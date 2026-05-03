'use client';

import React from 'react';
import Sidebar from '@/components/ui/Sidebar';
import { useRouteGuard } from '@/hooks/useRouteGuard';
import { useAuth } from '@/context/AuthContext';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import styles from '../portal.module.css';

const baseAdminNavItems = [
  { label: 'Dashboard',    href: '/admin',          icon: '📊' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  useIdleTimeout();
  const { isLoading } = useRouteGuard(['admin']);
  const { user } = useAuth();
  
  if (isLoading || !user) return <div className={styles.loadingScreen}>Loading…</div>;

  const dynamicNavItems = [...baseAdminNavItems];
  
  // Superadmins or sub-admins with specific flags
  if (user.can_manage_vendors) dynamicNavItems.push({ label: 'Vendors', href: '/admin/vendors', icon: '🏢' });
  if (user.can_manage_schools) dynamicNavItems.push({ label: 'Schools', href: '/admin/schools', icon: '🏫' });
  if (user.can_manage_students) dynamicNavItems.push({ label: 'Students', href: '/admin/students', icon: '🎓' });
  if (user.can_manage_content) {
    dynamicNavItems.push({ label: 'Blog', href: '/admin/blog', icon: '📝' });
    dynamicNavItems.push({ label: 'Static CMS', href: '/admin/cms', icon: '📄' });
  }
  if (user.can_manage_reports) {
    dynamicNavItems.push({ label: 'Audit Logs', href: '/admin/audit', icon: '📋' });
    dynamicNavItems.push({ label: 'Reports', href: '/admin/reports', icon: '📈' });
    dynamicNavItems.push({ label: 'Contact Leads', href: '/admin/leads', icon: '📞' });
  }

  // Always show users management for superadmins or specific roles if needed. We'll simply let all admins see it for now, or maybe only true superusers
  dynamicNavItems.push({ label: 'Admin Users', href: '/admin/users', icon: '🛡️' });
  dynamicNavItems.push({ label: 'Platform Settings', href: '/admin/settings', icon: '⚙️' });

  return (
    <div className={styles.portalContainer}>
      <Sidebar navItems={dynamicNavItems} portalTitle="Admin Panel" />
      <main className={styles.portalMain}>{children}</main>
    </div>
  );
}
