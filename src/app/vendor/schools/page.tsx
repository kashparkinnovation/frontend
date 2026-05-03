'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import type { School } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

function SchoolCard({ school, onRefresh }: { school: School; onRefresh: () => void }) {
  const { toast } = useToast();
  const logoUrl = school.logo
    ? (school.logo.startsWith('http') ? school.logo : `${API_BASE}${school.logo}`)
    : null;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '0.5rem', overflow: 'hidden',
          background: 'var(--color-bg)', border: '1px solid var(--color-border)',
          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem',
        }}>
          {logoUrl ? <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏫'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{school.name}</h3>
            <StatusBadge status={school.approval_status} />
          </div>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Code: <strong>{school.code}</strong>
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8125rem' }}>
        {school.city && (
          <div style={{ color: 'var(--color-text-secondary)' }}>
            📍 {school.city}{school.state ? `, ${school.state}` : ''}
          </div>
        )}
        {school.contact_email && (
          <div style={{ color: 'var(--color-text-secondary)' }}>
            ✉️ {school.contact_email}
          </div>
        )}
        {school.contact_phone && (
          <div style={{ color: 'var(--color-text-secondary)' }}>
            📞 {school.contact_phone}
          </div>
        )}
      </div>

      {school.approval_status === 'rejected' && school.rejection_reason && (
        <div style={{
          background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 'var(--radius)',
          padding: '0.625rem 0.875rem', fontSize: '0.8125rem', color: '#9f1239',
        }}>
          <strong>Rejection reason:</strong> {school.rejection_reason}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {school.is_approved && (
          <Link href={`/vendor/products?school=${school.id}`} className="btn btn-outline btn-sm">
            👕 Products
          </Link>
        )}
        <Link href={`/vendor/schools/${school.id}`} className="btn btn-ghost btn-sm">
          Edit
        </Link>
      </div>
    </div>
  );
}

export default function VendorSchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchSchools = () => {
    setLoading(true);
    apiClient.get('/schools/')
      .then((r) => setSchools(r.data.results ?? r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSchools(); }, []);

  const filtered = filter === 'all' ? schools : schools.filter((s) => s.approval_status === filter);

  const counts = {
    all: schools.length,
    approved: schools.filter((s) => s.approval_status === 'approved').length,
    pending: schools.filter((s) => s.approval_status === 'pending').length,
    rejected: schools.filter((s) => s.approval_status === 'rejected').length,
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Schools</h1>
      </div>

      {/* Filter tabs */}
      <div className="tabs">
        {(['all', 'approved', 'pending', 'rejected'] as const).map((f) => (
          <button
            key={f}
            className={`tab-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span style={{
              marginLeft: '0.4rem',
              background: filter === f ? 'var(--color-primary)' : '#e2e8f0',
              color: filter === f ? 'white' : 'var(--color-text-muted)',
              borderRadius: '9999px', padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700,
            }}>{counts[f]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <span className="spinner dark" style={{ width: '2rem', height: '2rem' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏫</div>
          <p className="empty-state-title">No schools {filter !== 'all' ? `with status "${filter}"` : 'yet'}</p>
          <p className="empty-state-desc">Wait for the admin to assign a school to you to start adding products</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {filtered.map((s) => <SchoolCard key={s.id} school={s} onRefresh={fetchSchools} />)}
        </div>
      )}
    </div>
  );
}
