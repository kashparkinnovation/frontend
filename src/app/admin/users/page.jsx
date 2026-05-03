"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  // Create / Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  // Form fields
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [perms, setPerms] = useState({
    can_manage_vendors: false,
    can_manage_schools: false,
    can_manage_students: false,
    can_manage_content: false,
    can_manage_reports: false,
  });

  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAdmins();
  }, [search]);

  const fetchAdmins = () => {
    const token = Cookies.get("access_token");
    const qs = search ? `?search=${search}` : "";
    fetch(`${API_URL}/auth/admins/${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : (data.results ?? []));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const openNew = () => {
    setEditingId(null);
    setEmail("");
    setFirstName("");
    setLastName("");
    setPassword("");
    setPerms({
      can_manage_vendors: false,
      can_manage_schools: false,
      can_manage_students: false,
      can_manage_content: false,
      can_manage_reports: false,
    });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditingId(u.id);
    setEmail(u.email);
    setFirstName(u.first_name);
    setLastName(u.last_name);
    setPassword("");
    setPerms({
      can_manage_vendors: u.can_manage_vendors,
      can_manage_schools: u.can_manage_schools,
      can_manage_students: u.can_manage_students,
      can_manage_content: u.can_manage_content,
      can_manage_reports: u.can_manage_reports,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const token = Cookies.get("access_token");
    const payload = {
      email,
      first_name: firstName,
      last_name: lastName,
      ...perms,
    };
    if (password) payload.password = password;

    const url = editingId
      ? `${API_URL}/auth/admins/${editingId}/`
      : `${API_URL}/auth/admins/`;
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowModal(false);
        fetchAdmins();
      } else {
        const errData = await res.json();
        alert("Error saving Admin: " + JSON.stringify(errData));
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.875rem", fontWeight: 800 }}>
          Admin Profiles & Roles
        </h1>
        <button
          onClick={openNew}
          style={{
            background: "#4f46e5",
            color: "white",
            padding: "0.625rem 1.25rem",
            borderRadius: "8px",
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + Add Sub-Admin
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          value={search}
          placeholder="Search sub-admins..."
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "0.625rem",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            flex: 1,
            minWidth: "200px",
            maxWidth: "300px",
          }}
        />
      </div>

      {loading ? (
        <p>Loading admins...</p>
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
                <th
                  style={{
                    padding: "1rem",
                    color: "#64748b",
                    fontSize: "0.875rem",
                  }}
                >
                  Name
                </th>
                <th
                  style={{
                    padding: "1rem",
                    color: "#64748b",
                    fontSize: "0.875rem",
                  }}
                >
                  Email
                </th>
                <th
                  style={{
                    padding: "1rem",
                    color: "#64748b",
                    fontSize: "0.875rem",
                  }}
                >
                  Permissions
                </th>
                <th
                  style={{
                    padding: "1rem",
                    color: "#64748b",
                    fontSize: "0.875rem",
                    textAlign: "right",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "1rem", fontWeight: 600 }}>
                    {u.first_name} {u.last_name}
                  </td>
                  <td style={{ padding: "1rem", color: "#64748b" }}>
                    {u.email}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      display: "flex",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    {u.can_manage_schools && (
                      <span
                        style={{
                          padding: "0.2rem 0.5rem",
                          background: "#eef2ff",
                          color: "#4f46e5",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                        }}
                      >
                        Schools
                      </span>
                    )}
                    {u.can_manage_vendors && (
                      <span
                        style={{
                          padding: "0.2rem 0.5rem",
                          background: "#eef2ff",
                          color: "#4f46e5",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                        }}
                      >
                        Vendors
                      </span>
                    )}
                    {u.can_manage_students && (
                      <span
                        style={{
                          padding: "0.2rem 0.5rem",
                          background: "#eef2ff",
                          color: "#4f46e5",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                        }}
                      >
                        Students
                      </span>
                    )}
                    {u.can_manage_content && (
                      <span
                        style={{
                          padding: "0.2rem 0.5rem",
                          background: "#eef2ff",
                          color: "#4f46e5",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                        }}
                      >
                        Content
                      </span>
                    )}
                    {u.can_manage_reports && (
                      <span
                        style={{
                          padding: "0.2rem 0.5rem",
                          background: "#eef2ff",
                          color: "#4f46e5",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                        }}
                      >
                        Reports
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <button
                      onClick={() => openEdit(u)}
                      style={{
                        color: "#4f46e5",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Edit Access
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "16px",
              width: "100%",
              maxWidth: 500,
            }}
          >
            <h2 style={{ margin: "0 0 1.5rem", fontSize: "1.5rem" }}>
              {editingId ? "Edit Sub-Admin" : "Create Sub-Admin"}
            </h2>
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <input
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  style={{
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                />
                <input
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  style={{
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                />
              </div>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              />
              <input
                type="password"
                placeholder={
                  editingId ? "Reset Password (Optional)" : "Password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!editingId}
                style={{
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              />

              <div
                style={{
                  marginTop: "1rem",
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: "1rem",
                }}
              >
                <h4 style={{ margin: "0 0 1rem", color: "#0f172a" }}>
                  Role Permissions
                </h4>
                {Object.keys(perms).map((key) => (
                  <label
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "0.5rem",
                      color: "#475569",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={perms[key]}
                      onChange={(e) =>
                        setPerms({ ...perms, [key]: e.target.checked })
                      }
                      style={{ width: 18, height: 18 }}
                    />
                    {key.replace("can_manage_", "Manage ").replace("_", " ")}
                  </label>
                ))}
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    background: "#e2e8f0",
                    color: "#475569",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    background: "#4f46e5",
                    color: "white",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: 600,
                  }}
                >
                  {saving ? "Saving..." : "Save Sub-Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
