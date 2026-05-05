"use client";

import React, { useState } from "react";

// ── Predefined size presets ────────────────────────────────────────
const SIZE_PRESETS = [
  { label: "Clothing (XS–XXL)", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
  { label: "Trousers (26–38)", sizes: ["26", "28", "30", "32", "34", "36", "38"] },
  { label: "Kids (2Y–14Y)", sizes: ["2Y", "4Y", "6Y", "8Y", "10Y", "12Y", "14Y"] },
  { label: "Shoes (UK 4–12)", sizes: ["4", "5", "6", "7", "8", "9", "10", "11", "12"] },
];

const ALL_COMMON_SIZES = [
  "XS", "S", "M", "L", "XL", "XXL", "XXXL",
  "26", "28", "30", "32", "34", "36", "38", "40", "42",
  "2Y", "4Y", "6Y", "8Y", "10Y", "12Y", "14Y",
  "4", "5", "6", "7", "8", "9", "10", "11", "12",
  "Free Size",
];

function makeRow(size = "", color = "") {
  return { size, color, price_override: "", school_commission_percent: "", quantity: 0 };
}

// ── Panel component ────────────────────────────────────────────────
function Panel({ title, color = "#f0f4ff", border = "#c7d2fe", children }) {
  return (
    <div
      style={{
        background: color,
        border: `1.5px solid ${border}`,
        borderRadius: "var(--radius)",
        padding: "1rem",
        marginBottom: "1rem",
      }}
    >
      <p style={{ margin: "0 0 0.625rem", fontSize: "0.8125rem", fontWeight: 700, color: "#1e1b4b" }}>
        {title}
      </p>
      {children}
    </div>
  );
}

export default function VariantBuilder({ variants, onChange, basePrice }) {
  // ── Variation type names (what "size" and "color" mean for THIS product)
  const [type1, setType1] = useState("Size");
  const [type2, setType2] = useState("Color");

  // ── Panel visibility
  const [showTypeEditor, setShowTypeEditor] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  // ── Matrix builder state
  const [matrixAxis1, setMatrixAxis1] = useState("");
  const [matrixAxis2, setMatrixAxis2] = useState("");

  // ── Other helpers
  const [customInput, setCustomInput] = useState("");
  const [bulkSecond, setBulkSecond] = useState("");

  const activeVariants = variants.filter((v) => !v._delete);

  // ── Core mutation helpers ─────────────────────────────────────────
  const addRow = () => onChange([...variants, makeRow()]);

  const updateRow = (index, field, value) =>
    onChange(variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)));

  const removeRow = (index) => {
    const v = variants[index];
    if (v.id) {
      onChange(variants.map((row, i) => (i === index ? { ...row, _delete: true } : row)));
    } else {
      onChange(variants.filter((_, i) => i !== index));
    }
  };

  // ── Quick-add preset sizes ────────────────────────────────────────
  const addQuickSizes = (sizes) => {
    const existing = new Set(variants.map((v) => `${v.size}::${v.color}`));
    const newRows = sizes
      .filter((s) => !existing.has(`${s}::`))
      .map((s) => makeRow(s));
    onChange([...variants, ...newRows]);
  };

  // ── Custom comma-separated values for axis 1 ─────────────────────
  const addCustomSizes = () => {
    const sizes = customInput.split(",").map((s) => s.trim()).filter(Boolean);
    if (!sizes.length) return;
    const existing = new Set(variants.map((v) => `${v.size}::${v.color}`));
    const newRows = sizes.filter((s) => !existing.has(`${s}::`)).map((s) => makeRow(s));
    onChange([...variants, ...newRows]);
    setCustomInput("");
    setShowCustom(false);
  };

  // ── Matrix generator: all axis1 × axis2 combinations ─────────────
  const generateMatrix = () => {
    const ax1 = matrixAxis1.split(",").map((s) => s.trim()).filter(Boolean);
    const ax2 = matrixAxis2.split(",").map((s) => s.trim()).filter(Boolean);
    if (!ax1.length) return;

    const existing = new Set(variants.map((v) => `${v.size}::${v.color}`));
    const newRows = [];

    if (ax2.length === 0) {
      // No second axis — just add ax1 values as size rows
      ax1.forEach((s) => {
        if (!existing.has(`${s}::`)) newRows.push(makeRow(s));
      });
    } else {
      // Full cartesian product
      ax1.forEach((s) => {
        ax2.forEach((c) => {
          if (!existing.has(`${s}::${c}`)) newRows.push(makeRow(s, c));
        });
      });
    }

    onChange([...variants, ...newRows]);
    setMatrixAxis1("");
    setMatrixAxis2("");
    setShowMatrix(false);
  };

  // ── Bulk fill second axis for rows that have none ─────────────────
  const applyBulkSecond = () => {
    if (!bulkSecond.trim()) return;
    onChange(variants.map((v) => (v._delete || v.color ? v : { ...v, color: bulkSecond.trim() })));
    setBulkSecond("");
  };

  // ── Matrix preview count ──────────────────────────────────────────
  const ax1Count = matrixAxis1.split(",").filter((s) => s.trim()).length;
  const ax2Count = matrixAxis2.split(",").filter((s) => s.trim()).length;
  const matrixCount = ax1Count * (ax2Count || 1);

  return (
    <div>

      {/* ══ 1. Variation Type Configuration ══════════════════════════ */}
      <div style={{ marginBottom: "0.875rem" }}>
        <button
          type="button"
          className="btn btn-ghost btn-xs"
          style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", border: "1px dashed var(--color-border)" }}
          onClick={() => setShowTypeEditor((v) => !v)}
        >
          ⚙️ Variation type labels: <strong>{type1}</strong> × <strong>{type2}</strong>
          {showTypeEditor ? "  ▲" : "  ▼"}
        </button>
      </div>

      {showTypeEditor && (
        <Panel title="⚙️ Customize Variation Type Names" color="#f8fafc" border="#e2e8f0">
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
            Rename the variation axes to match your product. These labels only affect the UI — the data
            is stored in the same two fields regardless.
          </p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "160px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.3rem" }}>
                Primary Variation (e.g. Size, Waist, Material)
              </label>
              <input
                className="input"
                value={type1}
                onChange={(e) => setType1(e.target.value || "Size")}
                placeholder="Size"
              />
            </div>
            <div style={{ flex: 1, minWidth: "160px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.3rem" }}>
                Secondary Variation (e.g. Color, Inseam, Fit) — optional
              </label>
              <input
                className="input"
                value={type2}
                onChange={(e) => setType2(e.target.value || "Color")}
                placeholder="Color"
              />
            </div>
          </div>
          <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
            {[
              { t1: "Size", t2: "Color" },
              { t1: "Waist", t2: "Inseam" },
              { t1: "Material", t2: "Color" },
              { t1: "Size", t2: "Fit" },
              { t1: "Length", t2: "Width" },
            ].map(({ t1, t2 }) => (
              <button
                key={t1 + t2}
                type="button"
                className="btn btn-xs btn-outline"
                onClick={() => { setType1(t1); setType2(t2); }}
                style={{
                  background: type1 === t1 && type2 === t2 ? "var(--color-primary)" : "",
                  color: type1 === t1 && type2 === t2 ? "white" : "",
                  borderColor: type1 === t1 && type2 === t2 ? "var(--color-primary)" : "",
                }}
              >
                {t1} × {t2}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            style={{ marginTop: "0.75rem" }}
            onClick={() => setShowTypeEditor(false)}
          >
            Done ✓
          </button>
        </Panel>
      )}

      {/* ══ 2. Add Variants Toolbar ════════════════════════════════════ */}
      <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", flexShrink: 0 }}>
          Quick add:
        </span>
        {SIZE_PRESETS.map((group) => (
          <button
            key={group.label}
            type="button"
            className="btn btn-outline btn-xs"
            onClick={() => addQuickSizes(group.sizes)}
          >
            {group.label}
          </button>
        ))}
        <button
          type="button"
          className="btn btn-xs"
          style={{ background: "#7c3aed", color: "white", border: "none" }}
          onClick={() => { setShowMatrix((v) => !v); setShowCustom(false); }}
        >
          ⚡ Matrix
        </button>
        <button
          type="button"
          className="btn btn-xs"
          style={{ background: "var(--color-primary)", color: "white", border: "none" }}
          onClick={() => { setShowCustom((v) => !v); setShowMatrix(false); }}
        >
          ✨ Custom
        </button>
      </div>

      {/* ══ 3. Matrix Generator ════════════════════════════════════════ */}
      {showMatrix && (
        <Panel title={`⚡ Generate ${type1} × ${type2} Matrix`} color="#f5f3ff" border="#c4b5fd">
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
            Define values for each variation type. All combinations will be generated automatically.
            Leave <strong>{type2}</strong> blank to add {type1}-only rows.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6d28d9", display: "block", marginBottom: "0.3rem" }}>
                {type1} values <span style={{ color: "var(--color-danger)" }}>*</span>
              </label>
              <input
                className="input"
                placeholder={`e.g. XS, S, M, L, XL  or  36, 38, 40`}
                value={matrixAxis1}
                onChange={(e) => setMatrixAxis1(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generateMatrix()}
              />
            </div>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6d28d9", display: "block", marginBottom: "0.3rem" }}>
                {type2} values (optional)
              </label>
              <input
                className="input"
                placeholder={`e.g. White, Navy, Black`}
                value={matrixAxis2}
                onChange={(e) => setMatrixAxis2(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generateMatrix()}
              />
            </div>
          </div>

          {ax1Count > 0 && (
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.75rem", color: "#6d28d9", fontWeight: 600 }}>
              Will generate <strong>{matrixCount}</strong> variant{matrixCount !== 1 ? "s" : ""}
              {ax2Count > 0 ? ` (${ax1Count} ${type1} × ${ax2Count} ${type2})` : ""}
            </p>
          )}

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" className="btn btn-sm" style={{ background: "#7c3aed", color: "white", border: "none" }} onClick={generateMatrix}>
              ⚡ Generate {matrixCount > 0 ? `${matrixCount} rows` : ""}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShowMatrix(false); setMatrixAxis1(""); setMatrixAxis2(""); }}>
              Cancel
            </button>
          </div>
        </Panel>
      )}

      {/* ══ 4. Custom single-axis input ════════════════════════════════ */}
      {showCustom && (
        <Panel title={`✨ Add Custom ${type1} Values`} color="#f0f4ff" border="#c7d2fe">
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
            Enter any values separated by commas — they will be added as new rows.
          </p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <input
              className="input"
              style={{ flex: 1, minWidth: "200px" }}
              placeholder={`e.g. 36, 38, 40, 42  or  S/M, M/L`}
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomSizes()}
            />
            <button type="button" className="btn btn-primary btn-sm" onClick={addCustomSizes}>
              + Add Rows
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShowCustom(false); setCustomInput(""); }}>
              Cancel
            </button>
          </div>
        </Panel>
      )}

      {/* ══ 5. Bulk fill second axis ═══════════════════════════════════ */}
      {activeVariants.length > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", flexShrink: 0 }}>
            Fill {type2} for empty rows:
          </span>
          <input
            className="input"
            style={{ width: 140, padding: "0.35rem 0.625rem", fontSize: "0.8125rem" }}
            placeholder={`e.g. White`}
            value={bulkSecond}
            onChange={(e) => setBulkSecond(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyBulkSecond()}
          />
          <button type="button" className="btn btn-outline btn-xs" onClick={applyBulkSecond}>
            Apply to all
          </button>
        </div>
      )}

      {/* ══ 6. Variant table ═══════════════════════════════════════════ */}
      <div className="table-wrapper" style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius)" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>
                {type1} <span style={{ color: "var(--color-danger)" }}>*</span>
              </th>
              <th>{type2}</th>
              <th>Price Override (₹)</th>
              <th>School Comm. (%)</th>
              <th>
                Qty <span style={{ color: "var(--color-danger)" }}>*</span>
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {variants.map((row, idx) =>
              row._delete ? null : (
                <tr key={idx}>
                  <td>
                    <input
                      list={`sizes-${idx}`}
                      className="input"
                      style={{ minWidth: "90px" }}
                      placeholder={`e.g. M`}
                      value={row.size}
                      onChange={(e) => updateRow(idx, "size", e.target.value)}
                    />
                    <datalist id={`sizes-${idx}`}>
                      {ALL_COMMON_SIZES.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  </td>
                  <td>
                    <input
                      className="input"
                      style={{ minWidth: "90px" }}
                      placeholder="e.g. White"
                      value={row.color}
                      onChange={(e) => updateRow(idx, "color", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="0.01"
                      style={{ minWidth: "100px" }}
                      placeholder={basePrice || "0.00"}
                      value={row.price_override}
                      onChange={(e) => updateRow(idx, "price_override", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="0.01"
                      style={{ minWidth: "80px" }}
                      placeholder="%"
                      value={row.school_commission_percent}
                      onChange={(e) => updateRow(idx, "school_commission_percent", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      style={{ minWidth: "70px" }}
                      value={row.quantity}
                      onChange={(e) => updateRow(idx, "quantity", parseInt(e.target.value, 10) || 0)}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-xs btn-ghost"
                      style={{ color: "var(--color-danger)" }}
                      onClick={() => removeRow(idx)}
                      title="Remove"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ),
            )}
            {activeVariants.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "2rem 1.5rem", fontSize: "0.875rem" }}
                >
                  No variants yet — use the quick-add presets, <strong>⚡ Matrix</strong>, or <strong>+ Add Row</strong>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ══ 7. Footer actions ══════════════════════════════════════════ */}
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" className="btn btn-outline btn-sm" onClick={addRow}>
          + Add Row
        </button>
        {activeVariants.length > 0 && (
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center" }}>
            {activeVariants.length} variant{activeVariants.length !== 1 ? "s" : ""} •{" "}
            {activeVariants.reduce((s, v) => s + (v.quantity || 0), 0)} units total
          </span>
        )}
      </div>
    </div>
  );
}
