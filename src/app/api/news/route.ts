import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    // Fetch the data for the current page and the total count in parallel
    const [newsResponse, countResponse] = await Promise.all([
      supabase
        .from('summarized_news')
        .select('*')
        .order('published_date', { ascending: false })
        .range(from, to),
      supabase
        .from('summarized_news')
        .select('*', { count: 'exact', head: true })
    ]);

    if (newsResponse.error) throw new Error(newsResponse.error.message);
    if (countResponse.error) throw new Error(countResponse.error.message);

    return NextResponse.json({ 
      news: newsResponse.data,
      count: countResponse.count
    });

  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error fetching news from DB:', errorMessage);
    return NextResponse.json(
      { message: 'Failed to fetch news', error: errorMessage },
      { status: 500 }
    );
  }
}
