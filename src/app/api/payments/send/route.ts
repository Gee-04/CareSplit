import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { familyMembers, payments, paymentSplits } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";
import { generateId } from "@/lib/auth";
import {
  getExchangeRate,
  calculatePaymentBreakdown,
  splitPaymentByFamily,
  simulateOpenPaymentsFlow,
} from "@/lib/payments";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { amountGBP, currency = "GBP" } = await req.json();

    if (!amountGBP || amountGBP <= 0) {
      return NextResponse.json(
        { message: "Valid amount is required" },
        { status: 400 }
      );
    }

    // Get family members
    const members = await db
      .select()
      .from(familyMembers)
      .where(eq(familyMembers.userId, auth.userId));

    if (members.length === 0) {
      return NextResponse.json(
        { message: "No family members configured. Add family members first." },
        { status: 400 }
      );
    }

    // Get exchange rate
    const rate = await getExchangeRate(currency, "ZAR");
    const breakdown = calculatePaymentBreakdown(amountGBP, rate);

    // Split by family
    const splits = splitPaymentByFamily(breakdown.zarReceived, members);

    // Execute simulated Open Payments flow
    const openPaymentsResult = await simulateOpenPaymentsFlow(splits);

    // Record payment in DB
    const paymentId = generateId();
    await db.insert(payments).values({
      id: paymentId,
      userId: auth.userId,
      totalAmountGBP: amountGBP,
      totalAmountZAR: breakdown.zarReceived,
      exchangeRate: rate.rate,
      feeAmount: breakdown.feeGBP,
      status: "completed",
      openPaymentsGrantId: openPaymentsResult.grantId,
      completedAt: new Date(),
    });

    // Record each split
    for (const split of openPaymentsResult.splits) {
      await db.insert(paymentSplits).values({
        id: generateId(),
        paymentId,
        familyMemberId: split.familyMemberId,
        amountZAR: split.amountZAR,
        status: "completed",
        outgoingPaymentId: split.outgoingPaymentId,
      });
    }

    return NextResponse.json({
      success: true,
      paymentId,
      breakdown,
      splits: openPaymentsResult.splits,
      steps: openPaymentsResult.steps,
      message: "Payment completed successfully",
    });
  } catch (err) {
    console.error("Send payment error:", err);
    return NextResponse.json(
      { message: "Payment failed. Please try again." },
      { status: 500 }
    );
  }
}

// Get payment history
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const history = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, auth.userId))
      .orderBy(payments.createdAt);

    return NextResponse.json({ payments: history.reverse() });
  } catch (err) {
    console.error("Get payments error:", err);
    return NextResponse.json(
      { message: "Failed to load payment history" },
      { status: 500 }
    );
  }
}
