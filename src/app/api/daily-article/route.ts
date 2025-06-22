import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://www.qhsou.com/one/api.php', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; BlogBot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.title || !data.author || !data.content) {
      throw new Error('Invalid API response format');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching daily article:', error);
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
} 