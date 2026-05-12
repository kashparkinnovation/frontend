'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';
import Drawer, { DrawerRow, DrawerSection } from '@/components/ui/Drawer';
import { useToast } from '@/context/ToastContext';

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'awaiting_confirmation', label: 'Awaiting' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'distributed', label: 'Distributed' },
];

export default function SchoolOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [distributing, setDistributing] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnType, setReturnType] = useState('return');
  const [returnReason, setReturnReason] = useState('');
  const [exchangeSize, setExchangeSize] = useState('');
  const [exchangeColor, setExchangeColor] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const { showToast } = useToast();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const query = filter ? `?status=${filter}` : '';
      const { data } = await apiClient.get(`/orders/school/${query}`);
      setOrders(Array.isArray(data) ? data : (data.results ?? []));
    } catch {
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, showToast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleMarkAsDistributed = async () => {
    if (!selected) return;
    setDistributing(true);
    try {
      const { data } = await apiClient.patch(`/orders/school/${selected.id}/distribute/`);
      setSelected(data);
      setOrders((prev) => prev.map((o) => o.id === data.id ? data : o));
      showToast('Order marked as Distributed!', 'success');
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Update failed.', 'error');
    } finally {
      setDistributing(false);
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    if (!returnReason.trim()) { showToast('Please provide a reason', 'error'); return; }
    
    setSubmittingReturn(true);
    try {
      await apiClient.post(`/orders/${selected.id}/return/`, {
        request_type: returnType,
        reason: returnReason,
        exchange_size: exchangeSize,
        exchange_color: exchangeColor,
        raised_by_school: true,
      });
      showToast('Return request submitted on behalf of student!', 'success');
      setReturnModalOpen(false);
      setReturnReason('');
      setExchangeSize('');
      setExchangeColor('');
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Failed to submit request', 'error');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const downloadFile = async (url, filename) => {
    try {
      const res = await apiClient.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      showToast('Download failed', 'error');
    }
  };

  // Client-side search
  const filteredOrders = orders.filter(o => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.order_number?.toLowerCase().includes(q) ||
      o.student_name?.toLowerCase().includes(q) ||
      o.parent_name?.toLowerCase().includes(q) ||
      o.vendor_name?.toLowerCase().includes(q)
    );
  });

  // Tab counts
  const tabCounts = {};
  STATUS_TABS.forEach(t => {
    tabCounts[t.key] = t.key === '' ? orders.length : orders.filter(o => o.status === t.key).length;
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Orders</h1>
        <Link href="/school/orders/bulk" className="btn btn-primary">Bulk Orders</Link>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1rem' }}>
        <div className="search-bar" style={{ maxWidth: '400px' }}>
          <span>🔍</span>
          <input
            placeholder="Search order #, student, parent…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="tabs" style={{ marginBottom: '1.25rem' }}>
        {STATUS_TABS.map(({ key, label }) => (
          <button
            key={key}
            className={`tab-btn ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label} {tabCounts[key] > 0 ? `(${tabCounts[key]})` : ''}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <span className="spinner dark" style={{ width: '1.5rem', height: '1.5rem' }} />
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Student</th>
                  <th>Parent</th>
                  <th>Vendor</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No orders found.</td></tr>
                ) : filteredOrders.map((o) => (
                  <tr key={o.id} onClick={() => setSelected(o)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{o.order_number}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{o.student_name}</div>
                      {o.student_details && (
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          {o.student_details.class_name}{o.student_details.section ? `-${o.student_details.section}` : ''}
                          {o.student_details.roll_number ? ` | Roll: ${o.student_details.roll_number}` : ''}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{o.parent_name || '—'}</div>
                      {o.parent_phone && <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{o.parent_phone}</div>}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{o.vendor_name}</td>
                    <td style={{ textAlign: 'center' }}>{o.items?.length ?? 0}</td>
                    <td style={{ fontWeight: 600 }}>₹{parseFloat(o.total_amount).toLocaleString('en-IN')}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Drawer */}
      <Drawer isOpen={!!selected} onClose={() => { setSelected(null); setReturnModalOpen(false); }} title={`Order ${selected?.order_number ?? ''}`} subtitle={selected?.student_name} width="520px">
        {selected && !returnModalOpen && (
          <>
            <DrawerSection title="Summary" />
            <DrawerRow label="Order #" value={<span style={{ fontFamily: 'monospace' }}>{selected.order_number}</span>} />
            <DrawerRow label="Order Status" value={<StatusBadge status={selected.status} />} />
            <DrawerRow label="Total" value={<strong style={{ color: '#059669', fontSize: '1.05rem' }}>₹{parseFloat(selected.total_amount).toLocaleString('en-IN')}</strong>} />
            <DrawerRow label="Date" value={new Date(selected.created_at).toLocaleString('en-IN')} />
            <DrawerRow label="Payment" value={`${selected.payment_method?.replace(/_/g, ' ')} (${selected.payment_status})`} />
            {selected.bulk_order_number && (
              <DrawerRow label="Bulk Order" value={
                <Link href={`/school/orders/bulk/${selected.bulk_order}`} style={{ color: 'var(--color-primary)' }} onClick={() => setSelected(null)}>
                  {selected.bulk_order_number}
                </Link>
              } />
            )}

            {/* Parent Details */}
            <DrawerSection title="Parent / Guardian" />
            <DrawerRow label="Name" value={selected.parent_name || '—'} />
            <DrawerRow label="Phone" value={selected.parent_phone || '—'} />
            <DrawerRow label="Email" value={selected.parent_email || '—'} />

            {/* Student */}
            <DrawerSection title="Student" />
            <DrawerRow label="Student" value={selected.student_name} />
            {selected.student_details && (
              <>
                <DrawerRow label="Class" value={`${selected.student_details.class_name}${selected.student_details.section ? ` - ${selected.student_details.section}` : ''}`} />
                {selected.student_details.roll_number && <DrawerRow label="Roll No" value={selected.student_details.roll_number} />}
              </>
            )}

            {/* Vendor */}
            <DrawerRow label="Vendor" value={selected.vendor_name} />

            {/* Items */}
            {selected.items && selected.items.length > 0 && (
              <>
                <DrawerSection title="Items" />
                {selected.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{item.product_name}</div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{item.size}{item.color ? ` / ${item.color}` : ''} × {item.quantity}</div>
                    </div>
                    <div style={{ fontWeight: 600 }}>₹{parseFloat(item.line_total).toLocaleString('en-IN')}</div>
                  </div>
                ))}
                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '2px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                    <span>Total</span><span>₹{parseFloat(selected.total_amount).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </>
            )}

            {/* Distribution - Mark as distributed */}
            {selected.status === 'delivered' && (
              <div className="drawer-actions">
                <button onClick={handleMarkAsDistributed} disabled={distributing} className="btn btn-primary" style={{ width: '100%' }}>
                  {distributing ? 'Updating…' : '✓ Mark as Distributed to Student'}
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="drawer-actions" style={{ borderTop: 'none', paddingTop: 0, flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                <button 
                  onClick={() => downloadFile(`/orders/${selected.id}/invoice/`, `Invoice_${selected.order_number}.pdf`)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  📄 Invoice
                </button>
                <button 
                  onClick={() => downloadFile(`/orders/${selected.id}/delivery-slip/`, `Slip_${selected.order_number}.pdf`)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  🏷️ Slip
                </button>
              </div>
              {selected.status === 'distributed' && (
                <button 
                  onClick={() => setReturnModalOpen(true)}
                  className="btn btn-outline"
                  style={{ width: '100%', color: '#dc2626', borderColor: '#fca5a5', background: 'white' }}
                >
                  Request Return / Exchange
                </button>
              )}
              <Link href={`/school/orders/${selected.id}`} className="btn btn-outline" style={{ width: '100%', display: 'flex', justifyContent: 'center' }} onClick={() => setSelected(null)}>
                View Full Details →
              </Link>
              {selected.can_cancel && (
                <button 
                  onClick={async () => {
                    if (!confirm('Are you sure you want to cancel this order?')) return;
                    try {
                      const { data } = await apiClient.post(`/orders/${selected.id}/cancel/`);
                      showToast('Order cancelled successfully', 'success');
                      setOrders((prev) => prev.map((o) => o.id === data.id ? data : o));
                      setSelected(data);
                    } catch (err) {
                      showToast('Failed to cancel order', 'error');
                    }
                  }}
                  className="btn btn-outline"
                  style={{ width: '100%', color: '#dc2626', borderColor: '#fca5a5', background: '#fef2f2' }}
                >
                  Cancel Order
                </button>
              )}
            </div>

            {/* Notes */}
            {selected.notes && (
              <>
                <DrawerSection title="Notes" />
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569' }}>{selected.notes}</p>
              </>
            )}
          </>
        )}

        {/* Return / Exchange Form */}
        {selected && returnModalOpen && (
          <form onSubmit={handleReturnSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <DrawerSection title="Request Return or Exchange (On behalf of Student)" />
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', border: `1.5px solid ${returnType === 'return' ? '#4f46e5' : '#e2e8f0'}`, background: returnType === 'return' ? '#eef2ff' : 'white', padding: '1rem', borderRadius: '10px', cursor: 'pointer' }}>
                <input type="radio" checked={returnType === 'return'} onChange={() => setReturnType('return')} style={{ accentColor: '#4f46e5' }} />
                <span style={{ fontWeight: 600 }}>Refund</span>
              </label>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', border: `1.5px solid ${returnType === 'exchange' ? '#4f46e5' : '#e2e8f0'}`, background: returnType === 'exchange' ? '#eef2ff' : 'white', padding: '1rem', borderRadius: '10px', cursor: 'pointer' }}>
                <input type="radio" checked={returnType === 'exchange'} onChange={() => setReturnType('exchange')} style={{ accentColor: '#4f46e5' }} />
                <span style={{ fontWeight: 600 }}>Exchange</span>
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Reason for {returnType}</label>
              <textarea 
                value={returnReason} onChange={(e) => setReturnReason(e.target.value)} required
                placeholder="Please describe why the student wants to return or exchange..." 
                style={{ width: '100%', minHeight: '80px', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: 'inherit' }} 
              />
            </div>

            {returnType === 'exchange' && (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Replacement Size</label>
                  <input type="text" value={exchangeSize} onChange={(e) => setExchangeSize(e.target.value)} placeholder="e.g. 34, M" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Replacement Color</label>
                  <input type="text" value={exchangeColor} onChange={(e) => setExchangeColor(e.target.value)} placeholder="(Optional)" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button 
                type="button" onClick={() => setReturnModalOpen(false)}
                style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.875rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="submit" disabled={submittingReturn}
                style={{ flex: 2, background: '#4f46e5', color: 'white', border: 'none', padding: '0.875rem', borderRadius: '10px', fontWeight: 700, cursor: submittingReturn ? 'not-allowed' : 'pointer', opacity: submittingReturn ? 0.7 : 1 }}
              >
                {submittingReturn ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}
      </Drawer>
    </div>
  );
}
