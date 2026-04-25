'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';
import Drawer, { DrawerRow, DrawerSection } from '@/components/ui/Drawer';
import { useToast } from '@/context/ToastContext';

interface Coupon {
  id: number;
  code: string;
  description: string;
  discount_type: 'flat' | 'percent';
  discount_value: string;
  min_order_amount: string | null;
  max_discount: string | null;
  max_uses: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  school_names: string[];
  is_expired: boolean;
  is_exhausted: boolean;
  created_at: string;
}

const emptyForm = () => ({
  code: '',
  description: '',
  discount_type: 'percent' as 'flat' | 'percent',
  discount_value: '',
  min_order_amount: '',
  max_discount: '',
  max_uses: '',
  valid_from: new Date().toISOString().slice(0, 10),
  valid_until: '',
  is_active: true,
});

export default function VendorCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Coupon | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);
  const { showToast } = useToast();

  const fetchCoupons = () => {
    apiClient.get('/orders/coupons/')
      .then((r) => setCoupons(r.data.results ?? r.data))
      .catch(() => showToast('Failed to load coupons', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        code: form.code.toUpperCase().trim(),
        description: form.description,
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        valid_from: form.valid_from,
        is_active: form.is_active,
      };
      if (form.min_order_amount) payload.min_order_amount = form.min_order_amount;
      if (form.max_discount) payload.max_discount = form.max_discount;
      if (form.max_uses) payload.max_uses = parseInt(form.max_uses);
      if (form.valid_until) payload.valid_until = form.valid_until;

      await apiClient.post('/orders/coupons/', payload);
      showToast('Coupon created!', 'success');
      setShowCreate(false);
      setForm(emptyForm());
      fetchCoupons();
    } catch (err: any) {
      const msg = err?.response?.data?.code?.[0] || 'Failed to create coupon.';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (coupon: Coupon) => {
    setToggling(coupon.id);
    try {
      const { data } = await apiClient.patch(`/orders/coupons/${coupon.id}/toggle/`);
      setCoupons((prev) => prev.map((c) => c.id === coupon.id ? data : c));
      if (selected?.id === coupon.id) setSelected(data);
    } catch {
      showToast('Toggle failed', 'error');
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) return;
    try {
      await apiClient.delete(`/orders/coupons/${coupon.id}/`);
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
      if (selected?.id === coupon.id) setSelected(null);
      showToast('Coupon deleted', 'success');
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  const couponStatus = (c: Coupon) => {
    if (!c.is_active) return 'inactive';
    if (c.is_expired) return 'expired';
    if (c.is_exhausted) return 'exhausted';
    return 'active';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Coupons</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {coupons.filter((c) => c.is_active && !c.is_expired).length} active coupons
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary">+ Create Coupon</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><span className="spinner dark" style={{ width: '2rem', height: '2rem' }} /></div>
        ) : coupons.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏷️</div>
            <p className="empty-state-title">No coupons yet</p>
            <p className="empty-state-desc">Create discount coupons to attract more orders</p>
            <button onClick={() => setShowCreate(true)} className="btn btn-primary">Create Coupon</button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Used</th>
                  <th>Valid Until</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} onClick={() => setSelected(c)}>
                    <td>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.05em' }}>{c.code}</div>
                      {c.description && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{c.description}</div>}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {c.discount_type === 'percent' ? `${c.discount_value}%` : `₹${c.discount_value}`} off
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{c.used_count}</span>
                      {c.max_uses && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}> / {c.max_uses}</span>}
                    </td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{c.valid_until ? new Date(c.valid_until).toLocaleDateString('en-IN') : '∞ No expiry'}</td>
                    <td><StatusBadge status={couponStatus(c)} /></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => handleToggle(c)}
                          disabled={toggling === c.id}
                          className="btn btn-xs"
                          style={{ background: c.is_active ? '#fef3c7' : '#d1fae5', color: c.is_active ? '#92400e' : '#065f46', border: 'none' }}
                        >
                          {toggling === c.id ? '…' : c.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button onClick={() => handleDelete(c)} className="btn btn-xs" style={{ background: '#fee2e2', color: '#b91c1c', border: 'none' }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create coupon drawer */}
      <Drawer isOpen={showCreate} onClose={() => { setShowCreate(false); setForm(emptyForm()); }} title="Create New Coupon">
        <form onSubmit={handleCreate}>
          <DrawerSection title="Coupon Code" />
          <div className="form-group" style={{ margin: '0 0 1rem' }}>
            <label className="form-label">Code <span className="required">*</span></label>
            <input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="WELCOME20" required style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.05em' }} />
            <span className="form-hint">Will be auto-uppercased. Must be unique.</span>
          </div>
          <div className="form-group" style={{ margin: '0 0 1rem' }}>
            <label className="form-label">Description</label>
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="E.g., 20% off for new students" />
          </div>

          <DrawerSection title="Discount" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Type</label>
              <select className="select" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as any })}>
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Value <span className="required">*</span></label>
              <input className="input" type="number" step="0.01" min="0" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} placeholder={form.discount_type === 'percent' ? '20' : '100'} required />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Min Order Amount (₹)</label>
              <input className="input" type="number" min="0" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} placeholder="Optional" />
            </div>
            {form.discount_type === 'percent' && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Max Discount Cap (₹)</label>
                <input className="input" type="number" min="0" value={form.max_discount} onChange={(e) => setForm({ ...form, max_discount: e.target.value })} placeholder="Optional" />
              </div>
            )}
          </div>

          <DrawerSection title="Usage & Validity" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Max Uses</label>
              <input className="input" type="number" min="1" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="Unlimited" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Valid From <span className="required">*</span></label>
              <input className="input" type="date" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} required />
            </div>
          </div>
          <div className="form-group" style={{ margin: '0 0 1rem' }}>
            <label className="form-label">Valid Until</label>
            <input className="input" type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
            <span className="form-hint">Leave blank for no expiry</span>
          </div>

          <div className="drawer-actions">
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Creating…' : '+ Create Coupon'}
            </button>
            <button type="button" onClick={() => { setShowCreate(false); setForm(emptyForm()); }} className="btn btn-ghost">Cancel</button>
          </div>
        </form>
      </Drawer>

      {/* Coupon detail drawer */}
      <Drawer isOpen={!!selected && !showCreate} onClose={() => setSelected(null)} title={selected?.code ?? ''} subtitle={selected?.description}>
        {selected && (
          <>
            <DrawerSection title="Discount" />
            <DrawerRow label="Type" value={selected.discount_type === 'percent' ? 'Percentage' : 'Flat'} />
            <DrawerRow label="Value" value={<strong style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>{selected.discount_type === 'percent' ? `${selected.discount_value}%` : `₹${selected.discount_value}`} off</strong>} />
            {selected.min_order_amount && <DrawerRow label="Min Order" value={`₹${selected.min_order_amount}`} />}
            {selected.max_discount && <DrawerRow label="Max Cap" value={`₹${selected.max_discount}`} />}

            <DrawerSection title="Usage" />
            <DrawerRow label="Times Used" value={`${selected.used_count}${selected.max_uses ? ` / ${selected.max_uses}` : ''}`} />
            <DrawerRow label="Valid From" value={new Date(selected.valid_from).toLocaleDateString('en-IN')} />
            <DrawerRow label="Valid Until" value={selected.valid_until ? new Date(selected.valid_until).toLocaleDateString('en-IN') : '∞ No expiry'} />
            <DrawerRow label="Status" value={<StatusBadge status={couponStatus(selected)} />} />

            {selected.school_names.length > 0 && (
              <>
                <DrawerSection title="Restricted to Schools" />
                {selected.school_names.map((s, i) => <DrawerRow key={i} label="" value={`🏫 ${s}`} />)}
              </>
            )}

            <div className="drawer-actions">
              <button onClick={() => handleToggle(selected)} disabled={toggling === selected.id} className="btn" style={{ background: selected.is_active ? '#fef3c7' : '#d1fae5', color: selected.is_active ? '#92400e' : '#065f46' }}>
                {selected.is_active ? 'Disable Coupon' : 'Enable Coupon'}
              </button>
              <button onClick={() => handleDelete(selected)} className="btn" style={{ background: '#fee2e2', color: '#b91c1c' }}>🗑 Delete Coupon</button>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}
