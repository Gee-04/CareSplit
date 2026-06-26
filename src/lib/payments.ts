// Simulates Open Payments / ILP exchange rate lookup
// In production, this calls a real FX API

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
  fee: number; // percentage, e.g. 0.015 = 1.5%
}

export async function getExchangeRate(
  from: string,
  to: string
): Promise<ExchangeRate> {
  // Simulated rates — in production, call SARB / Open Exchange Rates / etc.
  const rates: Record<string, number> = {
    "GBP-ZAR": 23.45,
    "USD-ZAR": 18.72,
    "EUR-ZAR": 20.1,
    "ZAR-ZAR": 1,
  };

  const key = `${from}-${to}`;
  const rate = rates[key] || 1;

  return {
    from,
    to,
    rate,
    timestamp: new Date(),
    fee: 0.015, // 1.5% vs 8% traditional
  };
}

export function calculatePaymentBreakdown(
  amountGBP: number,
  exchangeRate: ExchangeRate
) {
  const zarBeforeFee = amountGBP * exchangeRate.rate;
  const feeGBP = amountGBP * exchangeRate.fee;
  const feeZAR = feeGBP * exchangeRate.rate;
  const totalDebitGBP = amountGBP + feeGBP;
  const zarReceived = zarBeforeFee - feeZAR;

  return {
    amountGBP,
    totalDebitGBP: Math.round(totalDebitGBP * 100) / 100,
    feeGBP: Math.round(feeGBP * 100) / 100,
    feeZAR: Math.round(feeZAR * 100) / 100,
    zarReceived: Math.round(zarReceived * 100) / 100,
    exchangeRate: exchangeRate.rate,
    feePercent: exchangeRate.fee * 100,
  };
}

export function splitPaymentByFamily(
  totalZAR: number,
  familyRules: Array<{
    id: string;
    name: string;
    monthlyAmount: number;
  }>
) {
  const totalConfigured = familyRules.reduce(
    (sum, m) => sum + m.monthlyAmount,
    0
  );

  return familyRules.map((member) => ({
    familyMemberId: member.id,
    name: member.name,
    amountZAR:
      totalConfigured > 0
        ? Math.round(
            (member.monthlyAmount / totalConfigured) * totalZAR * 100
          ) / 100
        : Math.round((totalZAR / familyRules.length) * 100) / 100,
  }));
}

// Simulate Open Payments flow response
export interface OpenPaymentsQuote {
  id: string;
  walletAddress: string;
  receiveAmount: { value: string; assetCode: string; assetScale: number };
  debitAmount: { value: string; assetCode: string; assetScale: number };
  expiresAt: Date;
}

export async function simulateOpenPaymentsFlow(splits: Array<{
  familyMemberId: string;
  name: string;
  amountZAR: number;
}>) {
  // Simulates the Open Payments discovery → incoming payment → quote → grant → outgoing payment flow
  // In production, this uses the @interledger/open-payments SDK

  const steps = [
    { step: "discovery", label: "Discovering wallets", duration: 500 },
    { step: "incoming_payments", label: "Creating incoming payments", duration: 800 },
    { step: "quote", label: "Getting exchange quote", duration: 600 },
    { step: "consent", label: "Awaiting interactive consent", duration: 1000 },
    { step: "outgoing_payments", label: "Executing split payments", duration: 1200 },
    { step: "settlement", label: "ILP settlement", duration: 700 },
  ];

  return {
    steps,
    splits: splits.map((s, i) => ({
      ...s,
      outgoingPaymentId: `op_${Date.now()}_${i}`,
      status: "completed",
    })),
    grantId: `grant_${Date.now()}`,
    completedAt: new Date(),
  };
}
