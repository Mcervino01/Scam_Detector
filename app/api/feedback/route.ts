import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getClientSession } from "@/lib/auth/session";
import type { FeedbackType } from "@prisma/client";

export async function POST(request: NextRequest) {
  const session = await getClientSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { analysisId, feedback, comment } = body as {
    analysisId: string;
    feedback: FeedbackType;
    comment?: string;
  };

  if (!analysisId || !feedback) {
    return NextResponse.json({ error: "analysisId and feedback are required" }, { status: 400 });
  }

  const validFeedback = ["HELPFUL", "NOT_HELPFUL", "FALSE_POSITIVE", "FALSE_NEGATIVE"];
  if (!validFeedback.includes(feedback)) {
    return NextResponse.json({ error: "Invalid feedback type" }, { status: 400 });
  }

  // Verify the analysis belongs to a conversation owned by this client
  const analysis = await prisma.analysis.findFirst({
    where: {
      id: analysisId,
      conversation: { clientId: session.clientId },
    },
  });

  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  await prisma.analysis.update({
    where: { id: analysisId },
    data: {
      userFeedback: feedback,
      feedbackComment: comment || null,
    },
  });

  return NextResponse.json({ success: true });
}
