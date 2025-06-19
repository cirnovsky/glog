import { NextRequest, NextResponse } from 'next/server';
import { getDiscussionBySlug } from '@/lib/github';

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;
    const post = await getDiscussionBySlug(slug);
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(post);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 