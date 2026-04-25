'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';
import Drawer, { DrawerRow, DrawerSection } from '@/components/ui/Drawer';
import { useToast } from '@/context/ToastContext';

interface Order {
  id: number;
  order_number: string;
  student_name: string;
  vendor_name: string;
  status: string;
  distribution_status: string;
  total_amount: string;
  subtotal: string;
  items?: { product_name: string; size: string; color: string; quantity: number; unit_price: string }[];
  bulk_order: number | null;
  bulk_order_number: string | null;
  notes: string;
  created_at: string;
  distributed_at: string | null;
}

export default function SchoolOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [distributing, setDistributing] = useState(false);
  const { showToast } = useToast();

  const fetchOrders = async () => {
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
  };

  useEffect(() => { fetchOrders(); }, [filter]);

  const handleDistribute = async (newStatus: 'collected' | 'returned') => {
    if (!selected) return;
    setDistributing(true);
    try {
      const { data } = await apiClient.patch(`/orders/school/${selected.id}/distribute/`, { distribution_status: newStatus });
      setSelected(data);
      setOrders((prev) => prev.map((o) => o.id === data.id ? data : o));
      showToast('Distribution status updated.', 'success');
    } catch {
      showToast('Update failed.', 'error');
    } finally {
      setDistributing(false);
    }
  };

  const tabs = [
    { key: '', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
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
                  <th>Distribution</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No orders found.</td></tr>
                ) : orders.map((o) => (
                  <tr key={o.id} onClick={() => setSelected(o)}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{o.order_number}</td>
                    <td>{o.student_name}</td>
                    <td>{o.vendor_name}</td>
                    <td>₹{parseFloat(o.total_amount).toLocaleString('en-IN')}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td><StatusBadge status={o.distribution_status} /></td>
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
            <DrawerRow label="Distribution" value={<StatusBadge status={selected.distribution_status} />} />
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

            {selected.distribution_status === 'ready_for_pickup' && (
              <div className="drawer-actions">
                <button onClick={() => handleDistribute('collected')} disabled={distributing} className="btn btn-primary">
                  {distributing ? '…' : '✓ Mark as Collected'}
                </button>
                <button onClick={() => handleDistribute('returned')} disabled={distributing} className="btn" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                  {distributing ? '…' : '✕ Mark as Returned'}
                </button>
              </div>
            )}

            <div className="drawer-actions" style={{ borderTop: 'none', paddingTop: 0 }}>
              <Link href={`/school/orders/${selected.id}`} className="btn btn-outline" onClick={() => setSelected(null)}>
                View Full Details →
              </Link>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}
