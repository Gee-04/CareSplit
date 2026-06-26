import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  surname: text("surname").notNull(),
  email: text("email").notNull().unique(),
  cellNumber: text("cell_number").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isVerified: integer("is_verified", { mode: "boolean" }).default(false),
  preferredOTPChannel: text("preferred_otp_channel").default("email"),
  walletAddress: text("wallet_address"), // Open Payments wallet address (UK)
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(strftime('%s', 'now'))`
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`(strftime('%s', 'now'))`
  ),
});

// OTPs table
export const otps = sqliteTable("otps", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  code: text("code").notNull(), // hashed 6-digit code
  type: text("type").notNull(), // "verification" | "login" | "payment"
  channel: text("channel").notNull(), // "email" | "sms"
  destination: text("destination").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp" }),
  attempts: integer("attempts").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(strftime('%s', 'now'))`
  ),
});

// Sessions table
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  deviceInfo: text("device_info"),
  ipAddress: text("ip_address"),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(strftime('%s', 'now'))`
  ),
});

// Family members linked to a user
export const familyMembers = sqliteTable("family_members", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  relationship: text("relationship").notNull(), // "mother" | "son" | "daughter" | "other"
  walletAddress: text("wallet_address"), // Open Payments wallet address (SA)
  phoneNumber: text("phone_number"),
  monthlyAmount: real("monthly_amount").notNull().default(0), // in ZAR
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(strftime('%s', 'now'))`
  ),
});

// Allowance rules per family member
export const allowanceRules = sqliteTable("allowance_rules", {
  id: text("id").primaryKey(),
  familyMemberId: text("family_member_id")
    .notNull()
    .references(() => familyMembers.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // "groceries" | "medical" | "school" | "allowance" | "food_voucher"
  amount: real("amount").notNull(), // in ZAR
  isVoucher: integer("is_voucher", { mode: "boolean" }).default(false),
  isDailyStreaming: integer("is_daily_streaming", { mode: "boolean" }).default(false),
  dailyAmount: real("daily_amount"), // if streaming: amount per day
  streamingDays: integer("streaming_days"), // number of days to stream
  blockLiquorStores: integer("block_liquor_stores", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(strftime('%s', 'now'))`
  ),
});

// Payment history
export const payments = sqliteTable("payments", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  totalAmountGBP: real("total_amount_gbp").notNull(),
  totalAmountZAR: real("total_amount_zar").notNull(),
  exchangeRate: real("exchange_rate").notNull(),
  feeAmount: real("fee_amount").notNull(),
  status: text("status").notNull().default("pending"), // "pending" | "processing" | "completed" | "failed"
  openPaymentsGrantId: text("open_payments_grant_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(strftime('%s', 'now'))`
  ),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

// Individual payment splits per family member
export const paymentSplits = sqliteTable("payment_splits", {
  id: text("id").primaryKey(),
  paymentId: text("payment_id")
    .notNull()
    .references(() => payments.id, { onDelete: "cascade" }),
  familyMemberId: text("family_member_id")
    .notNull()
    .references(() => familyMembers.id),
  amountZAR: real("amount_zar").notNull(),
  status: text("status").notNull().default("pending"),
  outgoingPaymentId: text("outgoing_payment_id"), // Open Payments ID
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(strftime('%s', 'now'))`
  ),
});
