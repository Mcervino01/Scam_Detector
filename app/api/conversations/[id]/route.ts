import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getClientSession } from "@/lib/auth/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getClientSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const conversation = await prisma.conversation.findFirst({
    where: { id, clientId: session.clientId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          content: true,
          contentType: true,
          attachments: true,
          metadata: true,
          createdAt: true,
        },
      },
      analyses: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          riskScore: true,
          riskLevel: true,
          confidence: true,
          scamType: true,
          indicators: true,
          recommendation: true,
          actions: true,
          inputType: true,
          createdAt: true,
        },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  return NextResponse.json({ conversation });
}
