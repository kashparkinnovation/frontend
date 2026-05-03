"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useStudent } from "@/context/StudentContext";
import StatusBadge from "@/components/ui/StatusBadge";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
  "http://localhost:8000";

export default function StoreHomePage() {
  const { user } = useAuth();
  const { students, activeStudent, setActiveStudent } = useStudent();

  const verifiedStudents = students.filter((s) => s.is_verified);
  const pendingStudents = students.filter(
    (s) => !s.is_verified && s.pending_verification,
  );
  const rejectedStudents = students.filter(
    (s) =>
      !s.is_verified &&
      !s.pending_verification &&
      s.latest_verification_request?.status === "rejected",
  );
  const unsubmittedStudents = students.filter(
    (s) =>
      !s.is_verified &&
      !s.pending_verification &&
      s.latest_verification_request?.status !== "rejected",
  );

  return (
    <div>
      {/* Welcome header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            margin: "0 0 0.375rem",
            letterSpacing: "-0.02em",
          }}
        >
          Welcome back, {user?.first_name ?? user?.email?.split("@")[0]} 👋
        </h1>
        <p style={{ color: "#64748b", margin: 0 }}>
          Manage your student profiles and order uniforms below.
        </p>
      </div>

      {/* Quick Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {[
          {
            icon: "👨‍🎓",
            value: students.length,
            label: "Students",
            href: "/store/students",
          },
          {
            icon: "✅",
            value: verifiedStudents.length,
            label: "Verified",
            href: "/store/students",
          },
          {
            icon: "⏳",
            value: pendingStudents.length,
            label: "Pending",
            href: "/store/students",
          },
          {
            icon: "⚠️",
            value: rejectedStudents.length + unsubmittedStudents.length,
            label: "Action Needed",
            href: "/store/students",
          },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.375rem",
                transition: "box-shadow 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow = "0 4px 14px rgb(0 0 0/0.07)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "")}
            >
              <span style={{ fontSize: "1.75rem" }}>{stat.icon}</span>
              <span
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                {stat.value}
              </span>
              <span
                style={{
                  fontSize: "0.8125rem",
                  color: "#64748b",
                  fontWeight: 500,
                }}
              >
                {stat.label}
              </span>
            </div>
          </Link>
        ))}
        <Link href="/browse" style={{ textDecoration: "none" }}>
          <div
            style={{
              background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
              borderRadius: "14px",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.375rem",
              color: "white",
              cursor: "pointer",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <span style={{ fontSize: "1.75rem" }}>🏫</span>
            <span style={{ fontSize: "1.1rem", fontWeight: 800 }}>Browse</span>
            <span style={{ fontSize: "0.8125rem", opacity: 0.85 }}>
              Explore schools
            </span>
          </div>
        </Link>
      </div>

      {/* No students CTA */}
      {students.length === 0 && (
        <div
          style={{
            position: "relative",
            borderRadius: "16px",
            overflow: "hidden",
            marginBottom: "2rem",
            display: "flex",
            border: "1px solid #e2e8f0",
            background: "white",
            boxShadow: "0 4px 14px rgb(0 0 0/0.05)",
          }}
        >
          <div style={{ flex: 1, padding: "3rem 2.5rem", zIndex: 10 }}>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                margin: "0 0 0.5rem",
                color: "#0f172a",
              }}
            >
              No student profiles yet
            </h2>
            <p
              style={{
                color: "#64748b",
                margin: "0 0 1.5rem",
                fontSize: "1rem",
                maxWidth: 400,
              }}
            >
              Add your child&apos;s details to link them to their school and
              start shopping for their official uniforms.
            </p>
            <Link
              href="/store/students/new"
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "#4f46e5",
                color: "white",
                fontWeight: 700,
                padding: "0.875rem 2rem",
                borderRadius: "10px",
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(79,70,229,0.3)",
              }}
            >
              + Add First Student
            </Link>
          </div>
          <div style={{ width: "40%", minWidth: 250, position: "relative" }}>
            <img
              src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80"
              alt="Students"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to right, white 0%, transparent 100%)",
              }}
            />
          </div>
        </div>
      )}

      {/* Student cards — shop for each */}
      {students.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>
              Your Students
            </h2>
            <Link
              href="/store/students/new"
              style={{
                fontSize: "0.875rem",
                color: "#4f46e5",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              + Add Student
            </Link>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {students.map((s) => (
              <div
                key={s.id}
                style={{
                  background: "white",
                  border: `1.5px solid ${activeStudent?.id === s.id ? "#4f46e5" : "#e2e8f0"}`,
                  borderRadius: "14px",
                  padding: "1.25rem",
                  transition: "all 0.15s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.875rem",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: s.is_verified ? "#d1fae5" : "#fef3c7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.25rem",
                      flexShrink: 0,
                    }}
                  >
                    {s.student_name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9375rem",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {s.student_name}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                      {s.class_name} {s.section} · {s.school_name}
                    </div>
                  </div>
                  <StatusBadge
                    status={
                      s.is_verified
                        ? "verified"
                        : s.pending_verification
                          ? "pending"
                          : s.latest_verification_request?.status === "rejected"
                            ? "rejected"
                            : "unverified"
                    }
                  />
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {s.is_verified ? (
                    <Link
                      href={`/store/shop/${s.school}`}
                      onClick={() => setActiveStudent(s)}
                      style={{
                        flex: 1,
                        textAlign: "center",
                        background: "#4f46e5",
                        color: "white",
                        padding: "0.5rem",
                        borderRadius: "8px",
                        textDecoration: "none",
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                      }}
                    >
                      🛒 Shop
                    </Link>
                  ) : s.pending_verification ? (
                    <div
                      style={{
                        flex: 1,
                        textAlign: "center",
                        background: "#f8fafc",
                        color: "#64748b",
                        padding: "0.5rem",
                        borderRadius: "8px",
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      ⏳ Awaiting Approval
                    </div>
                  ) : (
                    <Link
                      href={`/store/students/${s.id}`}
                      style={{
                        flex: 1,
                        textAlign: "center",
                        background: "#fef3c7",
                        color: "#92400e",
                        padding: "0.5rem",
                        borderRadius: "8px",
                        textDecoration: "none",
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                      }}
                    >
                      {s.latest_verification_request?.status === "rejected"
                        ? "❌ Action Needed"
                        : "📋 Verify"}
                    </Link>
                  )}
                  <Link
                    href={`/store/students/${s.id}`}
                    style={{
                      padding: "0.5rem 0.75rem",
                      background: "#f8fafc",
                      color: "#64748b",
                      borderRadius: "8px",
                      textDecoration: "none",
                      fontSize: "0.8125rem",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    ⚙️
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          padding: "1.5rem",
        }}
      >
        <h2
          style={{ margin: "0 0 1rem", fontSize: "1.0625rem", fontWeight: 700 }}
        >
          Quick Actions
        </h2>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {[
            {
              label: "+ Add Student Profile",
              href: "/store/students/new",
              bg: "#eef2ff",
              color: "#4f46e5",
            },
            {
              label: "📦 View All Orders",
              href: "/store/orders",
              bg: "#f0fdf4",
              color: "#166534",
            },
            {
              label: "🏫 Browse All Schools",
              href: "/browse",
              bg: "#f8fafc",
              color: "#64748b",
            },
          ].map(({ label, href, bg, color }) => (
            <Link
              key={href}
              href={href}
              style={{
                display: "inline-block",
                background: bg,
                color,
                fontWeight: 600,
                padding: "0.625rem 1.1rem",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "0.875rem",
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
