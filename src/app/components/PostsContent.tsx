'use client';

import { Header, Segment, Pagination, Message } from 'semantic-ui-react';
import PostCard from './PostCard';
import SearchBar from './SearchBar';
import { Discussion, Category, Label } from '@/types/github';
import ClientOnly from './ClientOnly';

interface PostsContentProps {
  posts: Discussion[];
  categories: Category[];
  labels: Label[];
  totalPages: number;
  currentPage: number;
  searchParams: {
    search?: string;
    category?: string;
    tag?: string;
  };
}

export default function PostsContent({
  posts,
  categories,
  labels,
  totalPages,
  currentPage,
  searchParams,
}: PostsContentProps) {
  return (
    <div>
      <ClientOnly>
        <Header as="h1" content="All Posts" />
        <SearchBar categories={categories} labels={labels} />
        
        {posts.length === 0 ? (
          <Message info>
            <Message.Header>No posts found</Message.Header>
            <p>Try adjusting your search criteria or browse all posts.</p>
          </Message>
        ) : (
          <>
            <Segment>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  title={post.title}
                  excerpt={post.body}
                  date={post.createdAt}
                  slug={post.slug}
                  category={post.category}
                  tags={post.labels.nodes}
                />
              ))}
            </Segment>
            
            {totalPages > 1 && (
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <Pagination
                  activePage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(_, data) => {
                    const params = new URLSearchParams(searchParams as any);
                    params.set('page', data.activePage?.toString() || '1');
                    window.location.href = `/posts?${params.toString()}`;
                  }}
                />
              </div>
            )}
          </>
        )}
      </ClientOnly>
    </div>
  );
} 