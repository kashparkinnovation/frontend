"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import Link from "next/link";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
  "http://localhost:8000";

export default function BlogPostPage() {
  const params = useParams();
  const slug = params?.slug;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API_URL}/blog/posts/${slug}/`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => setPost(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading)
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
        <main style={{ padding: "4rem 2rem", textAlign: "center" }}>
          Loading...
        </main>
        <Footer />
      </div>
    );
  if (!post)
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
        <main style={{ padding: "10rem 2rem", textAlign: "center" }}>
          Article not found.
        </main>
        <Footer />
      </div>
    );

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
      <main style={{ flex: 1, paddingBottom: "4rem" }}>
        {/* Hero Section */}
        <div
          style={{
            position: "relative",
            background: "#0f172a",
            padding: "6rem 2rem",
            color: "white",
            overflow: "hidden",
          }}
        >
          {post.featured_image && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${post.featured_image.startsWith("http") ? post.featured_image : API_BASE + post.featured_image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: 0.3,
              }}
            />
          )}
          <div
            style={{
              position: "relative",
              zIndex: 10,
              maxWidth: 800,
              margin: "0 auto",
              textAlign: "center",
            }}
          >
            <Link
              href="/blog"
              style={{
                color: "#cbd5e1",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: 600,
                display: "inline-block",
                marginBottom: "2rem",
              }}
            >
              ← Back to Blog
            </Link>
            {post.category && (
              <div
                style={{
                  color: "#4f46e5",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "1rem",
                  fontSize: "0.875rem",
                }}
              >
                {post.category.name}
              </div>
            )}
            <h1
              style={{
                fontSize: "3rem",
                fontWeight: 900,
                marginBottom: "1.5rem",
                lineHeight: 1.2,
              }}
            >
              {post.title}
            </h1>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center",
                color: "#94a3b8",
                fontSize: "0.9375rem",
              }}
            >
              <span>By {post.author_name}</span>
              <span>•</span>
              <span>
                {new Date(post.published_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div
          style={{
            maxWidth: 800,
            margin: "-2rem auto 0",
            position: "relative",
            zIndex: 20,
            background: "white",
            borderRadius: "24px",
            padding: "4rem",
            boxShadow: "0 20px 40px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{ fontSize: "1.125rem", lineHeight: 1.8, color: "#334155" }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
