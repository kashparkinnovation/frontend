"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { ROLES, ROLE_PORTALS } from "@/lib/constants";

export default function Header() {
  const { isAuthenticated, role } = useAuth();
  const { totalItems } = useCart();

  const portalLink = () => {
    return ROLE_PORTALS[role] ?? "/store";
  };

  return (
    <header
      style={{
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e2e8f0",
        position: "sticky",
        top: 0,
        zIndex: 200,
        boxShadow: "var(--mat-shadow-1)",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 2rem",
          height: 68,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            textDecoration: "none",
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
              letterSpacing: "-0.04em",
              color: "#0f172a",
            }}
          >
            eSchoolKart
          </span>
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>


          {!isAuthenticated ? (
            <>
              <Link
                href="/register"
                style={{
                  background: "#4f46e5",
                  color: "white",
                  padding: "0.5rem 1.25rem",
                  borderRadius: "8px",
                  fontWeight: 700,
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  marginLeft: "0.5rem",
                  boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)",
                }}
              >
                Get Started
              </Link>
            </>
          ) : (
            <>
              {role === ROLES.STUDENT && (
                <Link
                  href="/store/cart"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    color: "#0f172a",
                    fontWeight: 700,
                    textDecoration: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    marginLeft: "0.5rem",
                  }}
                >
                  🛒 Cart{" "}
                  {totalItems > 0 && (
                    <span
                      style={{
                        background: "#4f46e5",
                        color: "white",
                        padding: "0.1rem 0.4rem",
                        borderRadius: "99px",
                        fontSize: "0.75rem",
                      }}
                    >
                      {totalItems}
                    </span>
                  )}
                </Link>
              )}
              <Link
                href={portalLink()}
                style={{
                  background: "#0f172a",
                  color: "white",
                  padding: "0.5rem 1.25rem",
                  borderRadius: "8px",
                  fontWeight: 700,
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  marginLeft: "0.5rem",
                }}
              >
                Dashboard
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
