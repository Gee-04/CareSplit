import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, otps } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  generateId,
  hashPassword,
  generateOTP,
  hashOTP,
  getOTPExpiry,
} from "@/lib/auth";
import { sendOTPEmail } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const { name, surname, email, cellNumber, password } = await req.json();

    if (!name || !surname || !email || !cellNumber || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check existing user
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .get();

    if (existing) {
      return NextResponse.json(
        { message: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const userId = generateId();
    const passwordHash = await hashPassword(password);

    await db.insert(users).values({
      id: userId,
      name: name.trim(),
      surname: surname.trim(),
      email: email.toLowerCase().trim(),
      cellNumber: cellNumber.trim(),
      passwordHash,
      isVerified: false,
    });

    // Generate and store OTP
    const otpCode = generateOTP();
    const otpHash = await hashOTP(otpCode);

    await db.insert(otps).values({
      id: generateId(),
      userId,
      code: otpHash,
      type: "verification",
      channel: "email",
      destination: email.toLowerCase(),
      expiresAt: getOTPExpiry(10),
    });

    await sendOTPEmail(email, otpCode, "verification");

    return NextResponse.json(
      {
        success: true,
        message: "Account created. Check your email for a verification code.",
        userId,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
