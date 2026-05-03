"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useStudent } from "@/context/StudentContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
  "http://localhost:8000";
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const CAT_ICON = {
  shirt: "👔",
  trouser: "👖",
  skirt: "👗",
  blazer: "🧥",
  tie: "👔",
  shoes: "👟",
  socks: "🧦",
  other: "👕",
};

export default function ShopPage() {
  const { schoolId } = useParams();
  const [school, setSchool] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const { activeStudent, setActiveStudent, students } = useStudent();
  const { addItem, totalItems } = useCart();
  const { showToast } = useToast();

  // If active student isn't from this school, suggest switching
  const studentsForSchool = students.filter(
    (s) => s.school === Number(schoolId) && s.is_verified,
  );

  useEffect(() => {
    if (!schoolId) return;
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/schools/public/${schoolId}/`).then((r) => r.json()),
      fetch(`${API_URL}/store/?school=${schoolId}`).then((r) => r.json()),
    ])
      .then(([s, p]) => {
        setSchool(s);
        setProducts(Array.isArray(p) ? p : (p.results ?? []));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [schoolId]);

  const logoUrl = (logo) =>
    logo ? (logo.startsWith("http") ? logo : `${API_BASE}${logo}`) : null;
  const imgUrl = (p) => {
    if (p.primary_image_url) return p.primary_image_url;
    const pi = p.images.find((i) => i.is_primary) || p.images[0];
    return pi
      ? pi.image.startsWith("http")
        ? pi.image
        : `${API_BASE}${pi.image}`
      : null;
  };

  const categories = [...new Set(products.map((p) => p.category))];
  const filtered = products.filter(
    (p) =>
      (!catFilter || p.category === catFilter) &&
      (!search || p.name.toLowerCase().includes(search.toLowerCase())),
  );

  const canOrder =
    activeStudent?.school === Number(schoolId) && activeStudent?.is_verified;

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}>
        Loading shop…
      </div>
    );

  return (
    <div>
      {/* School header */}
      <div
        style={{
          position: "relative",
          background: "#0f172a",
          color: "white",
          borderRadius: "16px",
          padding: "2.5rem 2rem",
          marginBottom: "1.5rem",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              'url("https://images.unsplash.com/photo-1594938298596-70f56fb3cecb?auto=format&fit=crop&w=1200&q=80")',
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.3,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to right, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.7) 100%)",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "16px",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              overflow: "hidden",
              flexShrink: 0,
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              padding: school?.logo ? 0 : "0.5rem",
            }}
          >
            {school?.logo ? (
              <img
                src={logoUrl(school.logo) ?? undefined}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              "🏫"
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                margin: "0 0 0.25rem",
                fontSize: "1.5rem",
                fontWeight: 800,
              }}
            >
              {school?.name}
            </h1>
            <p
              style={{
                margin: "0 0 0.875rem",
                opacity: 0.8,
                fontSize: "0.9375rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <span>📍 {school?.city}</span>
              <span>· {products.length} products available</span>
              {activeStudent && activeStudent.school === Number(schoolId) && (
                <span>
                  {" "}
                  · Shopping for <strong>
                    {activeStudent.student_name}
                  </strong>{" "}
                  {activeStudent.is_verified ? "✅" : "⏳"}
                </span>
              )}
            </p>
            {/* Student switcher for this school */}
            {studentsForSchool.length > 1 && (
              <select
                value={activeStudent?.id ?? ""}
                onChange={(e) => {
                  const s = studentsForSchool.find(
                    (s) => s.id === Number(e.target.value),
                  );
                  if (s) setActiveStudent(s);
                }}
                style={{
                  fontSize: "0.8125rem",
                  padding: "0.4rem 0.875rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {studentsForSchool.map((s) => (
                  <option key={s.id} value={s.id} style={{ color: "black" }}>
                    {s.student_name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <Link
            href="/store/cart"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "white",
              color: "#0f172a",
              padding: "0.75rem 1.25rem",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "0.9rem",
              flexShrink: 0,
              boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
            }}
          >
            🛒 {totalItems > 0 ? `Cart (${totalItems})` : "Cart"}
          </Link>
        </div>
      </div>

      {/* Not verified warning */}
      {!canOrder && (
        <div
          style={{
            background: "#fef3c7",
            border: "1px solid #fcd34d",
            borderRadius: "10px",
            padding: "1rem",
            marginBottom: "1.25rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p style={{ margin: 0, fontSize: "0.875rem", color: "#92400e" }}>
            ⏳ You need a verified student profile for this school to order.
          </p>
          <Link
            href="/store/students"
            style={{
              fontSize: "0.8125rem",
              color: "#92400e",
              fontWeight: 700,
              textDecoration: "none",
              whiteSpace: "nowrap",
              marginLeft: "1rem",
            }}
          >
            Manage Students →
          </Link>
        </div>
      )}

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "white",
            border: "1.5px solid #e2e8f0",
            borderRadius: "8px",
            padding: "0.5rem 0.875rem",
            flex: 1,
            minWidth: 200,
            maxWidth: 320,
          }}
        >
          <span>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search uniforms…"
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "0.875rem",
              flex: 1,
            }}
          />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            onClick={() => setCatFilter("")}
            style={{
              padding: "0.4rem 0.875rem",
              background: !catFilter ? "#4f46e5" : "#f8fafc",
              color: !catFilter ? "white" : "#64748b",
              border: "1px solid",
              borderColor: !catFilter ? "#4f46e5" : "#e2e8f0",
              borderRadius: "6px",
              fontSize: "0.8125rem",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              style={{
                padding: "0.4rem 0.875rem",
                background: catFilter === cat ? "#4f46e5" : "#f8fafc",
                color: catFilter === cat ? "white" : "#64748b",
                border: "1px solid",
                borderColor: catFilter === cat ? "#4f46e5" : "#e2e8f0",
                borderRadius: "6px",
                fontSize: "0.8125rem",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              {CAT_ICON[cat] || "👕"}{" "}
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>👕</div>
          <p>No items found{catFilter ? ` in "${catFilter}"` : ""}.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
            gap: "1.1rem",
          }}
        >
          {filtered.map((p) => {
            const img = imgUrl(p);
            const minPrice = p.inventory.reduce(
              (min, i) => Math.min(min, parseFloat(i.effective_price)),
              parseFloat(p.base_price),
            );
            const totalStock = p.inventory.reduce((s, i) => s + i.quantity, 0);
            const sizes = [
              ...new Set(
                p.inventory.filter((i) => i.quantity > 0).map((i) => i.size),
              ),
            ];
            return (
              <div
                key={p.id}
                style={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  overflow: "hidden",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.boxShadow = "0 8px 24px rgb(0 0 0/0.08)";
                  el.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.boxShadow = "";
                  el.style.transform = "";
                }}
              >
                <Link
                  href={`/browse/${schoolId}/${p.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "4/3",
                      background: "#f8fafc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "3.5rem",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {img ? (
                      <img
                        src={img}
                        alt={p.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background:
                            "radial-gradient(circle, #f1f5f9 0%, #cbd5e1 100%)",
                        }}
                      >
                        <img
                          src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=400&q=80"
                          alt="Placeholder"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            opacity: 0.1,
                            mixBlendMode: "multiply",
                          }}
                        />
                      </div>
                    )}
                    {totalStock === 0 && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(0,0,0,0.4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: 700,
                          fontSize: "0.8rem",
                        }}
                      >
                        Out of Stock
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "0.875rem 1rem 0.5rem" }}>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        fontWeight: 600,
                        letterSpacing: "0.05em",
                        marginBottom: "0.2rem",
                      }}
                    >
                      {p.category}
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        marginBottom: "0.375rem",
                      }}
                    >
                      {p.name}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontWeight: 800, color: "#4f46e5" }}>
                        ₹{minPrice.toLocaleString("en-IN")}
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                        {sizes.slice(0, 4).join(", ")}
                        {sizes.length > 4 ? "…" : ""}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
