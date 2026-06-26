"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpStage, setOtpStage] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [userId, setUserId] = useState("");
  const [channel, setChannel] = useState("email");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, deviceInfo: navigator.userAgent }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requiresVerification) {
          setUserId(data.userId);
          setOtpStage(true);
          setError("Verify your account first. Code sent to your email.");
          return;
        }
        setError(data.message);
        return;
      }

      if (data.requiresOTP) {
        setUserId(data.userId);
        setChannel(data.channel);
        setOtpStage(true);
        setError("");
        return;
      }
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
        body: JSON.stringify({
          userId,
          code: otpCode,
          type: "login",
          deviceInfo: navigator.userAgent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    try {
      await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, type: "login", channel }),
      });
      setError("New code sent.");
    } catch {
      setError("Failed to resend code.");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      background: "var(--bg)",
    }}>
      {/* Left — Branding */}
      <div style={{
        background: "linear-gradient(145deg, #0d0f1f 0%, #111326 60%, #13163a 100%)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{
          position: "absolute", width: 400, height: 400,
          borderRadius: "50%", border: "1px solid var(--border)",
          top: -100, right: -100, opacity: 0.4,
        }} />
        <div style={{
          position: "absolute", width: 250, height: 250,
          borderRadius: "50%", border: "1px solid var(--border)",
          bottom: 60, left: -80, opacity: 0.3,
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Logo */}
          <div style={{
            width: 52, height: 52,
            background: "linear-gradient(135deg, var(--accent) 0%, #9d6fff 100%)",
            borderRadius: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 40, fontSize: 24,
          }}>
            ₩
          </div>

          <p style={{ color: "var(--accent-light)", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>
            Family Support Wallet
          </p>
          <h1 style={{
            fontSize: 40, fontWeight: 700, lineHeight: 1.15,
            marginBottom: 20, color: "var(--text)",
          }}>
            Send money home.<br />
            <span style={{ color: "var(--accent-light)" }}>Keep control.</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 16, lineHeight: 1.7, maxWidth: 360 }}>
            Built for migrant workers supporting families across borders. Low fees, automatic splits, and spending guardrails — all in one tap.
          </p>

          {/* Stats */}
          <div style={{ marginTop: 48, display: "flex", gap: 32 }}>
            {[
              { value: "~1.5%", label: "transfer fee" },
              { value: "R1,080", label: "saved / year" },
              { value: "Instant", label: "settlement" },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "60px 80px",
      }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          {!otpStage ? (
            <>
              <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Welcome back</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: 36, fontSize: 14 }}>
                Don&apos;t have an account?{" "}
                <Link href="/signup" style={{ color: "var(--accent-light)" }}>Create one</Link>
              </p>

              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="thandi@email.com"
                    required
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={inputStyle}
                  />
                </div>

                <div style={{ textAlign: "right", marginTop: -8 }}>
                  <Link href="/forgot-password" style={{ color: "var(--accent-light)", fontSize: 13 }}>
                    Forgot password?
                  </Link>
                </div>

                {error && <p style={errorStyle}>{error}</p>}

                <button type="submit" disabled={loading} style={primaryBtnStyle}>
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>
            </>
          ) : (
            <>
              <div style={{
                width: 48, height: 48,
                background: "var(--accent-dim)",
                borderRadius: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 24, fontSize: 22,
              }}>
                🔐
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Check your {channel}</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: 36, fontSize: 14, lineHeight: 1.6 }}>
                We sent a 6-digit code to {channel === "email" ? email : "your phone"}. Enter it below to continue.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label style={labelStyle}>Verification code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    style={{ ...inputStyle, letterSpacing: 8, fontSize: 22, textAlign: "center" }}
                    autoFocus
                  />
                </div>

                {error && <p style={errorStyle}>{error}</p>}

                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || otpCode.length !== 6}
                  style={primaryBtnStyle}
                >
                  {loading ? "Verifying..." : "Verify & sign in"}
                </button>

                <button onClick={resendOTP} style={ghostBtnStyle}>
                  Resend code
                </button>

                <button onClick={() => { setOtpStage(false); setOtpCode(""); setError(""); }} style={ghostBtnStyle}>
                  ← Back to login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, color: "var(--text-muted)",
  marginBottom: 8, fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px",
  background: "var(--surface-2)", border: "1px solid var(--border-2)",
  borderRadius: 8, color: "var(--text)", fontSize: 14,
  transition: "border-color 0.15s",
};

const primaryBtnStyle: React.CSSProperties = {
  width: "100%", padding: "13px 20px",
  background: "linear-gradient(135deg, var(--accent) 0%, #9d6fff 100%)",
  border: "none", borderRadius: 8,
  color: "white", fontSize: 14, fontWeight: 600,
  cursor: "pointer", transition: "opacity 0.15s",
};

const ghostBtnStyle: React.CSSProperties = {
  width: "100%", padding: "13px 20px",
  background: "transparent", border: "1px solid var(--border-2)",
  borderRadius: 8, color: "var(--text-muted)", fontSize: 14,
  cursor: "pointer", transition: "border-color 0.15s",
};

const errorStyle: React.CSSProperties = {
  color: "var(--red)", fontSize: 13,
  background: "#ef444415", border: "1px solid #ef444430",
  borderRadius: 6, padding: "10px 12px",
};
