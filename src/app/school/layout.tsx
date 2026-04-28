'use client';

import React from 'react';
import Sidebar from '@/components/ui/Sidebar';
import { useRouteGuard } from '@/hooks/useRouteGuard';
import styles from '../portal.module.css';

const schoolNavItems = [
  { label: 'Dashboard',    href: '/school',               icon: '📊' },
  { label: 'Students',     href: '/school/students',      icon: '👨‍🎓' },
  { label: 'Verification', href: '/school/verification',  icon: '🛡️' },
  { label: 'Orders',       href: '/school/orders',        icon: '🛒' },
  { label: 'Bulk Orders',  href: '/school/orders/bulk',   icon: '📦' },
  { label: 'Distribution', href: '/school/distribution',  icon: '🔄' },
  { label: 'Profile',      href: '/school/profile',       icon: '🏫' },
  { label: 'Vendor Requests', href: '/school/vendor-requests', icon: '🤝' },
];

export default function SchoolLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useRouteGuard(['school']);
  if (isLoading) return <div className={styles.loadingScreen}>Loading…</div>;

  return (
    <div className={styles.portalContainer}>
      <Sidebar navItems={schoolNavItems} portalTitle="School Portal" />
      <main className={styles.portalMain}>{children}</main>
    </div>
  );
}
