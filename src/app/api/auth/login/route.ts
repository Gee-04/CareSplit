import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, otps, sessions } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import {
  generateId,
  verifyPassword,
  generateToken,
  generateOTP,
  hashOTP,
  getOTPExpiry,
  getSessionExpiry,
} from "@/lib/auth";
import { sendOTPEmail, sendOTPSMS } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const { email, password, deviceInfo, rememberMe } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .get();

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Account not verified — resend OTP
    if (!user.isVerified) {
      const otpCode = generateOTP();
      const otpHash = await hashOTP(otpCode);

      await db.insert(otps).values({
        id: generateId(),
        userId: user.id,
        code: otpHash,
        type: "verification",
        channel: "email",
        destination: user.email,
        expiresAt: getOTPExpiry(10),
      });

      await sendOTPEmail(user.email, otpCode, "verification");

      return NextResponse.json(
        {
          message: "Account not verified. A new code has been sent to your email.",
          userId: user.id,
          requiresVerification: true,
        },
        { status: 403 }
      );
    }

    // For financial app: always require OTP on login
    const channel = (user.preferredOTPChannel as "email" | "sms") || "email";
    const destination = channel === "email" ? user.email : user.cellNumber;

    const otpCode = generateOTP();
    const otpHash = await hashOTP(otpCode);

    await db.insert(otps).values({
      id: generateId(),
      userId: user.id,
      code: otpHash,
      type: "login",
      channel,
      destination,
      expiresAt: getOTPExpiry(10),
    });

    if (channel === "email") {
      await sendOTPEmail(destination, otpCode, "login");
    } else {
      await sendOTPSMS(destination, otpCode, "login");
    }

    return NextResponse.json({
      message: `Verification code sent to your ${channel}.`,
      userId: user.id,
      requiresOTP: true,
      channel,
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
