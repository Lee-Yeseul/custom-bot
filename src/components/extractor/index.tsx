"use client";

import type React from "react";

import { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ExtractedData {
  referenceNo: string;
  date: string;
  grossWeight: string;
}

interface UploadedFile {
  id: number;
  name: string;
  size: string;
  status: "processing" | "completed" | "error";
  progress?: number;
  extractedData?: ExtractedData;
  errorMessage?: string;
  file?: File;
}

export function Extractor() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      if (file.type === "application/pdf") {
        const newFile: UploadedFile = {
          id: Date.now() + Math.random(),
          name: file.name,
          size: formatFileSize(file.size),
          status: "processing",
          progress: 0,
          file: file,
        };

        setUploadedFiles((prev) => [...prev, newFile]);
        processFile(newFile);
      }
    });
  };

  const processFile = async (file: UploadedFile) => {
    try {
      // 진행률 시뮬레이션
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, progress } : f))
        );
      }

      const extractedData = await extractDataFromPDF(file.file!);

      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? {
                ...f,
                status: "completed",
                extractedData,
                progress: 100,
              }
            : f
        )
      );
    } catch (error) {
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? {
                ...f,
                status: "error",
                errorMessage: "PDF 처리 중 오류가 발생했습니다.",
              }
            : f
        )
      );
    }
  };

  // PDF에서 데이터 추출 (실제 구현에서는 PDF 파싱 라이브러리 사용)
  const extractDataFromPDF = async (file: File): Promise<ExtractedData> => {
    return {
      referenceNo: "CO-2024-001234",
      date: "2024-01-15",
      grossWeight: "1,250.5 KG",
    };
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const removeFile = (fileId: number) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const downloadExcel = (file: UploadedFile) => {
    if (!file.extractedData) return;

    // Excel 파일 생성 및 다운로드
    const data = [
      ["항목", "값"],
      ["Reference No", file.extractedData.referenceNo],
      ["Date", file.extractedData.date],
      ["Gross Weight", file.extractedData.grossWeight],
      ["파일명", file.name],
      ["추출일시", new Date().toLocaleString("ko-KR")],
    ];

    const csvContent = data.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${file.name.replace(".pdf", "")}_extracted.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllExcel = () => {
    const completedFiles = uploadedFiles.filter(
      (f) => f.status === "completed" && f.extractedData
    );

    if (completedFiles.length === 0) return;

    const allData = [
      ["파일명", "Reference No", "Date", "Gross Weight", "추출일시"],
      ...completedFiles.map((file) => [
        file.name,
        file.extractedData!.referenceNo,
        file.extractedData!.date,
        file.extractedData!.grossWeight,
        new Date().toLocaleString("ko-KR"),
      ]),
    ];

    const csvContent = allData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `certificate_of_origin_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">완료</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800">처리중</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800">오류</Badge>;
      default:
        return <Badge variant="outline">대기</Badge>;
    }
  };

  const completedFiles = uploadedFiles.filter((f) => f.status === "completed");
  const processingFiles = uploadedFiles.filter(
    (f) => f.status === "processing"
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                원산지 증명서 데이터 추출
              </h3>
              <p className="text-gray-600">
                Certificate of Origin에서 Reference No, Date, Gross Weight를
                추출합니다
              </p>
            </div>
            {completedFiles.length > 0 && (
              <Button
                onClick={downloadAllExcel}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                전체 Excel 다운로드 ({completedFiles.length}개)
              </Button>
            )}
          </div>

          {/* 업로드 영역 */}
          <Card>
            <CardContent className="p-6">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-300 hover:border-blue-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  원산지 증명서 PDF 파일을 드래그하거나 클릭하여 업로드
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  PDF 파일만 지원됩니다
                </p>
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button asChild>
                    <span>파일 선택</span>
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* 추출 결과 테이블 */}
          {completedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>추출 완료된 데이터</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>파일명</TableHead>
                      <TableHead>Reference No</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Gross Weight</TableHead>
                      <TableHead>작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedFiles.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell className="font-medium">
                          {file.name}
                        </TableCell>
                        <TableCell>{file.extractedData?.referenceNo}</TableCell>
                        <TableCell>{file.extractedData?.date}</TableCell>
                        <TableCell>{file.extractedData?.grossWeight}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadExcel(file)}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Excel
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFile(file.id)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* 처리 중인 파일들 */}
          {(processingFiles.length > 0 ||
            uploadedFiles.some((f) => f.status === "error")) && (
            <Card>
              <CardHeader>
                <CardTitle>처리 현황</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {uploadedFiles
                  .filter((f) => f.status !== "completed")
                  .map((file) => (
                    <div key={file.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(file.status)}
                          <span className="font-medium text-sm">
                            {file.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(file.status)}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFile(file.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span>{file.size}</span>
                        {file.status === "processing" && (
                          <span>{file.progress}% 완료</span>
                        )}
                      </div>

                      {file.status === "processing" && (
                        <Progress value={file.progress} className="mb-3" />
                      )}

                      {file.status === "error" && (
                        <Alert className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            {file.errorMessage}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

          {/* 사용 가이드 */}
          <Card>
            <CardHeader>
              <CardTitle>사용 가이드</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600">
                <h4 className="font-medium mb-2">추출되는 데이터:</h4>
                <ul className="space-y-1 ml-4">
                  <li>
                    • <strong>Reference No</strong>: 원산지 증명서 참조번호
                  </li>
                  <li>
                    • <strong>Date</strong>: 발급일자
                  </li>
                  <li>
                    • <strong>Gross Weight</strong>: 총중량
                  </li>
                </ul>
              </div>
              <div className="text-sm text-gray-600">
                <h4 className="font-medium mb-2">지원 형식:</h4>
                <ul className="space-y-1 ml-4">
                  <li>• PDF 파일만 지원</li>
                  <li>• 한 번에 여러 파일 업로드 가능</li>
                  <li>• 추출된 데이터는 Excel(CSV) 형식으로 다운로드</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
