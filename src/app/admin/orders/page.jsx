'use client';

import React, { useEffect, useState } from 'react';
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
  const [schools, setSchools] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);
  const { showToast } = useToast();

  const fetchData = React.useCallback(async () => {
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

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdating(true);
    try {
      const { data } = await apiClient.patch(`/orders/${orderId}/update-status/`, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === data.id ? data : o));
      setSelected(data);
      showToast('Order status updated', 'success');
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Update failed', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Global Orders Management</h1>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Order Status</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="form-input">
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>School</label>
          <select value={schoolFilter} onChange={(e) => setSchoolFilter(e.target.value)} className="form-input">
            <option value="">All Schools</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Vendor</label>
          <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)} className="form-input">
            <option value="">All Vendors</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.business_name}</option>)}
          </select>
        </div>
      </div>

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
                  <th>School</th>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No orders matching filters.</td></tr>
                ) : orders.map(o => (
                  <tr key={o.id} onClick={() => setSelected(o)}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{o.order_number}</td>
                    <td>{o.student_name}</td>
                    <td><span style={{ fontSize: '0.8rem' }}>{o.school_name}</span></td>
                    <td><span style={{ fontSize: '0.8rem' }}>{o.vendor_name}</span></td>
                    <td>₹{parseFloat(o.total_amount).toLocaleString('en-IN')}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td style={{ color: '#64748b', fontSize: '0.75rem' }}>{new Date(o.created_at).toLocaleDateString()}</td>
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
        title={`Order Details: ${selected?.order_number}`}
        subtitle={`Student: ${selected?.student_name}`}
      >
        {selected && (
          <>
            <DrawerSection title="Overview" />
            <DrawerRow label="Status" value={<StatusBadge status={selected.status} />} />
            <DrawerRow label="School" value={selected.school_name} />
            <DrawerRow label="Vendor" value={selected.vendor_name} />
            <DrawerRow label="Amount" value={<strong>₹{parseFloat(selected.total_amount).toLocaleString('en-IN')}</strong>} />
            <DrawerRow label="Date" value={new Date(selected.created_at).toLocaleString()} />
            
            <DrawerSection title="Admin Controls" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Override Status</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select 
                  className="form-input" 
                  value={selected.status}
                  onChange={(e) => handleUpdateStatus(selected.id, e.target.value)}
                  disabled={updating}
                >
                  {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                * Changing status here will bypass standard validation. Use with caution.
              </p>
            </div>

            <DrawerSection title="Items" />
            {selected.items?.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{item.product_name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.size} / {item.color} x {item.quantity}</div>
                </div>
                <div style={{ fontWeight: 600 }}>₹{item.unit_price}</div>
              </div>
            ))}
            
            <div className="drawer-actions">
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
                  } catch (err) { showToast('Invoice failed', 'error'); }
                }}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                📄 Invoice
              </button>
              <button 
                onClick={async () => {
                  try {
                    const res = await apiClient.get(`/orders/${selected.id}/delivery-slip/`, { responseType: 'blob' });
                    const url = window.URL.createObjectURL(new Blob([res.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `Slip_${selected.order_number}.pdf`);
                    document.body.appendChild(link);
                    link.click();
                    link.parentNode?.removeChild(link);
                  } catch (err) { showToast('Slip failed', 'error'); }
                }}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                🏷️ Slip
              </button>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}
