"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import apiClient from "@/lib/api";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  // Personal Info Form State
  const [personalForm, setPersonalForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });
  const [savingPersonal, setSavingPersonal] = useState(false);

  // Security Form State
  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setPersonalForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handlePersonalSubmit = async (e) => {
    e.preventDefault();
    setSavingPersonal(true);
    try {
      const { data } = await apiClient.patch("/auth/me/", personalForm);
      updateUser(data);
      showToast("Profile updated successfully!", "success");
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to update profile.";
      showToast(msg, "error");
    } finally {
      setSavingPersonal(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showToast("New passwords do not match.", "error");
      return;
    }
    setSavingPassword(true);
    try {
      await apiClient.post("/auth/change-password/", {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      showToast("Password changed successfully!", "success");
      setPasswordForm({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to change password.";
      showToast(msg, "error");
    } finally {
      setSavingPassword(false);
    }
  };

  const inputStyle = {
    padding: "0.625rem 0.875rem",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "0.9375rem",
    outline: "none",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: "0.8125rem",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "0.375rem",
    display: "block",
  };

  const sectionStyle = {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "2rem",
    marginBottom: "2rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1
        style={{
          fontSize: "1.875rem",
          fontWeight: 800,
          color: "#0f172a",
          marginBottom: "2rem",
        }}
      >
        Account Settings
      </h1>

      {/* Personal Information */}
      <div style={sectionStyle}>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#1e293b",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span>👤</span> Personal Information
        </h2>
        <form
          onSubmit={handlePersonalSubmit}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.25rem",
          }}
        >
          <div>
            <label style={labelStyle}>First Name</label>
            <input
              style={inputStyle}
              value={personalForm.first_name}
              onChange={(e) =>
                setPersonalForm({ ...personalForm, first_name: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Last Name</label>
            <input
              style={inputStyle}
              value={personalForm.last_name}
              onChange={(e) =>
                setPersonalForm({ ...personalForm, last_name: e.target.value })
              }
              required
            />
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              style={inputStyle}
              value={personalForm.email}
              onChange={(e) =>
                setPersonalForm({ ...personalForm, email: e.target.value })
              }
              required
            />
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label style={labelStyle}>Phone Number</label>
            <input
              type="tel"
              style={inputStyle}
              value={personalForm.phone}
              onChange={(e) =>
                setPersonalForm({ ...personalForm, phone: e.target.value })
              }
              required
            />
          </div>
          <div style={{ gridColumn: "span 2", marginTop: "0.5rem" }}>
            <button
              type="submit"
              disabled={savingPersonal}
              style={{
                background: "#4f46e5",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "0.75rem 1.5rem",
                fontWeight: 600,
                cursor: savingPersonal ? "not-allowed" : "pointer",
                opacity: savingPersonal ? 0.7 : 1,
              }}
            >
              {savingPersonal ? "Saving..." : "Update Profile"}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div style={sectionStyle}>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#1e293b",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span>🔒</span> Security
        </h2>
        <form
          onSubmit={handlePasswordSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          <div>
            <label style={labelStyle}>Current Password</label>
            <input
              type="password"
              style={inputStyle}
              value={passwordForm.old_password}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  old_password: e.target.value,
                })
              }
              required
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.25rem",
            }}
          >
            <div>
              <label style={labelStyle}>New Password</label>
              <input
                type="password"
                style={inputStyle}
                value={passwordForm.new_password}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    new_password: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Confirm New Password</label>
              <input
                type="password"
                style={inputStyle}
                value={passwordForm.confirm_password}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirm_password: e.target.value,
                  })
                }
                required
              />
            </div>
          </div>
          <div style={{ marginTop: "0.5rem" }}>
            <button
              type="submit"
              disabled={savingPassword}
              style={{
                background: "#1e293b",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "0.75rem 1.5rem",
                fontWeight: 600,
                cursor: savingPassword ? "not-allowed" : "pointer",
                opacity: savingPassword ? 0.7 : 1,
              }}
            >
              {savingPassword ? "Changing..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
