/**
 * Seed script: creates a demo user (Thandi) with family members
 * Run: npm run db:seed
 */
import { db } from "./index";
import { users, familyMembers, allowanceRules } from "./schema";
import { hashPassword, generateId } from "../lib/auth";

async function seed() {
  console.log("🌱 Seeding database...");

  const userId = generateId();
  const passwordHash = await hashPassword("password123");

  await db.insert(users).values({
    id: userId,
    name: "Thandi",
    surname: "Nkosi",
    email: "thandi@demo.com",
    cellNumber: "+447700123456",
    passwordHash,
    isVerified: true,
  });

  console.log("✓ Created user: thandi@demo.com / password123");

  // Gogo
  const gogoId = generateId();
  await db.insert(familyMembers).values({
    id: gogoId,
    userId,
    name: "Gogo",
    relationship: "mother",
    phoneNumber: "+27821234567",
    monthlyAmount: 600,
  });
  await db.insert(allowanceRules).values([
    { id: generateId(), familyMemberId: gogoId, category: "groceries", amount: 300, isVoucher: true, blockLiquorStores: true },
    { id: generateId(), familyMemberId: gogoId, category: "medical", amount: 300, isVoucher: true },
  ]);

  // Sipho
  const siphoId = generateId();
  await db.insert(familyMembers).values({
    id: siphoId,
    userId,
    name: "Sipho",
    relationship: "son",
    phoneNumber: "+27827654321",
    monthlyAmount: 400,
  });
  await db.insert(allowanceRules).values([
    { id: generateId(), familyMemberId: siphoId, category: "school", amount: 200, isVoucher: true },
    { id: generateId(), familyMemberId: siphoId, category: "allowance", amount: 200, isDailyStreaming: true, dailyAmount: 10, streamingDays: 20 },
  ]);

  // Zanele
  const zaneleId = generateId();
  await db.insert(familyMembers).values({
    id: zaneleId,
    userId,
    name: "Zanele",
    relationship: "daughter",
    phoneNumber: "+27839876543",
    monthlyAmount: 500,
  });
  await db.insert(allowanceRules).values([
    { id: generateId(), familyMemberId: zaneleId, category: "food_voucher", amount: 300, isVoucher: true },
    { id: generateId(), familyMemberId: zaneleId, category: "allowance", amount: 200 },
  ]);

  console.log("✓ Created family: Gogo (R600), Sipho (R400), Zanele (R500)");
  console.log("✓ Sipho's R200 allowance set to stream R10/day over 20 school days");
  console.log("\n🎉 Seed complete. Login at http://localhost:3000");
  console.log("   Email: thandi@demo.com");
  console.log("   Password: password123");
  console.log("   (OTP will print to console in dev mode)");

  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
