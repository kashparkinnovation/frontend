"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function AdminBlogList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = () => {
    const token = Cookies.get("access_token");
    fetch(`${API_URL}/admin/blog/posts/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setPosts(Array.isArray(data) ? data : (data.results ?? []));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const deletePost = async (id) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    const token = Cookies.get("access_token");
    try {
      await fetch(`${API_URL}/admin/blog/posts/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.875rem", fontWeight: 800 }}>
          Blog Posts
        </h1>
        <Link
          href="/admin/blog/new"
          style={{
            background: "#4f46e5",
            color: "white",
            padding: "0.625rem 1.25rem",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Create New Post
        </Link>
      </div>

      {loading ? (
        <p>Loading posts...</p>
      ) : (
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <th
                  style={{
                    padding: "1rem",
                    color: "#64748b",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                  }}
                >
                  Title
                </th>
                <th
                  style={{
                    padding: "1rem",
                    color: "#64748b",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "1rem",
                    color: "#64748b",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                  }}
                >
                  Author
                </th>
                <th
                  style={{
                    padding: "1rem",
                    color: "#64748b",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                  }}
                >
                  Date
                </th>
                <th
                  style={{
                    padding: "1rem",
                    color: "#64748b",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    textAlign: "right",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "1rem", fontWeight: 600 }}>
                    {post.title}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        background:
                          post.status === "published" ? "#dcfce7" : "#f1f5f9",
                        color:
                          post.status === "published" ? "#166534" : "#475569",
                      }}
                    >
                      {post.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", color: "#64748b" }}>
                    {post.author_name}
                  </td>
                  <td style={{ padding: "1rem", color: "#64748b" }}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <Link
                      href={`/admin/blog/${post.id}`}
                      style={{
                        color: "#4f46e5",
                        marginRight: "1rem",
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => deletePost(post.id)}
                      style={{
                        color: "#ef4444",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    No posts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
