"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px",
  background: "var(--surface-2)", border: "1px solid var(--border-2)",
  borderRadius: 8, color: "var(--text)", fontSize: 14,
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, color: "var(--text-muted)",
  marginBottom: 7, fontWeight: 500,
};
const errorStyle: React.CSSProperties = {
  color: "var(--red)", fontSize: 13,
  background: "#ef444415", border: "1px solid #ef444430",
  borderRadius: 6, padding: "10px 12px",
};

interface Rule {
  category: string;
  amount: string;
  isVoucher: boolean;
  isDailyStreaming: boolean;
  dailyAmount: string;
  streamingDays: string;
  blockLiquorStores: boolean;
}

const defaultRule = (): Rule => ({
  category: "groceries", amount: "", isVoucher: false,
  isDailyStreaming: false, dailyAmount: "", streamingDays: "20",
  blockLiquorStores: false,
});

export default function AddFamilyMemberPage() {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("mother");
  const [walletAddress, setWalletAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [rules, setRules] = useState<Rule[]>([defaultRule()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const addRule = () => setRules((prev) => [...prev, defaultRule()]);
  const removeRule = (i: number) => setRules((prev) => prev.filter((_, idx) => idx !== i));
  const updateRule = (i: number, field: keyof Rule, value: string | boolean) =>
    setRules((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/payments/family", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name, relationship, walletAddress, phoneNumber,
          monthlyAmount: Number(monthlyAmount),
          rules: rules.map((r) => ({
            ...r,
            amount: Number(r.amount),
            dailyAmount: r.dailyAmount ? Number(r.dailyAmount) : undefined,
            streamingDays: r.streamingDays ? Number(r.streamingDays) : undefined,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const categories = ["groceries", "medical", "school", "allowance", "food_voucher", "other"];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <nav style={{
        borderBottom: "1px solid var(--border)", padding: "0 32px",
        display: "flex", alignItems: "center", height: 60,
        background: "var(--surface)", gap: 16,
      }}>
        <Link href="/dashboard" style={{ color: "var(--text-muted)", fontSize: 13 }}>← Dashboard</Link>
        <span style={{ color: "var(--border-2)" }}>|</span>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Add family member</span>
      </nav>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Add a family member</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 36, lineHeight: 1.6 }}>
          Configure how much they receive and how it can be spent.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Basic info */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Basic info</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input type="text" placeholder="Gogo" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Relationship</label>
                <select value={relationship} onChange={(e) => setRelationship(e.target.value)}
                  style={{ ...inputStyle }}>
                  <option value="mother">Mother / Gogo</option>
                  <option value="son">Son</option>
                  <option value="daughter">Daughter</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Phone number</label>
                <input type="tel" placeholder="+27 82 123 4567" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Monthly amount (ZAR)</label>
                <input type="number" placeholder="600" value={monthlyAmount} onChange={(e) => setMonthlyAmount(e.target.value)} required style={inputStyle} />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>Open Payments wallet address (optional)</label>
              <input type="text" placeholder="https://ilp.interledger-test.dev/gogo" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} style={inputStyle} />
              <p style={{ color: "var(--text-dim)", fontSize: 11, marginTop: 6 }}>
                Leave blank if family member doesn&apos;t have a wallet yet — funds held until claimed.
              </p>
            </div>
          </div>

          {/* Allowance rules */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600 }}>Spending rules</h2>
              <button type="button" onClick={addRule}
                style={{ background: "var(--accent-dim)", color: "var(--accent-light)", border: "none", padding: "5px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>
                + Add rule
              </button>
            </div>

            {rules.map((rule, i) => (
              <div key={i} style={{
                background: "var(--surface-2)", border: "1px solid var(--border)",
                borderRadius: 10, padding: 18, marginBottom: i < rules.length - 1 ? 12 : 0,
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={labelStyle}>Category</label>
                    <select value={rule.category} onChange={(e) => updateRule(i, "category", e.target.value)}
                      style={inputStyle}>
                      {categories.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Amount (ZAR)</label>
                    <input type="number" placeholder="300" value={rule.amount}
                      onChange={(e) => updateRule(i, "amount", e.target.value)}
                      style={inputStyle} />
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 1 }}>
                    {rules.length > 1 && (
                      <button type="button" onClick={() => removeRule(i)}
                        style={{ background: "#ef444415", color: "var(--red)", border: "none", padding: "11px 12px", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
                        ×
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", cursor: "pointer" }}>
                    <input type="checkbox" checked={rule.isVoucher} onChange={(e) => updateRule(i, "isVoucher", e.target.checked)} />
                    Voucher (restricted spend)
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", cursor: "pointer" }}>
                    <input type="checkbox" checked={rule.blockLiquorStores} onChange={(e) => updateRule(i, "blockLiquorStores", e.target.checked)} />
                    Block liquor stores
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", cursor: "pointer" }}>
                    <input type="checkbox" checked={rule.isDailyStreaming} onChange={(e) => updateRule(i, "isDailyStreaming", e.target.checked)} />
                    Daily streaming (not lump sum)
                  </label>
                </div>

                {rule.isDailyStreaming && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
                    <div>
                      <label style={labelStyle}>Daily amount (ZAR)</label>
                      <input type="number" placeholder="10" value={rule.dailyAmount}
                        onChange={(e) => updateRule(i, "dailyAmount", e.target.value)}
                        style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Streaming days</label>
                      <input type="number" placeholder="20" value={rule.streamingDays}
                        onChange={(e) => updateRule(i, "streamingDays", e.target.value)}
                        style={inputStyle} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {error && <p style={errorStyle}>{error}</p>}

          <button type="submit" disabled={loading}
            style={{
              width: "100%", padding: "13px",
              background: "linear-gradient(135deg, var(--accent), #9d6fff)",
              border: "none", borderRadius: 8, color: "white",
              fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}>
            {loading ? "Saving..." : "Save family member"}
          </button>
        </form>
      </main>
    </div>
  );
}
