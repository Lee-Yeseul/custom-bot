import { NextResponse } from "next/server";

const RSS_URL =
  "http://www.customs.go.kr/kcs/selectBoardRss.do?mi=2891&bbsId=1362";

export async function GET() {
  try {
    const response = await fetch(RSS_URL, {
      headers: {
        "Content-Type": "application/xml",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch RSS feed" },
        { status: response.status }
      );
    }

    const xmlText = await response.text();

    return new NextResponse(xmlText, {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  } catch (error) {
    console.error("Error fetching RSS feed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
