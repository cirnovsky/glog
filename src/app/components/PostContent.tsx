'use client';

import { Header, Segment, Label, Button } from 'semantic-ui-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Category, Label as Tag } from '@/types/github';
import { marked } from 'marked';

interface PostContentProps {
  title: string;
  content: string;
  date: string;
  author: string;
  category: Category;
  tags: Tag[];
  slug: string;
}

export default function PostContent({ title, content, date, author, category, tags, slug }: PostContentProps) {
  return (
    <Segment>
      <Header as="h1">{title}</Header>
      <div style={{ color: 'rgba(0,0,0,.6)', marginBottom: '1rem' }}>
        By {author} on {format(new Date(date), 'MMMM d, yyyy')}
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <Label color="blue" size="large">
          {category.name}
        </Label>
        {tags.map((tag) => (
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
        dangerouslySetInnerHTML={{ __html: marked(content) }}
      />
      <div style={{ marginTop: '2rem' }}>
        <Button as={Link} href="/posts" primary>
          Back to Posts
        </Button>
      </div>
    </Segment>
  );
} 