import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getClientSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getClientSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversations = await prisma.conversation.findMany({
    where: { clientId: session.clientId, status: "ACTIVE" },
    include: {
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { content: true, createdAt: true, role: true },
      },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    conversations: conversations.map((c) => ({
      id: c.id,
      lastMessage: c.messages[0]?.content?.substring(0, 100) || null,
      lastMessageAt: c.messages[0]?.createdAt || c.createdAt,
      messageCount: c._count.messages,
      createdAt: c.createdAt,
    })),
  });
}
