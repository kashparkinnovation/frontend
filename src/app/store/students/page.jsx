'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';
import { useStudent } from '@/context/StudentContext';

export default function StudentsListPage() {
  const { students, setStudents, activeStudent, setActiveStudent } = useStudent();
  const [loading, setLoading] = useState(students.length === 0);

  useEffect(() => {
    apiClient.get('/students/').then((r) => {
      const list = r.data.results ?? r.data;
      setStudents(list);
    }).catch(console.error).finally(() => setLoading(false));
  }, [setStudents]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>My Students</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>Manage student profiles and verification for each child.</p>
        </div>
        <Link href="/store/students/new" style={{ background: '#4f46e5', color: 'white', fontWeight: 700, padding: '0.625rem 1.25rem', borderRadius: '10px', textDecoration: 'none', fontSize: '0.9rem' }}>
          + Add Student
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading…</div>
      ) : students.length === 0 ? (
        <div style={{ background: '#eef2ff', border: '1.5px dashed #a5b4fc', borderRadius: '16px', padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>👨‍🎓</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem' }}>No students yet</h2>
          <p style={{ color: '#64748b', margin: '0 0 1.5rem' }}>Add your first student profile to get started.</p>
          <Link href="/store/students/new" style={{ display: 'inline-block', background: '#4f46e5', color: 'white', fontWeight: 700, padding: '0.75rem 1.75rem', borderRadius: '10px', textDecoration: 'none' }}>+ Add Student</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {students.map((s) => (
            <div key={s.id} style={{ background: 'white', border: `1.5px solid ${activeStudent?.id === s.id ? '#4f46e5' : '#e2e8f0'}`, borderRadius: '14px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              {/* Avatar */}
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: s.is_verified ? '#d1fae5' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.25rem', flexShrink: 0, color: s.is_verified ? '#065f46' : '#92400e' }}>
                {s.student_name.charAt(0)}
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{s.student_name}</div>
                <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.125rem' }}>
                  Class {s.class_name}{s.section ? ` — Sec ${s.section}` : ''} · {s.school_name}
                  {s.roll_number && ` · Roll ${s.roll_number}`}
                </div>
              </div>
              {/* Status */}
              <div style={{ flexShrink: 0 }}>
                {s.is_verified ? (
                  <StatusBadge status="approved" />
                ) : s.pending_verification ? (
                  <StatusBadge status="pending" />
                ) : (
                  <StatusBadge status="rejected" />
                )}
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                {s.is_verified && (
                  <Link href={`/store/shop/${s.school}`} onClick={() => setActiveStudent(s)}
                    style={{ background: '#4f46e5', color: 'white', padding: '0.4rem 1rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.8125rem' }}>
                    🛒 Shop
                  </Link>
                )}
                <Link href={`/store/students/${s.id}`}
                  style={{ background: '#f8fafc', color: '#64748b', padding: '0.4rem 0.75rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.8125rem', border: '1px solid #e2e8f0' }}>
                  Manage →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
