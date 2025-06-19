"use client";

import useSWR from "swr";
import { useParams } from "next/navigation";
import PostContent from "../../components/PostContent";
import LoadingSpinner from "../../components/LoadingSpinner";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PostPage() {
  const { slug } = useParams();
  const { data, error, isLoading } = useSWR(slug ? `/api/post/${slug}` : null, fetcher);

  if (isLoading) return <LoadingSpinner text="Loading post..." />;
  if (error) return <div>Error loading post: {error.message}</div>;
  if (!data) return <div>Post not found</div>;

  return <PostContent post={data} />;
} 