"use client";

import { Suspense } from "react";
import useSWR, { SWRConfig } from "swr";
import { useSearchParams } from "next/navigation";
import PostCard from "../components/PostCard";
import LoadingSpinner from "../components/LoadingSpinner";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function Pagination({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  const searchParams = useSearchParams();

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7; // Show max 7 page numbers
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage <= 4) {
        // Show first 5 pages + ellipsis + last page
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Show first page + ellipsis + last 5 pages
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show first page + ellipsis + current-1, current, current+1 + ellipsis + last page
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  // Create URL with updated page parameter
  const createPageUrl = (pageNum: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', pageNum.toString());
    return `/posts?${params.toString()}`;
  };

  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      <div className="ui pagination menu">
        {/* Previous button */}
        {currentPage > 1 && (
          <a
            className="item"
            href={createPageUrl(currentPage - 1)}
            style={{ minWidth: 'auto', padding: '0.5em 0.75em' }}
          >
            ←
          </a>
        )}
        
        {/* Page numbers */}
        {pageNumbers.map((page, index) => (
          page === '...' ? (
            <span
              key={index}
              className="item disabled"
              style={{ 
                minWidth: 'auto', 
                padding: '0.5em 0.75em',
                cursor: 'default'
              }}
            >
              {page}
            </span>
          ) : (
            <a
              key={index}
              className={`item ${page === currentPage ? "active" : ""}`}
              href={createPageUrl(page as number)}
              style={{ 
                minWidth: 'auto', 
                padding: '0.5em 0.75em',
                cursor: 'pointer'
              }}
            >
              {page}
            </a>
          )
        ))}
        
        {/* Next button */}
        {currentPage < totalPages && (
          <a
            className="item"
            href={createPageUrl(currentPage + 1)}
            style={{ minWidth: 'auto', padding: '0.75em' }}
          >
            →
          </a>
        )}
      </div>
    </div>
  );
}

function PostsContent() {
  const searchParams = useSearchParams();
  const page = searchParams.get("page") || "1";
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const tag = searchParams.get("tag") || "";

  const { data, error, isLoading, isValidating } = useSWR(
    `/api/posts?page=${page}&search=${search}&category=${category}&tag=${tag}`,
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
  const totalCount = data?.repository?.discussions?.totalCount || 0;
  const perPage = 10;
  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <>
      {/* Show loading spinner for page switches */}
      {isValidating && <LoadingSpinner text={`Loading page ${page}...`} size="small" />}
      
      <div className="post-content-responsive">
        {posts.length === 0 ? (
          <p>No posts found</p>
        ) : (
          <>
            {totalPages > 1 && (
              <Pagination currentPage={Number(page)} totalPages={totalPages} />
            )}
            {posts.map((post: any) => (
              <PostCard
                key={post.id}
                title={post.title}
                excerpt={post.body}
                date={post.frontmatter?.date || post.createdAt}
                slug={post.slug}
                category={post.category}
                tags={post.labels.nodes}
              />
            ))}
          </>
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