"use client";

import React, { useEffect, useState } from "react";
import apiClient from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function SchoolVendorRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/schools/vendor-change-requests/");
      setRequests(Array.isArray(data) ? data : (data.results ?? []));
    } catch (err) {
      showToast("Failed to load requests", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    if (
      !confirm(`Are you sure you want to ${action} this vendor reassignment?`)
    )
      return;
    setProcessingId(id);
    try {
      await apiClient.patch(`/schools/vendor-change-requests/${id}/approve/`, {
        action,
      });
      showToast(`Vendor assignment ${action}ed successfully!`, "success");
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.detail || "Error applying choice", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const pending = requests.filter((r) => r.status === "pending");
  const history = requests.filter((r) => r.status !== "pending");

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendor Reassignment Requests</h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Review administrative requests to adjust your school&apos;s official
            uniform partner.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            marginBottom: "1.25rem",
            color: "#0f172a",
          }}
        >
          Pending Approvals
        </h2>
        {loading ? (
          <p>Loading requests...</p>
        ) : pending.length === 0 ? (
          <p style={{ color: "#64748b", margin: 0 }}>
            No pending vendor assignment requests.
          </p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {pending.map((r) => (
              <div
                key={r.id}
                style={{
                  padding: "1.25rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "12px",
                  background: "#f8fafc",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "#1e293b",
                    }}
                  >
                    Reassign to: {r.new_vendor_name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "#64748b",
                      marginTop: "0.25rem",
                    }}
                  >
                    Current Vendor: {r.old_vendor_name || "None"}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#94a3b8",
                      marginTop: "0.25rem",
                    }}
                  >
                    Requested on:{" "}
                    {new Date(r.created_at).toLocaleDateString("en-IN")}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    onClick={() => handleAction(r.id, "approve")}
                    disabled={processingId !== null}
                    className="btn btn-primary"
                    style={{ background: "#22c55e", borderColor: "#22c55e" }}
                  >
                    {processingId === r.id ? "Wait..." : "Approve"}
                  </button>
                  <button
                    onClick={() => handleAction(r.id, "reject")}
                    disabled={processingId !== null}
                    className="btn btn-outline"
                    style={{ borderColor: "#ef4444", color: "#ef4444" }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2
          style={{
            fontSize: "1.125rem",
            fontWeight: 700,
            marginBottom: "1.25rem",
            color: "#0f172a",
          }}
        >
          Request History
        </h2>
        {loading ? (
          <p>Loading history...</p>
        ) : history.length === 0 ? (
          <p style={{ color: "#64748b", margin: 0 }}>
            No past requests logged.
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>New Vendor</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.new_vendor_name}</td>
                    <td>
                      <span
                        style={{
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          background:
                            r.status === "approved" ? "#dcfce7" : "#fee2e2",
                          color:
                            r.status === "approved" ? "#15803d" : "#991b1b",
                          textTransform: "capitalize",
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                      {new Date(r.created_at).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
