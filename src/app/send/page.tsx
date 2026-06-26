"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  monthlyAmount: number;
}

interface PaymentStep {
  step: string;
  label: string;
  duration: number;
}

interface Split {
  familyMemberId: string;
  name: string;
  amountZAR: number;
  status: string;
}

interface Breakdown {
  amountGBP: number;
  totalDebitGBP: number;
  feeGBP: number;
  zarReceived: number;
  exchangeRate: number;
  feePercent: number;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px",
  background: "var(--surface-2)", border: "1px solid var(--border-2)",
  borderRadius: 8, color: "var(--text)", fontSize: 14,
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, color: "var(--text-muted)",
  marginBottom: 7, fontWeight: 500,
};

export default function SendPage() {
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [amountGBP, setAmountGBP] = useState("");
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [sending, setSending] = useState(false);
  const [otpStage, setOtpStage] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [userId, setUserId] = useState("");
  const [processingStage, setProcessingStage] = useState(false);
  const [steps, setSteps] = useState<PaymentStep[]>([]);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [splits, setSplits] = useState<Split[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (!token) { router.push("/"); return; }
    if (user) setUserId(JSON.parse(user).id);

    fetch("/api/payments/family", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()).then((d) => {
      if (d.members) setFamily(d.members);
    });
  }, [router]);

  const getQuote = async () => {
    if (!amountGBP || Number(amountGBP) <= 0) return;
    setLoadingQuote(true);
    // Simulate quote calculation locally
    const rate = 23.45;
    const fee = 0.015;
    const gbp = Number(amountGBP);
    setBreakdown({
      amountGBP: gbp,
      totalDebitGBP: Math.round(gbp * (1 + fee) * 100) / 100,
      feeGBP: Math.round(gbp * fee * 100) / 100,
      zarReceived: Math.round(gbp * rate * (1 - fee) * 100) / 100,
      exchangeRate: rate,
      feePercent: fee * 100,
    });
    setTimeout(() => setLoadingQuote(false), 600);
  };

  const requestPaymentOTP = async () => {
    setSending(true);
    setError("");
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    const uid = userStr ? JSON.parse(userStr).id : userId;

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: uid, type: "payment", channel: "email" }),
      });
      if (res.ok) {
        setUserId(uid);
        setOtpStage(true);
      }
    } catch {
      setError("Failed to send verification code.");
    } finally {
      setSending(false);
    }
  };

  const verifyAndSend = async () => {
    if (otpCode.length !== 6) return;
    setSending(true);
    setError("");

    try {
      // Verify OTP
      const verifyRes = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code: otpCode, type: "payment" }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) { setError(verifyData.message); setSending(false); return; }

      // Execute payment
      setOtpStage(false);
      setProcessingStage(true);

      const token = localStorage.getItem("token");
      const res = await fetch("/api/payments/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amountGBP: Number(amountGBP) }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.message); setProcessingStage(false); return; }

      setSteps(data.steps);
      setSplits(data.splits);

      // Animate steps
      for (let i = 0; i < data.steps.length; i++) {
        await new Promise((r) => setTimeout(r, data.steps[i].duration));
        setCompletedSteps((prev) => [...prev, data.steps[i].step]);
      }

      setDone(true);
    } catch {
      setError("Payment failed. Please try again.");
      setProcessingStage(false);
    } finally {
      setSending(false);
    }
  };

  const relIcons: Record<string, string> = { mother: "👵", son: "👦", daughter: "👧", other: "👤" };

  if (processingStage || done) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 520, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 28 }}>
            {done ? "Payment complete ✓" : "Sending payment..."}
          </h2>

          {/* Steps */}
          <div style={{ marginBottom: 32 }}>
            {(steps.length ? steps : [
              { step: "discovery", label: "Discovering wallets" },
              { step: "incoming_payments", label: "Creating incoming payments" },
              { step: "quote", label: "Getting exchange quote" },
              { step: "consent", label: "Processing consent grant" },
              { step: "outgoing_payments", label: "Executing split payments" },
              { step: "settlement", label: "ILP settlement" },
            ]).map((s) => {
              const complete = completedSteps.includes(s.step);
              const isNext = !complete && completedSteps.length === (steps.length ? steps : []).indexOf(s as PaymentStep);
              return (
                <div key={s.step} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                    background: complete ? "var(--green)" : isNext ? "var(--accent)" : "var(--border-2)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
                  }}>
                    {complete ? "✓" : isNext ? "…" : ""}
                  </div>
                  <span style={{ fontSize: 13, color: complete ? "var(--text)" : "var(--text-muted)" }}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Splits */}
          {splits.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Split breakdown</p>
              {splits.map((split) => (
                <div key={split.familyMemberId} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0", borderBottom: "1px solid var(--border)",
                }}>
                  <span style={{ fontSize: 14 }}>{split.name}</span>
                  <span style={{ fontWeight: 600, color: "var(--green)", fontSize: 14 }}>
                    R{split.amountZAR.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {done && (
            <Link href="/dashboard" style={{
              display: "block", width: "100%", padding: "13px",
              background: "linear-gradient(135deg, var(--accent), #9d6fff)",
              border: "none", borderRadius: 8, color: "white",
              fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "center",
            }}>
              Back to dashboard
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <nav style={{
        borderBottom: "1px solid var(--border)", padding: "0 32px",
        display: "flex", alignItems: "center", height: 60, background: "var(--surface)", gap: 16,
      }}>
        <Link href="/dashboard" style={{ color: "var(--text-muted)", fontSize: 13 }}>← Dashboard</Link>
        <span style={{ color: "var(--border-2)" }}>|</span>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Send money</span>
      </nav>

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Send to family</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 36 }}>
          One transfer splits automatically across all family members.
        </p>

        {family.length === 0 ? (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 32, textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>No family members configured yet.</p>
            <Link href="/family/add" style={{
              background: "linear-gradient(135deg, var(--accent), #9d6fff)",
              color: "white", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500,
            }}>Add family member</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {!otpStage ? (
              <>
                {/* Amount input */}
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
                  <label style={labelStyle}>Amount to send (GBP)</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    <input
                      type="number" placeholder="70" value={amountGBP}
                      onChange={(e) => { setAmountGBP(e.target.value); setBreakdown(null); }}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button onClick={getQuote} disabled={loadingQuote || !amountGBP}
                      style={{
                        padding: "12px 20px", background: "var(--accent-dim)", border: "1px solid var(--accent)",
                        borderRadius: 8, color: "var(--accent-light)", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap",
                      }}>
                      {loadingQuote ? "..." : "Get quote"}
                    </button>
                  </div>

                  {breakdown && (
                    <div style={{ marginTop: 16, background: "var(--surface-2)", borderRadius: 8, padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Exchange rate</span>
                        <span style={{ fontSize: 13 }}>1 GBP = {breakdown.exchangeRate} ZAR</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Fee ({breakdown.feePercent}%)</span>
                        <span style={{ fontSize: 13 }}>£{breakdown.feeGBP}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Family receives</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--green)" }}>R{breakdown.zarReceived.toLocaleString()}</span>
                      </div>
                      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>You pay total</span>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>£{breakdown.totalDebitGBP}</span>
                      </div>
                      <p style={{ color: "var(--text-dim)", fontSize: 11, marginTop: 10 }}>
                        vs ~8% (£{(Number(amountGBP) * 0.08).toFixed(2)}) with traditional banks — saving £{(Number(amountGBP) * 0.065).toFixed(2)} this transfer
                      </p>
                    </div>
                  )}
                </div>

                {/* Family split preview */}
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Split preview</p>
                  {family.map((m) => {
                    const total = family.reduce((s, f) => s + f.monthlyAmount, 0);
                    const share = breakdown
                      ? Math.round((m.monthlyAmount / total) * breakdown.zarReceived * 100) / 100
                      : m.monthlyAmount;
                    return (
                      <div key={m.id} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "10px 0", borderBottom: "1px solid var(--border)",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 20 }}>{relIcons[m.relationship] || "👤"}</span>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</p>
                            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1, textTransform: "capitalize" }}>{m.relationship}</p>
                          </div>
                        </div>
                        <span style={{ fontWeight: 600, color: "var(--green)", fontSize: 13 }}>
                          R{breakdown ? share.toFixed(2) : m.monthlyAmount.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {error && <p style={{ color: "var(--red)", fontSize: 13, background: "#ef444415", border: "1px solid #ef444430", borderRadius: 6, padding: "10px 12px" }}>{error}</p>}

                <button
                  onClick={requestPaymentOTP}
                  disabled={sending || !breakdown}
                  style={{
                    width: "100%", padding: "14px",
                    background: breakdown ? "linear-gradient(135deg, var(--accent), #9d6fff)" : "var(--surface-2)",
                    border: breakdown ? "none" : "1px solid var(--border-2)",
                    borderRadius: 8, color: breakdown ? "white" : "var(--text-dim)",
                    fontSize: 14, fontWeight: 600, cursor: breakdown ? "pointer" : "not-allowed",
                  }}>
                  {sending ? "Sending..." : breakdown ? `Send £${breakdown.totalDebitGBP} → R${breakdown.zarReceived.toLocaleString()}` : "Get a quote first"}
                </button>
              </>
            ) : (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 32 }}>
                <div style={{ width: 48, height: 48, background: "var(--accent-dim)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 20 }}>
                  🔐
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Confirm payment</h2>
                <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
                  We sent a code to your email. Enter it to authorise this transfer.
                </p>
                <label style={labelStyle}>Verification code</label>
                <input
                  type="text" inputMode="numeric" maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  style={{ ...inputStyle, letterSpacing: 8, fontSize: 24, textAlign: "center", marginBottom: 20 }}
                  autoFocus
                />
                {error && <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 16 }}>{error}</p>}
                <button onClick={verifyAndSend} disabled={sending || otpCode.length !== 6}
                  style={{
                    width: "100%", padding: "13px",
                    background: "linear-gradient(135deg, var(--accent), #9d6fff)",
                    border: "none", borderRadius: 8, color: "white",
                    fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 12,
                  }}>
                  {sending ? "Processing..." : "Authorise & send"}
                </button>
                <button onClick={() => { setOtpStage(false); setOtpCode(""); }}
                  style={{ width: "100%", padding: "13px", background: "transparent", border: "1px solid var(--border-2)", borderRadius: 8, color: "var(--text-muted)", fontSize: 14, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
