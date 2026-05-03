"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";
import PhoneOTP from "@/components/auth/PhoneOTP";
import EmailOTP from "@/components/auth/EmailOTP";
import { useAuth } from "@/context/AuthContext";
import styles from "../login/auth.module.css";

// ── Tab order: Phone OTP → Password → Email Link ────────────────────────────
const TABS = [
  { id: "phone", label: "Phone OTP", icon: "📱" },
  { id: "password", label: "Password", icon: "🔑" },
  { id: "email", label: "Email Link", icon: "✉️" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [method, setMethod] = useState("phone");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── Shared form state ──────────────────────────────────────────────────────
  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    password2: "",
  });
  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // ── Password-flow OTP state ────────────────────────────────────────────────
  const [pwStep, setPwStep] = useState("details");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleError = (err) => {
    const d = err?.response?.data;
    if (typeof d === "object") setError(Object.values(d).flat().join(" "));
    else setError("Registration failed. Please try again.");
  };

  // ── Step 1: validate form + send OTP to email ──────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.first_name || !form.last_name) {
      setError("Please enter your full name.");
      return;
    }
    if (!form.email) {
      setError("Please enter your email address.");
      return;
    }
    if (!form.password) {
      setError("Please enter a password.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.password2) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/auth/email-otp/send/", { email: form.email });
      setOtpSent(true);
      setPwStep("verify-otp");
      // 60s resend cooldown
      setResendCooldown(60);
      const t = setInterval(() => {
        setResendCooldown((n) => {
          if (n <= 1) {
            clearInterval(t);
            return 0;
          }
          return n - 1;
        });
      }, 1000);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      await apiClient.post("/auth/email-otp/send/", { email: form.email });
      setOtpCode("");
      setResendCooldown(60);
      const t = setInterval(() => {
        setResendCooldown((n) => {
          if (n <= 1) {
            clearInterval(t);
            return 0;
          }
          return n - 1;
        });
      }, 1000);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP + register ─────────────────────────────────────────
  const handlePasswordRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (otpCode.length !== 6) {
      setError("Please enter the 6-digit OTP from your email.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post("/auth/email-otp/register/", {
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        password: form.password,
        email_otp: otpCode,
      });
      setSession(data);
      router.push("/store");
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Phone OTP registration ─────────────────────────────────────────────────
  const handlePhoneOTPVerified = async (idToken) => {
    setError("");
    if (!form.email || !form.first_name || !form.last_name) {
      setError("Please fill in your name and email above first.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post("/auth/otp/register/", {
        id_token: idToken,
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        role: "student",
      });
      setSession(data);
      router.push("/store");
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Email link registration ────────────────────────────────────────────────
  const handleEmailOTPVerified = async (idToken) => {
    setError("");
    if (!form.first_name || !form.last_name) {
      setError("Please fill in your name above first.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post("/auth/otp/email-register/", {
        id_token: idToken,
        first_name: form.first_name,
        last_name: form.last_name,
        role: "student",
      });
      setSession(data);
      router.push("/store");
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailBeforeSend = () => {
    window.localStorage.setItem(
      "emailSignupIntent",
      JSON.stringify({
        first_name: form.first_name,
        last_name: form.last_name,
        role: "student",
      }),
    );
  };

  const nameFields = (
    <div
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
    >
      <div className={styles.formGroup}>
        <label className={styles.label}>First Name</label>
        <input
          name="first_name"
          className="input"
          placeholder="Ravi"
          value={form.first_name}
          onChange={handleChange}
          required
        />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label}>Last Name</label>
        <input
          name="last_name"
          className="input"
          placeholder="Sharma"
          value={form.last_name}
          onChange={handleChange}
          required
        />
      </div>
    </div>
  );

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🎓</span>
          <h1 className={styles.logoText}>eSchoolKart</h1>
        </div>
        <h2 className={styles.heading}>Create account</h2>
        <p className={styles.subheading}>Join as a Parent / Student</p>

        {/* ── Tab selector ── */}
        <div
          style={{
            display: "flex",
            borderBottom: "2px solid #e5e7eb",
            marginBottom: "1.5rem",
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              id={`tab-${t.id}`}
              onClick={() => {
                setMethod(t.id);
                setError("");
                setPwStep("details");
                setOtpCode("");
              }}
              style={{
                flex: 1,
                background: "none",
                border: "none",
                fontWeight: 600,
                fontSize: "0.78rem",
                cursor: "pointer",
                paddingBottom: "0.625rem",
                paddingTop: "0.25rem",
                color:
                  method === t.id ? "var(--color-primary, #4f46e5)" : "#6b7280",
                borderBottom:
                  method === t.id
                    ? "2px solid var(--color-primary, #4f46e5)"
                    : "2px solid transparent",
                marginBottom: "-2px",
                whiteSpace: "nowrap",
                transition: "color 0.15s, border-color 0.15s",
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {error && <div className={styles.errorMsg}>{error}</div>}

        {/* ── Phone OTP ── */}
        {method === "phone" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            {nameFields}
            <div className={styles.formGroup}>
              <label className={styles.label}>Email address</label>
              <input
                name="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "0.5rem",
                }}
              >
                Verify your mobile number
              </p>
              <PhoneOTP
                onVerified={handlePhoneOTPVerified}
                buttonText="Register"
              />
            </div>
          </div>
        )}

        {/* ── Password + Email OTP ── */}
        {method === "password" && pwStep === "details" && (
          <form onSubmit={handleSendOTP} className={styles.form}>
            {nameFields}
            <div className={styles.formGroup}>
              <label className={styles.label}>Email address</label>
              <input
                name="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="input"
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9ca3af",
                    fontSize: "1rem",
                    padding: "0.2rem",
                  }}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Confirm Password</label>
              <div style={{ position: "relative" }}>
                <input
                  name="password2"
                  type={showPassword ? "text" : "password"}
                  className="input"
                  placeholder="••••••••"
                  value={form.password2}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9ca3af",
                    fontSize: "1rem",
                    padding: "0.2rem",
                  }}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>
            <button
              id="send-otp-btn"
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%" }}
              disabled={loading}
            >
              {loading ? "Sending OTP…" : "✉️ Send Verification OTP"}
            </button>
          </form>
        )}

        {method === "password" && pwStep === "verify-otp" && (
          <form onSubmit={handlePasswordRegister} className={styles.form}>
            <div
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "0.5rem",
                padding: "0.875rem",
                marginBottom: "0.5rem",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  color: "#1e40af",
                  fontWeight: 600,
                }}
              >
                📧 OTP sent to {form.email}
              </p>
              <p
                style={{
                  margin: "0.25rem 0 0",
                  fontSize: "0.8rem",
                  color: "#374151",
                }}
              >
                Check your inbox (and spam folder). Valid for 10 minutes.
              </p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Enter 6-digit OTP</label>
              <input
                id="otp-code-input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="input"
                placeholder="● ● ● ● ● ●"
                value={otpCode}
                onChange={(e) =>
                  setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
                style={{
                  textAlign: "center",
                  letterSpacing: "0.4rem",
                  fontSize: "1.4rem",
                  fontWeight: 700,
                }}
              />
            </div>

            <button
              id="register-btn"
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%" }}
              disabled={loading || otpCode.length < 6}
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setPwStep("details");
                  setOtpCode("");
                  setError("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--color-primary, #4f46e5)",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                ← Change details
              </button>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendCooldown > 0 || loading}
                style={{
                  background: "none",
                  border: "none",
                  color:
                    resendCooldown > 0
                      ? "#9ca3af"
                      : "var(--color-primary, #4f46e5)",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  cursor: resendCooldown > 0 ? "default" : "pointer",
                  textDecoration: "underline",
                }}
              >
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend OTP"}
              </button>
            </div>
          </form>
        )}

        {/* ── Email magic-link ── */}
        {method === "email" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            {nameFields}
            <div>
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "0.5rem",
                }}
              >
                Verify your email address
              </p>
              <EmailOTP
                onVerified={handleEmailOTPVerified}
                onBeforeSend={handleEmailBeforeSend}
                buttonText="Register"
              />
            </div>
          </div>
        )}

        <p className={styles.switchLink}>
          Already have an account?{" "}
          <Link
            href="/login"
            style={{ color: "var(--color-primary)", fontWeight: 600 }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
