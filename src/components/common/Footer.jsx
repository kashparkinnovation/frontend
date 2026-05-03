"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{
        background: "#0f172a",
        padding: "5rem 2rem 2rem",
        marginTop: "auto",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "3rem",
            marginBottom: "4rem",
          }}
        >
          <div>
            <Link href="/" style={{ textDecoration: "none" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  marginBottom: "1.25rem",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    background: "#4f46e5",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.25rem",
                    color: "white",
                  }}
                >
                  E
                </div>
                <span
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: 900,
                    color: "white",
                  }}
                >
                  eSchoolKart
                </span>
              </div>
            </Link>
            <p
              style={{
                color: "#94a3b8",
                fontSize: "0.9375rem",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              The modern way for parents to order official school uniforms.
              Guaranteed authenticity, easy sizing, and rapid delivery.
            </p>
          </div>

          {/* Links */}
          {[
            {
              title: "Platform",
              links: [
                ["Browse Schools", "/browse"],
                ["How It Works", "/how-it-works"],
                ["Become a Vendor", "/become-vendor"],
                ["Join Your School", "/join-school"],
                ["Contact Us", "/contact"],
              ],
            },
            {
              title: "Portals",
              links: [
                ["Student Login", "/login"],
                ["Vendor Portal", "/vendor"],
                ["School Portal", "/school"],
                ["Admin Panel", "/admin"],
              ],
            },
            {
              title: "Support",
              links: [
                ["Help Center", "/faq"],
                ["Return Policy", "/returns"],
                ["Terms & Conditions", "/terms"],
                ["Privacy Policy", "/privacy"],
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <div
                style={{
                  color: "white",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  marginBottom: "1.5rem",
                  letterSpacing: "0.04em",
                }}
              >
                {col.title}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {col.links.map(([label, href]) => (
                  <Link
                    key={label}
                    href={href}
                    style={{
                      fontSize: "0.875rem",
                      color: "#94a3b8",
                      textDecoration: "none",
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "white")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#94a3b8")
                    }
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: "2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
            <p style={{ margin: 0, fontSize: "0.8125rem", color: "#64748b" }}>
              © {new Date().getFullYear()} eSchoolKart Platform. All rights
              reserved.
            </p>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "0.8125rem",
              color: "#64748b",
              fontWeight: 600,
            }}
          >
            Made with <span style={{ color: "#4f46e5" }}>♥</span> for Indian
            schools
          </p>
        </div>
      </div>
    </footer>
  );
}
