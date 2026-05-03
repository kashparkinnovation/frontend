"use client";

import React, { useState, useEffect, useRef } from "react";
import { auth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const INDIA_DIAL = "+91";

/** Validates a 10-digit Indian mobile number (starts with 6–9) */
function isValidIndianMobile(digits) {
  return /^[6-9]\d{9}$/.test(digits);
}

export default function PhoneOTP({ onVerified, buttonText = "Submit OTP" }) {
  const [digits, setDigits] = useState(""); // 10-digit part only
  const [otp, setOtp] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const recaptchaContainerRef = useRef(null);
  const recaptchaVerifierRef = useRef(null);
  const confirmationResultRef = useRef(null);

  // Clean up reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (_) {}
      }
    };
  }, []);

  const initRecaptcha = () => {
    if (!recaptchaVerifierRef.current && recaptchaContainerRef.current) {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(
          auth,
          recaptchaContainerRef.current,
          {
            size: "invisible",
            callback: () => {},
            "expired-callback": () =>
              setError("reCAPTCHA expired. Please try again."),
          },
        );
      } catch (err) {
        setError(err.message || "Failed to initialize reCAPTCHA");
      }
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");

    if (!isValidIndianMobile(digits)) {
      setError(
        "Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.",
      );
      return;
    }

    setLoading(true);
    const fullPhone = `${INDIA_DIAL}${digits}`;

    try {
      initRecaptcha();
      const appVerifier = recaptchaVerifierRef.current;
      if (!appVerifier)
        throw new Error("reCAPTCHA not ready. Please refresh and try again.");

      const result = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
      confirmationResultRef.current = result;
      setCodeSent(true);
    } catch (err) {
      setError(err.message || "Failed to send OTP. Please try again.");
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");

    if (otp.length < 6) {
      setError("Please enter the 6-digit OTP sent to your phone.");
      return;
    }

    setLoading(true);
    try {
      if (!confirmationResultRef.current) {
        throw new Error("Session expired. Please resend the OTP.");
      }
      const result = await confirmationResultRef.current.confirm(otp);
      const idToken = await result.user.getIdToken();
      onVerified(idToken);
    } catch (err) {
      setError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Error banner */}
      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            fontSize: "0.875rem",
            padding: "0.625rem 0.875rem",
            borderRadius: "0.5rem",
            border: "1px solid #fecaca",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Invisible reCAPTCHA anchor */}
      <div ref={recaptchaContainerRef} id="recaptcha-container" />

      {/* ── Step 1: Phone number ── */}
      {!codeSent ? (
        <form
          onSubmit={handleSendOTP}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.375rem",
            }}
          >
            <label
              htmlFor="phone-digits"
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-text-primary, #374151)",
              }}
            >
              Mobile Number
            </label>

            {/* Dial-code prefix + number input */}
            <div
              style={{
                display: "flex",
                border: "1.5px solid var(--color-border, #d1d5db)",
                borderRadius: "0.5rem",
                overflow: "hidden",
                transition: "border-color 0.2s",
              }}
            >
              {/* Read-only flag + dial code */}
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0 0.875rem",
                  background: "#f9fafb",
                  color: "#374151",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  borderRight: "1.5px solid var(--color-border, #d1d5db)",
                  whiteSpace: "nowrap",
                  userSelect: "none",
                }}
              >
                🇮🇳 +91
              </span>

              {/* 10-digit numeric input */}
              <input
                id="phone-digits"
                type="tel"
                inputMode="numeric"
                placeholder="98765 43210"
                value={digits}
                onChange={(e) =>
                  setDigits(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                maxLength={10}
                required
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  padding: "0.7rem 0.875rem",
                  fontSize: "1rem",
                  background: "white",
                  letterSpacing: "0.05rem",
                }}
              />
            </div>

            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-secondary, #6b7280)",
              }}
            >
              Enter your 10-digit Indian mobile number
            </span>
          </div>

          <button
            id="send-otp-btn"
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={loading || digits.length < 10}
          >
            {loading ? "Sending SMS…" : "Send OTP via SMS"}
          </button>
        </form>
      ) : (
        /* ── Step 2: OTP verification ── */ <form
          onSubmit={handleVerifyOTP}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-secondary, #6b7280)",
              margin: 0,
            }}
          >
            OTP sent to&nbsp;
            <strong>
              +91-{digits.slice(0, 5)}&nbsp;{digits.slice(5)}
            </strong>
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.375rem",
            }}
          >
            <label
              htmlFor="otp-input"
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-text-primary, #374151)",
              }}
            >
              Enter 6-digit OTP
            </label>
            <input
              id="otp-input"
              type="text"
              inputMode="numeric"
              placeholder="● ● ● ● ● ●"
              maxLength={6}
              className="input"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
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
            id="verify-otp-btn"
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={loading || otp.length < 6}
          >
            {loading ? "Verifying…" : buttonText}
          </button>

          <button
            type="button"
            onClick={() => {
              setCodeSent(false);
              setOtp("");
              setError("");
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-primary, #4f46e5)",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            ← Change Number
          </button>
        </form>
      )}
    </div>
  );
}
