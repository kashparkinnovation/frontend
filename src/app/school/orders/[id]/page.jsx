'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';
import { useToast } from '@/context/ToastContext';

export default function SchoolOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(false);
  const { showToast } = useToast();

  const fetchOrder = React.useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await apiClient.get(`/orders/school/${id}/`);
      setOrder(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load order detail', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleDistribute = async (newStatus) => {
    if (!order) return;
    setDistributing(true);
    try {
      const { data } = await apiClient.patch(`/orders/school/${order.id}/distribute/`, {
        distribution_status: newStatus,
      });
      setOrder(data);
      showToast('Distribution status updated.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Update failed. Please try again.', 'error');
    } finally {
      setDistributing(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;
  if (!order) return <div style={{ padding: '2rem' }}>Order not found.</div>;

  const canMarkCollected = order.distribution_status === 'ready_for_pickup';
  const canMarkReturned  = ['ready_for_pickup', 'pending'].includes(order.distribution_status);

  return (
    <div>
      <div className="page-header">
        <div>
          <Link
            href="/school/orders"
            style={{ color: 'var(--color-primary)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'inline-block' }}
          >
            &larr; Back to Orders
          </Link>
          <h1 className="page-title">Order {order.order_number}</h1>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <StatusBadge status={order.status} />
            <StatusBadge status={order.distribution_status} />
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>₹{order.total_amount}</h2>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            Placed on {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Items */}
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem' }}>Items List</h2>
          <table className="data-table" style={{ marginTop: '0' }}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Size / Color</th>
                <th>Unit Price</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 500 }}>{item.product_name}</td>
                  <td>{item.size}{item.color ? ` / ${item.color}` : ''}</td>
                  <td>₹{item.unit_price}</td>
                  <td>{item.quantity}</td>
                  <td style={{ fontWeight: 600 }}>₹{item.line_total}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Order total breakdown */}
          <div style={{ marginTop: '1rem', textAlign: 'right', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
            <div>Subtotal: ₹{order.subtotal}</div>
            {parseFloat(order.tax_amount) > 0 && <div>Tax: ₹{order.tax_amount}</div>}
            {parseFloat(order.shipping_amount) > 0 && <div>Shipping: ₹{order.shipping_amount}</div>}
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)', marginTop: '0.25rem' }}>
              Total: ₹{order.total_amount}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Student & Parent Info */}
          <div className="card">
            <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem' }}>Student & Parent Details</h2>
            <p style={{ margin: '0 0 0.5rem' }}><strong>Student:</strong> {order.student_name}</p>
            {order.student_details && (
              <>
                <p style={{ margin: '0 0 0.25rem', fontSize: '0.875rem', color: '#475569' }}>
                  Class: {order.student_details.class_name}{order.student_details.section ? ` - ${order.student_details.section}` : ''}
                </p>
                {order.student_details.roll_number && (
                  <p style={{ margin: '0 0 0.25rem', fontSize: '0.875rem', color: '#475569' }}>Roll No: {order.student_details.roll_number}</p>
                )}
              </>
            )}
            <div style={{ borderTop: '1px solid #f1f5f9', margin: '0.75rem 0', paddingTop: '0.75rem' }}>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Parent / Guardian</p>
              <p style={{ margin: '0 0 0.25rem' }}><strong>{order.parent_name || '—'}</strong></p>
              {order.parent_phone && <p style={{ margin: '0 0 0.125rem', fontSize: '0.875rem', color: '#475569' }}>📞 {order.parent_phone}</p>}
              {order.parent_email && <p style={{ margin: '0', fontSize: '0.875rem', color: '#475569' }}>✉️ {order.parent_email}</p>}
            </div>
            {order.bulk_order_number && (
              <p style={{ margin: '0.75rem 0 0' }}>
                <strong>Part of Bulk Order:</strong>{' '}
                <Link href={`/school/orders/bulk/${order.bulk_order}`} style={{ color: 'var(--color-primary)' }}>
                  {order.bulk_order_number}
                </Link>
              </p>
            )}
          </div>

          {/* Vendor */}
          <div className="card">
            <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem' }}>Vendor</h2>
            <p style={{ margin: 0 }}><strong>{order.vendor_name}</strong></p>
          </div>

          {/* Distribution Actions */}
          <div className="card">
            <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem' }}>Distribution</h2>
            <div style={{ marginBottom: '1rem' }}>
              <StatusBadge status={order.distribution_status} />
              {order.distributed_at && (
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  Collected on {new Date(order.distributed_at).toLocaleString()}
                </p>
              )}
            </div>
            {(canMarkCollected || canMarkReturned) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {canMarkCollected && (
                  <button
                    onClick={() => handleDistribute('collected')}
                    disabled={distributing}
                    className="btn btn-primary"
                    style={{ fontSize: '0.875rem' }}
                  >
                    {distributing ? 'Updating…' : '✓ Mark as Collected'}
                  </button>
                )}
                {canMarkReturned && (
                  <button
                    onClick={() => handleDistribute('returned')}
                    disabled={distributing}
                    className="btn"
                    style={{ fontSize: '0.875rem', background: '#fee2e2', color: '#b91c1c' }}
                  >
                    {distributing ? 'Updating…' : '✕ Mark as Returned'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="card">
              <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem' }}>Notes</h2>
              <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
