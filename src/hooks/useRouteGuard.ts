'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types';

/**
 * Route guard hook. Call at the top of any portal layout or page.
 * @param allowedRoles - roles allowed to access this route
 */
export function useRouteGuard(allowedRoles: UserRole[]) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (user && !allowedRoles.includes(user.role)) {
      // Redirect to the user's own portal
      const roleRedirects: Record<UserRole, string> = {
        admin: '/admin',
        vendor: '/vendor',
        school: '/school',
        student: '/store',
      };
      router.replace(roleRedirects[user.role]);
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router]);

  return { user, isLoading };
}
