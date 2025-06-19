import { NextRequest, NextResponse } from 'next/server';
import { getAllDiscussions } from '@/lib/github';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page') || 1);
    const perPage = Number(searchParams.get('perPage') || 10);
    const category = searchParams.get('category') || undefined;
    const tag = searchParams.get('tag') || undefined;
    const search = searchParams.get('search') || undefined;

    // Fetch all discussions using cursor-based pagination
    const discussions = await getAllDiscussions({
      category,
      tag,
      search,
    });

    const allPosts = discussions.repository?.discussions?.nodes || [];
    const totalCount = discussions.repository?.discussions?.totalCount || 0;

    // Calculate pagination
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    
    // Check if the requested page is beyond available posts
    if (startIndex >= allPosts.length) {
      console.log(`API: Page ${page} requested but only ${allPosts.length} posts available`);
      return NextResponse.json({
        repository: {
          discussions: {
            nodes: [],
            totalCount: totalCount
          }
        }
      });
    }

    const paginatedPosts = allPosts.slice(startIndex, endIndex);

    console.log(`API: Page ${page}, showing posts ${startIndex + 1}-${Math.min(endIndex, allPosts.length)} of ${allPosts.length} (total available: ${totalCount})`);

    // Return paginated results
    return NextResponse.json({
      repository: {
        discussions: {
          nodes: paginatedPosts,
          totalCount: totalCount
        }
      }
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 