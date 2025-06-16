import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';
import TurndownService from 'turndown';

// Initialize Octokit
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const SOURCE_REPO_OWNER = 'cirnovsky';
const SOURCE_REPO_NAME = 'blog';
const TARGET_REPO_OWNER = process.env.GITHUB_REPO_OWNER || '';
const TARGET_REPO_NAME = process.env.GITHUB_REPO_NAME || '';

// Initialize Turndown for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
});

// Configure Turndown for code blocks
turndownService.addRule('codeBlocks', {
  filter: ['pre'],
  replacement: function(content, node) {
    const code = node.querySelector('code');
    const language = code?.className?.replace('language-', '') || '';
    return `\n\`\`\`${language}\n${content}\n\`\`\`\n`;
  }
});

interface PostMetadata {
  date: string;
  slug: string;
  title: string;
  tags: string[];
  type: 'article' | 'note';
}

// Function to read metadata from meta.json
async function readMetadata(): Promise<Record<string, PostMetadata>> {
  try {
    const response = await octokit.rest.repos.getContent({
      owner: SOURCE_REPO_OWNER,
      repo: SOURCE_REPO_NAME,
      path: 'meta.json',
    });

    if ('content' in response.data) {
      const content = Buffer.from(response.data.content, 'base64').toString();
      return JSON.parse(content);
    }
    throw new Error('Failed to read meta.json');
  } catch (error) {
    console.error('Error reading metadata:', error);
    throw error;
  }
}

// Function to read HTML content from a file
async function readHtmlContent(filePath: string): Promise<{ content: string; date?: string }> {
  try {
    const response = await octokit.rest.repos.getContent({
      owner: SOURCE_REPO_OWNER,
      repo: SOURCE_REPO_NAME,
      path: filePath,
    });

    if ('content' in response.data) {
      const content = Buffer.from(response.data.content, 'base64').toString();
      // Extract content between <div class="content"> and </div>
      const match = content.match(/<div class="content">([\s\S]*?)<\/div>/);
      const extractedContent = match ? match[1].trim() : content;

      // Try to extract date from frontmatter if it exists
      const frontmatterMatch = content.match(/---\s*\n([\s\S]*?)\n---/);
      let date;
      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        const dateMatch = frontmatter.match(/date:\s*(.+)/);
        if (dateMatch) {
          date = dateMatch[1].trim();
        }
      }

      // Convert HTML to Markdown
      const markdown = turndownService.turndown(extractedContent);

      return {
        content: markdown,
        date: date,
      };
    }
    throw new Error(`Failed to read ${filePath}`);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    throw error;
  }
}

// Function to get image content
async function getImageContent(imagePath: string): Promise<{ content: string; name: string } | null> {
  try {
    const response = await octokit.rest.repos.getContent({
      owner: SOURCE_REPO_OWNER,
      repo: SOURCE_REPO_NAME,
      path: imagePath,
    });

    if ('content' in response.data) {
      return {
        content: response.data.content,
        name: path.basename(imagePath),
      };
    }
    return null;
  } catch (error) {
    console.error(`Error reading image ${imagePath}:`, error);
    return null;
  }
}

// Function to create a discussion
async function createDiscussion(
  title: string,
  body: string,
  categoryId: string,
  tags: string[],
  publishDate: string
) {
  try {
    // Create labels for tags if they don't exist
    for (const tag of tags) {
      try {
        await octokit.rest.issues.createLabel({
          owner: TARGET_REPO_OWNER,
          repo: TARGET_REPO_NAME,
          name: tag,
          color: Math.floor(Math.random()*16777215).toString(16), // Random color
        });
      } catch (error) {
        // Label might already exist, continue
        console.log(`Label ${tag} might already exist, continuing...`);
      }
    }

    // Create the discussion
    const response = await octokit.graphql(`
      mutation CreateDiscussion($input: CreateDiscussionInput!) {
        createDiscussion(input: $input) {
          discussion {
            id
            title
            url
            createdAt
            updatedAt
          }
        }
      }
    `, {
      input: {
        repositoryId: process.env.GITHUB_REPO_ID,
        categoryId: categoryId,
        title: title,
        body: body,
        labelIds: tags.map(tag => tag.toLowerCase()), // Convert tags to label IDs
      },
    });

    const discussionId = response.createDiscussion.discussion.id;

    // Add a comment with the original publish date if it exists
    if (publishDate) {
      await octokit.graphql(`
        mutation AddDiscussionComment($input: AddDiscussionCommentInput!) {
          addDiscussionComment(input: $input) {
            comment {
              id
            }
          }
        }
      `, {
        input: {
          discussionId: discussionId,
          body: `Originally published on ${new Date(publishDate).toLocaleDateString()}`,
        },
      });
    }

    return response;
  } catch (error) {
    console.error('Error creating discussion:', error);
    throw error;
  }
}

