'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import type { VendorDashboard, Order } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';

function StatCard({ icon, value, label, sub }: { icon: string; value: string | number; label: string; sub?: string }) {
  return (
    <div className="stat-card">
      <span className="stat-icon">{icon}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {sub && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{sub}</span>}
    </div>
  );
}

export default function VendorDashboardPage() {
  const [data, setData] = useState<VendorDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/vendors/dashboard/')
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <span className="spinner dark" style={{ width: '2rem', height: '2rem' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/vendor/products/new" className="btn btn-primary btn-sm">+ Add Product</Link>
          <Link href="/vendor/schools/apply" className="btn btn-outline btn-sm">+ Apply for School</Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="stats-grid">
        <StatCard
          icon="🏫"
          value={data?.schools.approved ?? '—'}
          label="Approved Schools"
          sub={data?.schools.pending ? `${data.schools.pending} pending` : undefined}
        />
        <StatCard icon="👕" value={data?.products.active ?? '—'} label="Active Products"
          sub={`${data?.products.total_variants ?? 0} variants`} />
        <StatCard
          icon="🛒"
          value={data?.orders.pending ?? '—'}
          label="Pending Orders"
          sub={data?.orders.processing ? `${data.orders.processing} processing` : undefined}
        />
        <StatCard icon="💰" value={data ? fmt(data.revenue.this_month) : '₹—'} label="Revenue This Month"
          sub={data ? `Total: ${fmt(data.revenue.total)}` : undefined} />
        <StatCard
          icon="📦"
          value={data?.products.low_stock ?? '—'}
          label="Low Stock"
          sub={data?.products.out_of_stock ? `${data.products.out_of_stock} out of stock` : undefined}
        />
      </div>

      {/* Recent orders */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Recent Orders</h2>
          <Link href="/vendor/orders" className="btn btn-ghost btn-sm">View all →</Link>
        </div>

        {!data?.recent_orders?.length ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛒</div>
            <p className="empty-state-title">No orders yet</p>
            <p className="empty-state-desc">Orders from students will appear here</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Student</th>
                  <th>School</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_orders.map((order) => (
                  <tr key={order.id}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{order.order_number}</span></td>
                    <td>{order.student_name}</td>
                    <td>{order.school_name}</td>
                    <td><strong>₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</strong></td>
                    <td><StatusBadge status={order.status} /></td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                      {new Date(order.created_at).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
