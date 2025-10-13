"use client";

import { PDFExtractor } from "@/lib/pdf-extractor";
import { useState, useCallback } from "react";

interface ExtractedData {
  referenceNo: string;
  date: string;
  grossWeight: string;
}

interface ProcessingResult {
  success: boolean;
  data?: ExtractedData;
  confidence?: number;
  error?: string;
}

export function usePDFProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = useCallback(
    async (file: File): Promise<ProcessingResult> => {
      setIsProcessing(true);

      try {
        // 실제 구현에서는 PDF.js나 다른 PDF 파싱 라이브러리 사용
        const text = await extractTextFromPDF(file);
        const preprocessedText = PDFExtractor.preprocessText(text);
        const extractedData = PDFExtractor.extractData(preprocessedText);
        const confidence = PDFExtractor.calculateConfidence(extractedData);

        return {
          success: true,
          data: extractedData,
          confidence,
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "알 수 없는 오류가 발생했습니다",
        };
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  return {
    processFile,
    isProcessing,
  };
}

/**
 * PDF에서 텍스트 추출 (실제 구현에서는 PDF.js 사용)
 */
async function extractTextFromPDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      // 실제로는 PDF.js를 사용해서 텍스트 추출
      // 여기서는 시뮬레이션
      setTimeout(() => {
        const simulatedText = `
          CERTIFICATE OF ORIGIN
          Reference No: CO-2024-001234
          Date: 2024-01-15
          Exporter: ABC Trading Company
          Consignee: XYZ Import Corp
          Description of Goods: Electronic Components
          Gross Weight: 1,250.5 KG
          Country of Origin: Korea
        `;
        resolve(simulatedText);
      }, 1000);
    };

    reader.onerror = () => reject(new Error("파일을 읽을 수 없습니다"));
    reader.readAsArrayBuffer(file);
  });
}
