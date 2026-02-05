import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/session";

/**
 * GET /api/admin/analytics - Get analytics overview
 */
export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30", 10);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [
    totalAnalyses,
    totalConversations,
    totalClients,
    riskDistribution,
    scamTypeDistribution,
    recentAnalyses,
  ] = await Promise.all([
    // Total analyses in period
    prisma.analysis.count({
      where: { createdAt: { gte: since }, status: "COMPLETED" },
    }),

    // Total conversations in period
    prisma.conversation.count({
      where: { createdAt: { gte: since } },
    }),

    // Total active clients
    prisma.client.count({ where: { isActive: true } }),

    // Risk level distribution
    prisma.analysis.groupBy({
      by: ["riskLevel"],
      where: { createdAt: { gte: since }, status: "COMPLETED" },
      _count: true,
    }),

    // Scam type distribution
    prisma.analysis.groupBy({
      by: ["scamType"],
      where: { createdAt: { gte: since }, status: "COMPLETED", scamType: { not: null } },
      _count: true,
      orderBy: { _count: { scamType: "desc" } },
      take: 10,
    }),

    // Recent analyses
    prisma.analysis.findMany({
      where: { createdAt: { gte: since }, status: "COMPLETED" },
      select: {
        id: true,
        riskScore: true,
        riskLevel: true,
        scamType: true,
        inputType: true,
        processingTimeMs: true,
        createdAt: true,
        conversation: { select: { client: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return NextResponse.json({
    period: { days, since: since.toISOString() },
    summary: {
      totalAnalyses,
      totalConversations,
      totalClients,
    },
    riskDistribution: riskDistribution.map((r) => ({
      level: r.riskLevel,
      count: r._count,
    })),
    scamTypeDistribution: scamTypeDistribution.map((s) => ({
      type: s.scamType,
      count: s._count,
    })),
    recentAnalyses: recentAnalyses.map((a) => ({
      id: a.id,
      riskScore: a.riskScore,
      riskLevel: a.riskLevel,
      scamType: a.scamType,
      inputType: a.inputType,
      processingTimeMs: a.processingTimeMs,
      clientName: a.conversation.client.name,
      createdAt: a.createdAt,
    })),
  });
}
