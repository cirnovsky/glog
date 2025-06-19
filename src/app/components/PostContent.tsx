'use client';

import { Header, Segment, Label, Button } from 'semantic-ui-react';
import { dating } from '@/lib/date';
import CommentSection from './CommentSection';
import { processGithubBodyHTML } from '@/lib/content';

interface PostContentProps {
  post: any;
}

export default function PostContent({ post }: PostContentProps) {
  const processed = processGithubBodyHTML(post.bodyHTML);

  return (
    <div className="post-content-responsive">
      <Header as="h1">{post.title}</Header>
      <div style={{ color: 'rgba(0,0,0,.6)', marginBottom: '1rem' }}>
        By {post.author?.login} on {dating(post)}
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <Label color="blue" size="large">
          {post.category.name}
        </Label>
        {post.labels?.nodes?.map((tag: any) => (
          <Label
            key={tag.id}
            size="large"
            style={{
              backgroundColor: `#${tag.color}`,
              color: parseInt(tag.color, 16) > 0x7fffff ? '#000' : '#fff',
              marginLeft: '0.5rem',
            }}
          >
            {tag.name}
          </Label>
        ))}
      </div>
      <div
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: processed }}
      />
      {/* Comment Section */}
      <CommentSection 
        discussionId={post.id} 
        discussionTitle={post.title}
      />
    </div>
  );
} 