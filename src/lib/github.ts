import { request } from 'graphql-request';
import { DiscussionsResponse, SearchParams, Category, Label } from '@/types/github';
import { parseFrontmatter } from './frontmatter';

const GITHUB_API_URL = 'https://api.github.com/graphql';
const REPO_OWNER = process.env.GITHUB_REPO_OWNER || '';
const REPO_NAME = process.env.GITHUB_REPO_NAME || '';

// Log environment variables status on module load
console.log('GitHub API Client - Environment check:', {
  hasToken: !!process.env.GITHUB_TOKEN,
  repoOwner: REPO_OWNER,
  repoName: REPO_NAME,
  apiUrl: GITHUB_API_URL,
});

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
    $after: String
    $categoryId: ID
  ) {
    repository(owner: $owner, name: $name) {
      discussions(
        first: $first
        after: $after
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
        pageInfo {
          hasNextPage
          endCursor
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
      after: params.after,
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