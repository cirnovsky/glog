import { NextRequest, NextResponse } from 'next/server';
import { getAllDiscussions } from '@/lib/github';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const tag = searchParams.get('tag') || undefined;
    const search = searchParams.get('search') || undefined;

    // Fetch all discussions
    const discussions = await getAllDiscussions({
      category,
      tag,
      search,
    });

    const allPosts = discussions.repository?.discussions?.nodes || [];
    const totalCount = discussions.repository?.discussions?.totalCount || 0;

    console.log(`API: Returning all ${allPosts.length} posts (total available: ${totalCount})`);

    // Return all results
    return NextResponse.json({
      repository: {
        discussions: {
          nodes: allPosts,
          totalCount: totalCount
        }
      }
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 