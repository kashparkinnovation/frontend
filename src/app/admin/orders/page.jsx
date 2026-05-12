'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';
import Drawer, { DrawerRow, DrawerSection } from '@/components/ui/Drawer';
import { useToast } from '@/context/ToastContext';

const ORDER_STATUSES = [
  "awaiting_confirmation",
  "processing",
  "shipped",
  "delivered",
  "distributed",
  "cancelled",
  "refunded",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [schools, setSchools] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, schoolsRes, vendorsRes] = await Promise.all([
        apiClient.get(`/orders/?status=${filter}&school=${schoolFilter}&vendor=${vendorFilter}`),
        apiClient.get('/schools/'),
        apiClient.get('/vendors/'),
      ]);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data.results ?? []));
      setSchools(Array.isArray(schoolsRes.data) ? schoolsRes.data : (schoolsRes.data.results ?? []));
      setVendors(Array.isArray(vendorsRes.data) ? vendorsRes.data : (vendorsRes.data.results ?? []));
    } catch (err) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, schoolFilter, vendorFilter, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openDrawer = (order) => {
    setSelected(order);
    setNewStatus(order.status);
  };

  const handleUpdateStatus = async () => {
    if (!selected || !newStatus) return;
    setUpdating(true);
    try {
      const { data } = await apiClient.patch(`/orders/${selected.id}/status/`, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === data.id ? data : o));
      setSelected(data);
      setNewStatus(data.status);
      showToast('Order status updated', 'success');
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Update failed', 'error');
    } finally {
      setUpdating(false);
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

  // Client-side search filtering
  const filteredOrders = orders.filter(o => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.order_number?.toLowerCase().includes(q) ||
      o.student_name?.toLowerCase().includes(q) ||
      o.parent_name?.toLowerCase().includes(q) ||
      o.school_name?.toLowerCase().includes(q) ||
      o.vendor_name?.toLowerCase().includes(q)
    );
  });

  // Summary stats
  const stats = {
    total: orders.length,
    awaiting: orders.filter(o => o.status === 'awaiting_confirmation').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Global Orders Management</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="chip">📦 {stats.total} Total</div>
          {stats.awaiting > 0 && <div className="chip" style={{ background: '#fef3c7', color: '#92400e' }}>⏳ {stats.awaiting} Awaiting</div>}
          {stats.processing > 0 && <div className="chip" style={{ background: '#dbeafe', color: '#1e40af' }}>⚙️ {stats.processing} Processing</div>}
          {stats.shipped > 0 && <div className="chip" style={{ background: '#e0e7ff', color: '#3730a3' }}>🚚 {stats.shipped} Shipped</div>}
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Search</label>
          <div className="search-bar">
            <span>🔍</span>
            <input
              placeholder="Order #, student, parent, school…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: '160px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Status</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="form-input">
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '160px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>School</label>
          <select value={schoolFilter} onChange={(e) => setSchoolFilter(e.target.value)} className="form-input">
            <option value="">All Schools</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '160px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Vendor</label>
          <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)} className="form-input">
            <option value="">All Vendors</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.business_name}</option>)}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <span className="spinner" />
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Student</th>
                  <th>Parent</th>
                  <th>School</th>
                  <th>Vendor</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No orders matching filters.</td></tr>
                ) : filteredOrders.map(o => (
                  <tr key={o.id} onClick={() => openDrawer(o)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{o.order_number}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{o.student_name}</div>
                      {o.student_details && (
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          {o.student_details.class_name}{o.student_details.section ? `-${o.student_details.section}` : ''}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem' }}>{o.parent_name || '—'}</div>
                      {o.parent_phone && <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{o.parent_phone}</div>}
                    </td>
                    <td><span style={{ fontSize: '0.8rem' }}>{o.school_name}</span></td>
                    <td><span style={{ fontSize: '0.8rem' }}>{o.vendor_name}</span></td>
                    <td style={{ textAlign: 'center' }}>{o.items?.length ?? 0}</td>
                    <td style={{ fontWeight: 600 }}>₹{parseFloat(o.total_amount).toLocaleString('en-IN')}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td style={{ color: '#64748b', fontSize: '0.75rem' }}>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Drawer */}
      <Drawer 
        isOpen={!!selected} 
        onClose={() => setSelected(null)} 
        title={`Order ${selected?.order_number}`}
        subtitle={selected?.student_name}
        width="520px"
      >
        {selected && (
          <>
            {/* Overview */}
            <DrawerSection title="Overview" />
            <DrawerRow label="Order #" value={<span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selected.order_number}</span>} />
            <DrawerRow label="Status" value={<StatusBadge status={selected.status} />} />
            <DrawerRow label="Amount" value={<strong style={{ color: '#059669', fontSize: '1.05rem' }}>₹{parseFloat(selected.total_amount).toLocaleString('en-IN')}</strong>} />
            <DrawerRow label="Date" value={new Date(selected.created_at).toLocaleString('en-IN')} />
            <DrawerRow label="Payment" value={`${selected.payment_method?.replace(/_/g, ' ')} (${selected.payment_status})`} />

            {/* Parent Details */}
            <DrawerSection title="Parent / Guardian" />
            <DrawerRow label="Name" value={selected.parent_name || '—'} />
            <DrawerRow label="Phone" value={selected.parent_phone || '—'} />
            <DrawerRow label="Email" value={selected.parent_email || '—'} />

            {/* Student Details */}
            <DrawerSection title="Student Details" />
            <DrawerRow label="Student" value={selected.student_name} />
            {selected.student_details && (
              <>
                <DrawerRow label="Class" value={`${selected.student_details.class_name}${selected.student_details.section ? ` - ${selected.student_details.section}` : ''}`} />
                <DrawerRow label="Roll No" value={selected.student_details.roll_number || '—'} />
              </>
            )}

            {/* School Details */}
            <DrawerSection title="School Details" />
            <DrawerRow label="School" value={selected.school_name} />
            {selected.school_details && (
              <>
                <DrawerRow label="Address" value={[selected.school_details.address, selected.school_details.city, selected.school_details.state, selected.school_details.pincode].filter(Boolean).join(', ')} />
                <DrawerRow label="Phone" value={selected.school_details.contact_phone || '—'} />
              </>
            )}

            {/* Vendor */}
            <DrawerRow label="Vendor" value={selected.vendor_name} />

            {/* Items */}
            <DrawerSection title="Items" />
            {selected.items?.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{item.product_name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {item.size}{item.color ? ` / ${item.color}` : ''} × {item.quantity}
                  </div>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>₹{parseFloat(item.line_total).toLocaleString('en-IN')}</div>
              </div>
            ))}

            {/* Totals */}
            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '2px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                <span>Subtotal</span><span>₹{parseFloat(selected.subtotal).toLocaleString('en-IN')}</span>
              </div>
              {parseFloat(selected.tax_amount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                  <span>Tax</span><span>₹{parseFloat(selected.tax_amount).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700, marginTop: '0.25rem', color: '#0f172a' }}>
                <span>Total</span><span>₹{parseFloat(selected.total_amount).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Shipping Address */}
            {selected.shipping_address && (
              <>
                <DrawerSection title="Shipping Address" />
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569', lineHeight: 1.6 }}>
                  {selected.shipping_name}<br />
                  {selected.shipping_address}<br />
                  {selected.shipping_city}, {selected.shipping_state} — {selected.shipping_pincode}<br />
                  📞 {selected.shipping_phone}
                </p>
              </>
            )}

            {/* Admin Controls */}
            <DrawerSection title="Admin Controls" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Override Status</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select 
                  className="form-input" 
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{ flex: 1 }}
                >
                  {ORDER_STATUSES.map(s => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                  ))}
                </select>
                <button 
                  className="btn btn-primary"
                  onClick={handleUpdateStatus}
                  disabled={updating || newStatus === selected.status}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {updating ? 'Updating…' : 'Update'}
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                ⚠️ Changing status here will bypass standard validation. Use with caution.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="drawer-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button 
                onClick={() => downloadFile(`/orders/${selected.id}/invoice/`, `Invoice_${selected.order_number}.pdf`)}
                className="btn btn-outline"
                style={{ flex: 1, minWidth: '120px' }}
              >
                📄 Invoice
              </button>
              <button 
                onClick={() => downloadFile(`/orders/${selected.id}/delivery-slip/`, `Slip_${selected.order_number}.pdf`)}
                className="btn btn-outline"
                style={{ flex: 1, minWidth: '120px' }}
              >
                🏷️ Delivery Slip
              </button>
              {selected.can_cancel && (
                <button
                  onClick={async () => {
                    if (!confirm('Are you sure you want to cancel this order?')) return;
                    try {
                      const { data } = await apiClient.post(`/orders/${selected.id}/cancel/`);
                      setOrders(prev => prev.map(o => o.id === data.id ? data : o));
                      setSelected(data);
                      showToast('Order cancelled', 'success');
                    } catch (err) {
                      showToast(err?.response?.data?.detail || 'Failed to cancel', 'error');
                    }
                  }}
                  className="btn"
                  style={{ width: '100%', color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', fontWeight: 600 }}
                >
                  ✕ Cancel Order
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
            {selected.cancelled_reason && (
              <>
                <DrawerSection title="Cancellation Reason" />
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#dc2626' }}>{selected.cancelled_reason}</p>
              </>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}
