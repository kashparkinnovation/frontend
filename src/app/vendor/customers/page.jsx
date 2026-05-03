"use client";

import React, { useEffect, useState } from "react";
import apiClient from "@/lib/api";
import Drawer, { DrawerRow, DrawerSection } from "@/components/ui/Drawer";
import { useToast } from "@/context/ToastContext";

export default function VendorCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    apiClient
      .get("/vendors/customers/")
      .then((r) => setCustomers(r.data))
      .catch(() => showToast("Failed to load customers", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const fmt = (n) => `₹${n.toLocaleString("en-IN")}`;

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.schools.some((s) => s.toLowerCase().includes(q))
    );
  });

  const totalRevenue = customers.reduce((s, c) => s + c.total_spend, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p
            style={{
              color: "var(--color-text-secondary)",
              fontSize: "0.875rem",
              marginTop: "0.25rem",
            }}
          >
            {customers.length} customers · {fmt(totalRevenue)} total spend
          </p>
        </div>
      </div>

      <div className="filters-row">
        <div className="search-bar" style={{ flex: 1, maxWidth: 400 }}>
          <span>🔍</span>
          <input
            placeholder="Search by name, email or school…"
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
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p className="empty-state-title">
              {search ? "No customers match your search" : "No customers yet"}
            </p>
            <p className="empty-state-desc">
              Customers will appear here once they place orders
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>School(s)</th>
                  <th>Orders</th>
                  <th>Total Spend</th>
                  <th>Last Order</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} onClick={() => setSelected(c)}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td style={{ color: "var(--color-text-secondary)" }}>
                      {c.email}
                    </td>
                    <td
                      style={{
                        color: "var(--color-text-muted)",
                        fontSize: "0.8rem",
                      }}
                    >
                      {c.schools.join(", ") || "—"}
                    </td>
                    <td style={{ fontWeight: 600, textAlign: "center" }}>
                      {c.order_count}
                    </td>
                    <td
                      style={{ fontWeight: 700, color: "var(--color-primary)" }}
                    >
                      {fmt(c.total_spend)}
                    </td>
                    <td
                      style={{
                        color: "var(--color-text-muted)",
                        fontSize: "0.8rem",
                      }}
                    >
                      {c.last_order
                        ? new Date(c.last_order).toLocaleDateString("en-IN")
                        : "—"}
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
        title={selected?.name ?? ""}
        subtitle={selected?.email}
      >
        {selected && (
          <>
            <DrawerSection title="Contact Info" />
            <DrawerRow label="Full Name" value={selected.name} />
            <DrawerRow label="Email" value={selected.email} />
            <DrawerRow label="Phone" value={selected.phone || "—"} />

            <DrawerSection title="Purchase History" />
            <DrawerRow
              label="Total Orders"
              value={<strong>{selected.order_count}</strong>}
            />
            <DrawerRow
              label="Total Spend"
              value={
                <strong
                  style={{ color: "var(--color-primary)", fontSize: "1.1rem" }}
                >
                  {fmt(selected.total_spend)}
                </strong>
              }
            />
            <DrawerRow
              label="Last Order"
              value={
                selected.last_order
                  ? new Date(selected.last_order).toLocaleString("en-IN")
                  : "—"
              }
            />

            <DrawerSection title="Schools" />
            {selected.schools.length === 0 ? (
              <p
                style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  color: "var(--color-text-muted)",
                }}
              >
                —
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.35rem",
                }}
              >
                {selected.schools.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: "0.875rem",
                      padding: "0.4rem 0.625rem",
                      background: "#f8fafc",
                      borderRadius: "6px",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    🏫 {s}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}
