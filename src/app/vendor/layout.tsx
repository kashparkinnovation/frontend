'use client';

import React from 'react';
import Sidebar from '@/components/ui/Sidebar';
import { useRouteGuard } from '@/hooks/useRouteGuard';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import styles from '../portal.module.css';

const vendorNavItems = [
  { label: 'Dashboard',  href: '/vendor',              icon: '📊' },
  { label: 'Schools',    href: '/vendor/schools',      icon: '🏫' },
  { label: 'Products',   href: '/vendor/products',     icon: '👕' },
  { label: 'Inventory',  href: '/vendor/inventory',    icon: '📦' },
  { label: 'Orders',     href: '/vendor/orders',       icon: '🛒' },
  { label: 'Returns',    href: '/vendor/returns',      icon: '↩️' },
  { label: 'Customers',  href: '/vendor/customers',    icon: '👥' },
  { label: 'Coupons',    href: '/vendor/coupons',      icon: '🏷️' },
  { label: 'Analytics',  href: '/vendor/analytics',    icon: '📈' },
  { label: 'Billing',    href: '/vendor/billing',      icon: '🧾' },
  { label: 'Profile',    href: '/vendor/profile',      icon: '⚙️' },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  useIdleTimeout();
  const { isLoading } = useRouteGuard(['vendor']);
  if (isLoading) return <div className={styles.loadingScreen}>Loading…</div>;

  return (
    <div className={styles.portalContainer}>
      <Sidebar navItems={vendorNavItems} portalTitle="Vendor Portal" />
      <main className={styles.portalMain}>{children}</main>
    </div>
  );
}
