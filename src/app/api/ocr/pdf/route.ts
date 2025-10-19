import { pdfToPageTexts, extractDataWithFields } from "@/lib/pdf-extractor";
import { NextRequest, NextResponse } from "next/server";

// 프론트엔드에서 넘어오는 필드 타입
interface ExtractField {
  id: string;
  label: string;
  key: string;
  enabled: boolean;
  pattern?: string;
}

// 반환될 데이터 타입
interface ExtractedData {
  page: number;
  [key: string]: string | number;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get("pdf");
    const fieldsString = formData.get("fields") as string | null;

    if (!pdfFile || !(pdfFile instanceof File)) {
      return NextResponse.json(
        { message: "유효한 PDF 파일이 아닙니다." },
        { status: 400 }
      );
    }

    if (!fieldsString) {
      return NextResponse.json(
        { message: "추출 필드 정보가 없습니다." },
        { status: 400 }
      );
    }

    const fields: ExtractField[] = JSON.parse(fieldsString);

    // 1. PDF에서 페이지별 텍스트 추출 (OCR)
    const pageTexts = await pdfToPageTexts(pdfFile);

    if (!pageTexts || pageTexts.length === 0) {
      throw new Error("PDF에서 텍스트를 추출하지 못했습니다.");
    }

    // 2. 각 페이지별로 데이터 추출 실행
    const allPagesData: ExtractedData[] = [];
    for (let i = 0; i < pageTexts.length; i++) {
      const pageText = pageTexts[i];
      const pageNumber = i + 1;

      // 현재 페이지의 텍스트로 데이터 추출
      const extractedDataForPage = extractDataWithFields(pageText, fields);

      // 추출된 데이터가 하나라도 있는지 확인 (모두 '추출 실패'가 아닌 경우)
      const hasExtractedData = Object.values(extractedDataForPage).some(
        (value) => value !== "추출 실패" && value !== "정규식 오류"
      );

      // 유효한 데이터가 있는 페이지만 결과에 추가
      if (hasExtractedData) {
        allPagesData.push({
          page: pageNumber,
          ...extractedDataForPage,
        });
      }
    }

    // 3. 결과 반환
    return NextResponse.json(allPagesData, { status: 200 });
  } catch (error) {
    console.error("PDF 처리 중 오류 발생:", error);
    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
