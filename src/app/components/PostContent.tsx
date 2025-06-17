'use client';

import { Header, Segment, Label, Button } from 'semantic-ui-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Category, Label as Tag } from '@/types/github';
import { marked } from 'marked';
import { useEffect } from 'react';
// @ts-expect-error: prismjs has no types
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-diff';
import 'prismjs/components/prism-markdown';
// @ts-expect-error: katex has no types
import katex from 'katex';
import 'prismjs/plugins/toolbar/prism-toolbar';
import 'prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard';

interface PostContentProps {
  title: string;
  content: string;
  date: string;
  author: string;
  category: Category;
  tags: Tag[];
  slug: string;
}

function renderMath(html: string): string {
  // Render block math $$...$$ and inline math $...$
  // Block math
  html = html.replace(/\$\$([\s\S]+?)\$\$/g, (match, expr) => {
    try {
      return katex.renderToString(expr, { displayMode: true });
    } catch {
      return match;
    }
  });
  // Inline math
  html = html.replace(/\$(.+?)\$/g, (match, expr) => {
    // Avoid replacing inside code blocks
    if (expr.includes('<code>') || expr.includes('</code>')) return match;
    try {
      return katex.renderToString(expr, { displayMode: false });
    } catch {
      return match;
    }
  });
  return html;
}

export default function PostContent({ title, content, date, author, category, tags, slug }: PostContentProps) {
  // Convert markdown to HTML
  const html: string = marked(content) as string;
  // Render math
  const mathHtml = renderMath(html);

  useEffect(() => {
    Prism.highlightAll();
  }, [mathHtml]);

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
        dangerouslySetInnerHTML={{ __html: mathHtml }}
      />
      <div style={{ marginTop: '2rem' }}>
        <Button as={Link} href="/posts" primary>
          Back to Posts
        </Button>
      </div>
    </Segment>
  );
} 