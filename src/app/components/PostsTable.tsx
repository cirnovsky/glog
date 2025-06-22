'use client';

import Link from 'next/link';
import { format as formatDate } from 'date-fns';

interface Post {
  id: string;
  title: string;
  date: string;
  slug: string;
}

interface PostsTableProps {
  posts: Post[];
}

export default function PostsTable({ posts }: PostsTableProps) {
  // Group posts by year
  const postsByYear = posts.reduce((acc, post) => {
    let year = 'Unknown';
    if (post.date) {
      let parsedDate: Date | null = null;
      if (!isNaN(Date.parse(post.date))) {
        parsedDate = new Date(post.date);
      } else if (/^\d{8}$/.test(post.date)) {
        // Convert YYYYMMDD to YYYY-MM-DD
        const isoDate = post.date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
        parsedDate = new Date(isoDate);
      }
      if (parsedDate && !isNaN(parsedDate.getTime())) {
        year = parsedDate.getFullYear().toString();
      }
    }
    
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(post);
    return acc;
  }, {} as Record<string, Post[]>);

  // Sort years in descending order
  const sortedYears = Object.keys(postsByYear).sort((a, b) => {
    if (a === 'Unknown') return 1;
    if (b === 'Unknown') return -1;
    return parseInt(b) - parseInt(a);
  });

  return (
    <div className="posts-table">
      {sortedYears.map(year => (
        <div key={year} className="year-section">
          <h2 className="year-header">{year}</h2>
          <div className="posts-list">
            {postsByYear[year].map((post) => {
              // Format date for display
              let displayDate = '';
              if (post.date) {
                let parsedDate: Date | null = null;
                if (!isNaN(Date.parse(post.date))) {
                  parsedDate = new Date(post.date);
                } else if (/^\d{8}$/.test(post.date)) {
                  // Convert YYYYMMDD to YYYY-MM-DD
                  const isoDate = post.date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
                  parsedDate = new Date(isoDate);
                }
                if (parsedDate && !isNaN(parsedDate.getTime())) {
                  displayDate = formatDate(parsedDate, 'yyyy-MM-dd');
                }
              }

              return (
                <div key={post.id} className="post-item">
                  <span className="post-date">{displayDate}</span>
                  <Link 
                    href={`/posts/${post.slug}`} 
                    className="post-title"
                  >
                    {post.title}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
} 