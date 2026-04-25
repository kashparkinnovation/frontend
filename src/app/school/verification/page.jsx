'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';
import Drawer, { DrawerRow, DrawerSection } from '@/components/ui/Drawer';
import { useToast } from '@/context/ToastContext';

export default function VerificationQueuePage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [actioning, setActioning] = useState(false);
  const { showToast } = useToast();

  const fetchQueue = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/students/school/verification-requests/?status=${filter}`);
      setRequests(Array.isArray(data) ? data : (data.results ?? []));
    } catch {
      showToast('Failed to load queue', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, showToast]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const openDrawer = (req) => {
    setSelected(req);
    setReviewNote('');
  };

  const handleAction = async (action) => {
    if (!selected) return;
    setActioning(true);
    try {
      await apiClient.patch(`/students/school/verification-requests/${selected.id}/action/`, { action, review_note: reviewNote });
      showToast(`Request ${action === 'approve' ? 'Approved' : 'Rejected'}!`, 'success');
      setSelected(null);
      fetchQueue();
    } catch {
      showToast('Action failed', 'error');
    } finally {
      setActioning(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Verification Queue</h1>
        <div style={{ display: 'flex', gap: '0.5rem', background: '#f3f4f6', padding: '0.25rem', borderRadius: '8px' }}>
          {['pending', 'approved', 'rejected'].map((s) => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', background: filter === s ? 'white' : 'transparent', fontWeight: filter === s ? 600 : 400, boxShadow: filter === s ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', textTransform: 'capitalize' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Class / Roll</th>
                  <th>Note</th>
                  <th>ID Card</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No {filter} requests found.</td></tr>
                ) : requests.map((req) => (
                  <tr key={req.id} onClick={() => openDrawer(req)}>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{new Date(req.created_at).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600 }}>{req.student.student_name}</td>
                    <td>{req.student.class_name} {req.student.section} - {req.student.roll_number}</td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--color-text-secondary)' }}>{req.request_note || '—'}</td>
                    <td style={{ textAlign: 'center' }}>{req.id_card ? <span title="ID card attached">📎</span> : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}</td>
                    <td><StatusBadge status={req.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Verification Request"
        subtitle={selected?.student.student_name}
      >
        {selected && (
          <>
            <DrawerSection title="Student Info" />
            <DrawerRow label="Name" value={selected.student.student_name} />
            <DrawerRow label="Class / Roll" value={`${selected.student.class_name} ${selected.student.section} — ${selected.student.roll_number}`} />
            <DrawerRow label="Submitted" value={new Date(selected.created_at).toLocaleString()} />
            <DrawerRow label="Status" value={<StatusBadge status={selected.status} />} />

            {selected.request_note && (
              <>
                <DrawerSection title="Student's Note" />
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{selected.request_note}</p>
              </>
            )}

            {selected.review_note && (
              <>
                <DrawerSection title="Review Note" />
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{selected.review_note}</p>
              </>
            )}

            <DrawerSection title="ID Card" />
            {selected.id_card ? (
              <div>
                <a href={selected.id_card} target="_blank" rel="noopener noreferrer">
                  <img src={selected.id_card} alt="Student ID card" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'block', cursor: 'zoom-in' }} />
                </a>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Click to open full-size</p>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>No ID card attached</p>
            )}

            {selected.status === 'pending' && (
              <>
                <DrawerSection title="Review Note (optional)" />
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="E.g., Roll number requires correction."
                  rows={3}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '0.875rem', resize: 'vertical', fontFamily: 'inherit' }}
                />
                <div className="drawer-actions">
                  <button onClick={() => handleAction('approve')} disabled={actioning} className="btn btn-primary">
                    {actioning ? '…' : '✓ Approve & Verify'}
                  </button>
                  <button onClick={() => handleAction('reject')} disabled={actioning} className="btn" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                    {actioning ? '…' : '✕ Reject'}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}
