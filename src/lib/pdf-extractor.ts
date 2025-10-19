import { GoogleAuth } from "google-auth-library";
import { DocumentProcessorServiceClient } from "@google-cloud/documentai";
import { PDFDocument } from "pdf-lib";

// 프론트엔드에서 넘어오는 필드 타입과 동일하게 정의
interface ExtractField {
  id: string;
  label: string;
  key: string;
  enabled: boolean;
  pattern?: string;
}

interface ExtractedData {
  [key: string]: string;
}

/**
 * OCR 텍스트와 사용자 정의 필드를 기반으로 데이터를 추출합니다.
 * @param text OCR을 통해 추출된 전체 텍스트
 * @param fields 사용자가 정의한 추출 필드 목록
 * @returns 추출된 데이터 객체 { [key]: value }
 */
export function extractDataWithFields(
  text: string,
  fields: ExtractField[]
): ExtractedData {
  const extractedData: ExtractedData = {};
  // 텍스트를 한 줄씩 나누고, 전체 텍스트에 대한 참조도 유지합니다.
  const textLines = text.split("\n");
  const fullText = text.replace(/\n/g, " "); // 정규식 매칭을 위해 공백으로 연결된 버전

  for (const field of fields) {
    if (!field.enabled) continue;

    let value = "추출 실패";

    // 1. 사용자 정의 정규식 패턴이 있으면 최우선으로 사용
    if (field.pattern) {
      try {
        // 's' 플래그(dotAll) 대신 [\s\S]를 사용하여 줄바꿈을 포함한 매칭을 지원
        const regex = new RegExp(field.pattern, "i");
        const match = fullText.match(regex);
        if (match && match[1]) {
          value = match[1].trim();
        }
      } catch (e) {
        console.error(`Invalid regex for field ${field.label}:`, e);
        value = "정규식 오류";
      }
    }

    // 2. 정규식 패턴으로 못찾았거나 패턴이 없는 경우, 필드 레이블(키워드)을 기반으로 탐색
    if (value === "추출 실패") {
      const keywordPattern = new RegExp(
        // 정규식 특수 문자를 이스케이프 처리
        field.label.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"),
        "i"
      );

      for (let i = 0; i < textLines.length; i++) {
        const line = textLines[i];
        if (keywordPattern.test(line)) {
          // 콜론(:)이나 특정 구분자 뒤의 값을 추출 (공백 포함)
          const lineParts = line.split(/:(.*)/s);
          if (lineParts.length > 1 && lineParts[1].trim()) {
            value = lineParts[1].trim();
            break;
          }

          // 같은 줄에 값이 있지만 콜론이 없는 경우 (예: "Gross Weight 1,250.5 KG")
          const matchInLine = line.match(
            new RegExp(`${keywordPattern.source}\s*(.*)`, "i")
          );
          if (matchInLine && matchInLine[1] && matchInLine[1].trim()) {
            value = matchInLine[1].trim();
            break;
          }

          // 다음 줄에 값이 있는 경우 (예: "Gross Weight" \n "1,250.5 KG")
          if (i + 1 < textLines.length && textLines[i + 1].trim()) {
            // 다음 줄이 다른 키워드를 포함하지 않는지 간단히 확인
            const nextLineHasKeyword = fields.some(
              (f) =>
                f.label !== field.label &&
                new RegExp(f.label, "i").test(textLines[i + 1])
            );
            if (!nextLineHasKeyword) {
              value = textLines[i + 1].trim();
              break;
            }
          }
        }
      }
    }

    extractedData[field.key] = value;
  }

  return extractedData;
}

export const pdfToPageTexts = async (file: File): Promise<string[]> => {
  try {
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const encodedFile = fileBuffer.toString("base64");

    const credentials = {
      type: "service_account",
      project_id: process.env.PROJECT_ID,
      private_key_id: process.env.PRIVATE_KEY_ID,
      private_key: process.env.PRIVATE_KEY?.replace(/\\n/g, "\n"),
      client_email: process.env.CLIENT_EMAIL,
      client_id: process.env.CLIENT_ID,
      auth_uri: process.env.AUTH_URI,
      token_uri: process.env.TOKEN_URI,
      auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
      universe_domain: process.env.UNIVERSE_DOMAIN,
    };

    const auth = new GoogleAuth({
      credentials: credentials,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const client = new DocumentProcessorServiceClient({ auth });

    const processor = process.env.GOOGLE_DOCUMENTAI_PROCESSOR;

    const request = {
      name: processor,
      rawDocument: {
        content: encodedFile,
        mimeType: "application/pdf",
      },
    };

    const [result] = await client.processDocument(request);
    const { document } = result;

    if (!document || !document.text || !document.pages) {
      throw new Error("Document, text, or pages not found in OCR result.");
    }

    const { text, pages } = document;
    const pageTexts: string[] = [];

    for (const page of pages) {
      let pageText = "";
      if (page.layout?.textAnchor?.textSegments) {
        for (const segment of page.layout.textAnchor.textSegments) {
          const startIndex = segment.startIndex ? Number(segment.startIndex) : 0;
          const endIndex = segment.endIndex ? Number(segment.endIndex) : 0;
          pageText += text.substring(startIndex, endIndex);
        }
      }
      pageTexts.push(pageText);
    }

    if (pageTexts.length === 0 && text) {
        return [text];
    }

    return pageTexts;
  } catch (error) {
    console.error("Error processing PDF:", error);
    throw new Error("PDF processing failed.");
  }
};

export async function processDocumentInChunks(
  encodedFile: string,
  auth: GoogleAuth
) {
  // PDF 파일 디코딩
  const pdfBuffer = Buffer.from(encodedFile, "base64");

  // PDF 로드 및 페이지 수 확인
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pageCount = pdfDoc.getPageCount();

  // 청크 크기 설정 (페이지 단위)
  const CHUNK_SIZE = 10; // 한 번에 10페이지씩 처리

  // Document AI 클라이언트 초기화
  const client = new DocumentProcessorServiceClient({ auth });
  const processor = process.env.GOOGLE_DOCUMENTAI_PROCESSOR;

  // 결과 저장용 변수
  let completeText = "";

  // 페이지를 청크 단위로 처리
  for (let i = 0; i < pageCount; i += CHUNK_SIZE) {
    // 청크 범위 계산
    const endPage = Math.min(i + CHUNK_SIZE, pageCount);
    console.log(`Processing pages ${i + 1} to ${endPage}`);

    // 새 PDF 문서 생성
    const chunkPdf = await PDFDocument.create();

    // 원본에서 페이지 복사
    const copiedPages = await chunkPdf.copyPages(
      pdfDoc,
      Array.from({ length: endPage - i }, (_, index) => i + index)
    );

    // 새 문서에 페이지 추가
    copiedPages.forEach((page) => {
      chunkPdf.addPage(page);
    });

    // PDF를 바이트 배열로 직렬화
    const chunkBytes = await chunkPdf.save();
    const chunkBase64 = Buffer.from(chunkBytes).toString("base64");

    // 청크 처리
    try {
      const request = {
        name: processor,
        rawDocument: {
          content: chunkBase64,
          mimeType: "application/pdf",
        },
      };

      const [result] = await client.processDocument(request);
      if (result.document && result.document.text) {
        completeText += result.document.text + "\n";
      }
    } catch (error) {
      console.error(`Error processing chunk ${i + 1}-${endPage}:`, error);
    }
  }

  return completeText;
}

export default processDocumentInChunks;
