"use client";

import { useState } from "react";
import {
  Send,
  Bookmark,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      content:
        "안녕하세요! 관세 업무 관련 질문이 있으시면 언제든 물어보세요. FTA 원산지 기준, HS코드 분류, 통관절차 등 다양한 주제로 도움드릴 수 있습니다.",
      timestamp: "오후 2:30",
    },
  ]);

  const promptTemplates = [
    "FTA 자격요건 확인용 질문",
    "수입신고 체크리스트 생성",
    "HS코드 분류 가이드",
    "원산지 증명서 요건",
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages([
        ...messages,
        {
          id: messages.length + 1,
          type: "user",
          content: message,
          timestamp: "지금",
        },
      ]);
      setMessage("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Prompt Templates */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">
            빠른 질문 템플릿
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {promptTemplates.map((template, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setMessage(template)}
            >
              {template}
            </Button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <Card
              className={`max-w-2xl ${
                msg.type === "user" ? "bg-blue-600 text-white" : "bg-white"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  {msg.type === "bot" && (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span
                        className={`text-xs ${
                          msg.type === "user"
                            ? "text-blue-100"
                            : "text-gray-500"
                        }`}
                      >
                        {msg.timestamp}
                      </span>
                      {msg.type === "bot" && (
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <Bookmark className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-6">
        <div className="flex space-x-4">
          <Input
            placeholder="관세 관련 질문을 입력하세요..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Enter를 눌러 메시지를 전송하거나, 위의 템플릿을 클릭해보세요.
        </p>
      </div>
    </div>
  );
}
