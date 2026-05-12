'use client';

import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/api';
import Drawer, { DrawerRow, DrawerSection } from '@/components/ui/Drawer';
import { useToast } from '@/context/ToastContext';

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const statusColors = {
  pending: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
  approved: { bg: '#d1fae5', color: '#065f46', label: 'Approved' },
  rejected: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
};

export default function VendorVerificationsPage() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [acting, setActing] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await apiClient.get('/students/vendor/verification-requests/', { params });
      setRequests(Array.isArray(data) ? data : (data.results ?? []));
    } catch {
      showToast('Failed to load verification requests', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAction = async (action) => {
    if (!selected) return;
    setActing(true);
    try {
      const { data } = await apiClient.patch(
        `/students/vendor/verification-requests/${selected.id}/action/`,
        { action, review_note: reviewNote }
      );
      setRequests((prev) => prev.map((r) => (r.id === data.id ? data : r)));
      setSelected(data);
      showToast(`Request ${action === 'approve' ? 'approved' : 'rejected'}`, 'success');
      setReviewNote('');
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Action failed', 'error');
    } finally {
      setActing(false);
    }
  };

  // Tab counts
  const counts = {
    '': requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  // When filter is applied server-side, counts for non-active tabs may be off.
  // We still show the tab labels.

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Student Verifications</h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
          Review and approve student profiles for your attached schools
        </p>
      </div>

      {/* Status Tabs */}
      <div className="tabs" style={{ marginBottom: '1.25rem' }}>
        {STATUS_TABS.map(({ key, label }) => (
          <button
            key={key}
            className={`tab-btn ${statusFilter === key ? 'active' : ''}`}
            onClick={() => setStatusFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <span className="spinner dark" style={{ width: '1.5rem', height: '1.5rem' }} />
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <p className="empty-state-title">No verification requests</p>
            <p className="empty-state-desc">
              {statusFilter === 'pending'
                ? 'All caught up! No pending requests.'
                : 'No requests match this filter.'}
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>School</th>
                  <th>Class</th>
                  <th>Roll No</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const st = statusColors[req.status] || statusColors.pending;
                  return (
                    <tr
                      key={req.id}
                      onClick={() => { setSelected(req); setReviewNote(''); }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 600 }}>{req.student?.student_name}</td>
                      <td style={{ fontSize: '0.85rem' }}>{req.student?.school_name}</td>
                      <td>
                        {req.student?.class_name}
                        {req.student?.section ? `-${req.student.section}` : ''}
                      </td>
                      <td>{req.student?.roll_number || '—'}</td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: st.bg,
                          color: st.color,
                        }}>
                          {st.label}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        {new Date(req.created_at).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Verification Request"
        subtitle={selected?.student?.student_name}
        width="480px"
      >
        {selected && (
          <>
            <DrawerSection title="Student Details" />
            <DrawerRow label="Name" value={<strong>{selected.student?.student_name}</strong>} />
            <DrawerRow label="School" value={selected.student?.school_name} />
            <DrawerRow label="Class" value={`${selected.student?.class_name || '—'}${selected.student?.section ? ` - ${selected.student.section}` : ''}`} />
            <DrawerRow label="Roll No" value={selected.student?.roll_number || '—'} />
            <DrawerRow label="Verified" value={selected.student?.is_verified ? '✅ Yes' : '❌ No'} />

            <DrawerSection title="Request Info" />
            <DrawerRow label="Status" value={
              <span style={{
                display: 'inline-block',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: (statusColors[selected.status] || statusColors.pending).bg,
                color: (statusColors[selected.status] || statusColors.pending).color,
              }}>
                {(statusColors[selected.status] || statusColors.pending).label}
              </span>
            } />
            <DrawerRow label="Submitted" value={new Date(selected.created_at).toLocaleString('en-IN')} />
            {selected.request_note && (
              <DrawerRow label="Student Note" value={selected.request_note} />
            )}

            {/* ID Card */}
            {selected.id_card && (
              <>
                <DrawerSection title="ID Card" />
                <div style={{ padding: '0.5rem 0' }}>
                  <a href={selected.id_card} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
                    📎 View Uploaded ID Card
                  </a>
                </div>
              </>
            )}

            {/* Review History */}
            {selected.reviewed_by_name && (
              <>
                <DrawerSection title="Review" />
                <DrawerRow label="Reviewed by" value={selected.reviewed_by_name} />
                <DrawerRow label="Reviewed at" value={selected.reviewed_at ? new Date(selected.reviewed_at).toLocaleString('en-IN') : '—'} />
                {selected.review_note && <DrawerRow label="Review Note" value={selected.review_note} />}
              </>
            )}

            {/* Action Section (only for pending requests) */}
            {selected.status === 'pending' && (
              <>
                <DrawerSection title="Take Action" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Review Note (optional)</label>
                    <textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="Add a note about your decision…"
                      style={{
                        width: '100%', minHeight: '60px', padding: '0.5rem 0.75rem',
                        borderRadius: '8px', border: '1px solid #e2e8f0',
                        fontFamily: 'inherit', fontSize: '0.875rem', resize: 'vertical',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => handleAction('approve')}
                      disabled={acting}
                      className="btn"
                      style={{
                        flex: 1, background: '#059669', color: '#fff', border: 'none',
                        padding: '0.75rem', borderRadius: '10px', fontWeight: 700,
                        cursor: acting ? 'not-allowed' : 'pointer', opacity: acting ? 0.7 : 1,
                      }}
                    >
                      {acting ? 'Processing…' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => handleAction('reject')}
                      disabled={acting}
                      className="btn"
                      style={{
                        flex: 1, background: '#dc2626', color: '#fff', border: 'none',
                        padding: '0.75rem', borderRadius: '10px', fontWeight: 700,
                        cursor: acting ? 'not-allowed' : 'pointer', opacity: acting ? 0.7 : 1,
                      }}
                    >
                      {acting ? 'Processing…' : '✗ Reject'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}
