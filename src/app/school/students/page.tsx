'use client';

import React, { useEffect, useState, useRef } from 'react';
import apiClient from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';
import Drawer, { DrawerRow, DrawerSection } from '@/components/ui/Drawer';
import { useToast } from '@/context/ToastContext';

interface StudentProfile {
  id: number;
  student_name: string;
  class_name: string;
  section: string;
  roll_number: string;
  student_id: string;
  parent_email: string;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
}

export default function StudentsListPage() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<StudentProfile | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/students/');
      setStudents(Array.isArray(data) ? data : (data.results ?? []));
    } catch (err) {
      console.error(err);
      showToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      showToast('Importing students...', 'info');
      const { data } = await apiClient.post('/students/school/import/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast(`Imported ${data.created} students.`, 'success');
      if (data.errors?.length > 0) showToast(`${data.errors.length} rows had errors.`, 'error');
      fetchStudents();
    } catch {
      showToast('Import failed. Check CSV format.', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob(['student_name,class_name,section,roll_number,student_id,parent_email\nJohn Doe,Class 5,A,12,STU001,parent@example.com\n'], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'student_import_template.csv' });
    a.click(); URL.revokeObjectURL(a.href);
  };

  const handleVerify = async (student: StudentProfile) => {
    setActionLoading(student.id);
    try {
      const endpoint = student.is_verified ? `/students/${student.id}/unverify/` : `/students/${student.id}/verify/`;
      await apiClient.post(endpoint);
      const updated = { ...student, is_verified: !student.is_verified };
      setStudents((prev) => prev.map((s) => s.id === student.id ? updated : s));
      if (selected?.id === student.id) setSelected(updated);
      showToast(student.is_verified ? 'Verification revoked' : 'Student verified!', 'success');
    } catch {
      showToast('Action failed.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = students.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.student_name.toLowerCase().includes(q) || s.roll_number.toLowerCase().includes(q) || s.class_name.toLowerCase().includes(q) || (s.parent_email || '').toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Students</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={downloadTemplate} className="btn" style={{ background: '#f3f4f6' }}>Template</button>
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
          <button onClick={() => fileInputRef.current?.click()} className="btn btn-primary">Import CSV</button>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <input type="text" placeholder="Search by name, roll number, class or email…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', maxWidth: '400px', padding: '0.6rem 0.875rem', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '0.875rem' }} />
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Class - Section</th>
                  <th>Student ID</th>
                  <th>Parent Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                    {search ? 'No students match your search.' : 'No students found. Import from CSV to get started.'}
                  </td></tr>
                ) : filtered.map((stu) => (
                  <tr key={stu.id} onClick={() => setSelected(stu)}>
                    <td style={{ fontWeight: 600 }}>{stu.roll_number}</td>
                    <td>{stu.student_name}</td>
                    <td>{stu.class_name}{stu.section ? ` - ${stu.section}` : ''}</td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{stu.student_id || '—'}</td>
                    <td>{stu.parent_email}</td>
                    <td><StatusBadge status={stu.is_verified ? 'approved' : 'pending'} /></td>
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
        title={selected?.student_name ?? ''}
        subtitle={`Roll No: ${selected?.roll_number}`}
      >
        {selected && (
          <>
            <DrawerSection title="Student Info" />
            <DrawerRow label="Full Name" value={selected.student_name} />
            <DrawerRow label="Roll Number" value={selected.roll_number} />
            <DrawerRow label="Class" value={`${selected.class_name}${selected.section ? ` - ${selected.section}` : ''}`} />
            <DrawerRow label="Student ID" value={selected.student_id || '—'} />

            <DrawerSection title="Parent / Guardian" />
            <DrawerRow label="Email" value={selected.parent_email || '—'} />

            <DrawerSection title="Verification" />
            <DrawerRow label="Status" value={<StatusBadge status={selected.is_verified ? 'approved' : 'pending'} />} />
            <DrawerRow label="Verified At" value={selected.verified_at ? new Date(selected.verified_at).toLocaleString() : '—'} />
            <DrawerRow label="Added On" value={new Date(selected.created_at).toLocaleDateString()} />

            <div className="drawer-actions">
              <button
                onClick={() => handleVerify(selected)}
                disabled={actionLoading === selected.id}
                className="btn"
                style={{
                  background: selected.is_verified ? '#fee2e2' : '#d1fae5',
                  color: selected.is_verified ? '#b91c1c' : '#065f46',
                }}
              >
                {actionLoading === selected.id ? '…' : selected.is_verified ? '✕ Revoke Verification' : '✓ Mark as Verified'}
              </button>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}
