"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import Link from "next/link";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
  "http://localhost:8000";

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/blog/posts/`)
      .then((r) => r.json())
      .then((data) => {
        setPosts(data.results || data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h1
            style={{
              fontSize: "3rem",
              fontWeight: 900,
              marginBottom: "1rem",
              color: "#0f172a",
              letterSpacing: "-0.02em",
              textAlign: "center",
            }}
          >
            eSchoolKart Blog
          </h1>
          <p
            style={{
              fontSize: "1.125rem",
              color: "#64748b",
              textAlign: "center",
              marginBottom: "4rem",
            }}
          >
            Updates, guides, and tips for back-to-school.
          </p>

          {loading ? (
            <div style={{ textAlign: "center", color: "#64748b" }}>
              Loading latest articles...
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "2rem",
              }}
            >
              {posts.map((post, i) => (
                <Link
                  href={`/blog/${post.slug}`}
                  key={i}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      background: "white",
                      borderRadius: "20px",
                      overflow: "hidden",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      transition: "transform 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "translateY(-4px)")
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
                  >
                    <div
                      style={{
                        height: 200,
                        overflow: "hidden",
                        background: "#f8fafc",
                      }}
                    >
                      {post.featured_image ? (
                        <img
                          src={
                            post.featured_image.startsWith("http")
                              ? post.featured_image
                              : `${API_BASE}${post.featured_image}`
                          }
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#94a3b8",
                            fontSize: "2rem",
                          }}
                        >
                          📝
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        padding: "2rem",
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          color: "#4f46e5",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {post.category?.name || "Uncategorized"}
                      </div>
                      <h3
                        style={{
                          fontSize: "1.375rem",
                          fontWeight: 800,
                          color: "#0f172a",
                          margin: "0 0 1rem",
                          lineHeight: 1.4,
                          flex: 1,
                        }}
                      >
                        {post.title}
                      </h3>
                      <div style={{ fontSize: "0.875rem", color: "#94a3b8" }}>
                        {new Date(post.published_at).toLocaleDateString(
                          undefined,
                          { year: "numeric", month: "short", day: "numeric" },
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              {posts.length === 0 && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    textAlign: "center",
                    color: "#64748b",
                    padding: "4rem",
                  }}
                >
                  No articles published yet.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
