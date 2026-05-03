"use client";

import React, { useEffect, useState } from "react";
import apiClient from "@/lib/api";
import StatusBadge from "@/components/ui/StatusBadge";
import Drawer, { DrawerRow, DrawerSection } from "@/components/ui/Drawer";

export default function AdminVerificationQueuePage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [selected, setSelected] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [actioning, setActioning] = useState(false);
  const [schools, setSchools] = useState([]);
  const [newSchoolId, setNewSchoolId] = useState("");
  const [changingSchool, setChangingSchool] = useState(false);

  const [search, setSearch] = useState("");

  const fetchQueue = React.useCallback(async () => {
    setLoading(true);
    let params = [];
    if (filter) params.push(`status=${filter}`);
    if (search) params.push(`search=${search}`);
    const qs = params.length > 0 ? `?${params.join("&")}` : "";

    try {
      const { data } = await apiClient.get(
        `/students/admin/verification-requests/${qs}`,
      );
      setRequests(Array.isArray(data) ? data : (data.results ?? []));
    } catch (err) {
      console.error("Failed to load queue", err);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQueue();
    }, 400);
    return () => clearTimeout(timer);
  }, [filter, search, fetchQueue]);

  useEffect(() => {
    apiClient
      .get("/admin/schools/")
      .then((r) => setSchools(r.data.results ?? r.data))
      .catch(console.error);
  }, []);

  const openDrawer = (req) => {
    setSelected(req);
    setReviewNote("");
  };

  const handleAction = async (action) => {
    if (!selected) return;
    setActioning(true);
    try {
      await apiClient.patch(
        `/students/admin/verification-requests/${selected.id}/action/`,
        { action, review_note: reviewNote },
      );
      alert(
        `Request physically ${action === "approve" ? "Approved" : "Rejected"} by Admin!`,
      );
      setSelected(null);
      fetchQueue();
    } catch {
      alert("Action failed");
    } finally {
      setActioning(false);
    }
  };

  const handleChangeSchool = async () => {
    if (!selected || !newSchoolId) return;
    setChangingSchool(true);
    try {
      await apiClient.patch(
        `/students/admin/school-change/${selected.student.id}/`,
        { school_id: newSchoolId },
      );
      alert(
        "School changed successfully! Note: Verification status has been reset.",
      );
      setSelected(null);
      fetchQueue();
    } catch {
      alert("Failed to change school");
    } finally {
      setChangingSchool(false);
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
          Student Requests
        </h1>
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            background: "#f3f4f6",
            padding: "0.25rem",
            borderRadius: "8px",
          }}
        >
          {["pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "6px",
                background: filter === s ? "white" : "transparent",
                fontWeight: filter === s ? 600 : 400,
                boxShadow: filter === s ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {s}
            </button>
          ))}
        </div>
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
          placeholder="Search students..."
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

      <div
        style={{
          background: "white",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div
            style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}
          >
            Loading requests...
          </div>
        ) : (
          <div style={{ width: "100%", overflowX: "auto" }}>
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
                    Date
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      color: "#64748b",
                      fontSize: "0.875rem",
                    }}
                  >
                    Student & School
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      color: "#64748b",
                      fontSize: "0.875rem",
                    }}
                  >
                    Class / Roll
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      color: "#64748b",
                      fontSize: "0.875rem",
                      textAlign: "center",
                    }}
                  >
                    ID Card
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
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: "center",
                        padding: "2rem",
                        color: "#64748b",
                      }}
                    >
                      No {filter} requests found across the platform.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr
                      key={req.id}
                      onClick={() => openDrawer(req)}
                      style={{
                        borderBottom: "1px solid #e2e8f0",
                        cursor: "pointer",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f8fafc")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <td
                        style={{
                          padding: "1rem",
                          color: "#64748b",
                          fontSize: "0.875rem",
                        }}
                      >
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>
                          {req.student.student_name}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            marginTop: "0.2rem",
                          }}
                        >
                          {req.student.school_name}
                        </div>
                      </td>
                      <td style={{ padding: "1rem", color: "#475569" }}>
                        {req.student.class_name} {req.student.section} -{" "}
                        {req.student.roll_number}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        {req.id_card ? (
                          <span title="ID card attached">📎</span>
                        ) : (
                          <span style={{ color: "#cbd5e1" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <StatusBadge status={req.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Verification Request"
        subtitle={selected?.student.school_name}
      >
        {selected && (
          <>
            <DrawerSection title="Student Info" />
            <DrawerRow label="Name" value={selected.student.student_name} />
            <DrawerRow
              label="Class / Roll"
              value={`${selected.student.class_name} ${selected.student.section} — ${selected.student.roll_number}`}
            />
            <DrawerRow
              label="Submitted Date"
              value={new Date(selected.created_at).toLocaleString()}
            />
            <DrawerRow
              label="Global Status"
              value={<StatusBadge status={selected.status} />}
            />

            {selected.request_note && (
              <>
                <DrawerSection title="Student's Message to School" />
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.875rem",
                    color: "#475569",
                    lineHeight: 1.5,
                  }}
                >
                  {selected.request_note}
                </p>
              </>
            )}

            {selected.review_note && (
              <>
                <DrawerSection title="School's Final Review Note" />
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.875rem",
                    color: "#475569",
                    lineHeight: 1.5,
                  }}
                >
                  {selected.review_note}
                </p>
              </>
            )}

            <DrawerSection title="ID Proof Attachment" />
            {selected.id_card ? (
              <div>
                <a
                  href={selected.id_card}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={selected.id_card}
                    alt="Student ID card"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "200px",
                      objectFit: "contain",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      display: "block",
                      cursor: "zoom-in",
                    }}
                  />
                </a>
                <p
                  style={{
                    margin: "0.4rem 0 0",
                    fontSize: "0.75rem",
                    color: "#94a3b8",
                  }}
                >
                  Click to view full image in new tab
                </p>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#94a3b8" }}>
                No official ID card attached
              </p>
            )}

            {selected.status === "pending" && (
              <>
                <DrawerSection title="Admin Override (optional note)" />
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Leave an official note explaining the admin override..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />

                <div
                  style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}
                >
                  <button
                    onClick={() => handleAction("approve")}
                    disabled={actioning}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      background: "#22c55e",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 600,
                      cursor: actioning ? "wait" : "pointer",
                    }}
                  >
                    {actioning ? "Processing…" : "✓ Override & Approve"}
                  </button>
                  <button
                    onClick={() => handleAction("reject")}
                    disabled={actioning}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      background: "#fee2e2",
                      color: "#b91c1c",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 600,
                      cursor: actioning ? "wait" : "pointer",
                    }}
                  >
                    {actioning ? "Processing…" : "✕ Reject Override"}
                  </button>
                </div>
              </>
            )}

            <div
              style={{
                marginTop: "2rem",
                padding: "1rem",
                background: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            >
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b" }}>
                <strong>Note:</strong> As an admin, you have oversight authority
                to bypass the school&apos;s queue and directly approve or reject
                a student verification yourself.
              </p>
            </div>

            <DrawerSection title="Admin Tools: Change School" />
            <div
              style={{
                padding: "1rem",
                background: "#fff1f2",
                borderRadius: "8px",
                border: "1px solid #fecdd3",
              }}
            >
              <p
                style={{
                  margin: "0 0 1rem",
                  fontSize: "0.875rem",
                  color: "#be123c",
                }}
              >
                WARNING: Changing a student&apos;s school will reset their
                verification status to pending and delete their current
                verification requests.
              </p>
              <select
                value={newSchoolId}
                onChange={(e) => setNewSchoolId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #fecdd3",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  marginBottom: "1rem",
                }}
              >
                <option value="">Select New School...</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
              <button
                onClick={handleChangeSchool}
                disabled={changingSchool || !newSchoolId}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "#e11d48",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor:
                    changingSchool || !newSchoolId ? "not-allowed" : "pointer",
                  opacity: changingSchool || !newSchoolId ? 0.7 : 1,
                }}
              >
                {changingSchool ? "Changing..." : "Change School"}
              </button>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}
