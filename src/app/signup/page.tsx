"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, color: "var(--text-muted)",
  marginBottom: 8, fontWeight: 500,
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px",
  background: "var(--surface-2)", border: "1px solid var(--border-2)",
  borderRadius: 8, color: "var(--text)", fontSize: 14,
};
const primaryBtnStyle: React.CSSProperties = {
  width: "100%", padding: "13px 20px",
  background: "linear-gradient(135deg, var(--accent) 0%, #9d6fff 100%)",
  border: "none", borderRadius: 8,
  color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer",
};
const ghostBtnStyle: React.CSSProperties = {
  width: "100%", padding: "13px 20px",
  background: "transparent", border: "1px solid var(--border-2)",
  borderRadius: 8, color: "var(--text-muted)", fontSize: 14, cursor: "pointer",
};
const errorStyle: React.CSSProperties = {
  color: "var(--red)", fontSize: 13,
  background: "#ef444415", border: "1px solid #ef444430",
  borderRadius: 6, padding: "10px 12px",
};

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "", surname: "", email: "", cellNumber: "", password: "", confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpStage, setOtpStage] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [userId, setUserId] = useState("");
  const router = useRouter();

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, surname: form.surname, email: form.email,
          cellNumber: form.cellNumber, password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setUserId(data.userId);
      setOtpStage(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code: otpCode, type: "verification" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setSuccess("Account verified! Redirecting to login...");
      setTimeout(() => router.push("/"), 1500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      padding: 24, background: "var(--bg)",
    }}>
      {/* Background decoration */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "radial-gradient(ellipse at 20% 50%, #6c63ff0a 0%, transparent 60%)",
        pointerEvents: "none",
      }} />

      <div style={{
        width: "100%", maxWidth: 480,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 16, padding: 40,
        position: "relative",
      }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            width: 44, height: 44,
            background: "linear-gradient(135deg, var(--accent), #9d6fff)",
            borderRadius: 12, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 20, marginBottom: 20,
          }}>
            ₩
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>
            {otpStage ? "Verify your account" : "Create your account"}
          </h1>
          {!otpStage && (
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
              Already have one?{" "}
              <Link href="/" style={{ color: "var(--accent-light)" }}>Sign in</Link>
            </p>
          )}
        </div>

        {!otpStage ? (
          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>First name</label>
                <input type="text" placeholder="Thandi" value={form.name} onChange={update("name")} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Surname</label>
                <input type="text" placeholder="Nkosi" value={form.surname} onChange={update("surname")} required style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" placeholder="thandi@email.com" value={form.email} onChange={update("email")} required style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Cell number</label>
              <input type="tel" placeholder="+44 7700 123456" value={form.cellNumber} onChange={update("cellNumber")} required style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <input type="password" placeholder="At least 8 characters" value={form.password} onChange={update("password")} required minLength={8} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Confirm password</label>
              <input type="password" placeholder="Repeat your password" value={form.confirmPassword} onChange={update("confirmPassword")} required style={inputStyle} />
            </div>

            {error && <p style={errorStyle}>{error}</p>}

            <button type="submit" disabled={loading} style={primaryBtnStyle}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6 }}>
              We sent a 6-digit code to <strong style={{ color: "var(--text)" }}>{form.email}</strong>. Check your inbox (and spam folder, just in case).
            </p>

            <div>
              <label style={labelStyle}>Verification code</label>
              <input
                type="text" inputMode="numeric" maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                style={{ ...inputStyle, letterSpacing: 8, fontSize: 24, textAlign: "center" }}
                autoFocus
              />
            </div>

            {error && <p style={errorStyle}>{error}</p>}
            {success && (
              <p style={{ color: "var(--green)", fontSize: 13, background: "var(--green-dim)", borderRadius: 6, padding: "10px 12px" }}>
                {success}
              </p>
            )}

            <button onClick={handleVerifyOTP} disabled={loading || otpCode.length !== 6} style={primaryBtnStyle}>
              {loading ? "Verifying..." : "Verify account"}
            </button>

            <button onClick={async () => {
              const res = await fetch("/api/auth/request-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, type: "verification" }),
              });
              if (res.ok) setError("New code sent to your email.");
            }} style={ghostBtnStyle}>
              Resend code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
