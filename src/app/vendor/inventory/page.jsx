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
  const [stockFilter, setStockFilter] = useState(""); // all, low, out
  const [selected, setSelected] = useState(null);
  const [editQty, setEditQty] = useState(0);
  const [editPrice, setEditPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchInventory = useCallback(() => {
    setLoading(true);
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
      .catch(() => showToast('Failed to load inventory', 'error'))
      .finally(() => setLoading(false));
  }, [search, showToast]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const openDrawer = (inv) => {
    setSelected(inv);
    setEditQty(inv.quantity);
    setEditPrice(inv.price_override || "");
  };

  const saveChanges = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const payload = { quantity: editQty };
      const priceVal = editPrice === "" ? null : parseFloat(editPrice);
      if (priceVal !== null && !isNaN(priceVal)) {
        payload.price_override = priceVal;
      } else {
        payload.price_override = null;
      }
      
      const { data } = await apiClient.patch(`/store/vendor/inventory/${selected.id}/`, payload);
      const updated = {
        ...selected,
        quantity: data.quantity,
        price_override: data.price_override,
        effective_price: data.effective_price,
      };
      setInventory((prev) =>
        prev.map((i) => (i.id === selected.id ? updated : i)),
      );
      setSelected(updated);
      showToast("Inventory updated", "success");
    } catch {
      showToast("Failed to update inventory", "error");
    } finally {
      setSaving(false);
    }
  };

  // Stock filter
  const filteredInventory = inventory.filter(inv => {
    if (stockFilter === 'out') return inv.quantity === 0;
    if (stockFilter === 'low') return inv.quantity > 0 && inv.quantity <= 5;
    if (stockFilter === 'instock') return inv.quantity > 5;
    return true;
  });

  const lowStock = inventory.filter((i) => i.quantity <= 5 && i.quantity > 0).length;
  const outOfStock = inventory.filter((i) => i.quantity === 0).length;
  const inStock = inventory.filter((i) => i.quantity > 5).length;
  const totalValue = inventory.reduce((sum, i) => sum + (parseFloat(i.effective_price) * i.quantity), 0);

  const stockColor = (qty) =>
    qty === 0
      ? "var(--color-danger)"
      : qty <= 5
        ? "#92400e"
        : "var(--color-success)";

  const stockBg = (qty) =>
    qty === 0
      ? "#fff1f2"
      : qty <= 5
        ? "#fffbeb"
        : undefined;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Inventory Management</h1>
        <Link href="/vendor/products/new" className="btn btn-primary btn-sm">
          + Add Product
        </Link>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <div className="card" style={{ padding: '1rem', textAlign: 'center', cursor: 'pointer', border: stockFilter === '' ? '2px solid var(--color-primary)' : undefined }} onClick={() => setStockFilter('')}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>{inventory.length}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Variants</div>
        </div>
        <div className="card" style={{ padding: '1rem', textAlign: 'center', cursor: 'pointer', border: stockFilter === 'instock' ? '2px solid var(--color-success)' : undefined }} onClick={() => setStockFilter(stockFilter === 'instock' ? '' : 'instock')}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)' }}>{inStock}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>In Stock</div>
        </div>
        <div className="card" style={{ padding: '1rem', textAlign: 'center', cursor: 'pointer', border: stockFilter === 'low' ? '2px solid #92400e' : undefined }} onClick={() => setStockFilter(stockFilter === 'low' ? '' : 'low')}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#92400e' }}>{lowStock}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Low Stock (≤5)</div>
        </div>
        <div className="card" style={{ padding: '1rem', textAlign: 'center', cursor: 'pointer', border: stockFilter === 'out' ? '2px solid var(--color-danger)' : undefined }} onClick={() => setStockFilter(stockFilter === 'out' ? '' : 'out')}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-danger)' }}>{outOfStock}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Out of Stock</div>
        </div>
        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Stock Value</div>
        </div>
      </div>

      {/* Search */}
      <div className="filters-row" style={{ marginBottom: '1rem' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <span>🔍</span>
          <input
            placeholder="Search by product name, size, color…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
            <span className="spinner dark" style={{ width: "2rem", height: "2rem" }} />
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <p className="empty-state-title">No inventory found</p>
            <p className="empty-state-desc">
              {stockFilter ? 'No variants match this filter' : 'Add products and variants to track inventory here'}
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
                  <th>Base Price</th>
                  <th>Override Price</th>
                  <th>Effective Price</th>
                  <th>Stock</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => openDrawer(inv)}
                    style={{ background: stockBg(inv.quantity), cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: 600, color: "var(--color-primary)" }}>
                      {inv.product_name}
                    </td>
                    <td>
                      <span style={{ fontFamily: "monospace", fontSize: "0.8125rem" }}>
                        {inv.product_sku}
                      </span>
                    </td>
                    <td>
                      {inv.school_name ?? (
                        <span style={{ color: "var(--color-text-muted)" }}>All</span>
                      )}
                    </td>
                    <td><strong>{inv.size}</strong></td>
                    <td>
                      {inv.color ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {inv.color}
                        </span>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)" }}>—</span>
                      )}
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.85rem' }}>
                      ₹{parseFloat(inv.effective_price).toLocaleString("en-IN")}
                    </td>
                    <td>
                      {inv.price_override ? (
                        <span style={{ color: '#059669', fontWeight: 600 }}>₹{parseFloat(inv.price_override).toLocaleString("en-IN")}</span>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)" }}>—</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      ₹{parseFloat(inv.effective_price).toLocaleString("en-IN")}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: stockColor(inv.quantity), fontSize: '0.95rem' }}>
                        {inv.quantity}
                        {inv.quantity === 0 && " ⚠️"}
                        {inv.quantity > 0 && inv.quantity <= 5 && " ⚡"}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#475569' }}>
                      ₹{(parseFloat(inv.effective_price) * inv.quantity).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Drawer */}
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
              value={<span style={{ fontFamily: "monospace" }}>{selected.product_sku}</span>}
            />
            <DrawerRow label="School" value={selected.school_name ?? "All Schools"} />
            <DrawerRow label="Size" value={<strong>{selected.size}</strong>} />
            <DrawerRow label="Color" value={selected.color || "—"} />
            <DrawerRow
              label="Effective Price"
              value={<strong style={{ color: '#059669' }}>₹{parseFloat(selected.effective_price).toLocaleString("en-IN")}</strong>}
            />
            <DrawerRow
              label="Current Stock"
              value={<strong style={{ color: stockColor(selected.quantity) }}>{selected.quantity}</strong>}
            />
            <DrawerRow
              label="Stock Value"
              value={`₹${(parseFloat(selected.effective_price) * selected.quantity).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            />

            {/* Update Stock */}
            <DrawerSection title="Update Stock Quantity" />
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button
                onClick={() => setEditQty(Math.max(0, editQty - 1))}
                className="btn"
                style={{ padding: "0.4rem 0.75rem", fontSize: "1.2rem", lineHeight: 1 }}
              >
                −
              </button>
              <input
                type="number"
                min={0}
                value={editQty}
                onChange={(e) => setEditQty(Math.max(0, parseInt(e.target.value) || 0))}
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
                style={{ padding: "0.4rem 0.75rem", fontSize: "1.2rem", lineHeight: 1 }}
              >
                +
              </button>
            </div>
            {/* Quick adjust buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              {[5, 10, 25, 50, 100].map(n => (
                <button
                  key={n}
                  className="btn btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}
                  onClick={() => setEditQty(editQty + n)}
                >
                  +{n}
                </button>
              ))}
              <button
                className="btn btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer' }}
                onClick={() => setEditQty(0)}
              >
                Reset to 0
              </button>
            </div>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", color: "var(--color-text-muted)", textAlign: "center" }}>
              Current: <strong style={{ color: stockColor(selected.quantity) }}>{selected.quantity}</strong>
              {editQty !== selected.quantity && (
                <span> → <strong style={{ color: stockColor(editQty) }}>{editQty}</strong> ({editQty > selected.quantity ? '+' : ''}{editQty - selected.quantity})</span>
              )}
            </p>

            {/* Update Price Override */}
            <DrawerSection title="Price Override" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>₹</span>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder="Leave empty to use base price"
                  style={{
                    flex: 1,
                    padding: "0.5rem 0.75rem",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "1rem",
                  }}
                />
                {editPrice && (
                  <button
                    className="btn btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer' }}
                    onClick={() => setEditPrice("")}
                  >
                    Clear
                  </button>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                If set, this overrides the product base price for this specific size/color variant.
              </p>
            </div>

            {/* Save + Navigate */}
            <div className="drawer-actions">
              <button
                onClick={saveChanges}
                disabled={saving || (editQty === selected.quantity && (editPrice || "") === (selected.price_override || "").toString())}
                className="btn btn-primary"
              >
                {saving ? "Saving…" : "Save Changes"}
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
