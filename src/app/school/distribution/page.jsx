'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';
import Drawer, { DrawerRow, DrawerSection } from '@/components/ui/Drawer';
import { useToast } from '@/context/ToastContext';

export default function DistributionPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ready_for_pickup');
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const { showToast } = useToast();

  const fetchOrders = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/orders/school/?distribution_status=${filter}`);
      setOrders(Array.isArray(data) ? data : (data.results ?? []));
    } catch {
      showToast('Failed to load distribution list', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, showToast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateDistribution = async (id, newStatus) => {
    setActionLoading(id);
    try {
      const { data } = await apiClient.patch(`/orders/school/${id}/distribute/`, { distribution_status: newStatus });
      showToast(newStatus === 'collected' ? 'Marked as Collected' : 'Marked as Returned', 'success');
      setOrders((prev) => prev.filter((o) => o.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch {
      showToast('Action failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const tabs = [
    { key: 'pending', label: 'Pending' },
    { key: 'ready_for_pickup', label: 'Ready for Pickup' },
    { key: 'collected', label: 'Collected' },
    { key: 'returned', label: 'Returned' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Distribution Tracker</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Click any row to manage distribution.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', background: '#f3f4f6', padding: '0.25rem', borderRadius: '8px' }}>
          {tabs.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', background: filter === key ? 'white' : 'transparent', fontWeight: filter === key ? 600 : 400, boxShadow: filter === key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Student</th>
                  <th>Vendor</th>
                  <th>Parcel Status</th>
                  <th>Distribution</th>
                  {filter === 'collected' && <th>Collected At</th>}
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No orders in &quot;{filter.replace(/_/g, ' ')}&quot; status.</td></tr>
                ) : orders.map((order) => (
                  <tr key={order.id} onClick={() => setSelected(order)}>
                    <td style={{ fontWeight: 600 }}>{order.order_number}</td>
                    <td style={{ fontWeight: 500 }}>{order.student_name}</td>
                    <td>{order.vendor_name}</td>
                    <td><StatusBadge status={order.status} /></td>
                    <td><StatusBadge status={order.distribution_status} /></td>
                    {filter === 'collected' && (
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                        {order.distributed_at ? new Date(order.distributed_at).toLocaleString() : '—'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.order_number ?? ''} subtitle={`Student: ${selected?.student_name}`}>
        {selected && (
          <>
            <DrawerSection title="Order Info" />
            <DrawerRow label="Order #" value={<span style={{ fontFamily: 'monospace' }}>{selected.order_number}</span>} />
            <DrawerRow label="Student" value={selected.student_name} />
            <DrawerRow label="Vendor" value={selected.vendor_name} />
            <DrawerRow label="Total" value={<strong>₹{parseFloat(selected.total_amount).toLocaleString('en-IN')}</strong>} />

            <DrawerSection title="Distribution Status" />
            <DrawerRow label="Parcel Status" value={<StatusBadge status={selected.status} />} />
            <DrawerRow label="Distribution" value={<StatusBadge status={selected.distribution_status} />} />
            {selected.distributed_at && (
              <DrawerRow label="Collected At" value={new Date(selected.distributed_at).toLocaleString()} />
            )}

            {(selected.distribution_status === 'ready_for_pickup' || selected.distribution_status === 'pending') && (
              <div className="drawer-actions">
                {selected.distribution_status === 'ready_for_pickup' && (
                  <button onClick={() => updateDistribution(selected.id, 'collected')} disabled={actionLoading === selected.id} className="btn btn-primary">
                    {actionLoading === selected.id ? '…' : '✓ Mark as Collected'}
                  </button>
                )}
                <button onClick={() => updateDistribution(selected.id, 'returned')} disabled={actionLoading === selected.id} className="btn" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                  {actionLoading === selected.id ? '…' : '✕ Mark as Returned'}
                </button>
              </div>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}
