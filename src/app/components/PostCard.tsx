'use client';

import { Card, Button, Label } from 'semantic-ui-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Category, Label as Tag } from '@/types/github';
import ClientOnly from './ClientOnly';

interface PostCardProps {
  title: string;
  excerpt: string;
  date: string;
  slug: string;
  category: Category;
  tags: Tag[];
}

export default function PostCard({ title, excerpt, date, slug, category, tags }: PostCardProps) {
  return (
    <ClientOnly>
      <Card fluid>
        <Card.Content>
          <Card.Header>{title}</Card.Header>
          <Card.Meta>
            {format(new Date(date), 'MMMM d, yyyy')}
            <Label color="blue" size="tiny" style={{ marginLeft: '0.5rem' }}>
              {category.name}
            </Label>
          </Card.Meta>
          <Card.Description>
            {excerpt.length > 150 ? `${excerpt.substring(0, 150)}...` : excerpt}
          </Card.Description>
          <div style={{ marginTop: '1rem' }}>
            {tags.map((tag) => (
              <Label
                key={tag.id}
                size="tiny"
                style={{
                  backgroundColor: `#${tag.color}`,
                  color: parseInt(tag.color, 16) > 0x7fffff ? '#000' : '#fff',
                  marginRight: '0.5rem',
                }}
              >
                {tag.name}
              </Label>
            ))}
          </div>
        </Card.Content>
        <Card.Content extra>
          <Button as={Link} href={`/posts/${slug}`} primary>
            Read More
          </Button>
        </Card.Content>
      </Card>
    </ClientOnly>
  );
} 