'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import type { Order } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import Drawer, { DrawerRow, DrawerSection } from '@/components/ui/Drawer';
import { useToast } from '@/context/ToastContext';

const ORDER_STATUSES = ['pending','confirmed','processing','shipped','delivered','cancelled','refunded'];

export default function VendorOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (statusFilter) params.status = statusFilter;
    apiClient.get('/orders/', { params })
      .then((r) => setOrders(r.data.results ?? r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const openDrawer = (order: Order) => {
    setSelected(order);
    setNewStatus(order.status);
  };

  const updateStatus = async () => {
    if (!selected) return;
    setUpdating(true);
    try {
      await apiClient.patch(`/orders/${selected.id}/status/`, { status: newStatus });
      const updated = { ...selected, status: newStatus } as Order;
      setOrders((prev) => prev.map((o) => o.id === selected.id ? updated : o));
      setSelected(updated);
      showToast('Order status updated', 'success');
    } catch {
      showToast('Failed to update status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Orders</h1>
      </div>

      <div className="filters-row">
        <select className="select" style={{ width: 'auto' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <span className="spinner dark" style={{ width: '2rem', height: '2rem' }} />
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛒</div>
            <p className="empty-state-title">No orders yet</p>
            <p className="empty-state-desc">Orders placed by students will appear here</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Student</th>
                  <th>School</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} onClick={() => openDrawer(order)}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{order.order_number}</span></td>
                    <td>{order.student_name}</td>
                    <td>{order.school_name}</td>
                    <td>{order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}</td>
                    <td><strong>₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</strong></td>
                    <td><StatusBadge status={order.status} /></td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
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
            <DrawerSection title="Order Details" />
            <DrawerRow label="Order #" value={<span style={{ fontFamily: 'monospace' }}>{selected.order_number}</span>} />
            <DrawerRow label="Student" value={selected.student_name} />
            <DrawerRow label="School" value={selected.school_name} />
            <DrawerRow label="Date" value={new Date(selected.created_at).toLocaleString('en-IN')} />
            <DrawerRow label="Total" value={<strong>₹{parseFloat(selected.total_amount).toLocaleString('en-IN')}</strong>} />
            <DrawerRow label="Current Status" value={<StatusBadge status={selected.status} />} />

            {selected.items && selected.items.length > 0 && (
              <>
                <DrawerSection title="Items" />
                {selected.items.map((item: any, i: number) => (
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

            {selected.shipping_address && (
              <>
                <DrawerSection title="Shipping Address" />
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  {selected.shipping_name}<br />
                  {selected.shipping_address}<br />
                  {selected.shipping_city}, {selected.shipping_state} — {selected.shipping_pincode}<br />
                  📞 {selected.shipping_phone}
                </p>
              </>
            )}

            <DrawerSection title="Update Status" />
            <select className="select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={{ marginBottom: '0' }}>
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>

            <div className="drawer-actions" style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={updateStatus} disabled={updating || newStatus === selected.status} style={{ flex: 1 }}>
                {updating ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Updating…</> : 'Update Status'}
              </button>
              <button 
                onClick={() => window.open(`/vendor/orders/${selected.id}/print`, '_blank')} 
                style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                🖨️ Print Invoice & Label
              </button>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}
