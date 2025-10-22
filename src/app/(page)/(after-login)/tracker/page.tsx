"use client";

import { useState } from "react";
import { Tracker } from "@/components/tracker";

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

export default function TrackerPage() {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (clearanceNumber: string) => {
    setIsLoading(true);
    setError(null);
    setTrackingData(null);

    try {
      const response = await fetch(
        `/api/tracker?clearanceNumber=${clearanceNumber}`
      );
      const result = await response.json();

      if (result.status === "success") {
        setTrackingData(result.data);
      } else {
        setError(result.message || "통관 정보를 불러오는데 실패했습니다.");
      }
    } catch (err) {
      console.error("Failed to fetch tracking data:", err);
      setError("네트워크 오류 또는 서버에 문제가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full">
      <Tracker
        onSearch={handleSearch}
        trackingData={trackingData}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}
