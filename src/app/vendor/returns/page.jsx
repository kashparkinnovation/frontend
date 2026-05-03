"use client";

import React, { useEffect, useState } from "react";
import apiClient from "@/lib/api";
import StatusBadge from "@/components/ui/StatusBadge";
import Drawer, { DrawerRow, DrawerSection } from "@/components/ui/Drawer";
import { useToast } from "@/context/ToastContext";

const STATUS_ACTIONS = ["approve", "reject", "complete"];

export default function VendorReturnsPage() {
  const { showToast } = useToast();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState("approve");
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = () => {
    setLoading(true);
    apiClient
      .get("/orders/returns/")
      .then((r) => setReturns(r.data.results ?? r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const openDrawer = (req) => {
    setSelected(req);
    setAction(
      req.status === "pending"
        ? "approve"
        : req.status === "approved"
          ? "complete"
          : "complete",
    );
    setAdminNotes(req.admin_notes || "");
  };

  const submitAction = async () => {
    if (!selected) return;
    setUpdating(true);
    try {
      const res = await apiClient.patch(`/orders/returns/${selected.id}/`, {
        action: action,
        admin_notes: adminNotes,
      });
      setReturns((prev) =>
        prev.map((r) => (r.id === selected.id ? res.data : r)),
      );
      setSelected(res.data);
      showToast(`Return marked as ${res.data.status}`, "success");
    } catch {
      showToast("Failed to update return request", "error");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Returns & Exchanges</h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Manage student requests for refunds or size replacements.
        </p>
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
        ) : returns.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">↩️</div>
            <p className="empty-state-title">No returns right now</p>
            <p className="empty-state-desc">
              When students request a return or exchange, it will appear here.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Student & School</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Requested Date</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((req) => (
                  <tr key={req.id} onClick={() => openDrawer(req)}>
                    <td>
                      <span
                        style={{ fontFamily: "monospace", fontWeight: 600 }}
                      >
                        {req.order_number}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{req.student_name}</div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {req.school_name}
                      </div>
                    </td>
                    <td>
                      {req.request_type === "exchange"
                        ? "🔄 Exchange"
                        : "💰 Return"}
                      {req.request_type === "exchange" && req.exchange_size && (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          Size: {req.exchange_size}
                        </div>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={req.status} />
                    </td>
                    <td
                      style={{
                        color: "var(--color-text-muted)",
                        fontSize: "0.8125rem",
                      }}
                    >
                      {new Date(req.created_at).toLocaleDateString("en-IN")}
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
        title="Review Request"
        subtitle={`Order ${selected?.order_number}`}
      >
        {selected && (
          <>
            <DrawerSection title="Customer Details" />
            <DrawerRow label="Student" value={selected.student_name} />
            <DrawerRow label="School" value={selected.school_name} />

            <DrawerSection title="Request Details" />
            <DrawerRow
              label="Type"
              value={
                <span
                  style={{ fontWeight: 600, color: "var(--color-primary)" }}
                >
                  {selected.request_type.toUpperCase()}
                </span>
              }
            />
            <DrawerRow
              label="Status"
              value={<StatusBadge status={selected.status} />}
            />

            {selected.request_type === "exchange" && (
              <>
                <DrawerRow
                  label="Requested Size"
                  value={selected.exchange_size || "—"}
                />
                <DrawerRow
                  label="Requested Color"
                  value={selected.exchange_color || "—"}
                />
              </>
            )}

            <div
              style={{
                background: "#f8fafc",
                padding: "1rem",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                margin: "1rem 0",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  marginBottom: "0.25rem",
                }}
              >
                Reason Provided:
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  color: "#334155",
                  whiteSpace: "pre-wrap",
                }}
              >
                {selected.reason}
              </p>
            </div>

            {selected.status !== "completed" &&
              selected.status !== "rejected" && (
                <>
                  <DrawerSection title="Process Request" />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                    }}
                  >
                    <select
                      className="select"
                      value={action}
                      onChange={(e) => setAction(e.target.value)}
                      style={{ marginBottom: 0 }}
                    >
                      <option value="approve">Approve Request</option>
                      <option value="reject">Reject Request</option>
                      {selected.status === "approved" && (
                        <option value="complete">Mark as Completed</option>
                      )}
                    </select>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.25rem",
                      }}
                    >
                      <label
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          color: "#334155",
                        }}
                      >
                        Admin Notes (Visible to Customer)
                      </label>
                      <textarea
                        className="input"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="e.g. Return approved. Please drop the item at the school office."
                        style={{ minHeight: "80px", resize: "vertical" }}
                      />
                    </div>

                    <button
                      className="btn btn-primary"
                      onClick={submitAction}
                      disabled={updating}
                    >
                      {updating ? (
                        <>
                          <span
                            className="spinner"
                            style={{ width: 14, height: 14 }}
                          />{" "}
                          Processing…
                        </>
                      ) : (
                        "Submit Action"
                      )}
                    </button>
                  </div>
                </>
              )}

            {(selected.status === "completed" ||
              selected.status === "rejected") &&
              selected.admin_notes && (
                <div
                  style={{
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    padding: "1rem",
                    borderRadius: "8px",
                    marginTop: "1rem",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      color: "#92400e",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Your Internal Note:
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.875rem",
                      color: "#92400e",
                    }}
                  >
                    {selected.admin_notes}
                  </p>
                </div>
              )}
          </>
        )}
      </Drawer>
    </div>
  );
}
