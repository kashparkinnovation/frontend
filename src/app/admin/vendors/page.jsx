"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import apiClient from "@/lib/api";
import Drawer, { DrawerRow, DrawerSection } from "@/components/ui/Drawer";

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  // Create state
  const [showCreate, setShowCreate] = useState(false);
  const [schools, setSchools] = useState([]);
  const [createData, setCreateData] = useState({
    business_name: "",
    gst_number: "",
    vendor_email: "",
    vendor_password: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    school_id: "",
  });

  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchVendors();
    apiClient
      .get("/schools/")
      .then(({ data }) =>
        setSchools(Array.isArray(data) ? data : (data.results ?? [])),
      )
      .catch(console.error);
  }, []);

  const fetchVendors = React.useCallback(() => {
    setLoading(true);
    const qs = search ? `?search=${search}` : "";
    apiClient
      .get(`/admin/vendors/${qs}`)
      .then(({ data }) =>
        setVendors(Array.isArray(data) ? data : (data.results ?? [])),
      )
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVendors();
    }, 400);
    return () => clearTimeout(timer);
  }, [search, fetchVendors]);

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post("/admin/vendors/admin-create/", createData);
      alert("Vendor created and assigned successfully!");
      setShowCreate(false);
      setCreateData({
        business_name: "",
        gst_number: "",
        vendor_email: "",
        vendor_password: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        school_id: "",
      });
      fetchVendors();
    } catch (err) {
      alert("Error creating vendor.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, approve, e) => {
    if (e) e.stopPropagation();
    try {
      await apiClient.patch(`/admin/vendors/${id}/approve/`, {
        is_approved: approve,
      });
      fetchVendors();
      if (selected && selected.id === id) {
        setSelected({ ...selected, is_approved: approve });
      }
    } catch (err) {
      alert("Error updating status");
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      const { data: updated } = await apiClient.patch(
        `/admin/vendors/${selected.id}/`,
        editData,
      );
      setSelected(updated);
      fetchVendors();
      alert("Vendor updated successfully");
    } catch (err) {
      alert("Error saving vendor");
    } finally {
      setSaving(false);
    }
  };

  const handleDelegateLogin = async () => {
    if (!selected) return;
    if (
      !confirm(
        `Are you sure you want to log in as ${selected.business_name}? You will need to fully log out to return to the admin panel.`,
      )
    )
      return;
    try {
      const { data } = await apiClient.post("/auth/delegate-access/", {
        user_id: selected.user,
      });
      const token = Cookies.get("access_token");
      // Save admin tokens before overriding
      Cookies.set("admin_access_token", token || "", { expires: 1, path: "/" });
      const currentRefresh = Cookies.get("refresh_token");
      if (currentRefresh)
        Cookies.set("admin_refresh_token", currentRefresh, {
          expires: 7,
          path: "/",
        });
      const currentUser = Cookies.get("user");
      if (currentUser)
        Cookies.set("admin_user", currentUser, { expires: 1, path: "/" });
      Cookies.set("access_token", data.access, { expires: 1, path: "/" });
      Cookies.set("refresh_token", data.refresh, { expires: 7, path: "/" });
      Cookies.set("user", JSON.stringify(data.user), { expires: 7, path: "/" });
      window.location.href = "/vendor";
    } catch (err) {
      alert("Delegate login failed");
    }
  };

  const handleToggleUserActive = async () => {
    if (!selected?.user) return;
    try {
      await apiClient.patch(`/auth/users/${selected.user}/toggle-active/`);
      alert("Vendor user active status toggled successfully.");
    } catch (err) {
      alert("Failed to toggle user active status.");
    }
  };

  const openDrawer = (v) => {
    setSelected(v);
    setEditData({
      business_name: v.business_name,
      gst_number: v.gst_number || "",
      address: v.address || "",
      city: v.city || "",
      state: v.state || "",
      pincode: v.pincode || "",
    });
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.875rem", fontWeight: 800 }}>
          Vendor Management
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            background: "#4f46e5",
            color: "white",
            padding: "0.625rem 1.25rem",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          + Add New Vendor
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
          placeholder="Search vendors..."
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "0.625rem",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            flex: 1,
            minWidth: "200px",
            maxWidth: "300px",
          }}
        />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : vendors.length === 0 ? (
        <div
          style={{
            background: "white",
            padding: "3rem",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#64748b" }}>No vendors registered yet.</p>
        </div>
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
                  Business Name
                </th>
                <th
                  style={{
                    padding: "1rem",
                    color: "#64748b",
                    fontSize: "0.875rem",
                  }}
                >
                  GST
                </th>
                <th
                  style={{
                    padding: "1rem",
                    color: "#64748b",
                    fontSize: "0.875rem",
                  }}
                >
                  City
                </th>
                <th
                  style={{
                    padding: "1rem",
                    color: "#64748b",
                    fontSize: "0.875rem",
                  }}
                >
                  Status
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
              {vendors.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => openDrawer(v)}
                  style={{
                    borderBottom: "1px solid #e2e8f0",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f8fafc")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <td style={{ padding: "1rem" }}>
                    <div style={{ fontWeight: 600 }}>{v.business_name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                      {v.user_email}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      color: "#64748b",
                      fontSize: "0.875rem",
                      fontFamily: "monospace",
                    }}
                  >
                    {v.gst_number || "—"}
                  </td>
                  <td style={{ padding: "1rem", color: "#64748b" }}>
                    {v.city || "—"}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        padding: "0.2rem 0.6rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        background: v.is_approved ? "#dcfce7" : "#fef9c3",
                        color: v.is_approved ? "#166534" : "#854d0e",
                      }}
                    >
                      {v.is_approved ? "APPROVED" : "PENDING"}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    {!v.is_approved && (
                      <button
                        onClick={(e) => updateStatus(v.id, true, e)}
                        style={{
                          background: "#4f46e5",
                          color: "white",
                          padding: "0.4rem 0.8rem",
                          borderRadius: "6px",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                        }}
                      >
                        Approve
                      </button>
                    )}
                    {v.is_approved && (
                      <button
                        onClick={(e) => updateStatus(v.id, false, e)}
                        style={{
                          background: "#ef4444",
                          color: "white",
                          padding: "0.4rem 0.8rem",
                          borderRadius: "6px",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                        }}
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.business_name || "Vendor Details"}
      >
        {selected && (
          <form onSubmit={handleSaveEdit}>
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                marginBottom: "1.5rem",
                flexWrap: "wrap",
              }}
            >
              {!selected.is_approved && (
                <button
                  type="button"
                  onClick={() => updateStatus(selected.id, true)}
                  style={{
                    padding: "0.625rem 1rem",
                    background: "#22c55e",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 600,
                    cursor: "pointer",
                    flex: 1,
                  }}
                >
                  Approve Vendor
                </button>
              )}
              {selected.is_approved && (
                <button
                  type="button"
                  onClick={() => updateStatus(selected.id, false)}
                  style={{
                    padding: "0.625rem 1rem",
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 600,
                    cursor: "pointer",
                    flex: 1,
                  }}
                >
                  Revoke Access
                </button>
              )}
              <button
                type="button"
                onClick={handleDelegateLogin}
                style={{
                  padding: "0.625rem 1rem",
                  background: "#0f172a",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer",
                  flex: 1,
                }}
              >
                Login As Vendor ⚡
              </button>
              <button
                type="button"
                onClick={handleToggleUserActive}
                style={{
                  padding: "0.625rem 1rem",
                  background: "#f59e0b",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer",
                  flex: 1,
                }}
              >
                Toggle Active Status
              </button>
            </div>

            <DrawerSection title="Edit Details" />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                marginBottom: "1.5rem",
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
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  Business Name
                </label>
                <input
                  type="text"
                  value={editData.business_name || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, business_name: e.target.value })
                  }
                  style={{
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                  required
                />
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
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  GST Number
                </label>
                <input
                  type="text"
                  value={editData.gst_number || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, gst_number: e.target.value })
                  }
                  style={{
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontFamily: "monospace",
                  }}
                />
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
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  Address
                </label>
                <input
                  type="text"
                  value={editData.address || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, address: e.target.value })
                  }
                  style={{
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                />
              </div>
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
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#475569",
                    }}
                  >
                    City
                  </label>
                  <input
                    type="text"
                    value={editData.city || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, city: e.target.value })
                    }
                    style={{
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                    }}
                  />
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
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#475569",
                    }}
                  >
                    State
                  </label>
                  <input
                    type="text"
                    value={editData.state || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, state: e.target.value })
                    }
                    style={{
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                    }}
                  />
                </div>
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
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  Pincode
                </label>
                <input
                  type="text"
                  value={editData.pincode || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, pincode: e.target.value })
                  }
                  style={{
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 1,
                  padding: "0.875rem",
                  background: "#4f46e5",
                  color: "white",
                  borderRadius: "8px",
                  border: "none",
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>

            <DrawerSection title="Account Information" />
            <DrawerRow label="Admin Name" value={selected.user_name} />
            <DrawerRow label="Admin Email" value={selected.user_email} />
            <DrawerRow
              label="Registered Date"
              value={new Date(selected.created_at).toLocaleDateString()}
            />
          </form>
        )}
      </Drawer>

      {showCreate && (
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
              borderRadius: "12px",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
                Create New Vendor
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                }}
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={handleCreateVendor}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.375rem",
                }}
              >
                <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                  Business Name
                </label>
                <input
                  type="text"
                  value={createData.business_name}
                  onChange={(e) =>
                    setCreateData({
                      ...createData,
                      business_name: e.target.value,
                    })
                  }
                  style={{
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                  required
                />
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.375rem",
                }}
              >
                <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                  Assign to School
                </label>
                <select
                  value={createData.school_id}
                  onChange={(e) =>
                    setCreateData({ ...createData, school_id: e.target.value })
                  }
                  style={{
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                  required
                >
                  <option value="">-- Select Target School --</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

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
                  <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                    Vendor User Email
                  </label>
                  <input
                    type="email"
                    value={createData.vendor_email}
                    onChange={(e) =>
                      setCreateData({
                        ...createData,
                        vendor_email: e.target.value,
                      })
                    }
                    style={{
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                    }}
                    required
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.375rem",
                  }}
                >
                  <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                    Vendor User Password
                  </label>
                  <input
                    type="password"
                    value={createData.vendor_password}
                    onChange={(e) =>
                      setCreateData({
                        ...createData,
                        vendor_password: e.target.value,
                      })
                    }
                    style={{
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                    }}
                    required
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.375rem",
                }}
              >
                <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                  GST Number
                </label>
                <input
                  type="text"
                  value={createData.gst_number}
                  onChange={(e) =>
                    setCreateData({ ...createData, gst_number: e.target.value })
                  }
                  style={{
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontFamily: "monospace",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.375rem",
                }}
              >
                <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                  Address
                </label>
                <input
                  type="text"
                  value={createData.address}
                  onChange={(e) =>
                    setCreateData({ ...createData, address: e.target.value })
                  }
                  style={{
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                />
              </div>

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
                  <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                    City
                  </label>
                  <input
                    type="text"
                    value={createData.city}
                    onChange={(e) =>
                      setCreateData({ ...createData, city: e.target.value })
                    }
                    style={{
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.375rem",
                  }}
                >
                  <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                    State
                  </label>
                  <input
                    type="text"
                    value={createData.state}
                    onChange={(e) =>
                      setCreateData({ ...createData, state: e.target.value })
                    }
                    style={{
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.375rem",
                }}
              >
                <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                  Pincode
                </label>
                <input
                  type="text"
                  value={createData.pincode}
                  onChange={(e) =>
                    setCreateData({ ...createData, pincode: e.target.value })
                  }
                  style={{
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  marginTop: "1rem",
                  padding: "0.875rem",
                  background: "#4f46e5",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Creating..." : "Create Vendor"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
