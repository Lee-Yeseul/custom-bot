"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Package, Sparkles, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HSCodeResult {
  code: string;
  description: string;
  confidence: number;
  rationale: string;
}

export default function HScodeFinder() {
  const [productDescription, setProductDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<HSCodeResult[]>([]);

  const handleAnalyze = async () => {
    if (!productDescription.trim()) return;

    setIsAnalyzing(true);
    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockResults: HSCodeResult[] = [
      {
        code: "8471.30",
        description: "휴대용 자동자료처리기계(무게 10kg 이하)",
        confidence: 92,
        rationale:
          "제품 설명에서 '노트북', '휴대용', '컴퓨터'라는 키워드가 확인되었습니다. HS 코드 8471.30은 휴대용 자동자료처리기계를 분류하는 코드로, 무게 10kg 이하의 노트북 컴퓨터가 해당됩니다.",
      },
      {
        code: "8471.41",
        description: "기타 자동자료처리기계(시스템 형태)",
        confidence: 78,
        rationale:
          "제품이 시스템 형태로 구성된 경우 이 코드가 적용될 수 있습니다. 다만 휴대용 특성이 강조되어 있어 8471.30이 더 적합할 것으로 판단됩니다.",
      },
      {
        code: "8471.50",
        description: "자동자료처리기계의 처리장치",
        confidence: 65,
        rationale:
          "제품이 완제품이 아닌 처리장치 단독으로 수입되는 경우 이 코드를 고려할 수 있습니다. 그러나 완제품 노트북으로 보이므로 우선순위가 낮습니다.",
      },
    ];

    setResults(mockResults);
    setIsAnalyzing(false);
  };

  const handleReset = () => {
    setProductDescription("");
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="font-sans text-3xl font-bold text-foreground">
            HS 코드 분류 AI
          </h2>
          <p className="mt-2 font-sans text-base text-muted-foreground leading-relaxed">
            제품 설명을 입력하면 AI가 적합한 HS 코드 3개를 추천해드립니다
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left Panel - Input Form */}
          <div className="lg:col-span-2">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-sans text-xl">
                  <Package className="h-5 w-5" />
                  제품 정보 입력
                </CardTitle>
                <CardDescription className="font-sans">
                  분류하고자 하는 제품의 상세 정보를 입력하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="product-description"
                    className="font-sans text-sm font-medium"
                  >
                    제품 설명
                  </Label>
                  <Textarea
                    id="product-description"
                    placeholder="예: 14인치 노트북 컴퓨터, Intel Core i7 프로세서, 16GB RAM, 512GB SSD, Windows 11 운영체제"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    rows={8}
                    className="resize-none font-sans"
                  />
                  <p className="font-sans text-xs text-muted-foreground">
                    제품의 재질, 용도, 기능, 사양 등을 자세히 입력할수록 정확한
                    분류가 가능합니다
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !productDescription.trim()}
                    className="flex-1 font-sans"
                  >
                    {isAnalyzing ? (
                      <>
                        <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                        분석 중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        AI 분석 시작
                      </>
                    )}
                  </Button>
                  {results.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      className="font-sans bg-transparent"
                    >
                      초기화
                    </Button>
                  )}
                </div>

                {/* Tips */}
                <Card className="bg-muted/30">
                  <CardContent className="pt-4">
                    <h4 className="mb-2 font-sans text-sm font-semibold text-foreground">
                      입력 팁
                    </h4>
                    <ul className="space-y-1 font-sans text-xs text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 h-1 w-1 rounded-full bg-secondary flex-shrink-0" />
                        <span>제품의 재질과 구성 요소</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 h-1 w-1 rounded-full bg-secondary flex-shrink-0" />
                        <span>주요 용도와 기능</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 h-1 w-1 rounded-full bg-secondary flex-shrink-0" />
                        <span>기술 사양 및 특징</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-3">
            {results.length === 0 ? (
              <Card className="h-full">
                <CardContent className="flex h-full min-h-[400px] flex-col items-center justify-center p-12">
                  <TrendingUp className="mb-4 h-16 w-16 text-muted-foreground" />
                  <p className="font-sans text-base font-medium text-foreground">
                    AI 분석 결과가 여기에 표시됩니다
                  </p>
                  <p className="mt-2 text-center font-sans text-sm text-muted-foreground">
                    제품 설명을 입력하고 AI 분석을 시작하세요
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans text-xl font-semibold text-foreground">
                    추천 HS 코드
                  </h3>
                  <Badge variant="secondary" className="font-sans">
                    {results.length}개 결과
                  </Badge>
                </div>

                {results.map((result, index) => (
                  <Card
                    key={result.code}
                    className={`transition-all hover:border-primary ${
                      index === 0 ? "border-primary/50 shadow-md" : ""
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-3">
                            <Badge
                              variant={index === 0 ? "default" : "secondary"}
                              className="font-mono text-sm"
                            >
                              {result.code}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`font-sans text-xs ${
                                result.confidence >= 85
                                  ? "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400"
                                  : result.confidence >= 70
                                  ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                                  : "border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-400"
                              }`}
                            >
                              정확도 {result.confidence}%
                            </Badge>
                            {index === 0 && (
                              <Badge className="bg-secondary font-sans text-xs">
                                최적 추천
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="font-sans text-lg">
                            {result.description}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="mb-2 font-sans text-sm font-semibold text-foreground">
                            분류 근거
                          </h4>
                          <p className="font-sans text-sm leading-relaxed text-muted-foreground">
                            {result.rationale}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="font-sans text-xs bg-transparent"
                          >
                            상세 정보
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="font-sans text-xs bg-transparent"
                          >
                            관세율 확인
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Card className="bg-muted/30">
                  <CardContent className="pt-6">
                    <h4 className="mb-3 font-sans text-sm font-semibold text-foreground">
                      참고 사항
                    </h4>
                    <ul className="space-y-2 font-sans text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        <span>
                          AI 추천 결과는 참고용이며, 최종 분류는 관세사의 검토가
                          필요합니다
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        <span>정확도가 높은 순서대로 정렬되어 있습니다</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        <span>
                          각 코드의 상세 정보와 관세율을 확인할 수 있습니다
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
