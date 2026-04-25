'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';
import { useToast } from '@/context/ToastContext';

export default function BulkOrderDetailPage() {
  const { id } = useParams();
  const [bulkOrder, setBulkOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      try {
        const { data } = await apiClient.get(`/orders/school/bulk/${id}/`);
        setBulkOrder(data);
      } catch (err) {
        showToast('Failed to load bulk order detail', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;
  if (!bulkOrder) return <div style={{ padding: '2rem' }}>Order not found.</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <Link href="/school/orders/bulk" style={{ color: 'var(--color-primary)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'inline-block' }}>
            &larr; Back to Bulk Orders
          </Link>
          <h1 className="page-title">Bulk Order {bulkOrder.bulk_order_number}</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Placed on {new Date(bulkOrder.created_at).toLocaleString()}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>₹{bulkOrder.total_amount}</h2>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>{bulkOrder.total_orders} Individual Orders</p>
        </div>
      </div>

      <h2 style={{ fontSize: '1.25rem', margin: '2rem 0 1rem' }}>Split Output Orders</h2>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Student</th>
              <th>Items</th>
              <th>Status</th>
              <th>Distribution</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {bulkOrder.orders?.map((order: any) => (
              <tr key={order.id}>
                <td>
                  <Link href={`/school/orders/${order.id}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                    {order.order_number}
                  </Link>
                </td>
                <td style={{ fontWeight: 500 }}>{order.student_name}</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>
                  {order.items?.map((item: any) => `${item.product_name} (${item.quantity})`).join(', ')}
                </td>
                <td><StatusBadge status={order.status} /></td>
                <td><StatusBadge status={order.distribution_status} /></td>
                <td style={{ fontWeight: 600 }}>₹{order.total_amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
