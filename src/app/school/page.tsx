'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import styles from '../portal.module.css';

interface DashboardStats {
  total_students: number;
  verified_students: number;
  pending_verifications: number;
  total_orders: number;
  active_orders: number;
  ready_for_pickup: number;
  school_name: string;
}

export default function SchoolDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await apiClient.get('/schools/dashboard/');
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch school dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className={styles.loadingScreen}>Loading Dashboard…</div>;
  if (!stats) return <div className="card">Failed to load dashboard.</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">School Dashboard</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Welcome back, {stats.school_name}</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className="card">
          <span className={styles.statIcon}>👨‍🎓</span>
          <p className={styles.statValue}>{stats.total_students}</p>
          <p className={styles.statLabel}>Total Students</p>
        </div>
        <div className="card">
          <span className={styles.statIcon}>✅</span>
          <p className={styles.statValue}>{stats.verified_students}</p>
          <p className={styles.statLabel}>Verified Students</p>
        </div>
        <div className="card">
          <span className={styles.statIcon}>🛒</span>
          <p className={styles.statValue}>{stats.active_orders}</p>
          <p className={styles.statLabel}>Active Orders</p>
        </div>
        <div className="card">
          <span className={styles.statIcon}>📦</span>
          <p className={styles.statValue}>{stats.ready_for_pickup}</p>
          <p className={styles.statLabel}>Ready for Pickup</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Action Required</h2>
          </div>
          {stats.pending_verifications > 0 ? (
            <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: '#b91c1c' }}>
              <strong>{stats.pending_verifications} student verifications</strong> are waiting for your review.
              <div style={{ marginTop: '0.5rem' }}>
                <Link href="/school/verification" style={{ color: '#b91c1c', fontWeight: 600, textDecoration: 'underline' }}>
                  Review Now →
                </Link>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              All caught up! No pending verifications.
            </p>
          )}

          {stats.ready_for_pickup > 0 && (
            <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px', color: '#15803d', marginTop: '1rem' }}>
              <strong>{stats.ready_for_pickup} orders</strong> are ready for distribution to students.
              <div style={{ marginTop: '0.5rem' }}>
                <Link href="/school/distribution" style={{ color: '#15803d', fontWeight: 600, textDecoration: 'underline' }}>
                  Manage Distribution →
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600 }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link href="/school/orders/bulk/new" className="btn btn-primary" style={{ textAlign: 'center', display: 'block' }}>
              + Create Bulk Order
            </Link>
            <Link href="/school/students" className="btn btn-secondary" style={{ textAlign: 'center', display: 'block' }}>
              Manage Students
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
