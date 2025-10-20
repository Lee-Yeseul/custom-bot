'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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
  '통관/물류': ['통관', '수출', '수입', '물류', '특송', '우편', '공항', '항만'],
  '세금/관세': ['관세', '세금', '부가세', '품목분류', 'HS', '환급'],
  '밀수/단속': ['밀수', '단속', '마약', '불법', '위조', '짝퉁', '적발'],
  'FTA/무역': ['FTA', '무역', '협정', '원산지', 'AEO'],
  '인사/조직': ['인사', '임명', '조직', '개편', '성과', '채용'],
};
const defaultCategory = '기타';

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
  const [groupedNews, setGroupedNews] = useState<Record<string, NewsItem[]>>({});
  const [sortedCategories, setSortedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getNewsData() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/news');

        if (!response.ok) {
          throw new Error(`Failed to fetch news: ${response.statusText}`);
        }

        const { news } = await response.json();

        if (!news) {
          throw new Error('No news data found');
        }

        // Add category to each news item
        const categorizedNews = news.map((item: Omit<NewsItem, 'category'>) => ({
          ...item,
          category: categorizeNews(item.title),
        }));

        const grouped = categorizedNews.reduce((acc: Record<string, NewsItem[]>, item: NewsItem) => {
          (acc[item.category] = acc[item.category] || []).push(item);
          return acc;
        }, {});

        const sorted = Object.keys(grouped).sort((a, b) => {
          if (a === defaultCategory) return 1;
          if (b === defaultCategory) return -1;
          return a.localeCompare(b);
        });

        setGroupedNews(grouped);
        setSortedCategories(sorted);
      } catch (err: any) {
        console.error('Error fetching news data:', err);
        setError('최신 보도자료를 불러오는 데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    getNewsData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">관세청 보도자료</h1>
        <p className="text-muted-foreground">AI가 요약한 최신 보도자료를 확인하세요.</p>
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
        sortedCategories.map((category) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{category}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {groupedNews[category].map((item, index) => (
                <article key={item.link}>
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">
                        {new Date(item.published_date).toLocaleDateString('ko-KR')}
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
                    <p className="text-sm text-muted-foreground">{item.summary}</p>
                  </div>
                  {index < groupedNews[category].length - 1 && <Separator className="my-6" />}
                </article>
              ))}
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">표시할 보도자료가 없습니다.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
