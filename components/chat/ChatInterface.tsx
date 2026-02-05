"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";

type Message = {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  contentType?: string;
  createdAt: string;
};

type Analysis = {
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

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [analyses, setAnalyses] = useState<Record<string, Analysis>>({});
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Add welcome message on first load
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "ASSISTANT",
        content:
          "Hi! I'm ScamShield, your AI scam detector. I can help you check if something is a scam.\n\nYou can:\n- Paste a suspicious text message or email\n- Share a URL you're unsure about\n- Upload a screenshot of a suspicious message\n\nWhat would you like me to check?",
        createdAt: new Date().toISOString(),
      },
    ]);
  }, []);

  const handleSendMessage = useCallback(
    async (content: string) => {
      setError(null);
      setIsLoading(true);

      // Optimistically add user message
      const tempUserMsg: Message = {
        id: `temp-${Date.now()}`,
        role: "USER",
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMsg]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, conversationId }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to analyze");
        }

        const data = await res.json();

        // Update conversation ID
        if (!conversationId) {
          setConversationId(data.conversationId);
        }

        // Replace temp user message with real one, add assistant message
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
          return [
            ...filtered,
            {
              id: data.userMessage.id,
              role: data.userMessage.role,
              content: data.userMessage.content,
              createdAt: data.userMessage.createdAt,
            },
            {
              id: data.assistantMessage.id,
              role: data.assistantMessage.role,
              content: data.assistantMessage.content,
              createdAt: data.assistantMessage.createdAt,
            },
          ];
        });

        // Store analysis data keyed by assistant message ID
        if (data.analysis) {
          setAnalyses((prev) => ({
            ...prev,
            [data.assistantMessage.id]: data.analysis,
          }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId]
  );

  const handleUploadImage = useCallback(
    async (file: File) => {
      setError(null);
      setIsLoading(true);

      // Optimistically add user message
      const tempUserMsg: Message = {
        id: `temp-${Date.now()}`,
        role: "USER",
        content: `[Uploaded: ${file.name}]`,
        contentType: "IMAGE",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMsg]);

      try {
        const formData = new FormData();
        formData.append("file", file);
        if (conversationId) {
          formData.append("conversationId", conversationId);
        }

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        const data = await res.json();

        if (!conversationId) {
          setConversationId(data.conversationId);
        }

        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
          return [
            ...filtered,
            {
              id: data.userMessage.id,
              role: data.userMessage.role,
              content: data.userMessage.content,
              contentType: data.userMessage.contentType,
              createdAt: data.userMessage.createdAt,
            },
            {
              id: data.assistantMessage.id,
              role: data.assistantMessage.role,
              content: data.assistantMessage.content,
              createdAt: data.assistantMessage.createdAt,
            },
          ];
        });

        if (data.analysis) {
          setAnalyses((prev) => ({
            ...prev,
            [data.assistantMessage.id]: data.analysis,
          }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId]
  );

  const handleFeedback = useCallback(async (analysisId: string, feedback: string) => {
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId, feedback }),
      });
    } catch {
      // Silently fail - feedback is non-critical
    }
  }, []);

  const handleNewChat = useCallback(() => {
    setConversationId(null);
    setMessages([
      {
        id: "welcome",
        role: "ASSISTANT",
        content:
          "Hi! I'm ScamShield, your AI scam detector. What would you like me to check?",
        createdAt: new Date().toISOString(),
      },
    ]);
    setAnalyses({});
    setError(null);
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">ScamShield</h1>
            <p className="text-xs text-gray-500">AI-Powered Scam Detector</p>
          </div>
        </div>
        <button
          onClick={handleNewChat}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
        >
          + New Check
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            analysis={analyses[msg.id]}
            onFeedback={handleFeedback}
          />
        ))}
        {isLoading && <TypingIndicator />}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
              {error}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onUploadImage={handleUploadImage}
        disabled={isLoading}
      />
    </div>
  );
}
