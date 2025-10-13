"use client";

import { useState } from "react";
import {
  Calendar,
  Filter,
  Bell,
  ExternalLink,
  ChevronRight,
  Clock,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export function NewsDashboard() {
  const [selectedFilter, setSelectedFilter] = useState("all");

  const briefingData = [
    {
      id: 1,
      title: "2024년 FTA 원산지 관리 강화 방안 발표",
      summary:
        "관세청이 FTA 원산지 증명서 관리 체계를 강화하고, 디지털 원산지 증명서 도입을 추진한다고 발표했습니다.",
      category: "FTA",
      source: "관세청",
      date: "2024-01-15",
      importance: "high",
      tags: ["FTA", "원산지", "디지털화"],
    },
    {
      id: 2,
      title: "중국 수입 전자상거래 관세 정책 변경",
      summary:
        "중국에서 개인 구매 한도액이 상향 조정되고, 일부 품목의 관세율이 인하되었습니다.",
      category: "전자상거래",
      source: "무역협회",
      date: "2024-01-14",
      importance: "medium",
      tags: ["중국", "전자상거래", "관세율"],
    },
    {
      id: 3,
      title: "HS코드 2024년 개정사항 안내",
      summary:
        "2024년부터 적용되는 HS코드 개정사항과 주요 변경 품목에 대한 상세 안내입니다.",
      category: "HS코드",
      source: "관세청",
      date: "2024-01-13",
      importance: "high",
      tags: ["HS코드", "개정", "분류"],
    },
  ];

  const filters = [
    { id: "all", label: "전체", count: 15 },
    { id: "fta", label: "FTA", count: 5 },
    { id: "ecommerce", label: "전자상거래", count: 3 },
    { id: "hscode", label: "HS코드", count: 4 },
    { id: "law", label: "법령개정", count: 3 },
  ];

  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case "high":
        return <Badge className="bg-red-100 text-red-800">중요</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800">보통</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">일반</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search and Filters - move this to the top */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <Input placeholder="키워드로 검색..." className="max-w-md" />
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <div className="flex space-x-1">
              {filters.map((filter) => (
                <Button
                  key={filter.id}
                  variant={selectedFilter === filter.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter(filter.id)}
                  className="text-xs"
                >
                  {filter.label} ({filter.count})
                </Button>
              ))}
            </div>
          </div>
          <div className="ml-auto flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Bell className="w-4 h-4 mr-2" />
              알림 설정
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              오늘
            </Button>
          </div>
        </div>
      </div>

      {/* Briefing List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {briefingData.map((item) => (
            <Card
              key={item.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getImportanceBadge(item.importance)}
                      <Badge variant="outline">{item.category}</Badge>
                      <span className="text-xs text-gray-500">
                        {item.source}
                      </span>
                    </div>
                    <CardTitle className="text-lg leading-tight">
                      {item.title}
                    </CardTitle>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 text-sm leading-relaxed mb-3">
                  {item.summary}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {item.date}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Tag className="w-3 h-3 text-gray-400" />
                      {item.tags.map((tag, index) => (
                        <span key={index} className="text-xs text-gray-500">
                          #{tag}
                          {index < item.tags.length - 1 && ", "}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    원문 보기
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-6">
          <Button variant="outline">더 많은 브리핑 보기</Button>
        </div>
      </div>
    </div>
  );
}
