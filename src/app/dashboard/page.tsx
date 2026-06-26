"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  monthlyAmount: number;
  rules: Array<{ category: string; amount: number; isVoucher: boolean; isDailyStreaming: boolean }>;
}

interface Payment {
  id: string;
  totalAmountGBP: number;
  totalAmountZAR: number;
  feeAmount: number;
  status: string;
  createdAt: number;
}

interface User {
  name: string;
  surname: string;
  email: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/"); return; }
    if (userData) setUser(JSON.parse(userData));

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch("/api/payments/family", { headers }).then((r) => r.json()),
      fetch("/api/payments/send", { headers }).then((r) => r.json()),
    ]).then(([fData, pData]) => {
      if (fData.members) setFamily(fData.members);
      if (pData.payments) setPayments(pData.payments.slice(0, 5));
    }).finally(() => setLoading(false));
  }, [router]);

  const totalMonthly = family.reduce((s, m) => s + m.monthlyAmount, 0);

  const relIcons: Record<string, string> = {
    mother: "👵", son: "👦", daughter: "👧", other: "👤",
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Nav */}
      <nav style={{
        borderBottom: "1px solid var(--border)",
        padding: "0 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 60, background: "var(--surface)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: "linear-gradient(135deg, var(--accent), #9d6fff)",
            borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
          }}>₩</div>
          <span style={{ fontWeight: 600, fontSize: 15 }}>Family Support Wallet</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link href="/send" style={{ color: "var(--text-muted)", fontSize: 13 }}>Send money</Link>
          <button onClick={() => { localStorage.clear(); router.push("/"); }}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13 }}>
            Sign out
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 32px" }}>
        {/* Greeting */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 26, fontWeight: 600 }}>
            Good to see you, {user?.name} 👋
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: 6, fontSize: 14 }}>
            Your family is being taken care of.
          </p>
        </div>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 40 }}>
          {[
            { label: "Monthly total", value: `R${totalMonthly.toLocaleString()}`, sub: `~£${(totalMonthly / 23.45).toFixed(0)} GBP`, color: "var(--accent)" },
            { label: "Family members", value: family.length.toString(), sub: "configured", color: "var(--green)" },
            { label: "Est. fee saved", value: "R1,080", sub: "per year vs banks", color: "var(--amber)" },
          ].map((card) => (
            <div key={card.label} style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12, padding: "24px",
            }}>
              <p style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 10 }}>{card.label}</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: card.color }}>{card.value}</p>
              <p style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 4 }}>{card.sub}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Family members */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12,
          }}>
            <div style={{
              padding: "20px 24px", borderBottom: "1px solid var(--border)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>Family</h2>
              <Link href="/family/add" style={{
                fontSize: 12, color: "var(--accent-light)",
                background: "var(--accent-dim)", padding: "5px 12px", borderRadius: 6,
              }}>
                + Add member
              </Link>
            </div>

            {family.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 16 }}>
                  No family members yet. Add someone to get started.
                </p>
                <Link href="/family/add" style={{
                  display: "inline-block",
                  background: "linear-gradient(135deg, var(--accent), #9d6fff)",
                  color: "white", padding: "10px 20px", borderRadius: 8,
                  fontSize: 13, fontWeight: 500,
                }}>
                  Add family member
                </Link>
              </div>
            ) : (
              <div>
                {family.map((member, i) => (
                  <div key={member.id} style={{
                    padding: "16px 24px",
                    borderBottom: i < family.length - 1 ? "1px solid var(--border)" : "none",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 24 }}>{relIcons[member.relationship] || "👤"}</span>
                      <div>
                        <p style={{ fontWeight: 500, fontSize: 14 }}>{member.name}</p>
                        <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 2, textTransform: "capitalize" }}>
                          {member.relationship}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontWeight: 600, color: "var(--green)", fontSize: 14 }}>
                        R{member.monthlyAmount.toLocaleString()}
                      </p>
                      <p style={{ color: "var(--text-dim)", fontSize: 11, marginTop: 2 }}>/ month</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent payments */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12,
          }}>
            <div style={{
              padding: "20px 24px", borderBottom: "1px solid var(--border)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>Recent payments</h2>
              <Link href="/send" style={{
                fontSize: 12,
                background: "linear-gradient(135deg, var(--accent), #9d6fff)",
                color: "white", padding: "6px 14px", borderRadius: 6, fontWeight: 500,
              }}>
                Send now
              </Link>
            </div>

            {payments.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                  No payments yet. Send your first transfer.
                </p>
              </div>
            ) : (
              <div>
                {payments.map((payment, i) => (
                  <div key={payment.id} style={{
                    padding: "16px 24px",
                    borderBottom: i < payments.length - 1 ? "1px solid var(--border)" : "none",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500 }}>
                        R{payment.totalAmountZAR.toLocaleString()}
                      </p>
                      <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 2 }}>
                        £{payment.totalAmountGBP} · fee £{payment.feeAmount.toFixed(2)}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{
                        fontSize: 11, padding: "3px 8px", borderRadius: 4,
                        background: payment.status === "completed" ? "var(--green-dim)" : "#f59e0b15",
                        color: payment.status === "completed" ? "var(--green)" : "var(--amber)",
                      }}>
                        {payment.status}
                      </span>
                      <p style={{ color: "var(--text-dim)", fontSize: 11, marginTop: 4 }}>
                        {new Date(payment.createdAt * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{
          marginTop: 24,
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 12, padding: "24px",
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>How it works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {[
              { step: "1", title: "Add family", desc: "Set monthly amounts and spending rules for each person" },
              { step: "2", title: "Send once", desc: "One tap sends to everyone under a single Open Payments grant" },
              { step: "3", title: "Auto split", desc: "Funds split instantly via ILP — groceries, medical, allowances" },
              { step: "4", title: "Peace of mind", desc: "Vouchers block liquor stores. Sipho gets R10/day, not R200 at once" },
            ].map((item) => (
              <div key={item.step} style={{
                padding: 16,
                background: "var(--surface-2)",
                borderRadius: 10,
                border: "1px solid var(--border)",
              }}>
                <div style={{
                  width: 28, height: 28,
                  background: "var(--accent-dim)", borderRadius: 6,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--accent-light)", fontSize: 13, fontWeight: 700,
                  marginBottom: 10,
                }}>
                  {item.step}
                </div>
                <p style={{ fontWeight: 500, fontSize: 13, marginBottom: 6 }}>{item.title}</p>
                <p style={{ color: "var(--text-muted)", fontSize: 12, lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
