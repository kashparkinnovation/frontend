'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface MonthlyRevenue { month: string; revenue: number; }
interface StatusBreakdown { [key: string]: number; }
interface TopProduct { product_name: string; total_revenue: number; total_qty: number; }
interface TopSchool { school: string; revenue: number; orders: number; }

interface AnalyticsData {
  monthly_revenue: MonthlyRevenue[];
  status_breakdown: StatusBreakdown;
  top_products: TopProduct[];
  top_schools: TopSchool[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', confirmed: '#3b82f6', processing: '#8b5cf6',
  shipped: '#06b6d4', delivered: '#10b981', cancelled: '#ef4444', refunded: '#6b7280',
};

function BarChart({ data }: { data: MonthlyRevenue[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(0)}K` : `₹${n}`;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '160px', padding: '0 0.5rem' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', height: '100%', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{fmt(d.revenue)}</span>
          <div
            style={{
              width: '100%',
              height: `${Math.max((d.revenue / max) * 120, d.revenue > 0 ? 4 : 1)}px`,
              background: d.revenue > 0 ? 'linear-gradient(to top, #4f46e5, #818cf8)' : '#e2e8f0',
              borderRadius: '4px 4px 0 0',
              transition: 'height 0.6s ease',
            }}
          />
          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.2 }}>{d.month.split(' ')[0]}</span>
        </div>
      ))}
    </div>
  );
}

export default function VendorAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    apiClient.get('/vendors/analytics/')
      .then((r) => setData(r.data))
      .catch(() => showToast('Failed to load analytics', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const totalRevenue = data?.monthly_revenue.reduce((s, m) => s + m.revenue, 0) ?? 0;
  const totalOrders = data ? Object.values(data.status_breakdown).reduce((a, b) => a + b, 0) : 0;

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <span className="spinner dark" style={{ width: '2rem', height: '2rem' }} />
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Last 6 months performance</span>
      </div>

      {/* Summary KPIs */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <span className="stat-icon">💰</span>
          <span className="stat-value">{fmt(totalRevenue)}</span>
          <span className="stat-label">Revenue (6 months)</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🛒</span>
          <span className="stat-value">{totalOrders}</span>
          <span className="stat-label">Total Orders</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <span className="stat-value">{data?.status_breakdown['delivered'] ?? 0}</span>
          <span className="stat-label">Delivered</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⏳</span>
          <span className="stat-value">{(data?.status_breakdown['pending'] ?? 0) + (data?.status_breakdown['confirmed'] ?? 0)}</span>
          <span className="stat-label">Pending / Confirmed</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Revenue chart */}
        <div className="card">
          <h2 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 700 }}>Monthly Revenue</h2>
          {data?.monthly_revenue && <BarChart data={data.monthly_revenue} />}
        </div>

        {/* Orders by status */}
        <div className="card">
          <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700 }}>Orders by Status</h2>
          {data?.status_breakdown && Object.entries(data.status_breakdown).length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No orders yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data && Object.entries(data.status_breakdown).map(([s, count]) => {
                const pct = totalOrders ? Math.round((count / totalOrders) * 100) : 0;
                return (
                  <div key={s}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem', fontSize: '0.8rem' }}>
                      <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{s}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ background: '#f1f5f9', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: STATUS_COLORS[s] ?? '#4f46e5', borderRadius: '9999px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Top Products */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Top Products</h2>
          </div>
          {!data?.top_products?.length ? (
            <p style={{ padding: '1.5rem', color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>No sales data yet</p>
          ) : (
            <table className="data-table" style={{ marginTop: 0 }}>
              <thead><tr><th>Product</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
              <tbody>
                {data.top_products.map((p, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{p.product_name}</td>
                    <td>{p.total_qty}</td>
                    <td style={{ fontWeight: 600 }}>₹{Number(p.total_revenue).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Top Schools */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Top Schools by Revenue</h2>
          </div>
          {!data?.top_schools?.length ? (
            <p style={{ padding: '1.5rem', color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>No data yet</p>
          ) : (
            <table className="data-table" style={{ marginTop: 0 }}>
              <thead><tr><th>School</th><th>Orders</th><th>Revenue</th></tr></thead>
              <tbody>
                {data.top_schools.map((s, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>🏫 {s.school}</td>
                    <td>{s.orders}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(s.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
