import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Parser from "rss-parser";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

// Initialize Supabase Admin Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// 💡 최적화: 3~5 문장 요약에 맞춰 maxOutputTokens와 temperature를 조정
const generationConfig = {
  temperature: 0.4, // 자연스러운 요약을 위해 0.2 -> 0.4로 조정
  topK: 1,
  topP: 1,
  maxOutputTokens: 2048, // 1~3 문장 요약에 충분하도록 150 -> 400으로 상향
};
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Initialize RSS Parser
const parser = new Parser();
const RSS_URL =
  "http://www.customs.go.kr/kcs/selectBoardRss.do?mi=2891&bbsId=1362";

/**
 * Gemini AI를 사용하여 텍스트를 3~5 문장으로 요약합니다.
 * @param text 요약할 텍스트
 * @returns 요약된 텍스트
 */
async function summarizeText(text: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig,
    safetySettings,
  });

  // ⭐️ 프롬프트 수정: 한 문장 -> 3~5 문장 요약으로 변경
  const prompt = `다음 뉴스 기사 내용을 한국어로 1문장에서 3문장으로 요약해줘. 핵심 내용만 간결하게 전달해야 해.:\n\n${text}`;
  const result = await model.generateContent(prompt);
  const response = result.response;
  console.log("this is response", response);

  // 결과가 없거나 안전 설정에 의해 차단된 경우 에러를 던집니다.
  if (!response || response.promptFeedback?.blockReason) {
    throw new Error(
      `Generative model response blocked: ${
        response.promptFeedback?.blockReason || "No content"
      }`
    );
  }
  const data = response.text();
  return data;
}

export async function POST() {
  const startTime = Date.now();

  try {
    console.log("Starting on-demand news summarization job...");

    // 1. RSS 피드 파싱 (네트워크 I/O)
    const feed = await parser.parseURL(RSS_URL);

    // 유효한 link와 content를 가진 항목만 필터링
    const itemsToCheck = feed.items.filter(
      (item) => item.link && item.content && item.title
    );
    if (itemsToCheck.length === 0) {
      return NextResponse.json({
        message: "No valid items found in RSS feed.",
      });
    }

    const itemLinks = itemsToCheck.map((item) => item.link!);

    // 2. 💡 대량 DB 조회 최적화: 모든 링크에 대해 이미 존재하는지 한 번에 확인
    const { data: existingNews, error: selectError } = await supabase
      .from("summarized_news")
      .select("link")
      .in("link", itemLinks);

    if (selectError) {
      console.error("Error performing bulk news check:", selectError.message);
    }

    const existingLinks = new Set(existingNews?.map((n) => n.link) || []);

    // 3. 새로 처리할 항목 필터링
    const newItems = itemsToCheck.filter(
      (item) => !existingLinks.has(item.link)
    );

    if (newItems.length === 0) {
      const duration = Date.now() - startTime;
      const message = `On-demand job finished in ${duration}ms. No new articles to process.`;
      console.log(message);
      return NextResponse.json({ message });
    }

    // 4. 💡 병렬 처리 최적화: 요약 및 DB 삽입을 Promise.all을 사용하여 동시에 실행
    const processingPromises = newItems.map(async (item) => {
      const cleanText = item.content!.replace(/<[^>]*>?/gm, "");

      try {
        // AI 요약 (가장 시간이 많이 걸리는 작업)
        const summary = await summarizeText(cleanText);

        if (!summary) {
          console.warn(
            `Skipping item due to empty or failed summary: ${item.title}`
          );
          return false;
        }

        // DB 삽입 (또 다른 네트워크 I/O 작업)
        const { error: insertError } = await supabase
          .from("summarized_news")
          .insert({
            title: item.title,
            link: item.link,
            summary: summary,
            published_date: item.isoDate ? new Date(item.isoDate) : new Date(),
            source_feed: RSS_URL,
          });

        if (insertError) {
          console.error(
            "Error inserting new summarized news:",
            insertError.message,
            `Title: ${item.title}`
          );
          return false; // 실패
        } else {
          console.log(`Successfully summarized and inserted: ${item.title}`);
          return true; // 성공
        }
      } catch (e) {
        console.error(
          `Failed to summarize or insert item ${item.title}:`,
          e instanceof Error ? e.message : String(e)
        );
        return false; // 실패
      }
    });

    // 모든 병렬 작업이 완료될 때까지 대기
    const results = await Promise.all(processingPromises);
    const addedCount = results.filter((r) => r === true).length;

    const duration = Date.now() - startTime;
    const message = `On-demand job finished in ${duration}ms. Attempted to add ${newItems.length} articles, successfully added ${addedCount}.`;
    console.log(message);
    return NextResponse.json({ message });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    console.error(`On-demand job failed after ${duration}ms:`, errorMessage);

    // 환경 변수 누락 등 초기화 오류일 경우 405가 아닌 500을 반환하도록 수정 (실제 실패를 보고)
    return NextResponse.json(
      { message: "On-demand job failed", error: errorMessage },
      { status: 500 }
    );
  }
}
