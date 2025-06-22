"use client";

import { Suspense } from "react";
import useSWR, { SWRConfig } from "swr";
import { useSearchParams } from "next/navigation";
import PostsTable from "../components/PostsTable";
import LoadingSpinner from "../components/LoadingSpinner";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function PostsContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const tag = searchParams.get("tag") || "";

  const { data, error, isLoading, isValidating } = useSWR(
    `/api/posts?search=${search}&category=${category}&tag=${tag}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
      keepPreviousData: true,
    }
  );

  // Show loading spinner for initial load
  if (isLoading && !data) {
    return <LoadingSpinner text="Loading posts..." />;
  }

  if (error) return <div>Error loading posts: {error.message}</div>;

  const posts = data?.repository?.discussions?.nodes || [];

  return (
    <>
      {/* Show loading spinner for page switches */}
      {isValidating && <LoadingSpinner text="Loading posts..." size="small" />}
      
      <div className="post-content-responsive">
        {posts.length === 0 ? (
          <p>No posts found</p>
        ) : (
          <PostsTable 
            posts={posts.map((post: any) => ({
              id: post.id,
              title: post.title,
              date: post.frontmatter?.date || post.createdAt,
              slug: post.slug,
            }))}
          />
        )}
      </div>
    </>
  );
}

export default function PostsPage() {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 60000,
      }}
    >
      <Suspense fallback={<LoadingSpinner text="Loading..." />}>
        <PostsContent />
      </Suspense>
    </SWRConfig>
  );
} 