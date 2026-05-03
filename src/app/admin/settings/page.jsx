"use client";

import React, { useEffect, useState } from "react";
import apiClient from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function PlatformSettingsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [commission, setCommission] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = () => {
    setLoading(true);
    apiClient
      .get("/admin/settings/")
      .then((r) => {
        setSettings(r.data);
        setCommission(r.data.platform_commission_percent);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiClient.put("/admin/settings/", {
        platform_commission_percent: commission,
      });
      setSettings(res.data);
      showToast("Settings saved successfully", "success");
    } catch {
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Platform Settings</h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Configure global financial variables and platform rules.
        </p>
      </div>

      <div className="card" style={{ maxWidth: "600px" }}>
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
        ) : (
          <form
            onSubmit={handleSave}
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                  color: "#1e293b",
                }}
              >
                Platform Commission Percentage (%)
              </label>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#64748b",
                  marginBottom: "0.75rem",
                }}
              >
                The cut the platform takes from every successfully delivered
                order. This is deducted from the vendor&apos;s total payout.
              </p>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="input"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  required
                  style={{ width: "150px" }}
                />

                <span style={{ fontWeight: 600, color: "#64748b" }}>%</span>
              </div>
            </div>

            {settings && settings.updated_at && (
              <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                Last updated on{" "}
                {new Date(settings.updated_at).toLocaleString("en-IN")}
              </div>
            )}

            <div
              style={{
                borderTop: "1px solid #e2e8f0",
                paddingTop: "1.5rem",
                marginTop: "0.5rem",
              }}
            >
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
