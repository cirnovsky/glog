import { request } from 'graphql-request';
import { DiscussionsResponse, SearchParams, Category, Label } from '@/types/github';
import { parseFrontmatter, stripFrontmatterFromHtml } from './frontmatter';

const GITHUB_API_URL = 'https://api.github.com/graphql';
const REPO_OWNER = process.env.GITHUB_REPO_OWNER || '';
const REPO_NAME = process.env.GITHUB_REPO_NAME || '';

// Log environment variables status on module load
// console.log('GitHub API Client - Environment check:', {
//   hasToken: !!process.env.GITHUB_TOKEN,
//   repoOwner: REPO_OWNER,
//   repoName: REPO_NAME,
//   apiUrl: GITHUB_API_URL,
// });

// Validate environment variables
function validateEnv() {
  const errors = [];
  
  if (!process.env.GITHUB_TOKEN) {
    errors.push('GITHUB_TOKEN is not set');
  }
  
  if (!REPO_OWNER) {
    errors.push('GITHUB_REPO_OWNER is not set');
  }
  
  if (!REPO_NAME) {
    errors.push('GITHUB_REPO_NAME is not set');
  }
  
  if (errors.length > 0) {
    throw new Error(`GitHub API configuration error: ${errors.join(', ')}`);
  }
}

const DISCUSSION_QUERY = `
  query GetDiscussions(
    $owner: String!
    $name: String!
    $first: Int!
    $categoryId: ID
  ) {
    repository(owner: $owner, name: $name) {
      discussions(
        first: $first
        categoryId: $categoryId
        orderBy: { field: CREATED_AT, direction: DESC }
      ) {
        nodes {
          id
          title
          body
          bodyHTML
          createdAt
          updatedAt
          author {
            login
            avatarUrl
          }
          category {
            id
            name
            description
          }
          labels(first: 10) {
            nodes {
              id
              name
              color
            }
          }
          comments {
            totalCount
          }
        }
        totalCount
      }
    }
  }
`;

interface CategoriesResponse {
  repository: {
    discussionCategories: {
      nodes: Category[];
    };
  };
}

interface LabelsResponse {
  repository: {
    labels: {
      nodes: Label[];
    };
  };
}

export async function getDiscussions(params: SearchParams = {}): Promise<DiscussionsResponse> {
  try {
    validateEnv();

    const variables = {
      owner: REPO_OWNER,
      name: REPO_NAME,
      first: params.first || 10,
      categoryId: params.category,
    };

    const response = await request<DiscussionsResponse>(
      GITHUB_API_URL,
      DISCUSSION_QUERY,
      variables,
      {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      }
    );

    if (!response.repository) {
      throw new Error(`Repository not found: ${REPO_OWNER}/${REPO_NAME}`);
    }

    // Process frontmatter for each discussion
    response.repository.discussions.nodes = response.repository.discussions.nodes.map(discussion => {
      const { frontmatter, content } = parseFrontmatter(discussion.body);
      
      // Use frontmatter slug if available, otherwise use discussion ID
      const slug = frontmatter.slug || discussion.id;
      
      // Combine frontmatter tags with discussion labels
      const tags = frontmatter.tags || [];
      const existingLabels = discussion.labels.nodes.map(label => label.name);
      const allTags = Array.from(new Set([...tags, ...existingLabels]));
      
      return {
        ...discussion,
        slug,
        body: content,
        bodyHTML: stripFrontmatterFromHtml(discussion.bodyHTML),
        frontmatter,
        labels: {
          ...discussion.labels,
          nodes: allTags.map(tag => ({
            id: tag,
            name: tag,
            color: '000000', // Default color for frontmatter tags
          })),
        },
      };
    });

    // Filter discussions by label/tag if specified
    if (params.tag) {
      response.repository.discussions.nodes = response.repository.discussions.nodes.filter(
        discussion => discussion.labels.nodes.some(label => label.name === params.tag)
      );
      response.repository.discussions.totalCount = response.repository.discussions.nodes.length;
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        throw new Error('GitHub authentication failed. Please check your token.');
      }
      if (error.message.includes('404')) {
        throw new Error(`Repository not found: ${REPO_OWNER}/${REPO_NAME}`);
      }
      if (error.message.includes('403')) {
        throw new Error('Access denied. Please check your token permissions.');
      }
      throw new Error(`Failed to fetch discussions: ${error.message}`);
    }
    throw new Error('Failed to fetch discussions');
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    validateEnv();

    const CATEGORIES_QUERY = `
      query GetCategories($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          discussionCategories(first: 100) {
            nodes {
              id
              name
              description
            }
          }
        }
      }
    `;

    const response = await request<CategoriesResponse>(
      GITHUB_API_URL,
      CATEGORIES_QUERY,
      {
        owner: REPO_OWNER,
        name: REPO_NAME,
      },
      {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      }
    );

    if (!response.repository) {
      throw new Error(`Repository not found: ${REPO_OWNER}/${REPO_NAME}`);
    }

    return response.repository.discussionCategories.nodes;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
    throw new Error('Failed to fetch categories');
  }
}

