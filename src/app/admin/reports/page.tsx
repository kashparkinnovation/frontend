'use client';

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface PlatformStats {
  schools: { approved: number; pending: number; rejected: number; total: number };
  vendors: { approved: number; pending: number; total: number };
  students: { total: number; verified: number };
  users: { total: number };
  orders: { total: number; by_status: Record<string, number> };
  revenue: { total: number; this_month: number };
  monthly_revenue: { month: string; revenue: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', confirmed: '#3b82f6', processing: '#8b5cf6',
  shipped: '#06b6d4', delivered: '#10b981', cancelled: '#ef4444', refunded: '#6b7280',
};

function BarChart({ data }: { data: { month: string; revenue: number }[] }) {
  const max = Math.max(...data.map(d => d.revenue), 1);
  const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(0)}K` : `₹${n}`;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: 160, padding: '0 0.5rem' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', height: '100%', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>{fmt(d.revenue)}</span>
          <div style={{ width: '100%', height: `${Math.max((d.revenue / max) * 120, d.revenue > 0 ? 4 : 1)}px`, background: d.revenue > 0 ? 'linear-gradient(to top, #4f46e5, #818cf8)' : '#e2e8f0', borderRadius: '4px 4px 0 0', transition: 'height 0.6s ease' }} />
          <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{d.month.split(' ')[0]}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminReportsPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('access_token');
    fetch(`${API_URL}/admin/stats/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (data.schools) setStats(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const exportCSV = () => {
    if (!stats) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Schools', stats.schools.total],
      ['Approved Schools', stats.schools.approved],
      ['Total Vendors', stats.vendors.total],
      ['Approved Vendors', stats.vendors.approved],
      ['Total Students', stats.students.total],
      ['Verified Students', stats.students.verified],
      ['Total Orders', stats.orders.total],
      ['Total Revenue', stats.revenue.total],
      ['Revenue This Month', stats.revenue.this_month],
      ...Object.entries(stats.orders.by_status).map(([s, c]) => [`Orders (${s})`, c]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), { href: 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv), download: 'platform_report.csv' });
    a.click();
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /></div>;

  if (!stats) return <div style={{ padding: '2rem' }}><p style={{ color: '#64748b' }}>Failed to load platform stats. Please check your connection.</p></div>;

  const totalOrders = Object.values(stats.orders.by_status).reduce((a, b) => a + b, 0);

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 800 }}>Platform Reports</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.875rem' }}>Live data from the database</p>
        </div>
        <button onClick={exportCSV} style={{ background: '#4f46e5', color: 'white', padding: '0.625rem 1.25rem', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>⬇ Export CSV</button>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Schools', value: stats.schools.total, sub: `${stats.schools.approved} approved · ${stats.schools.pending} pending`, color: '#4f46e5' },
          { label: 'Active Vendors', value: stats.vendors.approved, sub: `${stats.vendors.pending} pending approval`, color: '#8b5cf6' },
          { label: 'Verified Students', value: stats.students.verified, sub: `of ${stats.students.total} total profiles`, color: '#06b6d4' },
          { label: 'Total Users', value: stats.users.total, sub: 'across all roles', color: '#10b981' },
          { label: 'Total Orders', value: stats.orders.total, sub: `${fmt(stats.revenue.total)} total revenue`, color: '#f59e0b' },
          { label: 'Revenue This Month', value: fmt(stats.revenue.this_month), sub: 'confirmed + delivered', color: '#ef4444' },
        ].map((kpi, i) => (
          <div key={i} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: kpi.color }} />
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.25rem' }}>{kpi.value}</div>
            <div style={{ fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>{kpi.label}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.25rem' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Revenue Chart */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Monthly Revenue Trend</h3>
          <BarChart data={stats.monthly_revenue} />
        </div>

        {/* Orders by Status */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Orders by Status</h3>
          {totalOrders === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No orders yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.entries(stats.orders.by_status).map(([s, count]) => {
                const pct = Math.round((count / totalOrders) * 100);
                return (
                  <div key={s}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem', fontSize: '0.8rem' }}>
                      <span style={{ textTransform: 'capitalize', fontWeight: 500, color: '#475569' }}>{s}</span>
                      <span style={{ color: '#94a3b8' }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ background: '#f1f5f9', borderRadius: '9999px', height: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: STATUS_COLORS[s] || '#4f46e5', borderRadius: '9999px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Entity Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>🏫 Schools</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Approved</span><strong style={{ color: '#10b981' }}>{stats.schools.approved}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Pending</span><strong style={{ color: '#f59e0b' }}>{stats.schools.pending}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Rejected</span><strong style={{ color: '#ef4444' }}>{stats.schools.rejected}</strong></div>
          </div>
        </div>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>🏢 Vendors</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Approved</span><strong style={{ color: '#10b981' }}>{stats.vendors.approved}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Pending</span><strong style={{ color: '#f59e0b' }}>{stats.vendors.pending}</strong></div>
          </div>
        </div>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>🎓 Students</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Total Profiles</span><strong>{stats.students.total}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Verified</span><strong style={{ color: '#10b981' }}>{stats.students.verified}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Unverified</span><strong style={{ color: '#f59e0b' }}>{stats.students.total - stats.students.verified}</strong></div>
          </div>
        </div>
      </div>

      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
