"use client";

import { AnalysisCard } from "./AnalysisCard";

type MessageData = {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  contentType?: string;
  createdAt: string;
};

type AnalysisData = {
  id: string;
  riskScore: number;
  riskLevel: string;
  confidence: number;
  scamType: string | null;
  explanation: string;
  recommendations: string[];
  indicators: Array<{ type: "red_flag" | "trust_signal"; text: string; weight: number }>;
  processingTimeMs: number;
  cached?: boolean;
};

export function MessageBubble({
  message,
  analysis,
  onFeedback,
}: {
  message: MessageData;
  analysis?: AnalysisData;
  onFeedback?: (analysisId: string, feedback: string) => void;
}) {
  const isUser = message.role === "USER";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`max-w-[85%] ${isUser ? "order-2" : "order-1"}`}>
        {/* Avatar */}
        <div className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0 ${
              isUser ? "bg-blue-600" : "bg-gray-700"
            }`}
          >
            {isUser ? "U" : "S"}
          </div>

          <div className="space-y-1 min-w-0">
            {/* Message bubble */}
            <div
              className={`rounded-2xl px-4 py-2.5 ${
                isUser
                  ? "bg-blue-600 text-white rounded-br-md"
                  : "bg-gray-100 text-gray-900 rounded-bl-md"
              }`}
            >
              {message.contentType === "IMAGE" ? (
                <p className="text-sm italic">
                  {message.content}
                </p>
              ) : (
                <div className="text-sm whitespace-pre-wrap break-words">
                  {message.content.split("\n").map((line, i) => {
                    if (line.startsWith("**") && line.endsWith("**")) {
                      return (
                        <p key={i} className="font-semibold mt-2 mb-1">
                          {line.replace(/\*\*/g, "")}
                        </p>
                      );
                    }
                    if (line.startsWith("- ")) {
                      return (
                        <p key={i} className="ml-2">
                          {"\u2022 "}{line.substring(2)}
                        </p>
                      );
                    }
                    return line ? <p key={i}>{line}</p> : <br key={i} />;
                  })}
                </div>
              )}
            </div>

            {/* Analysis card (shown below assistant messages) */}
            {!isUser && analysis && (
              <AnalysisCard analysis={analysis} onFeedback={onFeedback} />
            )}

            {/* Timestamp */}
            <p className={`text-[10px] text-gray-400 ${isUser ? "text-right" : "text-left"}`}>
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
