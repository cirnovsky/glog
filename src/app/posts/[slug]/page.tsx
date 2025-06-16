import { notFound } from 'next/navigation';
import { getDiscussions } from '@/lib/github';
import PostContent from '../../components/PostContent';
import { Discussion } from '@/types/github';

interface PostPageProps {
  params: {
    slug: string;
  };
}

export default async function PostPage({ params }: PostPageProps) {
  try {
    const response = await getDiscussions();
    const post = response.repository.discussions.nodes.find(
      (p: Discussion) => p.slug === params.slug
    );

    if (!post) {
      notFound();
    }

    return (
      <div className="ui container" style={{ marginTop: '2rem' }}>
        <PostContent
          title={post.title}
          content={post.body}
          date={post.createdAt}
          author={post.author.login}
          category={post.category}
          tags={post.labels.nodes}
          slug={post.slug}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading post:', error);
    return (
      <div className="ui container" style={{ marginTop: '2rem' }}>
        <div className="ui negative message">
          <div className="header">Error</div>
          <p>Failed to load the post. Please try again later.</p>
        </div>
      </div>
    );
  }
} 