'use client';

import { Header, Segment, Label, Button } from 'semantic-ui-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Category, Label as Tag } from '@/types/github';
import { marked } from 'marked';
import { useEffect } from 'react';
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
import CommentSection from './CommentSection';
import { stripFrontmatterFromHtml } from '@/lib/frontmatter';
import { processContentHtml } from './CommentSection';

interface PostContentProps {
  post: any;
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

export default function PostContent({ post }: PostContentProps) {
  // Use raw markdown, process it the same as comments
  const processedHtml = processContentHtml(post.body || '');

  useEffect(() => {
    // Ensure Prism is loaded and highlight all code blocks
    if (typeof Prism !== 'undefined') {
      Prism.highlightAll();
    } else {
      console.warn('Prism.js not loaded');
    }
  }, [processedHtml]);

  // Add a second effect to handle dynamic content
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof Prism !== 'undefined') {
        console.log('Re-highlighting code blocks after delay...');
        Prism.highlightAll();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [processedHtml]);

  return (
    <div className="post-content-responsive">
      <Segment>
        <Header as="h1">{post.title}</Header>
        <div style={{ color: 'rgba(0,0,0,.6)', marginBottom: '1rem' }}>
          By {post.author?.login} on {format(new Date(post.createdAt), 'MMMM d, yyyy')}
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
          dangerouslySetInnerHTML={{ __html: processedHtml }}
        />
        <div style={{ marginTop: '2rem' }}>
          <Button as={Link} href="/posts" primary>
            Back to Posts
          </Button>
        </div>
      </Segment>

      {/* Comment Section */}
      <CommentSection 
        discussionId={post.id} 
        discussionTitle={post.title}
      />
    </div>
  );
} 