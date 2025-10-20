"use client";

import type React from "react";

import { useState, useCallback, useMemo } from "react";
import {
  Upload,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2,
  X,
  Plus,
  Settings2,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExtractField {
  id: string;
  label: string;
  key: string;
  enabled: boolean;
  pattern?: string;
}

interface ExtractedData {
  page: number;
  [key: string]: string | number;
}

interface UploadedFile {
  id: number;
  name: string;
  size: string;
  status: "processing" | "completed" | "error";
  progress?: number;
  extractedData?: ExtractedData[];
  errorMessage?: string;
  file?: File;
}

const DEFAULT_FIELDS: ExtractField[] = [
  {
    id: "referenceNo",
    label: "Reference No",
    key: "referenceNo",
    enabled: true,
    pattern: "Reference\\s*No\\.?\\s*[:-]?\\s*([A-Z0-9\\-/]+)",
  },
  {
    id: "date",
    label: "Date",
    key: "date",
    enabled: true,
    pattern: "Date\\s*[:-]?\\s*(\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4})",
  },
  {
    id: "grossWeight",
    label: "Gross Weight",
    key: "grossWeight",
    enabled: true,
    pattern: "Gross\\s*Weight\\s*[:-]?\\s*([\\d,.\\s]*(?:KG|kg))",
  },
];

export function Extractor() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [extractFields, setExtractFields] =
    useState<ExtractField[]>(DEFAULT_FIELDS);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldPattern, setNewFieldPattern] = useState("");

  const processFile = useCallback(
    async (file: UploadedFile) => {
      if (!file.file) return;

      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, status: "processing", progress: 30 } : f
        )
      );

      try {
        const formData = new FormData();
        formData.append("pdf", file.file);
        const enabledFields = extractFields.filter((f) => f.enabled);
        formData.append("fields", JSON.stringify(enabledFields));

        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, progress: 60 } : f))
        );

        const response = await fetch("/api/ocr/pdf", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "서버에서 오류가 발생했습니다.");
        }

        const extractedData = await response.json();

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  status: "completed",
                  extractedData:
                    extractedData.length > 0 ? extractedData : undefined,
                  errorMessage:
                    extractedData.length === 0
                      ? "추출할 데이터를 찾지 못했습니다."
                      : undefined,
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
                  errorMessage:
                    error instanceof Error
                      ? error.message
                      : "PDF 처리 중 알 수 없는 오류가 발생했습니다.",
                }
              : f
          )
        );
      }
    },
    [extractFields]
  );

  const handleFiles = useCallback(
    (files: FileList) => {
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
    },
    [processFile]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
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

  const toggleField = (fieldId: string) => {
    setExtractFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, enabled: !f.enabled } : f))
    );
  };

  const addCustomField = () => {
    if (!newFieldLabel.trim()) return;
    const newField: ExtractField = {
      id: `custom_${Date.now()}`,
      label: newFieldLabel,
      key: newFieldLabel.toLowerCase().replace(/\s+/g, "_"),
      enabled: true,
      pattern: newFieldPattern || undefined,
    };
    setExtractFields((prev) => [...prev, newField]);
    setNewFieldLabel("");
    setNewFieldPattern("");
    setIsFieldDialogOpen(false);
  };

  const removeField = (fieldId: string) => {
    setExtractFields((prev) => prev.filter((f) => f.id !== fieldId));
  };

  const resetFields = () => {
    setExtractFields(DEFAULT_FIELDS);
  };

  const downloadAllExcel = () => {
    const completedFiles = uploadedFiles.filter(
      (f) => f.status === "completed" && f.extractedData
    );
    if (completedFiles.length === 0) return;

    const enabledFields = extractFields.filter((f) => f.enabled);
    const allData: (string | number)[][] = [
      ["파일명", "페이지", ...enabledFields.map((f) => f.label), "추출일시"],
    ];

    completedFiles.forEach((file) => {
      file.extractedData?.forEach((pageData) => {
        allData.push([
          file.name,
          pageData.page,
          ...enabledFields.map((field) => pageData[field.key] || "추출 실패"),
          new Date().toLocaleString("ko-KR"),
        ]);
      });
    });

    const csvContent = allData.map((row) => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `all_extracted_data_${new Date().toISOString().split("T")[0]}.csv`
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

  const getStatusBadge = (status: string, errorMessage?: string) => {
    if (status === "completed" && errorMessage) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">데이터 없음</Badge>
      );
    }
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
  const totalExtractedRows = useMemo(
    () =>
      completedFiles.reduce(
        (acc, file) => acc + (file.extractedData?.length || 0),
        0
      ),
    [completedFiles]
  );

  const processingFiles = uploadedFiles.filter(
    (f) => f.status === "processing"
  );
  const enabledFields = extractFields.filter((f) => f.enabled);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                PDF 데이터 추출 (Multi-page)
              </h3>
              <p className="text-gray-600">
                PDF의 각 페이지에서 데이터를 추출합니다.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Dialog
                open={isFieldDialogOpen}
                onOpenChange={setIsFieldDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Settings2 className="w-4 h-4 mr-2" />
                    추출 필드 설정
                  </Button>
                </DialogTrigger>
                <DialogContent className="min-w-3xl max-h-[680px] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>추출 필드 설정</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label className="text-base font-semibold mb-3 block">
                        추출할 필드 선택
                      </Label>
                      <ScrollArea className="h-[300px] rounded-md border p-4">
                        <div className="space-y-3">
                          {extractFields.map((field) => (
                            <div
                              key={field.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center space-x-3 flex-1">
                                <Checkbox
                                  id={field.id}
                                  checked={field.enabled}
                                  onCheckedChange={() => toggleField(field.id)}
                                />
                                <div className="flex-1">
                                  <Label
                                    htmlFor={field.id}
                                    className="font-medium cursor-pointer"
                                  >
                                    {field.label}
                                  </Label>
                                  {field.pattern && (
                                    <p className="text-xs text-gray-500 mt-1 font-mono">
                                      {field.pattern}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {!DEFAULT_FIELDS.find(
                                (f) => f.id === field.id
                              ) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeField(field.id)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                    <div className="border-t pt-4">
                      <Label className="text-base font-semibold mb-3 block">
                        커스텀 필드 추가
                      </Label>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="field-label">필드 이름 *</Label>
                          <Input
                            id="field-label"
                            placeholder="예: Exporter Name"
                            value={newFieldLabel}
                            onChange={(e) => setNewFieldLabel(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="field-pattern">
                            추출 패턴 (정규표현식, 선택사항)
                          </Label>
                          <Input
                            id="field-pattern"
                            placeholder="예: Exporter\\s*[:-]?\\s*(.+)"
                            value={newFieldPattern}
                            onChange={(e) => setNewFieldPattern(e.target.value)}
                            className="font-mono text-sm"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button onClick={addCustomField} className="flex-1">
                            <Plus className="w-4 h-4 mr-2" />
                            필드 추가
                          </Button>
                          <Button variant="outline" onClick={resetFields}>
                            기본값으로 리셋
                          </Button>
                        </div>
                      </div>

                      <Alert className="mt-4 text-sm">
                        <Info className="h-4 w-4" />
                        <AlertTitle>도움말</AlertTitle>
                        <AlertDescription className="space-y-2">
                          <p>
                            <b>필드 이름</b>: PDF에서 찾고 싶은 항목의
                            이름(키워드)을 정확하게 입력하세요. (예: `Invoice
                            No`, `Exporter`)
                            <br />
                            기본적으로 프로그램이 키워드를 찾아 그 주변의 값을
                            자동으로 추출합니다.
                          </p>
                          <p>
                            <b>추출 패턴</b>: 값을 더 정교하게 찾아야 할 때
                            사용하는 고급 기능입니다. 잘 모르시면 비워두셔도
                            괜찮습니다.
                          </p>
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                추출 대상 필드 ({enabledFields.length}개)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {enabledFields.map((field) => (
                  <Badge key={field.id} variant="secondary" className="text-sm">
                    {field.label}
                  </Badge>
                ))}
                {enabledFields.length === 0 && (
                  <p className="text-sm text-gray-500">
                    추출할 필드를 선택해주세요.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

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
                  PDF 파일을 드래그하거나 클릭하여 업로드
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  여러 페이지를 포함한 PDF를 지원합니다.
                </p>
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-upload"
                  disabled={enabledFields.length === 0}
                />
                <label htmlFor="file-upload">
                  <Button asChild disabled={enabledFields.length === 0}>
                    <span>파일 선택</span>
                  </Button>
                </label>
                {enabledFields.length === 0 && (
                  <p className="text-xs text-red-500 mt-2">
                    먼저 추출할 필드를 선택해주세요.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {totalExtractedRows > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>추출 완료된 데이터</CardTitle>
                <Button
                  onClick={downloadAllExcel}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Excel 다운로드 ({totalExtractedRows}개 행)
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">파일명</TableHead>
                        <TableHead className="w-[80px]">페이지</TableHead>
                        {enabledFields.map((field) => (
                          <TableHead key={field.id} className="min-w-[150px]">
                            {field.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedFiles.map((file) =>
                        file.extractedData?.map((pageData) => (
                          <TableRow key={`${file.id}-${pageData.page}`}>
                            <TableCell className="font-medium">
                              {file.name}
                            </TableCell>
                            <TableCell>{pageData.page}</TableCell>
                            {enabledFields.map((field) => (
                              <TableCell key={field.id}>
                                {pageData[field.key] || "-"}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {(processingFiles.length > 0 ||
            uploadedFiles.some(
              (f) =>
                f.status === "error" ||
                (f.status === "completed" && f.errorMessage)
            )) && (
            <Card>
              <CardHeader>
                <CardTitle>처리 현황</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {uploadedFiles
                  .filter(
                    (f) =>
                      f.status !== "completed" ||
                      (f.status === "completed" && f.errorMessage)
                  )
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
                          {getStatusBadge(file.status, file.errorMessage)}
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

                      {(file.status === "error" ||
                        (file.status === "completed" && file.errorMessage)) && (
                        <Alert
                          variant={
                            file.status === "error" ? "destructive" : "default"
                          }
                          className="mt-2"
                        >
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
        </div>
      </div>
    </div>
  );
}
