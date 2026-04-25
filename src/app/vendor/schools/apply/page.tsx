'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useToast } from '@/context/ToastContext';

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Chandigarh','Jammu & Kashmir','Ladakh',
];

export default function ApplySchoolPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    contact_email: '',
    contact_phone: '',
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (logoFile) fd.append('logo', logoFile);
      await apiClient.post('/schools/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast('School application submitted! Awaiting admin approval.', 'success');
      router.push('/vendor/schools');
    } catch (err: any) {
      const detail = err?.response?.data;
      const msg = typeof detail === 'string' ? detail : JSON.stringify(detail);
      toast(msg || 'Failed to submit application', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <Link href="/vendor/schools" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            ← Back to Schools
          </Link>
          <h1 className="page-title" style={{ marginTop: '0.25rem' }}>Apply for a School</h1>
        </div>
      </div>

      <div className="card">
        <div style={{
          background: 'linear-gradient(135deg, #eef2ff 0%, #f0fdfa 100%)',
          border: '1px solid #c7d2fe',
          borderRadius: 'var(--radius)',
          padding: '0.875rem 1rem',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          color: '#3730a3',
        }}>
          ℹ️ Your application will be reviewed by the platform admin. Once approved, you can start adding products for the school.
        </div>

        <form onSubmit={handleSubmit}>
          {/* School Logo */}
          <div className="form-group" style={{ marginBottom: '1.5rem', alignItems: 'flex-start' }}>
            <label className="form-label">School Logo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: 80, height: 80, borderRadius: 'var(--radius)',
                border: '2px dashed var(--color-border)',
                overflow: 'hidden', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '2rem', background: 'var(--color-bg)',
              }}>
                {logoPreview ? <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏫'}
              </div>
              <input type="file" accept="image/*" onChange={handleLogo} />
            </div>
          </div>

          <div className="form-grid" style={{ marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">School Name <span className="required">*</span></label>
              <input className="input" name="name" value={form.name} onChange={handleChange} required placeholder="St. Mary's High School" />
            </div>
            <div className="form-group">
              <label className="form-label">School Code <span className="required">*</span></label>
              <input className="input" name="code" value={form.code} onChange={handleChange} required placeholder="SMHS001" />
              <span className="form-hint">Unique identifier for this school</span>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Address</label>
            <textarea className="textarea" name="address" value={form.address} onChange={handleChange} placeholder="123, School Lane, Area..." rows={2} style={{ minHeight: 70 }} />
          </div>

          <div className="form-grid" style={{ marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="input" name="city" value={form.city} onChange={handleChange} placeholder="Mumbai" />
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
              <input className="input" name="pincode" value={form.pincode} onChange={handleChange} placeholder="400001" maxLength={6} />
            </div>
          </div>

          <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input className="input" type="email" name="contact_email" value={form.contact_email} onChange={handleChange} placeholder="principal@school.edu" />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input className="input" name="contact_phone" value={form.contact_phone} onChange={handleChange} placeholder="+91 98765 43210" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Link href="/vendor/schools" className="btn btn-ghost">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving && <span className="spinner" />}
              {saving ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
