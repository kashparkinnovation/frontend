"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("access_token");
    fetch(`${API_URL}/audit/logs/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) =>
        setLogs(Array.isArray(data) ? data : (data.results ?? [])),
      )
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ margin: "0 0 2rem", fontSize: "1.875rem", fontWeight: 800 }}>
        System Audit Logs
      </h1>
      {loading ? (
        <p>Loading...</p>
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
                <th style={{ padding: "1rem", color: "#64748b" }}>Action</th>
                <th style={{ padding: "1rem", color: "#64748b" }}>UserEmail</th>
                <th style={{ padding: "1rem", color: "#64748b" }}>Role</th>
                <th style={{ padding: "1rem", color: "#64748b" }}>Resource</th>
                <th style={{ padding: "1rem", color: "#64748b" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "1rem", fontWeight: 600 }}>
                    {log.action}
                  </td>
                  <td style={{ padding: "1rem", color: "#64748b" }}>
                    {log.user_email || "System"}
                  </td>
                  <td style={{ padding: "1rem", color: "#64748b" }}>
                    {log.user_role}
                  </td>
                  <td style={{ padding: "1rem", color: "#64748b" }}>
                    {log.resource_path}
                  </td>
                  <td style={{ padding: "1rem", color: "#64748b" }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{ padding: "2rem", textAlign: "center" }}
                  >
                    No audit logs found.
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
