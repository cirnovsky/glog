import { getDiscussions, getCategories, getLabels } from '@/lib/github';
import PostCard from '../components/PostCard';
import { Discussion } from '@/types/github';
import SearchBar from '../components/SearchBar';

interface PostsPageProps {
  searchParams: {
    page?: string;
    category?: string;
    tag?: string;
    search?: string;
  };
}

interface Discussion {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  frontmatter?: {
    date?: string;
  };
  slug: string;
  category: Category;
  labels: {
    nodes: Tag[];
  };
  date?: string;
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  try {
    const page = parseInt(searchParams.page || '1');
    const perPage = 10;

    // First, try to get just the discussions
    const discussionsResponse = await getDiscussions({
      first: perPage,
      after: page > 1 ? btoa(`cursor:${(page - 1) * perPage}`) : undefined,
      category: searchParams.category,
      tag: searchParams.tag,
      search: searchParams.search,
    });

    if (!discussionsResponse.repository) {
      throw new Error('Repository not found');
    }

    const posts = discussionsResponse.repository.discussions.nodes.map((post: Discussion) => ({
      ...post,
      date: post.frontmatter?.date || post.createdAt,
    }));
    const totalCount = discussionsResponse.repository.discussions.totalCount;
    const totalPages = Math.ceil(totalCount / perPage);

    // If discussions work, try to get categories and labels
    const [categories, labels] = await Promise.all([
      getCategories(),
      getLabels(),
    ]);

    return (
      <div className="ui container">
        <h1>All Posts</h1>
        <SearchBar categories={categories} labels={labels} />
        <div className="ui segment">
          {posts.length === 0 ? (
            <p>No posts found</p>
          ) : (
            <>
              {posts.map((post: Discussion) => (
                <PostCard
                  key={post.id}
                  title={post.title}
                  excerpt={post.body}
                  date={post.date}
                  slug={post.slug}
                  category={post.category}
                  tags={post.labels.nodes}
                />
              ))}
              
              {totalPages > 1 && (
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <div className="ui pagination menu">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <a
                        key={pageNum}
                        className={`item ${pageNum === page ? 'active' : ''}`}
                        href={`/posts?page=${pageNum}`}
                      >
                        {pageNum}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in PostsPage:', error);
    return (
      <div className="ui container">
        <h1>Error Loading Posts</h1>
        <div className="ui segment">
          <p>
            {error instanceof Error
              ? error.message
              : 'Failed to load posts. Please try again later.'}
          </p>
          <p>Please check that:</p>
          <ul>
            <li>Your GitHub token is properly configured</li>
            <li>The repository owner and name are correct</li>
            <li>You have the necessary permissions to access the repository</li>
          </ul>
        </div>
      </div>
    );
  }
} 