'use client';

import { Card, Button, Label } from 'semantic-ui-react';
import Link from 'next/link';
import { format as formatDate } from 'date-fns';
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
  // Safely parse the date
  let displayDate = 'Unknown date';
  if (date) {
    let parsedDate: Date | null = null;
    if (!isNaN(Date.parse(date))) {
      parsedDate = new Date(date);
    } else if (/^\d{8}$/.test(date)) {
      // Convert YYYYMMDD to YYYY-MM-DD
      const isoDate = date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
      parsedDate = new Date(isoDate);
    }
    if (parsedDate && !isNaN(parsedDate.getTime())) {
      displayDate = formatDate(parsedDate, 'MMMM d, yyyy');
    }
  }
  return (
    <ClientOnly>
      <Card fluid>
        <Card.Content>
          <Card.Header style={{ marginBottom: '0.5rem' }}>
            <Link href={`/posts/${slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
              {title}
            </Link>
          </Card.Header>
          <Card.Meta>
            {displayDate}
            <Link href={`/posts?category=${category.id}`} style={{ textDecoration: 'none' }}>
              <Label color="blue" size="tiny" style={{ marginLeft: '0.5rem' }}>
                {category.name}
              </Label>
            </Link>
          </Card.Meta>
          <Card.Description>
            {excerpt.length > 150 ? `${excerpt.substring(0, 150)}...` : excerpt}
          </Card.Description>
          <div style={{ marginTop: '1rem' }}>
            {tags.map((tag) => (
              <Link key={tag.id} href={`/posts?tag=${tag.id}`} style={{ textDecoration: 'none' }}>
                <Label
                  size="tiny"
                  style={{
                    backgroundColor: `#${tag.color}`,
                    color: parseInt(tag.color, 16) > 0x7fffff ? '#000' : '#fff',
                    marginRight: '0.5rem',
                  }}
                >
                  {tag.name}
                </Label>
              </Link>
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