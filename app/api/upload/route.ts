import { NextRequest, NextResponse } from "next/server";
import { getClientSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { runAnalysisPipeline } from "@/lib/threat/pipeline";
import { generateSessionId } from "@/lib/utils";
import { MAX_IMAGE_SIZE, ALLOWED_IMAGE_TYPES } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const session = await getClientSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const conversationId = formData.get("conversationId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  // Validate file size
  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      { error: `File too large. Maximum size: ${MAX_IMAGE_SIZE / 1024 / 1024}MB` },
      { status: 400 }
    );
  }

  // Check client quota
  const client = await prisma.client.findUnique({ where: { id: session.clientId } });
  if (!client || !client.isActive) {
    return NextResponse.json({ error: "Client access disabled" }, { status: 403 });
  }

  if (client.monthlyQuota > 0 && client.quotaUsed >= client.monthlyQuota) {
    return NextResponse.json({ error: "Monthly analysis quota exceeded" }, { status: 429 });
  }

  // Convert file to base64
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  // Get or create conversation
  let conversation;
  if (conversationId) {
    conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, clientId: session.clientId },
    });
  }
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        clientId: session.clientId,
        sessionId: generateSessionId(),
      },
    });
  }

  // Store user message with image reference
  const userMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "USER",
      content: `[Uploaded image: ${file.name}]`,
      contentType: "IMAGE",
      attachments: {
        type: file.type,
        name: file.name,
        size: file.size,
      },
    },
  });

  // Run analysis pipeline with image
  try {
    const result = await runAnalysisPipeline({
      content: `[Image: ${file.name}]`,
      inputType: "IMAGE",
      imageBase64: base64,
      imageMediaType: file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
      conversationId: conversation.id,
    });

    // Store assistant response
    const assistantContent = [
      result.explanation,
      "",
      "**Recommendations:**",
      ...result.recommendations.map((r) => `- ${r}`),
    ].join("\n");

    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "ASSISTANT",
        content: assistantContent,
        metadata: {
          analysisId: result.analysisId,
          riskScore: result.riskScore,
          riskLevel: result.riskLevel,
        },
      },
    });

    // Increment quota
    await prisma.client.update({
      where: { id: session.clientId },
      data: { quotaUsed: { increment: 1 } },
    });

    return NextResponse.json({
      conversationId: conversation.id,
      userMessage: {
        id: userMessage.id,
        role: userMessage.role,
        content: userMessage.content,
        contentType: userMessage.contentType,
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
      },
    });
  } catch (error) {
    console.error("Image analysis error:", error);
    return NextResponse.json({ error: "Image analysis failed" }, { status: 500 });
  }
}
