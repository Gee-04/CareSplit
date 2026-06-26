import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, otps, sessions } from "@/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import {
  generateId,
  verifyOTP,
  generateToken,
  getSessionExpiry,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { userId, code, type, deviceInfo } = await req.json();

    if (!userId || !code || !type) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get latest unused OTP of this type
    const otpRecord = await db
      .select()
      .from(otps)
      .where(
        and(
          eq(otps.userId, userId),
          eq(otps.type, type),
          isNull(otps.usedAt)
        )
      )
      .orderBy(desc(otps.createdAt))
      .limit(1)
      .get();

    if (!otpRecord) {
      return NextResponse.json(
        { message: "No active verification code found. Please request a new one." },
        { status: 400 }
      );
    }

    // Check expiry
    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json(
        { message: "Code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Check attempt limit
    if ((otpRecord.attempts || 0) >= 5) {
      return NextResponse.json(
        { message: "Too many incorrect attempts. Please request a new code." },
        { status: 400 }
      );
    }

    const isValid = await verifyOTP(code, otpRecord.code);

    if (!isValid) {
      await db
        .update(otps)
        .set({ attempts: (otpRecord.attempts || 0) + 1 })
        .where(eq(otps.id, otpRecord.id));

      const remaining = 5 - ((otpRecord.attempts || 0) + 1);
      return NextResponse.json(
        {
          message: `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
        },
        { status: 400 }
      );
    }

    // Mark as used
    await db
      .update(otps)
      .set({ usedAt: new Date() })
      .where(eq(otps.id, otpRecord.id));

    // Verification OTP: mark user as verified
    if (type === "verification") {
      await db
        .update(users)
        .set({ isVerified: true })
        .where(eq(users.id, userId));

      return NextResponse.json({
        success: true,
        message: "Account verified. You can now log in.",
      });
    }

    // Login or payment OTP: create session
    if (type === "login") {
      const token = generateToken(userId);
      const sessionId = generateId();

      await db.insert(sessions).values({
        id: sessionId,
        userId,
        token,
        deviceInfo: deviceInfo || null,
        expiresAt: getSessionExpiry(7),
      });

      // Return user info (minus password)
      const user = await db
        .select({
          id: users.id,
          name: users.name,
          surname: users.surname,
          email: users.email,
          cellNumber: users.cellNumber,
          walletAddress: users.walletAddress,
        })
        .from(users)
        .where(eq(users.id, userId))
        .get();

      return NextResponse.json({
        success: true,
        token,
        user,
        message: "Login successful",
      });
    }

    // Payment OTP
    if (type === "payment") {
      return NextResponse.json({
        success: true,
        message: "Payment authorised",
        authorised: true,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
