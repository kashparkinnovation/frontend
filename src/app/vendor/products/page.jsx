"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import apiClient from "@/lib/api";
import StatusBadge from "@/components/ui/StatusBadge";
import Drawer, { DrawerRow, DrawerSection } from "@/components/ui/Drawer";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/context/ToastContext";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
  "http://localhost:8000";
const CATEGORIES = [
  "shirt",
  "trouser",
  "skirt",
  "blazer",
  "tie",
  "belt",
  "shoes",
  "socks",
  "sweater",
  "jacket",
  "tracksuit",
  "shorts",
  "other",
];

export default function VendorProductsPage() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [schoolFilter, setSchoolFilter] = useState(
    searchParams.get("school") || "",
  );
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (schoolFilter) params.school = schoolFilter;
    if (categoryFilter) params.category = categoryFilter;
    if (activeFilter) params.is_active = activeFilter;
    apiClient
      .get("/store/vendor/products/", { params })
      .then((r) => setProducts(r.data.results ?? r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, schoolFilter, categoryFilter, activeFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  useEffect(() => {
    apiClient
      .get("/schools/", { params: { approval_status: "approved" } })
      .then((r) => setSchools(r.data.results ?? r.data))
      .catch(console.error);
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/store/vendor/products/${deleteTarget.id}/`);
      showToast("Product deleted", "success");
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
      if (selected?.id === deleteTarget.id) setSelected(null);
    } catch {
      showToast("Failed to delete product", "error");
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (product) => {
    try {
      const r = await apiClient.patch(`/store/vendor/products/${product.id}/`, {
        is_active: !product.is_active,
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_active: r.data.is_active } : p,
        ),
      );
      if (selected?.id === product.id)
        setSelected((prev) =>
          prev ? { ...prev, is_active: r.data.is_active } : prev,
        );
      showToast(
        `Product ${r.data.is_active ? "activated" : "deactivated"}`,
        "success",
      );
    } catch {
      showToast("Failed to update status", "error");
    }
  };

  const resolveImage = (p) => {
    const url =
      p.primary_image_url ||
      (p.image
        ? p.image.startsWith("http")
          ? p.image
          : `${API_BASE}${p.image}`
        : null);
    return url;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Products</h1>
        <Link href="/vendor/products/new" className="btn btn-primary">
          + Add Product
        </Link>
      </div>

      <div className="filters-row">
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <span>🔍</span>
          <input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="select"
          style={{ width: "auto" }}
          value={schoolFilter}
          onChange={(e) => setSchoolFilter(e.target.value)}
        >
          <option value="">All Schools</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          className="select"
          style={{ width: "auto" }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
        <select
          className="select"
          style={{ width: "auto" }}
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "3rem",
            }}
          >
            <span
              className="spinner dark"
              style={{ width: "2rem", height: "2rem" }}
            />
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👕</div>
            <p className="empty-state-title">No products found</p>
            <p className="empty-state-desc">
              Add your first product to start selling uniforms
            </p>
            <Link href="/vendor/products/new" className="btn btn-primary">
              Add Product
            </Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>School</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Variants</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const imgUrl = resolveImage(p);
                  const totalStock = p.inventory.reduce(
                    (s, i) => s + i.quantity,
                    0,
                  );
                  return (
                    <tr key={p.id} onClick={() => setSelected(p)}>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "var(--radius)",
                              overflow: "hidden",
                              background: "var(--color-bg)",
                              border: "1px solid var(--color-border)",
                              flexShrink: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "1.1rem",
                            }}
                          >
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt=""
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              "👕"
                            )}
                          </div>
                          <span style={{ fontWeight: 600 }}>{p.name}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "0.8125rem",
                          }}
                        >
                          {p.sku}
                        </span>
                      </td>
                      <td>
                        {p.school_name ?? (
                          <span style={{ color: "var(--color-text-muted)" }}>
                            All schools
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="chip">{p.category}</span>
                      </td>
                      <td>
                        <strong>
                          ₹{parseFloat(p.base_price).toLocaleString("en-IN")}
                        </strong>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {p.inventory.length} variants
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color:
                              totalStock === 0
                                ? "var(--color-danger)"
                                : totalStock <= 10
                                  ? "var(--color-warning)"
                                  : "var(--color-text-muted)",
                          }}
                        >
                          {totalStock} in stock
                        </div>
                      </td>
                      <td>
                        <StatusBadge
                          status={p.is_active ? "active" : "inactive"}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product detail drawer */}
      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={`SKU: ${selected?.sku}`}
        width="520px"
      >
        {selected &&
          (() => {
            const imgUrl = resolveImage(selected);
            const totalStock = selected.inventory.reduce(
              (s, i) => s + i.quantity,
              0,
            );
            return (
              <>
                {imgUrl && (
                  <div
                    style={{
                      width: "100%",
                      height: "180px",
                      borderRadius: "10px",
                      overflow: "hidden",
                      marginBottom: "1rem",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt={selected.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                )}

                <DrawerSection title="Product Info" />
                <DrawerRow label="Name" value={selected.name} />
                <DrawerRow
                  label="SKU"
                  value={
                    <span style={{ fontFamily: "monospace" }}>
                      {selected.sku}
                    </span>
                  }
                />
                <DrawerRow
                  label="School"
                  value={selected.school_name ?? "All Schools"}
                />
                <DrawerRow
                  label="Category"
                  value={<span className="chip">{selected.category}</span>}
                />
                <DrawerRow
                  label="Base Price"
                  value={
                    <strong>
                      ₹{parseFloat(selected.base_price).toLocaleString("en-IN")}
                    </strong>
                  }
                />
                <DrawerRow
                  label="Total Stock"
                  value={
                    <span
                      style={{
                        fontWeight: 600,
                        color:
                          totalStock === 0
                            ? "var(--color-danger)"
                            : totalStock <= 10
                              ? "var(--color-warning)"
                              : "var(--color-success)",
                      }}
                    >
                      {totalStock} units
                    </span>
                  }
                />
                <DrawerRow
                  label="Images"
                  value={`${selected.images.length} image${selected.images.length !== 1 ? "s" : ""}`}
                />
                <DrawerRow
                  label="Status"
                  value={
                    <StatusBadge
                      status={selected.is_active ? "active" : "inactive"}
                    />
                  }
                />

                {selected.description && (
                  <>
                    <DrawerSection title="Description" />
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.875rem",
                        color: "var(--color-text-secondary)",
                        lineHeight: 1.6,
                      }}
                    >
                      {selected.description}
                    </p>
                  </>
                )}

                {selected.inventory.length > 0 && (
                  <>
                    <DrawerSection title="Variants & Stock" />
                    {selected.inventory.map((inv, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "0.4rem 0",
                          borderBottom: "1px solid #f1f5f9",
                          fontSize: "0.875rem",
                        }}
                      >
                        <span>
                          {inv.size}
                          {inv.color ? ` / ${inv.color}` : ""}
                        </span>
                        <span
                          style={{
                            fontWeight: 600,
                            color:
                              inv.quantity === 0
                                ? "var(--color-danger)"
                                : undefined,
                          }}
                        >
                          {inv.quantity} units · ₹
                          {parseFloat(inv.effective_price).toLocaleString(
                            "en-IN",
                          )}
                        </span>
                      </div>
                    ))}
                  </>
                )}

                <div className="drawer-actions">
                  <button
                    onClick={() => toggleActive(selected)}
                    className="btn"
                    style={{
                      background: selected.is_active ? "#fef3c7" : "#d1fae5",
                      color: selected.is_active ? "#92400e" : "#065f46",
                    }}
                  >
                    {selected.is_active ? "○ Deactivate" : "● Activate"}
                  </button>
                  <Link
                    href={`/vendor/products/${selected.id}`}
                    className="btn btn-primary"
                    onClick={() => setSelected(null)}
                  >
                    ✏️ Edit Product
                  </Link>
                  <button
                    onClick={() => {
                      setDeleteTarget(selected);
                      setSelected(null);
                    }}
                    className="btn"
                    style={{ background: "#fee2e2", color: "#b91c1c" }}
                  >
                    🗑 Delete
                  </button>
                </div>
              </>
            );
          })()}
      </Drawer>

      {/* Delete confirm modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Product"
        footer={
          <>
            <button
              className="btn btn-ghost"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting && <span className="spinner" />} Delete
            </button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
          This will permanently remove the product and all its variants and
          images.
        </p>
      </Modal>
    </div>
  );
}
