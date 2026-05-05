'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';
import Drawer, { DrawerRow, DrawerSection } from '@/components/ui/Drawer';
import { useToast } from '@/context/ToastContext';

export default function SchoolOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [distributing, setDistributing] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnType, setReturnType] = useState('return');
  const [returnReason, setReturnReason] = useState('');
  const [exchangeSize, setExchangeSize] = useState('');
  const [exchangeColor, setExchangeColor] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const { showToast } = useToast();

  const fetchOrders = React.useCallback(async () => {
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
      // Endpoint: PATCH /api/v1/orders/school/{pk}/distribute/
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

  const tabs = [
    { key: '', label: 'All' },
    { key: 'awaiting_confirmation', label: 'Awaiting' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'distributed', label: 'Distributed' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Orders</h1>
        <Link href="/school/orders/bulk" className="btn btn-primary">Bulk Orders</Link>
      </div>

      <div className="tabs" style={{ marginBottom: '1.25rem' }}>
        {tabs.map(({ key, label }) => (
          <button key={key} className={`tab-btn ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>{label}</button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Student</th>
                  <th>Vendor</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No orders found.</td></tr>
                ) : orders.map((o) => (
                  <tr key={o.id} onClick={() => setSelected(o)}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{o.order_number}</td>
                    <td>{o.student_name}</td>
                    <td>{o.vendor_name}</td>
                    <td>₹{parseFloat(o.total_amount).toLocaleString('en-IN')}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer isOpen={!!selected} onClose={() => setSelected(null)} title={`Order ${selected?.order_number ?? ''}`} subtitle={selected?.student_name}>
        {selected && (
          <>
            <DrawerSection title="Summary" />
            <DrawerRow label="Order #" value={<span style={{ fontFamily: 'monospace' }}>{selected.order_number}</span>} />
            <DrawerRow label="Student" value={selected.student_name} />
            <DrawerRow label="Vendor" value={selected.vendor_name} />
            <DrawerRow label="Order Status" value={<StatusBadge status={selected.status} />} />
            <DrawerRow label="Total" value={<strong>₹{parseFloat(selected.total_amount).toLocaleString('en-IN')}</strong>} />
            <DrawerRow label="Date" value={new Date(selected.created_at).toLocaleString()} />
            {selected.bulk_order_number && (
              <DrawerRow label="Bulk Order" value={
                <Link href={`/school/orders/bulk/${selected.bulk_order}`} style={{ color: 'var(--color-primary)' }} onClick={() => setSelected(null)}>
                  {selected.bulk_order_number}
                </Link>
              } />
            )}

            {selected.items && selected.items.length > 0 && (
              <>
                <DrawerSection title="Items" />
                {selected.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{item.product_name}</div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{item.size}{item.color ? ` / ${item.color}` : ''} × {item.quantity}</div>
                    </div>
                    <div style={{ fontWeight: 600 }}>₹{item.unit_price}</div>
                  </div>
                ))}
              </>
            )}

            {selected.status === 'delivered' && (
              <div className="drawer-actions">
                <button onClick={handleMarkAsDistributed} disabled={distributing} className="btn btn-primary" style={{ width: '100%' }}>
                  {distributing ? 'Updating…' : '✓ Mark as Distributed to Student'}
                </button>
              </div>
            )}

            <div className="drawer-actions" style={{ borderTop: 'none', paddingTop: 0, flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                <button 
                  onClick={async () => {
                    try {
                      const res = await apiClient.get(`/orders/${selected.id}/invoice/`, { responseType: 'blob' });
                      const url = window.URL.createObjectURL(new Blob([res.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `Invoice_${selected.order_number}.pdf`);
                      document.body.appendChild(link);
                      link.click();
                      link.parentNode?.removeChild(link);
                    } catch (err) { showToast('Failed to download invoice', 'error'); }
                  }}
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  📄 Download Invoice
                </button>
                <button 
                  onClick={async () => {
                    try {
                      const res = await apiClient.get(`/orders/${selected.id}/delivery-slip/`, { responseType: 'blob' });
                      const url = window.URL.createObjectURL(new Blob([res.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `DeliverySlip_${selected.order_number}.pdf`);
                      document.body.appendChild(link);
                      link.click();
                      link.parentNode?.removeChild(link);
                    } catch (err) { showToast('Failed to download delivery slip', 'error'); }
                  }}
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  🏷️ Download Delivery Slip
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
              <Link href={`/school/orders/${selected.id}`} className="btn btn-outline" onClick={() => setSelected(null)}>
                View Full Details →
              </Link>
              {selected.can_cancel && (
                <button 
                  onClick={async () => {
                    if (!confirm('Are you sure you want to cancel this order?')) return;
                    try {
                      await apiClient.post(`/orders/${selected.id}/cancel/`);
                      showToast('Order cancelled successfully', 'success');
                      setOrders((prev) => prev.map((o) => o.id === selected.id ? { ...o, status: 'cancelled', can_cancel: false } : o));
                      setSelected({ ...selected, status: 'cancelled', can_cancel: false });
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
          </>
        )}

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
