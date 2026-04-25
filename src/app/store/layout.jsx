'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useStudent } from '@/context/StudentContext';
import { useCart } from '@/context/CartContext';
import apiClient from '@/lib/api';

export default function StoreLayout({ children }) {
  const { isAuthenticated, isLoading: authLoading, logout, user } = useAuth();
  const { students, activeStudent, setActiveStudent, setStudents, refreshNeeded } = useStudent();
  const { totalItems } = useCart();
  const router = useRouter();

  // Auth guard — redirect if not logged in as student
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?next=/store');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load student profiles on mount and whenever refresh is triggered
  useEffect(() => {
    if (!isAuthenticated) return;
    apiClient.get('/students/').then((r) => {
      const list = r.data.results ?? r.data;
      setStudents(list);
    }).catch(console.error);
  }, [isAuthenticated, refreshNeeded, setStudents]);

  if (authLoading || !isAuthenticated) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#94a3b8', fontFamily: 'var(--font-sans)' }}>Loading…</div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'var(--font-sans)' }}>
      {/* Top nav */}
      <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgb(0 0 0/0.05)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Brand */}
          <Link href="/store" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <span style={{ fontSize: '1.5rem' }}>🎓</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#4f46e5' }}>eSchoolKart</span>
          </Link>

          {/* Nav links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {[
              { label: 'Home', href: '/store' },
              { label: 'My Students', href: '/store/students' },
              { label: 'My Orders', href: '/store/orders' },
              { label: 'Returns', href: '/store/returns' },
            ].map(({ label, href }) => (
              <Link key={href} href={href} style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500, textDecoration: 'none', padding: '0.4rem 0.75rem', borderRadius: '6px' }}>
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Active student selector */}
            {students.length > 0 && (
              <div style={{ position: 'relative' }}>
                <select
                  value={activeStudent?.id ?? ''}
                  onChange={(e) => {
                    const found = students.find((s) => s.id === Number(e.target.value));
                    setActiveStudent(found ?? null);
                  }}
                  style={{ padding: '0.4rem 2rem 0.4rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 600, background: 'white', cursor: 'pointer', color: '#0f172a', appearance: 'none' }}
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.student_name} {s.is_verified ? '✅' : '⏳'}</option>
                  ))}
                </select>
                <span style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b', fontSize: '0.75rem' }}>▾</span>
              </div>
            )}

            {/* Cart */}
            <Link href="/store/cart" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.375rem', background: '#eef2ff', color: '#4f46e5', padding: '0.4rem 0.875rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>
              🛒
              {totalItems > 0 && (
                <span style={{ background: '#4f46e5', color: 'white', borderRadius: '9999px', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>{totalItems}</span>
              )}
            </Link>

            {/* Avatar / Logout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link href="/store/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                  {user?.first_name?.charAt(0) ?? user?.email?.charAt(0) ?? 'U'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{user?.first_name}</span>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Account Settings</span>
                </div>
              </Link>
              <div style={{ width: '1px', height: '20px', background: '#e2e8f0' }} />
              <button onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8125rem', color: '#ef4444', fontWeight: 600 }}>Logout</button>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {children}
      </main>
    </div>
  );
}
