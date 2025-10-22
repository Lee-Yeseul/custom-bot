"use client";

import { useState } from "react";
import {
  Search,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  Plane,
  Ship,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface TrackingHistory {
  timestamp: string;
  description: string;
}

interface TrackingData {
  clearanceNumber: string;
  currentStatus: string;
  location: string;
  history: TrackingHistory[];
}

interface TrackerProps {
  onSearch: (clearanceNumber: string) => void;
  trackingData: TrackingData | null;
  isLoading: boolean;
  error: string | null;
}

export function Tracker({
  onSearch,
  trackingData,
  isLoading,
  error,
}: TrackerProps) {
  const [clearanceNumberInput, setClearanceNumberInput] = useState("");

  const handleSearchClick = () => {
    if (clearanceNumberInput.trim()) {
      onSearch(clearanceNumberInput.trim());
    }
  };

  // Helper functions (getStatusColor, getTransportIcon) will need to be adapted
  // or removed if the new trackingData structure doesn't support them directly.
  // For now, I'll keep them as placeholders or simplify them.

  const getStatusColor = (status: string) => {
    switch (status) {
      case "통관 완료":
        return "bg-green-100 text-green-800";
      case "통관 진행 중":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // The original getTransportIcon used 'transportType' which is not in TrackingData.
  // I'll simplify this or remove it if not directly applicable.
  const getTransportIcon = (type: string) => {
    // Placeholder, as TrackingData doesn't have transportType
    return <Package className="w-5 h-5" />;
  };

  return (
    <div className="flex flex-col h-full">
      <main className="container mx-auto px-6 py-6">
        <div className="mb-8">
          <h3 className="font-sans text-2xl font-bold text-foreground">
            통관 화물 추적
          </h3>
          <p className="mt-2 font-sans text-base text-muted-foreground leading-relaxed">
            통관번호를 입력하여 화물의 실시간 위치와 통관 진행 상태를 확인하세요
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* 검색 영역 */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="통관번호를 입력하세요 (예: 24-0116-1234567)"
                      value={clearanceNumberInput}
                      onChange={(e) => setClearanceNumberInput(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSearchClick()
                      }
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    onClick={handleSearchClick}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        조회 중...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        추적하기
                      </>
                    )}
                  </Button>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {/* 최근 검색 - 이 부분은 API에서 제공되지 않으므로 제거하거나 mock으로 유지합니다. 현재는 제거합니다. */}
                {/* {!trackingData && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">
                        최근 조회한 통관번호
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((number, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => setClearanceNumberInput(number)}
                          >
                            {number}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )} */}
              </div>
            </CardContent>
          </Card>
          {/* 추적 결과 */}
          {trackingData && (
            <>
              {/* 현재 상태 카드 */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">
                        통관번호: {trackingData.clearanceNumber}
                      </CardTitle>
                      <CardDescription>
                        {/* estimatedDelivery는 TrackingData에 없으므로 제거 */}
                        {/* 예상 도착일: {trackingData.estimatedDelivery} */}
                      </CardDescription>
                    </div>
                    <Badge
                      className={getStatusColor(trackingData.currentStatus)}
                    >
                      {trackingData.currentStatus}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 배송 정보 - TrackingData에 shipper, receiver, origin, destination, transportType 없음 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {/* getTransportIcon(trackingData.transportType) */}
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">현재 위치</p>
                        <p className="font-medium">{trackingData.location}</p>
                      </div>
                    </div>
                    {/* 나머지 배송 정보는 TrackingData에 없으므로 제거 */}
                    {/*
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">출발지</p>
                          <p className="font-medium">{trackingData.origin}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">도착지</p>
                          <p className="font-medium">
                            {trackingData.destination}
                          </p>
                        </div>
                      </div>
                      */}
                  </div>
                  <Separator />
                  {/* 송하인/수하인 정보는 TrackingData에 없으므로 제거 */}
                  {/*
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          송하인 (Shipper)
                        </p>
                        <p className="font-medium">{trackingData.shipper}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          수하인 (Consignee)
                        </p>
                        <p className="font-medium">{trackingData.receiver}</p>
                      </div>
                    </div>
                    */}
                </CardContent>
              </Card>
              {/* 추적 이벤트 타임라인 */}
              <Card>
                <CardHeader>
                  <CardTitle>배송 진행 상황</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trackingData.history.map((event, index) => (
                      <div key={index} className="relative">
                        {index < trackingData.history.length - 1 && (
                          <div
                            className={`absolute left-4 top-10 w-0.5 h-full ${
                              // event.completed는 TrackingHistory에 없으므로 항상 파란색으로 표시
                              "bg-blue-600"
                            }`}
                          />
                        )}
                        <div className="flex items-start space-x-4">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              // event.completed는 TrackingHistory에 없으므로 항상 파란색으로 표시
                              "bg-blue-600"
                            }`}
                          >
                            {/* event.completed는 TrackingHistory에 없으므로 항상 CheckCircle 표시 */}
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 pb-8">
                            <div className="flex items-center justify-between mb-1">
                              <h4
                                className={`font-semibold ${
                                  // event.completed는 TrackingHistory에 없으므로 항상 text-gray-900
                                  "text-gray-900"
                                }`}
                              >
                                {event.description}
                              </h4>
                              <span className="text-sm text-gray-500">
                                {event.timestamp}
                              </span>
                            </div>
                            <p
                              className={`text-sm ${
                                // event.completed는 TrackingHistory에 없으므로 항상 text-gray-600
                                "text-gray-600"
                              }`}
                            >
                              {event.description}
                            </p>
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              {/* TrackingHistory에 location이 없으므로 제거 */}
                              {/* <MapPin className="w-3 h-3 mr-1" />
                                {event.location} */}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              {/* 관련 링크 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">관련 서비스</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-between bg-transparent"
                  >
                    <span>관세청 유니패스에서 확인</span>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-between bg-transparent"
                  >
                    <span>수입신고 서류 다운로드</span>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-between bg-transparent"
                  >
                    <span>통관 관련 문의하기</span>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
          {/* 사용 가이드 */}
          {!trackingData && (
            <Card>
              <CardHeader>
                <CardTitle>사용 가이드</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600">
                  <h4 className="font-medium mb-2">통관번호 형식:</h4>
                  <ul className="space-y-1 ml-4">
                    <li>
                      • 수입신고번호: YY-MMDD-XXXXXXX (예: 24-0116-1234567)
                    </li>
                    <li>• 화물관리번호: 각 운송사별 고유번호</li>
                    <li>• B/L 번호: 선하증권 번호</li>
                  </ul>
                </div>
                <div className="text-sm text-gray-600">
                  <h4 className="font-medium mb-2">확인 가능한 정보:</h4>
                  <ul className="space-y-1 ml-4">
                    <li>• 화물의 현재 위치 및 상태</li>
                    <li>• 통관 진행 단계</li>
                    <li>• 예상 도착 일시</li>
                    <li>• 세관 검사 진행 상황</li>
                  </ul>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    실시간 정보는 관세청 유니패스 시스템과 연동되어 제공됩니다.
                    정보 업데이트에 최대 30분이 소요될 수 있습니다.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
