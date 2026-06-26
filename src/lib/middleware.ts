import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./auth";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
}

export async function requireAuth(
  req: NextRequest
): Promise<{ userId: string } | NextResponse> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { message: "Unauthorised. Please log in." },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { message: "Session expired. Please log in again." },
      { status: 401 }
    );
  }

  // Confirm session still exists in DB
  const session = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, payload.userId),
        eq(sessions.token, token),
        gt(sessions.expiresAt, new Date())
      )
    )
    .get();

  if (!session) {
    return NextResponse.json(
      { message: "Session not found. Please log in again." },
      { status: 401 }
    );
  }

  return { userId: payload.userId };
}

export async function getUserFromToken(token: string) {
  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, payload.userId))
    .get();

  return user || null;
}
