import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/session";
import { generateAccessToken } from "@/lib/utils";
import bcrypt from "bcryptjs";

/**
 * GET /api/admin/clients - List all clients
 */
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const clients = await prisma.client.findMany({
    include: {
      _count: { select: { conversations: true, analyticsEvents: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    clients: clients.map((c) => ({
      id: c.id,
      name: c.name,
      accessToken: c.accessToken,
      hasPasscode: !!c.passcodeHash,
      isActive: c.isActive,
      monthlyQuota: c.monthlyQuota,
      quotaUsed: c.quotaUsed,
      conversationCount: c._count.conversations,
      eventsCount: c._count.analyticsEvents,
      createdAt: c.createdAt,
    })),
  });
}

/**
 * POST /api/admin/clients - Create a new client
 */
export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json();
  const { name, passcode, monthlyQuota } = body as {
    name: string;
    passcode?: string;
    monthlyQuota?: number;
  };

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Client name is required" }, { status: 400 });
  }

  const accessToken = generateAccessToken();
  const passcodeHash = passcode ? await bcrypt.hash(passcode, 12) : null;

  const client = await prisma.client.create({
    data: {
      name: name.trim(),
      accessToken,
      passcodeHash,
      monthlyQuota: monthlyQuota || 100,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return NextResponse.json({
    client: {
      id: client.id,
      name: client.name,
      accessToken: client.accessToken,
      privateLink: `${appUrl}/c/${client.accessToken}`,
      hasPasscode: !!passcodeHash,
      monthlyQuota: client.monthlyQuota,
      createdAt: client.createdAt,
    },
  });
}

/**
 * PATCH /api/admin/clients - Update a client
 */
export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json();
  const { id, name, passcode, isActive, monthlyQuota } = body as {
    id: string;
    name?: string;
    passcode?: string;
    isActive?: boolean;
    monthlyQuota?: number;
  };

  if (!id) {
    return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name.trim();
  if (isActive !== undefined) updateData.isActive = isActive;
  if (monthlyQuota !== undefined) updateData.monthlyQuota = monthlyQuota;
  if (passcode !== undefined) {
    updateData.passcodeHash = passcode ? await bcrypt.hash(passcode, 12) : null;
  }

  const client = await prisma.client.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({
    client: {
      id: client.id,
      name: client.name,
      isActive: client.isActive,
      monthlyQuota: client.monthlyQuota,
    },
  });
}
