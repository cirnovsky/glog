'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Form, Comment, Header, Segment, Input, TextArea, Icon } from 'semantic-ui-react';
import LoadingSpinner from './LoadingSpinner';
// @ts-expect-error: katex has no types
import katex from 'katex';
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
import 'prismjs/plugins/toolbar/prism-toolbar';
import 'prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard';
import { stripFrontmatterFromHtml } from '@/lib/frontmatter';
import { marked } from 'marked';
import { parseFrontmatter } from '@/lib/frontmatter';

interface CommentData {
  id: string;
  body: string;
  author: {
    login: string;
    avatarUrl: string;
  };
  createdAt: string;
  userContentEdits: {
    totalCount: number;
  };
  isMinimized: boolean;
  minimizedReason: string | null;
  replyTo: {
    id: string;
  } | null;
}

interface CommentSectionProps {
  discussionId: string;
  discussionTitle: string;
}

interface CommentFormData {
  nickname: string;
  email: string;
  body: string;
}

interface ReplyFormState {
  parentId: string | null;
  nickname: string;
  email: string;
  body: string;
}

function CommentInput({
  value,
  onChange,
  onSubmit,
  loading,
  disabled,
  submitLabel,
  onCancel,
  showCancel,
}: {
  value: CommentFormData;
  onChange: (field: keyof CommentFormData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  disabled: boolean;
  submitLabel: string;
  onCancel?: () => void;
  showCancel?: boolean;
}) {
  return (
    <Form onSubmit={onSubmit} style={{ marginBottom: '2rem' }}>
      <Form.Group widths="equal">
        <Form.Field>
          <Input
            placeholder="Nickname *"
            value={value.nickname}
            onChange={e => onChange('nickname', e.target.value)}
            required
          />
        </Form.Field>
        <Form.Field>
          <Input
            type="email"
            placeholder="Email (optional, for Gravatar)"
            value={value.email}
            onChange={e => onChange('email', e.target.value)}
          />
        </Form.Field>
      </Form.Group>
      <Form.Field>
        <TextArea
          placeholder="Write your comment here..."
          value={value.body}
          onChange={e => onChange('body', (e.target as HTMLTextAreaElement).value)}
          rows={4}
          required
        />
      </Form.Field>
      <Button
        type="submit"
        primary
        loading={loading}
        disabled={disabled}
        icon="edit"
        content={submitLabel}
      />
      {showCancel && onCancel && (
        <Button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          style={{ marginLeft: 8 }}
        >
          Cancel
        </Button>
      )}
    </Form>
  );
}

// Use the same renderMath as PostContent
function renderMath(html: string): string {
  // Render block math $$...$$ and inline math $...$
  html = html.replace(/\$\$([\s\S]+?)\$\$/g, (match, expr) => {
    try {
      return katex.renderToString(expr, { displayMode: true });
    } catch {
      return match;
    }
  });
  html = html.replace(/\$(.+?)\$/g, (match, expr) => {
    if (expr.includes('<code>') || expr.includes('</code>')) return match;
    try {
      return katex.renderToString(expr, { displayMode: false });
    } catch {
      return match;
    }
  });
  return html;
}

// Shared content processing for posts, comments, and replies
export function processContentHtml(markdown: string): string {
  // Strip frontmatter from markdown
  const { content } = parseFrontmatter(markdown || '');
  // Render to HTML
  const html = marked(content) as string;
  // Render math
  return renderMath(html);
}

function CommentBody({ markdown }: { markdown: string }) {
  const htmlRef = useRef<HTMLDivElement>(null);
  const processedHtml = processContentHtml(markdown);
  useEffect(() => {
    if (typeof Prism !== 'undefined') {
      Prism.highlightAll();
    }
  }, [processedHtml]);
  return (
    <div
      className="markdown-body comment-markdown-body"
      ref={htmlRef}
      style={{ paddingLeft: 0, marginLeft: 0 }}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
}

export default function CommentSection({ discussionId, discussionTitle }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CommentFormData>({
    nickname: '',
    email: '',
    body: ''
  });
  const [replyForm, setReplyForm] = useState<ReplyFormState>({ parentId: null, nickname: '', email: '', body: '' });
  const [hasLoaded, setHasLoaded] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Fetch existing comments
  const fetchComments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/comments/${discussionId}`);
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setComments(data.comments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, [discussionId]);

  // Lazy load comments when section is visible
  useEffect(() => {
    if (hasLoaded) return;
    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasLoaded(true);
        }
      },
      { rootMargin: '200px' }
    );
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, [hasLoaded]);

  // Fetch comments when hasLoaded becomes true
  useEffect(() => {
    if (hasLoaded) fetchComments();
  }, [hasLoaded, fetchComments]);

  // Handle main comment form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nickname.trim() || !formData.body.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      const response = await fetch(`/api/comments/${discussionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: formData.nickname.trim(),
          email: formData.email.trim(),
          body: formData.body.trim(),
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      // Instead of adding the new comment, re-fetch all comments
      await fetchComments();
      setFormData({ nickname: '', email: '', body: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reply form submission
  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyForm.nickname.trim() || !replyForm.body.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      const response = await fetch(`/api/comments/${discussionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: replyForm.nickname.trim(),
          email: replyForm.email.trim(),
          body: replyForm.body.trim(),
          replyTo: parentId,
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      // Instead of adding the new reply, re-fetch all comments
      await fetchComments();
      setReplyForm({ parentId: null, nickname: '', email: '', body: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CommentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };
  const handleReplyInputChange = (field: keyof CommentFormData, value: string) => {
    setReplyForm(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  // Generate Gravatar URL
  const getGravatarUrl = (email: string) => {
    const hash = email.toLowerCase().trim();
    return `https://www.gravatar.com/avatar/${hash}?d=mp&s=40`;
  };

  // Build a tree from flat comments
  function buildCommentTree(flatComments: CommentData[]): any[] {
    console.log('DEBUG: flatComments', flatComments.map(c => ({ id: c.id, replyTo: c.replyTo })));
    const idToNode: Record<string, any> = {};
    const roots: any[] = [];
    flatComments.forEach(comment => {
      idToNode[comment.id] = { ...comment, children: [] };
    });
    flatComments.forEach(comment => {
      if (comment.replyTo && comment.replyTo.id && idToNode[comment.replyTo.id]) {
        idToNode[comment.replyTo.id].children.push(idToNode[comment.id]);
      } else {
        roots.push(idToNode[comment.id]);
      }
    });
    return roots;
  }

  // Prism highlight after comments change
  useEffect(() => {
    if (typeof Prism !== 'undefined') {
      Prism.highlightAll();
    }
  }, [comments]);

  // Recursive render
  function renderCommentTree(nodes: any[]): JSX.Element[] {
    return nodes.map((comment) => (
      <Comment key={comment.id}>
        <Comment.Avatar 
          src={comment.author?.avatarUrl || getGravatarUrl(comment.author?.login || '')} 
        />
        <Comment.Content>
          <Comment.Author as="a">
            {comment.author?.login || 'Anonymous'}
          </Comment.Author>
          <Comment.Metadata>
            <div>{new Date(comment.createdAt).toLocaleDateString()}</div>
          </Comment.Metadata>
          {replyForm.parentId === comment.id && (
            <CommentInput
              value={replyForm}
              onChange={handleReplyInputChange}
              onSubmit={e => handleReplySubmit(e, comment.id)}
              loading={isSubmitting}
              disabled={isSubmitting}
              submitLabel="Add Reply"
              onCancel={() => setReplyForm({ parentId: null, nickname: '', email: '', body: '' })}
              showCancel
            />
          )}
          <Comment.Text>
            <CommentBody markdown={comment.body} />
          </Comment.Text>
          <Comment.Actions>
            <Comment.Action onClick={() => setReplyForm({ parentId: comment.id, nickname: '', email: '', body: '' })}>
              <Icon name="reply" /> Reply
            </Comment.Action>
          </Comment.Actions>
        </Comment.Content>
        {comment.children && comment.children.length > 0 && (
          <Comment.Group>{renderCommentTree(comment.children)}</Comment.Group>
        )}
      </Comment>
    ));
  }

  if (!hasLoaded) {
    return <div ref={sectionRef} style={{ minHeight: 120 }} />;
  }
  if (isLoading) {
    return <div ref={sectionRef}><LoadingSpinner text="Loading comments..." size="small" /></div>;
  }

  return (
    <div ref={sectionRef} style={{ marginTop: '2rem' }}>
      <Segment>
        <Header as="h3">Comments</Header>
        <CommentInput
          value={formData}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          submitLabel="Post Comment"
        />
        {error && (
          <div style={{ color: '#db2828', marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        <Comment.Group>
          {comments.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>
              No comments yet. Be the first to comment!
            </p>
          ) : (
            renderCommentTree(buildCommentTree(comments))
          )}
        </Comment.Group>
      </Segment>
    </div>
  );
} 