"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
  "http://localhost:8000";
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function BrowseSchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/schools/public/`)
      .then((r) => r.json())
      .then((d) => setSchools(Array.isArray(d) ? d : (d.results ?? [])))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredSchools = schools.filter((s) => {
    const q = search.toLowerCase();
    return (
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q)
    );
  });

  const logoUrl = (logo) =>
    logo ? (logo.startsWith("http") ? logo : `${API_BASE}${logo}`) : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: "white",
          borderBottom: "1px solid #e2e8f0",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 1px 3px rgb(0 0 0/0.05)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 1.5rem",
            height: 64,
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
              gap: "0.5rem",
              textDecoration: "none",
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>🎓</span>
            <span
              style={{ fontSize: "1.1rem", fontWeight: 800, color: "#4f46e5" }}
            >
              eSchoolKart
            </span>
          </Link>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link
              href="/login"
              style={{
                fontSize: "0.875rem",
                color: "#64748b",
                fontWeight: 500,
                textDecoration: "none",
                padding: "0.4rem 0.75rem",
              }}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              style={{
                fontSize: "0.875rem",
                background: "#4f46e5",
                color: "white",
                fontWeight: 600,
                textDecoration: "none",
                padding: "0.5rem 1.1rem",
                borderRadius: "8px",
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <div
        style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 1.5rem" }}
      >
        {/* Title + Search */}
        <div style={{ marginBottom: "2.5rem" }}>
          <Link
            href="/"
            style={{
              fontSize: "0.875rem",
              color: "#94a3b8",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              marginBottom: "1rem",
            }}
          >
            ← Back to Home
          </Link>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              margin: "0 0 0.5rem",
              letterSpacing: "-0.02em",
            }}
          >
            Browse Schools
          </h1>
          <p style={{ color: "#64748b", margin: "0 0 1.5rem" }}>
            Select your school to view the official uniform catalogue.
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              background: "white",
              border: "1.5px solid #e2e8f0",
              borderRadius: "10px",
              padding: "0.625rem 1rem",
              maxWidth: 400,
            }}
          >
            <span style={{ fontSize: "1rem" }}>🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, city or code…"
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "0.9375rem",
                flex: 1,
              }}
            />
          </div>
        </div>

        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "4rem",
              color: "#94a3b8",
              fontSize: "1rem",
            }}
          >
            Loading schools…
          </div>
        ) : filteredSchools.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}
          >
            {search
              ? `No schools match "${search}"`
              : "No approved schools found."}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {filteredSchools.map((school) => {
              const img = logoUrl(school.logo);
              return (
                <Link
                  key={school.id}
                  href={`/browse/${school.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div
                    style={{
                      background: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "16px",
                      padding: "1.5rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                      height: "100%",
                      transition: "all 0.15s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget;
                      el.style.boxShadow = "0 8px 30px rgb(79 70 229/0.12)";
                      el.style.borderColor = "#a5b4fc";
                      el.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget;
                      el.style.boxShadow = "";
                      el.style.borderColor = "#e2e8f0";
                      el.style.transform = "";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                      }}
                    >
                      <div
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: "14px",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "2rem",
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        {img ? (
                          <img
                            src={img}
                            alt=""
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          "🏫"
                        )}
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: "0.9375rem",
                            lineHeight: 1.3,
                          }}
                        >
                          {school.name}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#94a3b8",
                            marginTop: "0.2rem",
                          }}
                        >
                          Code: {school.code}
                        </div>
                      </div>
                    </div>
                    {(school.city || school.state) && (
                      <div
                        style={{
                          fontSize: "0.8125rem",
                          color: "#64748b",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.375rem",
                        }}
                      >
                        📍{" "}
                        {[school.city, school.state].filter(Boolean).join(", ")}
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "auto",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          color: "#4f46e5",
                          fontWeight: 600,
                        }}
                      >
                        View Catalogue →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
