"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import apiClient from "@/lib/api";
import Drawer, { DrawerRow, DrawerSection } from "@/components/ui/Drawer";
import { useToast } from "@/context/ToastContext";

export default function VendorInventoryPage() {
  const { showToast } = useToast();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [editQty, setEditQty] = useState(0);
  const [saving, setSaving] = useState(false);

  const fetchInventory = useCallback(() => {
    const params = {};
    if (search) params.search = search;
    apiClient
      .get("/store/vendor/inventory/", { params })
      .then((r) => {
        const results = r.data.results ?? r.data;
        setInventory(
          results.map((inv) => ({
            ...inv,
            product_id: inv.product?.id ?? inv.product,
            product_name: inv.product?.name ?? "—",
            product_sku: inv.product?.sku ?? "—",
            school_name: inv.product?.school_name ?? null,
          })),
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const openDrawer = (inv) => {
    setSelected(inv);
    setEditQty(inv.quantity);
  };

  const saveStock = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.patch(`/store/vendor/inventory/${selected.id}/`, {
        quantity: editQty,
      });
      const updated = { ...selected, quantity: editQty };
      setInventory((prev) =>
        prev.map((i) => (i.id === selected.id ? updated : i)),
      );
      setSelected(updated);
      showToast("Stock updated", "success");
    } catch {
      showToast("Failed to update stock", "error");
    } finally {
      setSaving(false);
    }
  };

  const lowStock = inventory.filter(
    (i) => i.quantity <= 5 && i.quantity > 0,
  ).length;
  const outOfStock = inventory.filter((i) => i.quantity === 0).length;

  const stockColor = (qty) =>
    qty === 0
      ? "var(--color-danger)"
      : qty <= 5
        ? "#92400e"
        : "var(--color-success)";

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Inventory</h1>
        <Link href="/vendor/products/new" className="btn btn-primary btn-sm">
          + Add Product
        </Link>
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
        }}
      >
        <div className="chip">📦 {inventory.length} total variants</div>
        {outOfStock > 0 && (
          <div
            className="chip"
            style={{ background: "#fee2e2", color: "#991b1b" }}
          >
            ⚠️ {outOfStock} out of stock
          </div>
        )}
        {lowStock > 0 && (
          <div
            className="chip"
            style={{ background: "#fef3c7", color: "#92400e" }}
          >
            ⚡ {lowStock} low stock
          </div>
        )}
      </div>

      <div className="filters-row">
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <span>🔍</span>
          <input
            placeholder="Search by product name, size, color…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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
        ) : inventory.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <p className="empty-state-title">No inventory found</p>
            <p className="empty-state-desc">
              Add products and variants to track inventory here
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>School</th>
                  <th>Size</th>
                  <th>Color</th>
                  <th>Price</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => openDrawer(inv)}
                    style={{
                      background:
                        inv.quantity === 0
                          ? "#fff1f2"
                          : inv.quantity <= 5
                            ? "#fffbeb"
                            : undefined,
                    }}
                  >
                    <td
                      style={{ fontWeight: 600, color: "var(--color-primary)" }}
                    >
                      {inv.product_name}
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.8125rem",
                        }}
                      >
                        {inv.product_sku}
                      </span>
                    </td>
                    <td>
                      {inv.school_name ?? (
                        <span style={{ color: "var(--color-text-muted)" }}>
                          All
                        </span>
                      )}
                    </td>
                    <td>
                      <strong>{inv.size}</strong>
                    </td>
                    <td>
                      {inv.color || (
                        <span style={{ color: "var(--color-text-muted)" }}>
                          —
                        </span>
                      )}
                    </td>
                    <td>
                      ₹{parseFloat(inv.effective_price).toLocaleString("en-IN")}
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color: stockColor(inv.quantity),
                        }}
                      >
                        {inv.quantity}
                        {inv.quantity === 0 && " ⚠️"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.product_name ?? ""}
        subtitle={`SKU: ${selected?.product_sku}`}
      >
        {selected && (
          <>
            <DrawerSection title="Variant Info" />
            <DrawerRow label="Product" value={selected.product_name} />
            <DrawerRow
              label="SKU"
              value={
                <span style={{ fontFamily: "monospace" }}>
                  {selected.product_sku}
                </span>
              }
            />
            <DrawerRow
              label="School"
              value={selected.school_name ?? "All Schools"}
            />
            <DrawerRow label="Size" value={<strong>{selected.size}</strong>} />
            <DrawerRow label="Color" value={selected.color || "—"} />
            <DrawerRow
              label="Base Price"
              value={`₹${parseFloat(selected.effective_price).toLocaleString("en-IN")}`}
            />

            <DrawerSection title="Update Stock" />
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              <button
                onClick={() => setEditQty(Math.max(0, editQty - 1))}
                className="btn"
                style={{
                  padding: "0.4rem 0.75rem",
                  fontSize: "1.2rem",
                  lineHeight: 1,
                }}
              >
                −
              </button>
              <input
                type="number"
                min={0}
                value={editQty}
                onChange={(e) =>
                  setEditQty(Math.max(0, parseInt(e.target.value) || 0))
                }
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              />

              <button
                onClick={() => setEditQty(editQty + 1)}
                className="btn"
                style={{
                  padding: "0.4rem 0.75rem",
                  fontSize: "1.2rem",
                  lineHeight: 1,
                }}
              >
                +
              </button>
            </div>
            <p
              style={{
                margin: "0.5rem 0 0",
                fontSize: "0.8rem",
                color: "var(--color-text-muted)",
                textAlign: "center",
              }}
            >
              Current:{" "}
              <strong style={{ color: stockColor(selected.quantity) }}>
                {selected.quantity}
              </strong>
            </p>

            <div className="drawer-actions">
              <button
                onClick={saveStock}
                disabled={saving || editQty === selected.quantity}
                className="btn btn-primary"
              >
                {saving ? "Saving…" : "Save Stock"}
              </button>
              <Link
                href={`/vendor/products/${selected.product_id}`}
                className="btn btn-outline"
                onClick={() => setSelected(null)}
              >
                View Product →
              </Link>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}
