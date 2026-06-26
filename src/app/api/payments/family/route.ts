import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { familyMembers, allowanceRules } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";
import { generateId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const members = await db
      .select()
      .from(familyMembers)
      .where(eq(familyMembers.userId, auth.userId));

    // Fetch allowance rules for each member
    const membersWithRules = await Promise.all(
      members.map(async (member) => {
        const rules = await db
          .select()
          .from(allowanceRules)
          .where(eq(allowanceRules.familyMemberId, member.id));
        return { ...member, rules };
      })
    );

    return NextResponse.json({ members: membersWithRules });
  } catch (err) {
    console.error("Get family members error:", err);
    return NextResponse.json(
      { message: "Failed to load family members" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { name, relationship, walletAddress, phoneNumber, monthlyAmount, rules } =
      await req.json();

    if (!name || !relationship || !monthlyAmount) {
      return NextResponse.json(
        { message: "Name, relationship, and monthly amount are required" },
        { status: 400 }
      );
    }

    const memberId = generateId();

    await db.insert(familyMembers).values({
      id: memberId,
      userId: auth.userId,
      name,
      relationship,
      walletAddress: walletAddress || null,
      phoneNumber: phoneNumber || null,
      monthlyAmount: Number(monthlyAmount),
    });

    // Insert allowance rules if provided
    if (rules && Array.isArray(rules)) {
      for (const rule of rules) {
        await db.insert(allowanceRules).values({
          id: generateId(),
          familyMemberId: memberId,
          category: rule.category,
          amount: Number(rule.amount),
          isVoucher: rule.isVoucher || false,
          isDailyStreaming: rule.isDailyStreaming || false,
          dailyAmount: rule.dailyAmount ? Number(rule.dailyAmount) : null,
          streamingDays: rule.streamingDays ? Number(rule.streamingDays) : null,
          blockLiquorStores: rule.blockLiquorStores || false,
        });
      }
    }

    return NextResponse.json(
      { success: true, memberId, message: "Family member added" },
      { status: 201 }
    );
  } catch (err) {
    console.error("Add family member error:", err);
    return NextResponse.json(
      { message: "Failed to add family member" },
      { status: 500 }
    );
  }
}
