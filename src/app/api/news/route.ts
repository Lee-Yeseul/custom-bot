import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin Client
// We use the service key here for server-side operations.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("summarized_news")
      .select("*")
      .order("published_date", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ news: data });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Error fetching news from DB:", errorMessage);
    return NextResponse.json(
      { message: "Failed to fetch news", error: errorMessage },
      { status: 500 }
    );
  }
}
