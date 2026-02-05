import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getClientSession } from "@/lib/auth/session";
import { runAnalysisPipeline } from "@/lib/threat/pipeline";
import { generateSessionId, isUrl } from "@/lib/utils";
import type { InputType } from "@prisma/client";

export async function POST(request: NextRequest) {
  const session = await getClientSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { message, conversationId, inputType: explicitInputType } = body as {
    message: string;
    conversationId?: string;
    inputType?: InputType;
  };

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  if (message.length > 10000) {
    return NextResponse.json({ error: "Message too long (max 10,000 characters)" }, { status: 400 });
  }

  // Check client quota
  const client = await prisma.client.findUnique({ where: { id: session.clientId } });
  if (!client || !client.isActive) {
    return NextResponse.json({ error: "Client access disabled" }, { status: 403 });
  }

  if (client.monthlyQuota > 0 && client.quotaUsed >= client.monthlyQuota) {
    return NextResponse.json({ error: "Monthly analysis quota exceeded" }, { status: 429 });
  }

  // Get or create conversation
  let conversation;
  if (conversationId) {
    conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, clientId: session.clientId },
    });
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
  } else {
    conversation = await prisma.conversation.create({
      data: {
        clientId: session.clientId,
        sessionId: generateSessionId(),
      },
    });
  }

  // Auto-detect input type
  const inputType: InputType = explicitInputType || (isUrl(message.trim()) ? "URL" : "TEXT");

  // Store user message
  const userMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "USER",
      content: message.trim(),
      contentType: inputType === "URL" ? "URL" : "TEXT",
    },
  });

  // Run analysis pipeline
  try {
    const result = await runAnalysisPipeline({
      content: message.trim(),
      inputType,
      conversationId: conversation.id,
    });

    // Build assistant response
    const assistantContent = formatAssistantResponse(result);

    // Store assistant message
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "ASSISTANT",
        content: assistantContent,
        metadata: {
          analysisId: result.analysisId,
          riskScore: result.riskScore,
          riskLevel: result.riskLevel,
          cached: result.cached,
        },
      },
    });

    // Increment quota
    await prisma.client.update({
      where: { id: session.clientId },
      data: { quotaUsed: { increment: 1 } },
    });

    // Log analytics event
    await prisma.analyticsEvent.create({
      data: {
        clientId: session.clientId,
        eventType: "analysis_completed",
        eventData: {
          riskLevel: result.riskLevel,
          scamType: result.scamType,
          inputType,
          cached: result.cached,
          processingTimeMs: result.processingTimeMs,
        },
      },
    });

    return NextResponse.json({
      conversationId: conversation.id,
      userMessage: {
        id: userMessage.id,
        role: userMessage.role,
        content: userMessage.content,
        createdAt: userMessage.createdAt,
      },
      assistantMessage: {
        id: assistantMessage.id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        createdAt: assistantMessage.createdAt,
      },
      analysis: {
        id: result.analysisId,
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
        confidence: result.confidence,
        scamType: result.scamType,
        explanation: result.explanation,
        recommendations: result.recommendations,
        indicators: result.indicators,
        processingTimeMs: result.processingTimeMs,
        cached: result.cached,
      },
    });
  } catch (error) {
    console.error("Analysis pipeline error:", error);

    // Store error message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "ASSISTANT",
        content: "I'm sorry, I encountered an error analyzing your content. Please try again in a moment.",
      },
    });

    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}

function formatAssistantResponse(result: {
  riskLevel: string;
  explanation: string;
  recommendations: string[];
}): string {
  const lines = [result.explanation, "", "**Recommendations:**"];
  for (const rec of result.recommendations) {
    lines.push(`- ${rec}`);
  }
  return lines.join("\n");
}
