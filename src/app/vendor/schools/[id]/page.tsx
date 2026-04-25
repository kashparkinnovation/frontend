'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api';
import type { School } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import { useToast } from '@/context/ToastContext';

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Chandigarh','Jammu & Kashmir','Ladakh',
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

export default function SchoolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', code: '', address: '', city: '', state: '',
    pincode: '', contact_email: '', contact_phone: '',
  });

  useEffect(() => {
    apiClient.get(`/schools/${id}/`)
      .then((r) => {
        const s: School = r.data;
        setSchool(s);
        setForm({
          name: s.name, code: s.code, address: s.address, city: s.city,
          state: s.state, pincode: s.pincode, contact_email: s.contact_email,
          contact_phone: s.contact_phone,
        });
        if (s.logo) {
          setLogoPreview(s.logo.startsWith('http') ? s.logo : `${API_BASE}${s.logo}`);
        }
      })
      .catch(() => toast('Failed to load school', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (logoFile) fd.append('logo', logoFile);
      await apiClient.patch(`/schools/${id}/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast('School updated successfully', 'success');
    } catch (err: any) {
      toast('Failed to update school', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><span className="spinner dark" style={{ width: '2rem', height: '2rem' }} /></div>;
  if (!school) return <div className="card"><p>School not found.</p></div>;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <Link href="/vendor/schools" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>← Back to Schools</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
            <h1 className="page-title">{school.name}</h1>
            <StatusBadge status={school.approval_status} />
          </div>
        </div>
        {school.is_approved && (
          <Link href={`/vendor/products?school=${school.id}`} className="btn btn-outline btn-sm">
            👕 Manage Products
          </Link>
        )}
      </div>

      {school.approval_status === 'rejected' && school.rejection_reason && (
        <div style={{
          background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 'var(--radius)',
          padding: '0.875rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#9f1239',
        }}>
          <strong>Rejection reason:</strong> {school.rejection_reason}
        </div>
      )}

      {school.approval_status === 'pending' && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius)',
          padding: '0.875rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#92400e',
        }}>
          ⏳ Your application is under review. You'll be notified once approved.
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSave}>
          <div className="form-group" style={{ marginBottom: '1.5rem', alignItems: 'flex-start' }}>
            <label className="form-label">School Logo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: 80, height: 80, borderRadius: 'var(--radius)',
                border: '2px dashed var(--color-border)', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', background: 'var(--color-bg)',
              }}>
                {logoPreview ? <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏫'}
              </div>
              <input type="file" accept="image/*" onChange={handleLogo} />
            </div>
          </div>

          <div className="form-grid" style={{ marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">School Name <span className="required">*</span></label>
              <input className="input" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">School Code <span className="required">*</span></label>
              <input className="input" name="code" value={form.code} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Address</label>
            <textarea className="textarea" name="address" value={form.address} onChange={handleChange} rows={2} style={{ minHeight: 70 }} />
          </div>

          <div className="form-grid" style={{ marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="input" name="city" value={form.city} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <select className="select" name="state" value={form.state} onChange={handleChange}>
                <option value="">Select state…</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Pincode</label>
              <input className="input" name="pincode" value={form.pincode} onChange={handleChange} maxLength={6} />
            </div>
          </div>

          <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input className="input" type="email" name="contact_email" value={form.contact_email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input className="input" name="contact_phone" value={form.contact_phone} onChange={handleChange} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Link href="/vendor/schools" className="btn btn-ghost">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving && <span className="spinner" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
