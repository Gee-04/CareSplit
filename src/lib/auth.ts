import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function hashOTP(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

export async function verifyOTP(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: string, expiresIn = "7d"): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export function generateId(): string {
  return randomUUID();
}

export function getOTPExpiry(minutes = 10): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function getSessionExpiry(days = 7): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
