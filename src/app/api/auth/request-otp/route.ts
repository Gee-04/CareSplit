import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, otps } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  generateId,
  generateOTP,
  hashOTP,
  getOTPExpiry,
} from "@/lib/auth";
import { sendOTPEmail, sendOTPSMS } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const { userId, type, channel: requestedChannel } = await req.json();

    if (!userId || !type) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const channel =
      requestedChannel ||
      user.preferredOTPChannel ||
      "email";
    const destination =
      channel === "sms" ? user.cellNumber : user.email;
    const expiryMinutes = type === "payment" ? 5 : 10;

    const otpCode = generateOTP();
    const otpHash = await hashOTP(otpCode);

    await db.insert(otps).values({
      id: generateId(),
      userId: user.id,
      code: otpHash,
      type,
      channel,
      destination,
      expiresAt: getOTPExpiry(expiryMinutes),
    });

    if (channel === "sms") {
      await sendOTPSMS(destination, otpCode, type as "verification" | "login" | "payment");
    } else {
      await sendOTPEmail(destination, otpCode, type as "verification" | "login" | "payment");
    }

    return NextResponse.json({
      success: true,
      message: `Code sent to your ${channel}.`,
      channel,
    });
  } catch (err) {
    console.error("Request OTP error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
