"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useStudent } from "@/context/StudentContext";

export default function NewStudentPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { triggerRefresh } = useStudent();
  const [schools, setSchools] = useState([]);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    student_name: "",
    gender: "male",
    class_name: "",
    section: "",
    roll_number: "",
    student_id: "",
    school: "",
  });

  useEffect(() => {
    const API_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    fetch(`${API_URL}/schools/public/`)
      .then((r) => r.json())
      .then((d) => setSchools(Array.isArray(d) ? d : (d.results ?? [])))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.school) {
      showToast("Please select a school", "error");
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (file) formData.append("id_card_attachment", file);
      await apiClient.post("/students/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showToast(
        "Student profile created & submitted for verification!",
        "success",
      );
      triggerRefresh();
      router.push("/store/students");
    } catch (err) {
      const msg =
        Object.values(err?.response?.data || {})
          .flat()
          .join(" ") || "Failed to create student.";
      showToast(String(msg), "error");
    } finally {
      setSaving(false);
    }
  };

  const inp = (field, label, placeholder, required = false) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <label
        style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#374151" }}
      >
        {label}
        {required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
      </label>
      <input
        required={required}
        value={form[field]}
        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
        placeholder={placeholder}
        style={{
          padding: "0.625rem 0.875rem",
          border: "1.5px solid #e2e8f0",
          borderRadius: "8px",
          fontSize: "0.9375rem",
          outline: "none",
          fontFamily: "inherit",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#4f46e5")}
        onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
      />
    </div>
  );

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <Link
          href="/store/students"
          style={{
            fontSize: "0.875rem",
            color: "#94a3b8",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            marginBottom: "0.875rem",
          }}
        >
          ← Back to Students
        </Link>
        <h1
          style={{
            fontSize: "1.625rem",
            fontWeight: 800,
            margin: "0 0 0.25rem",
            letterSpacing: "-0.02em",
          }}
        >
          Add Student Profile
        </h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: "0.9375rem" }}>
          Enter your child&apos;s school details to create their profile.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        {/* School selector */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}
        >
          <label
            style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#374151" }}
          >
            School <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <select
            required
            value={form.school}
            onChange={(e) => setForm({ ...form, school: e.target.value })}
            style={{
              padding: "0.625rem 0.875rem",
              border: "1.5px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "0.9375rem",
              outline: "none",
              fontFamily: "inherit",
              background: "white",
            }}
          >
            <option value="">— Select your school —</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.city})
              </option>
            ))}
          </select>
          <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
            Only approved schools are listed.{" "}
            <Link href="/browse" style={{ color: "#4f46e5" }}>
              Browse all schools →
            </Link>
          </span>
        </div>

        {inp("student_name", "Student's Full Name", "e.g., Priya Sharma", true)}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.375rem",
            }}
          >
            <label
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "#374151",
              }}
            >
              Gender <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <select
              required
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              style={{
                padding: "0.625rem 0.875rem",
                border: "1.5px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "0.9375rem",
                outline: "none",
                fontFamily: "inherit",
                background: "white",
              }}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.375rem",
            }}
          >
            <label
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "#374151",
              }}
            >
              Class / Grade <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <select
              required
              value={form.class_name}
              onChange={(e) => setForm({ ...form, class_name: e.target.value })}
              style={{
                padding: "0.625rem 0.875rem",
                border: "1.5px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "0.9375rem",
                outline: "none",
                fontFamily: "inherit",
                background: "white",
              }}
            >
              <option value="">— Select Class —</option>
              {[
                "LKG",
                "UKG",
                "I",
                "II",
                "III",
                "IV",
                "V",
                "VI",
                "VII",
                "VIII",
                "IX",
                "X",
                "XI",
                "XII",
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
          }}
        >
          {inp("section", "Section", "e.g., A, B")}
          {inp("roll_number", "Roll Number", "e.g., 42", true)}
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}
        >
          {inp("student_id", "Student ID (optional)", "e.g., STU001")}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.375rem",
            marginTop: "0.5rem",
          }}
        >
          <label
            style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#374151" }}
          >
            Student ID Attachment (For Verification)
          </label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{
              padding: "0.625rem",
              border: "1.5px dashed #a5b4fc",
              borderRadius: "8px",
              background: "#eef2ff",
            }}
          />

          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
            Optional: Take a picture of the ID card or upload it from gallery.
          </span>
        </div>

        <div
          style={{
            background: "#f8fafc",
            borderRadius: "10px",
            padding: "0.875rem",
            fontSize: "0.875rem",
            color: "#334155",
            lineHeight: 1.5,
            border: "1px solid #e2e8f0",
          }}
        >
          We will automatically submit the ID Attachment to your school for
          verification right now!
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "0.875rem",
            background: "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
            fontFamily: "inherit",
          }}
        >
          {saving ? "Registering..." : "Create & Submit for Verification"}
        </button>
      </form>
    </div>
  );
}
