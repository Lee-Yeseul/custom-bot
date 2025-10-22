"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface NewsItem {
  id: number;
  created_at: string;
  title: string;
  link: string;
  summary: string;
  published_date: string;
  source_feed: string;
  category: string; // Add category property
}

const categories: Record<string, string[]> = {
  "통관/물류": ["통관", "수출", "수입", "물류", "특송", "우편", "공항", "항만"],
  "세금/관세": ["관세", "세금", "부가세", "품목분류", "HS", "환급"],
  "밀수/단속": ["밀수", "단속", "마약", "불법", "위조", "짝퉁", "적발"],
  "FTA/무역": ["FTA", "무역", "협정", "원산지", "AEO"],
  "인사/조직": ["인사", "임명", "조직", "개편", "성과", "채용"],
};
const defaultCategory = "기타";

function categorizeNews(title: string): string {
  const content = title.toLowerCase();
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword) => content.includes(keyword))) {
      return category;
    }
  }
  return defaultCategory;
}

export default function NewsDashboard() {
  const [groupedNews, setGroupedNews] = useState<Record<string, NewsItem[]>>(
    {}
  );
  const [sortedCategories, setSortedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    async function getNewsData() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/news?page=${currentPage}&pageSize=${pageSize}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch news: ${response.statusText}`);
        }

        const { news, count } = await response.json();

        if (!news) {
          throw new Error("No news data found");
        }

        setTotalCount(count || 0);

        // Add category to each news item
        const categorizedNews = news.map(
          (item: Omit<NewsItem, "category">) => ({
            ...item,
            category: categorizeNews(item.title),
          })
        );

        const grouped = categorizedNews.reduce(
          (acc: Record<string, NewsItem[]>, item: NewsItem) => {
            (acc[item.category] = acc[item.category] || []).push(item);
            return acc;
          },
          {}
        );

        const sorted = Object.keys(grouped).sort((a, b) => {
          if (a === defaultCategory) return 1;
          if (b === defaultCategory) return -1;
          return a.localeCompare(b);
        });

        setGroupedNews(grouped);
        setSortedCategories(sorted);
      } catch (err: any) {
        console.error("Error fetching news data:", err);
        setError("최신 보도자료를 불러오는 데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    }

    getNewsData();
  }, [currentPage]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="flex flex-col h-full">
      <main className="container mx-auto px-6 py-6">
        <div className="mb-8">
          <h3 className="font-sans text-2xl font-bold text-foreground">
            관세청 보도자료
          </h3>
          <p className="mt-2 font-sans text-base text-muted-foreground leading-relaxed">
            AI가 요약한 최신 보도자료를 확인하세요.
          </p>
        </div>
        {isLoading ? (
          <div className="space-y-8">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/4" />
                </CardHeader>
                <CardContent className="space-y-6">
                  {[...Array(2)].map((_, j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Separator className="my-6" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-destructive">{error}</p>
            </CardContent>
          </Card>
        ) : sortedCategories.length > 0 ? (
          <>
            {sortedCategories.map((category) => (
              <Card key={category} className="mb-4">
                <CardHeader>
                  <CardTitle>{category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {groupedNews[category].map((item, index) => (
                    <article key={item.link}>
                      <div className="space-y-2">
                        <div className="flex items-center gap-4">
                          <Badge variant="outline">
                            {new Date(item.published_date).toLocaleDateString(
                              "ko-KR"
                            )}
                          </Badge>
                          <h3 className="text-lg font-semibold">
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              {item.title}
                            </a>
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.summary}
                        </p>
                      </div>
                      {index < groupedNews[category].length - 1 && (
                        <Separator className="my-6" />
                      )}
                    </article>
                  ))}
                </CardContent>
              </Card>
            ))}
            <div className="flex items-center justify-center space-x-4 pt-4">
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                이전
              </Button>
              <span className="text-sm font-medium">
                {currentPage} / {totalPages}
              </span>
              <Button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                다음
              </Button>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                표시할 보도자료가 없습니다.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
