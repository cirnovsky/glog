import { NextRequest, NextResponse } from 'next/server';
import { getDiscussionComments, addCommentToDiscussion } from '@/lib/github';
import { parseFrontmatter } from '@/lib/frontmatter';

export async function GET(
  req: NextRequest,
  { params }: { params: { discussionId: string } }
) {
  try {
    const { discussionId } = params;
    
    if (!discussionId) {
      return NextResponse.json({ error: 'Discussion ID is required' }, { status: 400 });
    }

    const comments = await getDiscussionComments(discussionId);
    return NextResponse.json({ comments });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { discussionId: string } }
) {
  try {
    const { discussionId } = params;
    const { nickname, email, body, replyTo } = await req.json();

    if (!discussionId) {
      return NextResponse.json({ error: 'Discussion ID is required' }, { status: 400 });
    }

    if (!nickname || !body) {
      return NextResponse.json({ error: 'Nickname and body are required' }, { status: 400 });
    }

    // Create comment with YAML frontmatter
    let frontmatter = `---\nnickname: ${nickname}`;
    if (email && email.trim()) {
      frontmatter += `\nemail: ${email.trim()}`;
    }
    frontmatter += `\ntimestamp: ${new Date().toISOString()}`;
    frontmatter += `\n---\n`;
    const commentBody = `${frontmatter}${body}`;

    const comment = await addCommentToDiscussion(discussionId, commentBody, replyTo);
    // Parse frontmatter from the body
    const { frontmatter: meta } = parseFrontmatter(comment.body);
    // Return a formatted comment object for the frontend
    const avatarUrl = meta.email && meta.email.trim()
      ? `https://www.gravatar.com/avatar/${meta.email.toLowerCase().trim()}?d=mp&s=40`
      : 'https://www.gravatar.com/avatar/?d=mp&s=40';
    const formattedComment = {
      id: comment.id,
      body: comment.body, // raw markdown (not used for display)
      bodyHTML: comment.bodyHTML, // GitHub-rendered HTML
      author: {
        login: meta.nickname || 'Anonymous',
        avatarUrl
      },
      createdAt: comment.createdAt,
      userContentEdits: { totalCount: 0 },
      isMinimized: false,
      minimizedReason: null,
      replyTo: comment.replyTo || null
    };

    return NextResponse.json({ comment: formattedComment });
  } catch (error: any) {
    console.error('Error posting comment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 