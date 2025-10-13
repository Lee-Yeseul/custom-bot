// 실제 PDF 데이터 추출을 위한 유틸리티 함수들

interface ExtractedData {
  referenceNo: string;
  date: string;
  grossWeight: string;
}

export class PDFExtractor {
  // Reference No 패턴들
  private static REFERENCE_PATTERNS = [
    /Reference\s*No\.?\s*[:-]?\s*([A-Z0-9\-/]+)/i,
    /Ref\.?\s*No\.?\s*[:-]?\s*([A-Z0-9\-/]+)/i,
    /Certificate\s*No\.?\s*[:-]?\s*([A-Z0-9\-/]+)/i,
    /번호\s*[:-]?\s*([A-Z0-9\-/가-힣]+)/,
  ];

  // Date 패턴들
  private static DATE_PATTERNS = [
    /Date\s*[:-]?\s*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/i,
    /발급일자?\s*[:-]?\s*(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})/,
    /(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})/,
    /(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/,
  ];

  // Gross Weight 패턴들
  private static WEIGHT_PATTERNS = [
    /Gross\s*Weight\s*[:-]?\s*([\d,.]+\s*(?:KG|kg|Kg|키로|킬로그램|톤|T))/i,
    /총\s*중량\s*[:-]?\s*([\d,.]+\s*(?:KG|kg|Kg|키로|킬로그램|톤|T))/i,
    /중량\s*[:-]?\s*([\d,.]+\s*(?:KG|kg|Kg|키로|킬로그램|톤|T))/i,
  ];

  /**
   * PDF 텍스트에서 데이터 추출
   */
  static extractData(text: string): ExtractedData {
    const referenceNo = this.extractReferenceNo(text);
    const date = this.extractDate(text);
    const grossWeight = this.extractGrossWeight(text);

    return {
      referenceNo,
      date,
      grossWeight,
    };
  }

  /**
   * Reference No 추출
   */
  private static extractReferenceNo(text: string): string {
    for (const pattern of this.REFERENCE_PATTERNS) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return "추출 실패";
  }

  /**
   * Date 추출
   */
  private static extractDate(text: string): string {
    for (const pattern of this.DATE_PATTERNS) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const dateStr = match[1].trim();
        // 날짜 형식 정규화
        return this.normalizeDate(dateStr);
      }
    }
    return "추출 실패";
  }

  /**
   * Gross Weight 추출
   */
  private static extractGrossWeight(text: string): string {
    for (const pattern of this.WEIGHT_PATTERNS) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return "추출 실패";
  }

  /**
   * 날짜 형식 정규화
   */
  private static normalizeDate(dateStr: string): string {
    try {
      // 다양한 날짜 형식을 YYYY-MM-DD로 변환
      const date = new Date(dateStr.replace(/[-/.]/g, "-"));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }
    } catch (error) {
      // 변환 실패 시 원본 반환
    }
    return dateStr;
  }

  /**
   * 텍스트 전처리
   */
  static preprocessText(text: string): string {
    return text
      .replace(/\s+/g, " ") // 여러 공백을 하나로
      .replace(/\n+/g, " ") // 줄바꿈을 공백으로
      .trim();
  }

  /**
   * 신뢰도 점수 계산
   */
  static calculateConfidence(extractedData: ExtractedData): number {
    let score = 0;
    const maxScore = 3;

    // Reference No 검증
    if (
      extractedData.referenceNo !== "추출 실패" &&
      extractedData.referenceNo.length > 3
    ) {
      score += 1;
    }

    // Date 검증
    if (
      extractedData.date !== "추출 실패" &&
      this.isValidDate(extractedData.date)
    ) {
      score += 1;
    }

    // Gross Weight 검증
    if (
      extractedData.grossWeight !== "추출 실패" &&
      /[\d,.]+/.test(extractedData.grossWeight)
    ) {
      score += 1;
    }

    return (score / maxScore) * 100;
  }

  /**
   * 유효한 날짜인지 확인
   */
  private static isValidDate(dateStr: string): boolean {
    const date = new Date(dateStr);
    return (
      !isNaN(date.getTime()) &&
      date.getFullYear() > 1900 &&
      date.getFullYear() < 2100
    );
  }
}
