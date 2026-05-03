"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
  "http://localhost:8000";

export default function BlogEditor({ postId }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("draft");
  const [imageFile, setImageFile] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [loading, setLoading] = useState(postId ? true : false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (postId) {
      const token = Cookies.get("access_token");
      fetch(`${API_URL}/admin/blog/posts/${postId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          setTitle(data.title);
          setContent(data.content);
          setStatus(data.status);
          if (data.featured_image) {
            setExistingImage(
              data.featured_image.startsWith("http")
                ? data.featured_image
                : `${API_BASE}${data.featured_image}`,
            );
          }
        })
        .finally(() => setLoading(false));
    }
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const token = Cookies.get("access_token");
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("status", status);
    if (imageFile) {
      formData.append("featured_image", imageFile);
    }

    const url = postId
      ? `${API_URL}/admin/blog/posts/${postId}/`
      : `${API_URL}/admin/blog/posts/`;
    const method = postId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        router.push("/admin/blog");
      } else {
        const errData = await res.json();
        alert("Error saving post: " + JSON.stringify(errData));
      }
    } catch (err) {
      alert("Network error saving post");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 800, padding: "2rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.875rem", fontWeight: 800 }}>
          {postId ? "Edit Post" : "New Post"}
        </h1>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            type="button"
            onClick={() => router.push("/admin/blog")}
            style={{
              background: "#e2e8f0",
              color: "#475569",
              padding: "0.625rem 1.25rem",
              borderRadius: "8px",
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              background: "#4f46e5",
              color: "white",
              padding: "0.625rem 1.25rem",
              borderRadius: "8px",
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {saving ? "Saving..." : "Save Post"}
          </button>
        </div>
      </div>

      <div
        style={{
          background: "white",
          padding: "2rem",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              marginBottom: "0.5rem",
              color: "#0f172a",
            }}
          >
            Post Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "1rem",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "2rem" }}>
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: "0.5rem",
                color: "#0f172a",
              }}
            >
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "1rem",
              }}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div style={{ flex: 2 }}>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: "0.5rem",
                color: "#0f172a",
              }}
            >
              Featured Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              style={{ marginBottom: "0.5rem" }}
            />
            {existingImage && !imageFile && (
              <img
                src={existingImage}
                alt="Current"
                style={{ display: "block", height: 80, borderRadius: "8px" }}
              />
            )}
          </div>
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              marginBottom: "0.5rem",
              color: "#0f172a",
            }}
          >
            Content (HTML/Markdown supported visually on frontend)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={15}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "1rem",
              fontFamily: "monospace",
            }}
          />
        </div>
      </div>
    </form>
  );
}