export async function getLabels(): Promise<Label[]> {
  try {
    validateEnv();

    const LABELS_QUERY = `
      query GetLabels($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          labels(first: 100) {
            nodes {
              id
              name
              color
            }
          }
        }
      }
    `;

    const response = await request<LabelsResponse>(
      GITHUB_API_URL,
      LABELS_QUERY,
      {
        owner: REPO_OWNER,
        name: REPO_NAME,
      },
      {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      }
    );

    if (!response.repository) {
      throw new Error(`Repository not found: ${REPO_OWNER}/${REPO_NAME}`);
    }

    return response.repository.labels.nodes;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch labels: ${error.message}`);
    }
    throw new Error('Failed to fetch labels');
  }
}

const DELETE_DISCUSSION_MUTATION = `
  mutation DeleteDiscussion($discussionId: ID!) {
    deleteDiscussion(input: { id: $discussionId }) {
      discussion {
        id
      }
    }
  }
`;

export async function deleteDiscussion(discussionId: string): Promise<void> {
  try {
    validateEnv();

    await request(
      GITHUB_API_URL,
      DELETE_DISCUSSION_MUTATION,
      {
        discussionId,
      },
      {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        throw new Error('GitHub authentication failed. Please check your token.');
      }
      if (error.message.includes('404')) {
        throw new Error(`Discussion not found: ${discussionId}`);
      }
      if (error.message.includes('403')) {
        throw new Error('Access denied. Please check your token permissions.');
      }
      throw new Error(`Failed to delete discussion: ${error.message}`);
    }
    throw new Error('Failed to delete discussion');
  }
}

export async function getDiscussionBySlug(slug: string) {
  // Fetch a reasonable number of discussions (adjust as needed)
  const discussionsResponse = await getDiscussions({ first: 100 });
  const posts = discussionsResponse.repository?.discussions?.nodes || [];
  const post = posts.find((post: any) => post.slug === slug);
  if (!post) return undefined;
  return {
    ...post,
    bodyHTML: stripFrontmatterFromHtml(post.bodyHTML),
  };
}

export async function getAllDiscussions(params: SearchParams = {}): Promise<DiscussionsResponse> {
  try {
    validateEnv();

    let allNodes: any[] = [];
    let hasNextPage = true;
    let endCursor: string | null = null;
    const batchSize = 100; // GitHub's maximum

    while (hasNextPage) {
      const variables: any = {
        owner: REPO_OWNER,
        name: REPO_NAME,
        first: batchSize,
        categoryId: params.category,
        after: endCursor,
      };

      const response: any = await request<DiscussionsResponse>(
        GITHUB_API_URL,
        DISCUSSION_QUERY_WITH_CURSORS,
        variables,
        {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        }
      );

      if (!response.repository) {
        throw new Error(`Repository not found: ${REPO_OWNER}/${REPO_NAME}`);
      }

      const discussions: any = response.repository.discussions;
      allNodes = allNodes.concat(discussions.nodes);

      // Check if there are more pages
      hasNextPage = discussions.pageInfo?.hasNextPage || false;
      endCursor = discussions.pageInfo?.endCursor || null;

      // Safety check to prevent infinite loops
      if (allNodes.length > 1000) {
        console.warn('Reached safety limit of 1000 posts, stopping pagination');
        break;
      }
    }

    // Process frontmatter for all discussions
    allNodes = allNodes.map(discussion => {
      const { frontmatter, content } = parseFrontmatter(discussion.body);
      
      // Use frontmatter slug if available, otherwise use discussion ID
      const slug = frontmatter.slug || discussion.id;
      
      // Combine frontmatter tags with discussion labels
      const tags = frontmatter.tags || [];
      const existingLabels = discussion.labels.nodes.map((label: any) => label.name);
      const allTags = Array.from(new Set([...tags, ...existingLabels]));
      
      return {
        ...discussion,
        slug,
        body: content,
        bodyHTML: stripFrontmatterFromHtml(discussion.bodyHTML),
        frontmatter,
        labels: {
          ...discussion.labels,
          nodes: allTags.map(tag => ({
            id: tag,
            name: tag,
            color: '000000', // Default color for frontmatter tags
          })),
        },
      };
    });

    // Filter discussions by label/tag if specified
    if (params.tag) {
      allNodes = allNodes.filter(
        discussion => discussion.labels.nodes.some((label: any) => label.name === params.tag)
      );
    }

    return {
      repository: {
        discussions: {
          nodes: allNodes,
          totalCount: allNodes.length,
          pageInfo: {
            hasNextPage: false,
            endCursor: null as string | null,
          }
        }
      }
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        throw new Error('GitHub authentication failed. Please check your token.');
      }
      if (error.message.includes('404')) {
        throw new Error(`Repository not found: ${REPO_OWNER}/${REPO_NAME}`);
      }
      if (error.message.includes('403')) {
        throw new Error('Access denied. Please check your token permissions.');
      }
      throw new Error(`Failed to fetch discussions: ${error.message}`);
    }
    throw new Error('Failed to fetch discussions');
  }
}

const DISCUSSION_QUERY_WITH_CURSORS = `
  query GetDiscussions(
    $owner: String!
    $name: String!
    $first: Int!
    $categoryId: ID
    $after: String
  ) {
    repository(owner: $owner, name: $name) {
      discussions(
        first: $first
        categoryId: $categoryId
        after: $after
        orderBy: { field: CREATED_AT, direction: DESC }
      ) {
        nodes {
          id
          title
          body
          bodyHTML
          createdAt
          updatedAt
          author {
            login
            avatarUrl
          }
          category {
            id
            name
            description
          }
          labels(first: 10) {
            nodes {
              id
              name
              color
            }
          }
          comments {
            totalCount
          }
        }
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

// Helper to flatten comments and replies (1 level deep)
function flattenCommentsWithReplies(topLevel: any[], repliesMap: Record<string, any[]>): any[] {
  let flat: any[] = [];
  for (const node of topLevel) {
    flat.push({ ...node, replyTo: node.replyTo && node.replyTo.id ? { id: node.replyTo.id } : null });
    const replies = repliesMap[node.id] || [];
    for (const reply of replies) {
      flat.push({ ...reply, replyTo: reply.replyTo && reply.replyTo.id ? { id: reply.replyTo.id } : { id: node.id } });
    }
  }
  return flat;
}

export async function getDiscussionComments(discussionId: string) {
  try {
    validateEnv();

    const COMMENTS_QUERY = `
      query GetDiscussionComments($discussionId: ID!) {
        node(id: $discussionId) {
          ... on Discussion {
            comments(first: 100) {
              nodes {
                id
                body
                bodyHTML
                createdAt
                author {
                  login
                  avatarUrl
                }
                userContentEdits {
                  totalCount
                }
                isMinimized
                minimizedReason
                replyTo {
                  id
                }
              }
              totalCount
            }
          }
        }
      }
    `;

    const REPLIES_QUERY = `
      query GetReplies($commentId: ID!) {
        node(id: $commentId) {
          ... on DiscussionComment {
            replies(first: 100) {
              nodes {
                id
                body
                bodyHTML
                createdAt
                author {
                  login
                  avatarUrl
                }
                userContentEdits {
                  totalCount
                }
                isMinimized
                minimizedReason
                replyTo {
                  id
                }
              }
            }
          }
        }
      }
    `;

    const response: any = await request(
      GITHUB_API_URL,
      COMMENTS_QUERY,
      { discussionId },
      {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      }
    );

    if (!response.node) {
      throw new Error('Discussion not found');
    }

    const topLevelComments = response.node.comments.nodes || [];

    // Fetch replies for each top-level comment in parallel
    const repliesMap: Record<string, any[]> = {};
    await Promise.all(topLevelComments.map(async (comment: any) => {
      const replyResp: any = await request(
        GITHUB_API_URL,
        REPLIES_QUERY,
        { commentId: comment.id },
        {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        }
      );
      const replies = replyResp.node?.replies?.nodes || [];
      repliesMap[comment.id] = replies;
    }));

    // Flatten all comments and replies (1 level deep)
    const comments = flattenCommentsWithReplies(topLevelComments, repliesMap);
    
    // Process comments to handle frontmatter and sort by creation date
    const processedComments = comments.map((comment: any) => {
      // Try to parse YAML frontmatter for anonymous comments
      const { frontmatter: meta, content } = parseFrontmatter(comment.body);
      const avatarUrl = meta.email && meta.email.trim()
        ? `https://www.gravatar.com/avatar/${meta.email.toLowerCase().trim()}?d=mp&s=40`
        : 'https://www.gravatar.com/avatar/?d=mp&s=40';
      // Remove frontmatter block from bodyHTML if present (GitHub renders it as a <pre> or <code> block at the top)
      let cleanBodyHTML = stripFrontmatterFromHtml(comment.bodyHTML);
      return {
        ...comment,
        body: content, // markdown without frontmatter
        bodyHTML: cleanBodyHTML, // GitHub-rendered HTML without frontmatter
        author: {
          login: meta.nickname || comment.author?.login || 'Anonymous',
          avatarUrl
        },
        replyTo: comment.replyTo && comment.replyTo.id ? { id: comment.replyTo.id } : null
      };
    });

    // Sort comments by creation date (oldest first)
    return processedComments.sort((a: any, b: any) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch comments: ${error.message}`);
    }
    throw new Error('Failed to fetch comments');
  }
}

export async function addCommentToDiscussion(discussionId: string, body: string, replyToId?: string) {
  try {
    validateEnv();

    const ADD_COMMENT_MUTATION = `
      mutation AddComment($discussionId: ID!, $body: String!, $replyToId: ID) {
        addDiscussionComment(input: { discussionId: $discussionId, body: $body, replyToId: $replyToId }) {
          comment {
            id
            body
            createdAt
            author {
              login
              avatarUrl
            }
            replyTo {
              id
            }
          }
        }
      }
    `;

    const variables: any = { discussionId, body };
    if (replyToId) variables.replyToId = replyToId;

    const response: any = await request(
      GITHUB_API_URL,
      ADD_COMMENT_MUTATION,
      variables,
      {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      }
    );

    if (!response.addDiscussionComment?.comment) {
      throw new Error('Failed to add comment');
    }

    return response.addDiscussionComment.comment;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to add comment: ${error.message}`);
    }
    throw new Error('Failed to add comment');
  }
} 