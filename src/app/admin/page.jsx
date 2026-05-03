"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("access_token");
    fetch(`${API_URL}/admin/stats/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.schools) setStats(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);

  if (loading)
    return (
      <div
        style={{ display: "flex", justifyContent: "center", padding: "4rem" }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: "3px solid #e2e8f0",
            borderTopColor: "#4f46e5",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.875rem", fontWeight: 800 }}>
          Admin Dashboard
        </h1>
        <p
          style={{
            margin: "0.25rem 0 0",
            color: "#64748b",
            fontSize: "0.875rem",
          }}
        >
          Platform overview — live data
        </p>
      </div>

      {/* KPI Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        {[
          {
            icon: "🏫",
            label: "Schools",
            value: stats?.schools.total ?? "—",
            sub: `${stats?.schools.pending ?? 0} pending`,
            href: "/admin/schools",
            color: "#4f46e5",
          },
          {
            icon: "🏢",
            label: "Vendors",
            value: stats?.vendors.total ?? "—",
            sub: `${stats?.vendors.pending ?? 0} pending`,
            href: "/admin/vendors",
            color: "#8b5cf6",
          },
          {
            icon: "🎓",
            label: "Students",
            value: stats?.students.verified ?? "—",
            sub: `of ${stats?.students.total ?? 0} total`,
            href: "/admin/students",
            color: "#06b6d4",
          },
          {
            icon: "🛒",
            label: "Orders",
            value: stats?.orders.total ?? "—",
            sub: fmt(stats?.revenue.total ?? 0),
            href: "/admin/reports",
            color: "#10b981",
          },
          {
            icon: "💰",
            label: "This Month",
            value: fmt(stats?.revenue.this_month ?? 0),
            sub: "revenue",
            href: "/admin/reports",
            color: "#f59e0b",
          },
        ].map((kpi, i) => (
          <Link key={i} href={kpi.href} style={{ textDecoration: "none" }}>
            <div
              style={{
                background: "white",
                padding: "1.5rem",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                cursor: "pointer",
                transition: "all 0.2s",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "none";
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: kpi.color,
                }}
              />
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
                {kpi.icon}
              </div>
              <div
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                {kpi.value}
              </div>
              <div
                style={{
                  fontWeight: 600,
                  color: "#475569",
                  fontSize: "0.875rem",
                }}
              >
                {kpi.label}
              </div>
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "0.75rem",
                  marginTop: "0.15rem",
                }}
              >
                {kpi.sub}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
          }}
        >
          <h3
            style={{
              margin: "0 0 0.75rem",
              fontSize: "1rem",
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            Quick Actions
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <Link
              href="/admin/vendors"
              style={{
                padding: "0.75rem",
                background: "#f8fafc",
                borderRadius: "8px",
                textDecoration: "none",
                color: "#475569",
                fontWeight: 500,
                fontSize: "0.875rem",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Review Pending Vendors</span>
              <span style={{ color: "#94a3b8" }}>→</span>
            </Link>
            <Link
              href="/admin/schools"
              style={{
                padding: "0.75rem",
                background: "#f8fafc",
                borderRadius: "8px",
                textDecoration: "none",
                color: "#475569",
                fontWeight: 500,
                fontSize: "0.875rem",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Approve School Applications</span>
              <span style={{ color: "#94a3b8" }}>→</span>
            </Link>
            <Link
              href="/admin/blog"
              style={{
                padding: "0.75rem",
                background: "#f8fafc",
                borderRadius: "8px",
                textDecoration: "none",
                color: "#475569",
                fontWeight: 500,
                fontSize: "0.875rem",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Manage Blog Posts</span>
              <span style={{ color: "#94a3b8" }}>→</span>
            </Link>
            <Link
              href="/admin/users"
              style={{
                padding: "0.75rem",
                background: "#f8fafc",
                borderRadius: "8px",
                textDecoration: "none",
                color: "#475569",
                fontWeight: 500,
                fontSize: "0.875rem",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Manage Sub-Admins</span>
              <span style={{ color: "#94a3b8" }}>→</span>
            </Link>
          </div>
        </div>
        <div
          style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
          }}
        >
          <h3
            style={{
              margin: "0 0 0.75rem",
              fontSize: "1rem",
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            System Status
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              fontSize: "0.875rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "#64748b" }}>API Server</span>
              <span
                style={{
                  padding: "0.2rem 0.6rem",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  background: "#dcfce7",
                  color: "#166534",
                }}
              >
                ONLINE
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "#64748b" }}>Database</span>
              <span
                style={{
                  padding: "0.2rem 0.6rem",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  background: "#dcfce7",
                  color: "#166534",
                }}
              >
                HEALTHY
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "#64748b" }}>Payment Gateway</span>
              <span
                style={{
                  padding: "0.2rem 0.6rem",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  background: "#fef9c3",
                  color: "#854d0e",
                }}
              >
                SANDBOX
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
