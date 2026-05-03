"use client";

import React, { useState } from "react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import apiClient from "@/lib/api";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    user_type: "I am a Parent / Student",
    message: "",
  });
  const [status, setStatus] = useState("idle");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      await apiClient.post("/auth/leads/", formData);
      setStatus("success");
      setFormData({
        name: "",
        email: "",
        user_type: "I am a Parent / Student",
        message: "",
      });
    } catch {
      setStatus("error");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "#fafafa",
      }}
    >
      <Header />
      <main style={{ flex: 1, padding: "4rem 2rem" }}>
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "minmax(300px, 1fr) minmax(400px, 1.2fr)",
            gap: "4rem",
            alignItems: "center",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "3rem",
                fontWeight: 900,
                marginBottom: "1rem",
                color: "#0f172a",
                letterSpacing: "-0.02em",
              }}
            >
              Get in Touch.
            </h1>
            <p
              style={{
                fontSize: "1.125rem",
                color: "#64748b",
                lineHeight: 1.6,
                marginBottom: "2.5rem",
              }}
            >
              Have questions about verifying your student ID or completing a
              vendor application? We&apos;re here to help.
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "12px",
                    background: "#eef2ff",
                    color: "#4f46e5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    flexShrink: 0,
                  }}
                >
                  📍
                </div>
                <div>
                  <h4
                    style={{
                      margin: "0 0 0.25rem",
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    Office Address
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      color: "#64748b",
                      fontSize: "0.9375rem",
                    }}
                  >
                    123 Education Hub, Sector 44
                    <br />
                    Gurugram, IN 122003
                  </p>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "12px",
                    background: "#eef2ff",
                    color: "#4f46e5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    flexShrink: 0,
                  }}
                >
                  ✉️
                </div>
                <div>
                  <h4
                    style={{
                      margin: "0 0 0.25rem",
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    Email Support
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      color: "#64748b",
                      fontSize: "0.9375rem",
                    }}
                  >
                    support@eschoolkart.com
                    <br />
                    schools@eschoolkart.com
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              background: "white",
              padding: "3rem",
              borderRadius: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
            }}
          >
            <h3
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                marginBottom: "2rem",
                color: "#0f172a",
              }}
            >
              Send a Message
            </h3>

            {status === "success" ? (
              <div
                style={{
                  background: "#dcfce7",
                  color: "#166534",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                  ✅
                </div>
                <h4 style={{ margin: "0 0 0.5rem", fontWeight: 700 }}>
                  Message Sent!
                </h4>
                <p style={{ margin: 0, fontSize: "0.9rem" }}>
                  We&apos;ve received your request and will be in touch shortly.
                </p>
                <button
                  onClick={() => setStatus("idle")}
                  style={{
                    background: "transparent",
                    border: "1px solid #166534",
                    color: "#166534",
                    padding: "0.5rem 1rem",
                    borderRadius: "8px",
                    cursor: "pointer",
                    marginTop: "1rem",
                    fontSize: "0.875rem",
                  }}
                >
                  Send Another
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Your Name"
                  style={{
                    width: "100%",
                    padding: "1rem",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    outline: "none",
                    background: "#f8fafc",
                    fontSize: "1rem",
                  }}
                />
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Email Address"
                  style={{
                    width: "100%",
                    padding: "1rem",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    outline: "none",
                    background: "#f8fafc",
                    fontSize: "1rem",
                  }}
                />
                <select
                  value={formData.user_type}
                  onChange={(e) =>
                    setFormData({ ...formData, user_type: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "1rem",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    outline: "none",
                    background: "#f8fafc",
                    fontSize: "1rem",
                    color: "#0f172a",
                  }}
                >
                  <option>I am a Parent / Student</option>
                  <option>I am a School Administrator</option>
                  <option>I am a Vendor</option>
                </select>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="How can we help?"
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "1rem",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    outline: "none",
                    background: "#f8fafc",
                    fontSize: "1rem",
                    resize: "vertical",
                  }}
                ></textarea>

                {status === "error" && (
                  <p
                    style={{
                      color: "#ef4444",
                      fontSize: "0.875rem",
                      margin: 0,
                    }}
                  >
                    Something went wrong. Please try again.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  style={{
                    background: "#4f46e5",
                    color: "white",
                    padding: "1rem",
                    borderRadius: "10px",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "1rem",
                    cursor: status === "loading" ? "not-allowed" : "pointer",
                    marginTop: "0.5rem",
                    opacity: status === "loading" ? 0.7 : 1,
                  }}
                >
                  {status === "loading" ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
