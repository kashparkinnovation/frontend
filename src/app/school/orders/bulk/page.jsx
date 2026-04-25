'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import Drawer, { DrawerRow, DrawerSection } from '@/components/ui/Drawer';
import { useToast } from '@/context/ToastContext';

export default function BulkOrdersListPage() {
  const [bulkOrders, setBulkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await apiClient.get('/orders/school/bulk/');
        setBulkOrders(Array.isArray(data) ? data : (data.results ?? []));
      } catch {
        showToast('Failed to load bulk orders', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [showToast]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Bulk Orders</h1>
        <Link href="/school/orders/bulk/new" className="btn btn-primary">+ New Bulk Order</Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bulk Order No</th>
                  <th>Date</th>
                  <th>Vendor</th>
                  <th>Total Orders</th>
                  <th>Total Amount</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {bulkOrders.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No bulk orders placed yet.</td></tr>
                ) : bulkOrders.map((bo) => (
                  <tr key={bo.id} onClick={() => setSelected(bo)}>
                    <td style={{ fontWeight: 600, color: 'var(--color-primary)', fontFamily: 'monospace' }}>{bo.bulk_order_number}</td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{new Date(bo.created_at).toLocaleDateString()}</td>
                    <td>{bo.vendor_name}</td>
                    <td style={{ fontWeight: 500 }}>{bo.total_orders} orders</td>
                    <td style={{ fontWeight: 600 }}>₹{parseFloat(bo.total_amount).toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bo.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.bulk_order_number ?? ''} subtitle={`${selected?.total_orders} individual orders`}>
        {selected && (
          <>
            <DrawerSection title="Bulk Order Summary" />
            <DrawerRow label="Order Number" value={<span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selected.bulk_order_number}</span>} />
            <DrawerRow label="Vendor" value={selected.vendor_name} />
            <DrawerRow label="Total Orders" value={`${selected.total_orders} student orders`} />
            <DrawerRow label="Total Amount" value={<strong>₹{parseFloat(selected.total_amount).toLocaleString('en-IN')}</strong>} />
            <DrawerRow label="Placed On" value={new Date(selected.created_at).toLocaleString()} />
            {selected.notes && (
              <>
                <DrawerSection title="Notes" />
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{selected.notes}</p>
              </>
            )}
            <div className="drawer-actions">
              <button className="btn btn-primary" onClick={() => { setSelected(null); router.push(`/school/orders/bulk/${selected.id}`); }}>
                View All Sub-Orders →
              </button>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}