// Function to upload images to GitHub
async function uploadImages(discussionId: string, images: { content: string; name: string }[]) {
  for (const image of images) {
    try {
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: TARGET_REPO_OWNER,
        repo: TARGET_REPO_NAME,
        path: `discussions/${discussionId}/${image.name}`,
        message: `Add image for discussion ${discussionId}`,
        content: image.content,
      });
    } catch (error) {
      console.error(`Error uploading image ${image.name}:`, error);
    }
  }
}

// Function to extract image paths from HTML content
function extractImagePaths(content: string, baseDir: string): string[] {
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
  const paths: string[] = [];
  let match;

  while ((match = imgRegex.exec(content)) !== null) {
    const src = match[1];
    if (src.startsWith('/')) {
      paths.push(path.join(baseDir, 'uploads', path.basename(src)));
    } else if (src.startsWith('./uploads/')) {
      paths.push(path.join(baseDir, src));
    }
  }

  return paths;
}

// Main migration function
async function migratePosts() {
  try {
    // Validate environment variables
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN is not set');
    }
    if (!TARGET_REPO_OWNER) {
      throw new Error('GITHUB_REPO_OWNER is not set');
    }
    if (!TARGET_REPO_NAME) {
      throw new Error('GITHUB_REPO_NAME is not set');
    }
    if (!process.env.GITHUB_REPO_ID) {
      throw new Error('GITHUB_REPO_ID is not set');
    }

    // Get the blog category ID
    const { repository } = await octokit.graphql(`
      query GetCategories($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          discussionCategories(first: 10) {
            nodes {
              id
              name
            }
          }
        }
      }
    `, {
      owner: TARGET_REPO_OWNER,
      name: TARGET_REPO_NAME,
    });

    const blogCategory = repository.discussionCategories.nodes.find(
      (cat: any) => cat.name.toLowerCase() === 'blog'
    );

    if (!blogCategory) {
      throw new Error('Blog category not found in repository');
    }

    // Read metadata
    const metadata = await readMetadata();

    // Process articles
    const articlesDir = 'articles';
    try {
      const { data: articles } = await octokit.rest.repos.getContent({
        owner: SOURCE_REPO_OWNER,
        repo: SOURCE_REPO_NAME,
        path: articlesDir,
      });

      if (Array.isArray(articles)) {
        for (const file of articles) {
          if (file.name.endsWith('.html')) {
            const slug = path.basename(file.name, '.html');
            const postMeta = metadata[slug];
            
            if (!postMeta) {
              console.warn(`No metadata found for ${file.name}, skipping...`);
              continue;
            }

            const { content, date: frontmatterDate } = await readHtmlContent(`${articlesDir}/${file.name}`);
            
            // Extract and download images
            const imagePaths = extractImagePaths(content, articlesDir);
            const images = await Promise.all(
              imagePaths.map(path => getImageContent(path))
            );
            const validImages = images.filter((img): img is { content: string; name: string } => img !== null);

            // Create discussion body with frontmatter
            const discussionBody = `---
title: ${postMeta.title}
date: ${frontmatterDate || postMeta.date}
slug: ${postMeta.slug}
tags: ${postMeta.tags.join(', ')}
---

${content}`;

            console.log(`Creating discussion for: ${postMeta.title}`);
            const response = await createDiscussion(
              postMeta.title,
              discussionBody,
              blogCategory.id,
              postMeta.tags,
              frontmatterDate || postMeta.date
            );

            // Upload associated images
            await uploadImages(response.createDiscussion.discussion.id, validImages);
            
            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    } catch (error) {
      console.error('Error processing articles:', error);
    }

    // Process notes (similar to articles)
    const notesDir = 'notes';
    try {
      const { data: notes } = await octokit.rest.repos.getContent({
        owner: SOURCE_REPO_OWNER,
        repo: SOURCE_REPO_NAME,
        path: notesDir,
      });

      if (Array.isArray(notes)) {
        for (const file of notes) {
          if (file.name.endsWith('.html')) {
            const slug = path.basename(file.name, '.html');
            const postMeta = metadata[slug];
            
            if (!postMeta) {
              console.warn(`No metadata found for ${file.name}, skipping...`);
              continue;
            }

            const { content, date: frontmatterDate } = await readHtmlContent(`${notesDir}/${file.name}`);
            
            // Extract and download images
            const imagePaths = extractImagePaths(content, notesDir);
            const images = await Promise.all(
              imagePaths.map(path => getImageContent(path))
            );
            const validImages = images.filter((img): img is { content: string; name: string } => img !== null);

            const discussionBody = `---
title: ${postMeta.title}
date: ${frontmatterDate || postMeta.date}
slug: ${postMeta.slug}
tags: ${postMeta.tags.join(', ')}
---

${content}`;

            console.log(`Creating discussion for: ${postMeta.title}`);
            const response = await createDiscussion(
              postMeta.title,
              discussionBody,
              blogCategory.id,
              postMeta.tags,
              frontmatterDate || postMeta.date
            );

            // Upload associated images
            await uploadImages(response.createDiscussion.discussion.id, validImages);
            
            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    } catch (error) {
      console.error('Error processing notes:', error);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migratePosts(); 