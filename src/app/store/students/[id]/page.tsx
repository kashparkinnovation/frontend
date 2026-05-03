'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useStudent } from '@/context/StudentContext';
import StatusBadge from '@/components/ui/StatusBadge';

interface StudentProfile {
  id: number;
  student_name: string;
  class_name: string;
  section: string;
  roll_number: string;
  student_id: string;
  school: number;
  school_name: string;
  is_verified: boolean;
  verified_at: string | null;
  pending_verification: boolean;
  latest_verification_request: {
    status: 'pending' | 'approved' | 'rejected';
    request_note: string;
    review_note: string;
    created_at: string;
  } | null;
}

interface VerificationRequest {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  request_note: string;
  review_note: string;
  created_at: string;
  reviewed_at: string | null;
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const { triggerRefresh } = useStudent();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<StudentProfile>>({});
  const [verifyNote, setVerifyNote] = useState('');
  const [idCard, setIdCard] = useState<File | null>(null);
  const [submittingVerify, setSubmittingVerify] = useState(false);
  const [tab, setTab] = useState<'details' | 'verification'>('details');

  useEffect(() => {
    if (!id) return;
    apiClient.get(`/students/${id}/`)
    .then((studentRes) => {
      setStudent(studentRes.data);
      setForm(studentRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!student) return;
    setSaving(true);
    try {
      const { data } = await apiClient.patch(`/students/${id}/`, { student_name: form.student_name, class_name: form.class_name, section: form.section, roll_number: form.roll_number, student_id: form.student_id });
      setStudent(data);
      setForm(data);
      setEditMode(false);
      triggerRefresh();
      showToast('Student updated', 'success');
    } catch {
      showToast('Failed to update', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${student?.student_name}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/students/${id}/`);
      triggerRefresh();
      showToast('Student profile deleted', 'success');
      router.push('/store/students');
    } catch { showToast('Delete failed', 'error'); }
    finally { setDeleting(false); }
  };

  const handleVerificationRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    setSubmittingVerify(true);
    try {
      const fd = new FormData();
      fd.append('student', String(student.id));
      fd.append('request_note', verifyNote);
      if (idCard) fd.append('id_card', idCard);
      await apiClient.post('/students/verify-request/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('Verification request submitted!', 'success');
      setVerifyNote('');
      setIdCard(null);
      // Reload student
      const { data } = await apiClient.get(`/students/${id}/`);
      setStudent(data);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to submit request';
      showToast(String(msg), 'error');
    } finally { setSubmittingVerify(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading…</div>;
  if (!student) return <div style={{ textAlign: 'center', padding: '3rem' }}>Student not found. <Link href="/store/students">← Back</Link></div>;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <Link href="/store/students" style={{ fontSize: '0.875rem', color: '#94a3b8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1.25rem' }}>← Back to Students</Link>

      {/* Header card */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: student.is_verified ? '#d1fae5' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.5rem', flexShrink: 0, color: student.is_verified ? '#065f46' : '#92400e' }}>
          {student.student_name.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '1.25rem' }}>{student.student_name}</div>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{student.class_name} {student.section} · {student.school_name}</div>
          {student.roll_number && <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Roll {student.roll_number}</div>}
        </div>
        <StatusBadge status={student.is_verified ? 'approved' : (student.pending_verification ? 'pending' : 'rejected')} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '1.25rem' }}>
        {(['details', 'verification'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '0.75rem', fontWeight: 600, fontSize: '0.875rem', border: 'none', cursor: 'pointer', background: tab === t ? '#4f46e5' : 'transparent', color: tab === t ? 'white' : '#64748b', transition: 'all 0.15s', textTransform: 'capitalize' }}>
            {t === 'details' ? '📋 Details' : '✅ Verification'}
          </button>
        ))}
      </div>

      {/* Details tab */}
      {tab === 'details' && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Student Details</h2>
            {!editMode ? (
              <button onClick={() => setEditMode(true)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.4rem 0.875rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: '#64748b' }}>✏️ Edit</button>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => { setEditMode(false); setForm(student); }} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.4rem 0.875rem', cursor: 'pointer', fontSize: '0.8125rem' }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{ background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', padding: '0.4rem 0.875rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600 }}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[
              { label: 'Full Name', field: 'student_name' as const, required: true },
              { label: 'Class / Grade', field: 'class_name' as const, required: true },
              { label: 'Section', field: 'section' as const },
              { label: 'Roll Number', field: 'roll_number' as const },
              { label: 'Student ID', field: 'student_id' as const },
            ].map(({ label, field, required }) => (
              <div key={field} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f8fafc' }}>
                <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500, minWidth: 120 }}>{label}</span>
                {editMode ? (
                  <input value={(form[field] as string) || ''} required={required} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    style={{ flex: 1, padding: '0.35rem 0.625rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.875rem', outline: 'none', textAlign: 'right', fontFamily: 'inherit' }} />
                ) : (
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>{(student[field] as string) || '—'}</span>
                )}
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
              <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>School</span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#4f46e5' }}>{student.school_name}</span>
            </div>
            {student.verified_at && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>Verified On</span>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#10b981' }}>{new Date(student.verified_at).toLocaleDateString('en-IN')}</span>
              </div>
            )}
          </div>

          {/* Danger zone */}
          <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #fee2e2' }}>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: '#94a3b8' }}>Danger Zone</p>
            <button onClick={handleDelete} disabled={deleting} style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.8125rem' }}>
              🗑 {deleting ? 'Deleting…' : 'Delete Student Profile'}
            </button>
          </div>
        </div>
      )}

      {/* Verification tab */}
      {tab === 'verification' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Verification Status Card */}
          <div style={{ background: student.is_verified ? '#d1fae5' : '#fef3c7', border: `1px solid ${student.is_verified ? '#6ee7b7' : '#fcd34d'}`, borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.375rem', color: student.is_verified ? '#065f46' : '#92400e' }}>
              {student.is_verified ? '✅ Verified by School' : (student.latest_verification_request?.status === 'rejected' ? '❌ Verification Rejected' : '⏳ Pending School Approval')}
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: student.is_verified ? '#047857' : '#b45309' }}>
              {student.is_verified
                ? `${student.student_name} is verified and can order from ${student.school_name}'s catalogue.`
                : `Your verification request is currently with ${student.school_name}. Once approved, ${student.student_name} can place orders.`}
            </p>
          </div>

          {/* Rejection / Note Section */}
          {student.latest_verification_request?.review_note && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#b91c1c', marginBottom: '0.375rem' }}>Remarks from School:</div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#7f1d1d' }}>{student.latest_verification_request.review_note}</p>
            </div>
          )}

          {/* Update Request Form (only if rejected or never submitted) */}
          {!student.is_verified && !student.pending_verification && (
            <form onSubmit={handleVerificationRequest} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem', marginTop: '1rem' }}>
              <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 700 }}>{student.latest_verification_request?.status === 'rejected' ? 'Update Verification & Re-Submit' : 'Submit Verification Profile'}</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem', color: '#374151' }}>Note to School (optional)</label>
                  <textarea value={verifyNote} onChange={(e) => setVerifyNote(e.target.value)} placeholder={student.latest_verification_request?.status === 'rejected' ? "Reply to the school's remarks..." : "Add any details here..."} rows={3}
                    style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', resize: 'vertical', fontSize: '0.9375rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem', color: '#374151' }}>Student ID Card / Proof</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', border: '1.5px dashed #cbd5e1', borderRadius: '8px', cursor: 'pointer', background: '#f8fafc' }}>
                    <span style={{ fontSize: '1.5rem' }}>{idCard ? '📎' : '📁'}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{idCard ? idCard.name : 'Upload ID card photo'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>JPG, PNG</div>
                    </div>
                    <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => setIdCard(e.target.files?.[0] ?? null)} required={student.latest_verification_request?.status === 'rejected'} />
                  </label>
                </div>

                <button type="submit" disabled={submittingVerify} style={{ padding: '0.75rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.9375rem', cursor: submittingVerify ? 'not-allowed' : 'pointer', opacity: submittingVerify ? 0.7 : 1, fontFamily: 'inherit' }}>
                  {submittingVerify ? 'Submitting…' : '📨 Submit Profile For Approval'}
                </button>
              </div>
            </form>
          )}

          {/* Shop CTA when verified */}
          {student.is_verified && (
            <Link href={`/store/shop/${student.school}`} style={{ display: 'block', textAlign: 'center', background: '#4f46e5', color: 'white', padding: '1rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '1rem' }}>
              🛒 Shop for {student.student_name} →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
