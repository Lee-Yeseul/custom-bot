// src/app/api/summarize/route.ts
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const generationConfig = {
  temperature: 0.7,
  topK: 1,
  topP: 1,
  maxOutputTokens: 2048,
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

async function run(text: string) {
  // ********** 여기서 사용하는 모델명을 최신 모델로 변경했습니다. **********
  // 필요에 따라 'gemini-2.5-pro' 또는 'gemini-2.5-flash' 등 사용 가능 모델로 바꾸세요.
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash", // <-- 업데이트된 모델명 예시
    generationConfig,
    safetySettings,
  });

  const prompt = `다음 뉴스 기사 내용을 한국어로 한 문장으로 요약해줘. 핵심 내용만 간결하게 전달해야 해.:\n\n${text}`;

  // SDK의 generateContent 호출 (기존 방식과 호환되는 형태)
  const result = await model.generateContent(prompt);
  const response = result.response;

  // 응답 검증: 안전하게 텍스트를 꺼냅니다.
  if (!response) throw new Error("No response from generative model");
  const textResult = await response.text();
  return textResult;
}

export async function POST(req: Request) {
  try {
    const { article } = await req.json();

    if (!article || !article.content) {
      return NextResponse.json(
        { error: "Article content to summarize is required" },
        { status: 400 }
      );
    }

    // 1. Summarize
    const cleanText = article.content.replace(/<[^>]*>?/gm, "");
    const summary = await run(cleanText);

    // 2. Save to Supabase
    const { error: dbError, ...params } = await supabase
      .from("summarized_news")
      .upsert(
        {
          title: article.title,
          link: article.link,
          summary: summary,
          published_date: article.isoDate ? new Date(article.isoDate) : null,
          source_feed: article.source_feed,
        },
        {
          onConflict: "link", // Ignore duplicates based on the link
        }
      );

    console.log(params);

    if (dbError) {
      // Log the error, but don't block the response to the user
      console.error("Supabase insert error:", dbError.message);
    }

    // 3. Return summary to client
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error summarizing text:", error);
    return NextResponse.json(
      { error: "Failed to summarize text", detail: String(error) },
      { status: 500 }
    );
  }
}
