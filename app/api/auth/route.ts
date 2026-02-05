import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createSession, setSessionCookie, clearSession } from "@/lib/auth/session";

/**
 * POST /api/auth
 * Handles both client passcode login and admin email/password login.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { type } = body as { type: "client" | "admin" };

  if (type === "client") {
    return handleClientLogin(body);
  } else if (type === "admin") {
    return handleAdminLogin(body);
  }

  return NextResponse.json({ error: "Invalid auth type" }, { status: 400 });
}

/**
 * DELETE /api/auth - logout
 */
export async function DELETE() {
  await clearSession();
  return NextResponse.json({ success: true });
}

async function handleClientLogin(body: { passcode?: string; accessToken?: string }) {
  // If access token provided (from private link), authenticate directly
  if (body.accessToken) {
    const client = await prisma.client.findUnique({
      where: { accessToken: body.accessToken },
    });

    if (!client || !client.isActive) {
      return NextResponse.json({ error: "Invalid or expired access link" }, { status: 401 });
    }

    const token = await createSession({ type: "client", id: client.id, clientId: client.id });
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      client: { id: client.id, name: client.name },
    });
  }

  // Passcode login
  if (!body.passcode) {
    return NextResponse.json({ error: "Passcode is required" }, { status: 400 });
  }

  // Find any active client with a matching passcode
  const clients = await prisma.client.findMany({
    where: { isActive: true, passcodeHash: { not: null } },
  });

  for (const client of clients) {
    if (client.passcodeHash && await bcrypt.compare(body.passcode, client.passcodeHash)) {
      const token = await createSession({ type: "client", id: client.id, clientId: client.id });
      await setSessionCookie(token);

      return NextResponse.json({
        success: true,
        client: { id: client.id, name: client.name },
      });
    }
  }

  return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
}

async function handleAdminLogin(body: { email?: string; password?: string }) {
  if (!body.email || !body.password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({ where: { email: body.email } });
  if (!admin) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const isValid = await bcrypt.compare(body.password, admin.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createSession({ type: "admin", id: admin.id });
  await setSessionCookie(token);

  return NextResponse.json({ success: true, admin: { id: admin.id, email: admin.email } });
}
