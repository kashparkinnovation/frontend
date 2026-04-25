'use client';

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

export default function ImpersonationBanner() {
  const [isAdminImpersonating, setIsAdminImpersonating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleCheck = () => {
      setIsAdminImpersonating(!!Cookies.get('admin_access_token'));
    };
    handleCheck();
    
    // Periodically check just in case, but usually mount is fine.
    const interval = setInterval(handleCheck, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleReturnToAdmin = () => {
    const adminAccess = Cookies.get('admin_access_token');
    const adminRefresh = Cookies.get('admin_refresh_token');
    const adminUser = Cookies.get('admin_user');

    if (adminAccess) {
      Cookies.set('access_token', adminAccess, { path: '/' });
      if (adminRefresh) Cookies.set('refresh_token', adminRefresh, { path: '/' });
      if (adminUser) Cookies.set('user', adminUser, { path: '/' });
      
      Cookies.remove('admin_access_token', { path: '/' });
      Cookies.remove('admin_refresh_token', { path: '/' });
      Cookies.remove('admin_user', { path: '/' });
      
      window.location.href = '/admin';
    }
  };

  if (!isAdminImpersonating) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#ef4444', color: 'white', zIndex: 9999, padding: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', fontWeight: 600, fontSize: '0.875rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
      <span>⚠️ You are currently using Delegate Access (Impersonating).</span>
      <button 
        onClick={handleReturnToAdmin}
        style={{ background: 'white', color: '#ef4444', border: 'none', padding: '0.4rem 1rem', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', transition: 'opacity 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        Return to Admin Panel
      </button>
    </div>
  );
}
