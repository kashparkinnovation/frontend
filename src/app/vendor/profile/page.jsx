"use client";

import React, { useEffect, useState } from "react";
import apiClient from "@/lib/api";
import { useToast } from "@/context/ToastContext";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
  "http://localhost:8000";

export default function VendorProfilePage() {
  const { toast } = useToast();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [form, setForm] = useState({
    business_name: "",
    gst_number: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    apiClient
      .get("/vendors/profile/")
      .then((r) => {
        const v = r.data;
        setVendor(v);
        setForm({
          business_name: v.business_name,
          gst_number: v.gst_number,
          address: v.address,
          city: v.city,
          state: v.state,
          pincode: v.pincode,
        });
        if (v.logo)
          setLogoPreview(
            v.logo.startsWith("http") ? v.logo : `${API_BASE}${v.logo}`,
          );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (logoFile) fd.append("logo", logoFile);
      const r = await apiClient.patch("/vendors/profile/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setVendor(r.data);
      toast("Profile updated successfully!", "success");
    } catch {
      toast("Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div
        style={{ display: "flex", justifyContent: "center", padding: "4rem" }}
      >
        <span
          className="spinner dark"
          style={{ width: "2rem", height: "2rem" }}
        />
      </div>
    );

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div className="page-header">
        <h1 className="page-title">Vendor Profile</h1>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span
            className={`badge ${vendor?.is_approved ? "badge-success" : "badge-warning"}`}
          >
            {vendor?.is_approved ? "✓ Approved" : "⏳ Pending Approval"}
          </span>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSave}>
          {/* Logo */}
          <div
            className="form-group"
            style={{ marginBottom: "1.5rem", alignItems: "flex-start" }}
          >
            <label className="form-label">Business Logo</label>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "var(--radius-lg)",
                  border: "2px dashed var(--color-border)",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                  background: "var(--color-bg)",
                }}
              >
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  "🏢"
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogo}
                  id="logo-upload"
                  style={{ display: "none" }}
                />
                <label
                  htmlFor="logo-upload"
                  className="btn btn-outline btn-sm"
                  style={{ cursor: "pointer" }}
                >
                  Change Logo
                </label>
              </div>
            </div>
          </div>

          <div className="form-grid" style={{ marginBottom: "1.25rem" }}>
            <div className="form-group">
              <label className="form-label">
                Business Name <span className="required">*</span>
              </label>
              <input
                className="input"
                name="business_name"
                value={form.business_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">GST Number</label>
              <input
                className="input"
                name="gst_number"
                value={form.gst_number}
                onChange={handleChange}
                placeholder="22AAAAA0000A1Z5"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "1.25rem" }}>
            <label className="form-label">Business Address</label>
            <textarea
              className="textarea"
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={2}
              style={{ minHeight: 70 }}
            />
          </div>

          <div className="form-grid" style={{ marginBottom: "1.5rem" }}>
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                className="input"
                name="city"
                value={form.city}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input
                className="input"
                name="state"
                value={form.state}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Pincode</label>
              <input
                className="input"
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                maxLength={6}
              />
            </div>
          </div>

          {/* Account info (read-only) */}
          <hr className="divider" />
          <p className="section-heading">Account Information</p>
          <div className="form-grid" style={{ marginBottom: "1.5rem" }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="input"
                value={vendor?.user_email ?? ""}
                readOnly
                style={{ background: "var(--color-bg)", cursor: "not-allowed" }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="input"
                value={vendor?.user_name ?? ""}
                readOnly
                style={{ background: "var(--color-bg)", cursor: "not-allowed" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving && <span className="spinner" />}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
