"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";
import { useToast } from "@/context/ToastContext";

const emptyRow = () => ({
  roll_number: "",
  product_sku: "",
  size: "",
  color: "",
  quantity: 1,
});

export default function BulkOrderFormPage() {
  const [vendorId, setVendorId] = useState(null);
  const [vendorName, setVendorName] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([emptyRow()]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await apiClient.get("/schools/profile/");
        setVendorId(data.vendor);
        setVendorName(data.vendor_name || "");
      } catch {
        showToast("Failed to load school profile", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [showToast]);

  // ── Row helpers ──────────────────────────────────────────────────────────────

  const updateRow = (index, field, value) => {
    setItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const addRow = () => setItems((prev) => [...prev, emptyRow()]);

  const removeRow = (index) => {
    if (items.length === 1) return; // keep at least one row
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const duplicateRow = (index) => {
    setItems((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, { ...prev[index] });
      return copy;
    });
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!vendorId) {
      showToast("Vendor context missing — cannot create order", "error");
      return;
    }

    // Validate rows
    const invalid = items.findIndex(
      (r) =>
        !r.roll_number.trim() ||
        !r.product_sku.trim() ||
        !r.size.trim() ||
        r.quantity < 1,
    );
    if (invalid !== -1) {
      showToast(
        `Row ${invalid + 1}: Roll No, SKU, and Size are required and Qty must be ≥ 1.`,
        "error",
      );
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await apiClient.post("/orders/school/bulk/", {
        vendor_id: vendorId,
        notes,
        items,
      });

      const errCount = data.errors?.length ?? 0;
      if (errCount > 0) {
        showToast(
          `Order created with ${errCount} skipped row(s). Check console.`,
          "error",
        );
        console.warn("Bulk order errors:", data.errors);
      } else {
        showToast(
          `Bulk order ${data.bulk_order.bulk_order_number} created!`,
          "success",
        );
      }

      router.push(`/school/orders/bulk/${data.bulk_order.id}`);
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.detail || "Failed to create bulk order.";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: "2rem" }}>Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Bulk Order</h1>
          <p
            style={{
              color: "var(--color-text-secondary)",
              fontSize: "0.875rem",
              marginTop: "0.25rem",
            }}
          >
            Add each student&apos;s order as a row. All orders are shipped to
            the school and distributed manually.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Meta */}
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.25rem",
            }}
          >
            <div className="form-group" style={{ margin: 0 }}>
              <label>Vendor (auto-assigned)</label>
              <input
                value={vendorName || `Vendor ID: ${vendorId}`}
                disabled
                style={{ background: "#f3f4f6", cursor: "not-allowed" }}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Notes (optional)</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Annual uniform order 2026"
              />
            </div>
          </div>
        </div>

        {/* Line items table */}
        <div
          className="card"
          style={{ padding: 0, overflow: "hidden", marginBottom: "1.5rem" }}
        >
          <div
            style={{
              padding: "1rem 1.25rem",
              borderBottom: "1px solid var(--color-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
              Order Items
              <span
                style={{
                  marginLeft: "0.5rem",
                  fontSize: "0.8rem",
                  fontWeight: 400,
                  color: "var(--color-text-secondary)",
                }}
              >
                {items.length} row{items.length !== 1 ? "s" : ""}
              </span>
            </h2>
            <button
              type="button"
              onClick={addRow}
              className="btn btn-primary"
              style={{ padding: "0.4rem 0.875rem", fontSize: "0.875rem" }}
            >
              + Add Row
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              className="data-table"
              style={{ marginTop: 0, minWidth: "760px" }}
            >
              <thead>
                <tr>
                  <th style={{ width: "30px" }}>#</th>
                  <th>Roll Number *</th>
                  <th>Product SKU *</th>
                  <th>Size *</th>
                  <th>Color</th>
                  <th style={{ width: "80px" }}>Qty *</th>
                  <th style={{ width: "80px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, i) => (
                  <tr key={i} style={{ verticalAlign: "middle" }}>
                    <td
                      style={{
                        color: "var(--color-text-secondary)",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                      }}
                    >
                      {i + 1}
                    </td>
                    <td>
                      <input
                        value={row.roll_number}
                        onChange={(e) =>
                          updateRow(i, "roll_number", e.target.value)
                        }
                        placeholder="e.g. 42"
                        style={{
                          width: "100%",
                          padding: "0.4rem 0.6rem",
                          border: "1px solid var(--color-border)",
                          borderRadius: "6px",
                          fontSize: "0.875rem",
                        }}
                      />
                    </td>
                    <td>
                      <input
                        value={row.product_sku}
                        onChange={(e) =>
                          updateRow(i, "product_sku", e.target.value)
                        }
                        placeholder="e.g. DPS-SHI-001"
                        style={{
                          width: "100%",
                          padding: "0.4rem 0.6rem",
                          border: "1px solid var(--color-border)",
                          borderRadius: "6px",
                          fontSize: "0.875rem",
                        }}
                      />
                    </td>
                    <td>
                      <input
                        value={row.size}
                        onChange={(e) => updateRow(i, "size", e.target.value)}
                        placeholder="M / 32"
                        style={{
                          width: "100%",
                          padding: "0.4rem 0.6rem",
                          border: "1px solid var(--color-border)",
                          borderRadius: "6px",
                          fontSize: "0.875rem",
                        }}
                      />
                    </td>
                    <td>
                      <input
                        value={row.color}
                        onChange={(e) => updateRow(i, "color", e.target.value)}
                        placeholder="White"
                        style={{
                          width: "100%",
                          padding: "0.4rem 0.6rem",
                          border: "1px solid var(--color-border)",
                          borderRadius: "6px",
                          fontSize: "0.875rem",
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        value={row.quantity}
                        onChange={(e) =>
                          updateRow(
                            i,
                            "quantity",
                            Math.max(1, parseInt(e.target.value) || 1),
                          )
                        }
                        style={{
                          width: "100%",
                          padding: "0.4rem 0.6rem",
                          border: "1px solid var(--color-border)",
                          borderRadius: "6px",
                          fontSize: "0.875rem",
                          textAlign: "center",
                        }}
                      />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.25rem" }}>
                        <button
                          type="button"
                          onClick={() => duplicateRow(i)}
                          title="Duplicate row"
                          style={{
                            padding: "0.3rem 0.5rem",
                            border: "1px solid var(--color-border)",
                            borderRadius: "5px",
                            background: "white",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                          }}
                        >
                          ⧉
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRow(i)}
                          disabled={items.length === 1}
                          title="Remove row"
                          style={{
                            padding: "0.3rem 0.5rem",
                            border: "1px solid #fca5a5",
                            borderRadius: "5px",
                            background: "#fee2e2",
                            color: "#b91c1c",
                            cursor:
                              items.length === 1 ? "not-allowed" : "pointer",
                            opacity: items.length === 1 ? 0.4 : 1,
                            fontSize: "0.8rem",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              padding: "0.75rem 1.25rem",
              borderTop: "1px solid var(--color-border)",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={addRow}
              style={{
                background: "none",
                border: "1px dashed var(--color-border)",
                borderRadius: "6px",
                padding: "0.4rem 1rem",
                cursor: "pointer",
                color: "var(--color-text-secondary)",
                fontSize: "0.875rem",
              }}
            >
              + Add another row
            </button>
          </div>
        </div>

        {/* Hint */}
        <div
          style={{
            background: "#f0f9ff",
            border: "1px solid #bae6fd",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1.5rem",
            fontSize: "0.8rem",
            color: "#0369a1",
          }}
        >
          <strong>Tips:</strong> Roll Number must match a{" "}
          <strong>verified</strong> student in this school. SKU must match a
          product assigned to this school. Use ⧉ to duplicate a row for the same
          student with different sizes.
        </div>

        {/* Actions */}
        <div
          style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}
        >
          <button
            type="button"
            onClick={() => router.push("/school/orders/bulk")}
            className="btn"
            style={{ background: "#f3f4f6" }}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ minWidth: "160px" }}
          >
            {submitting
              ? "Creating Order…"
              : `Create Bulk Order (${items.length} row${items.length !== 1 ? "s" : ""})`}
          </button>
        </div>
      </form>
    </div>
  );
}
