export interface Author {
  login: string;
  avatarUrl: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Discussion {
  id: string;
  title: string;
  body: string;
  bodyHTML: string;
  createdAt: string;
  updatedAt: string;
  author: Author;
  category: Category;
  labels: {
    nodes: Label[];
  };
  comments: {
    totalCount: number;
  };
  slug: string;
  frontmatter: {
    slug?: string;
    tags?: string[];
    [key: string]: any;
  };
}

export interface DiscussionsResponse {
  repository: {
    discussions: {
      nodes: Discussion[];
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string;
      };
      totalCount: number;
    };
  };
}

export interface SearchParams {
  first?: number;
  after?: string;
  category?: string;
  tag?: string;
  search?: string;
} 