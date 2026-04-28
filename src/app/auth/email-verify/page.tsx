'use client';

/**
 * /auth/email-verify
 * Firebase redirects here after the user clicks the magic-link in their email.
 * The EmailOTP component auto-detects the link and handles completion.
 * This page just acts as the landing point and shows a loading state.
 */
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Cookies from 'js-cookie';
import apiClient from '@/lib/api';

export default function EmailVerifyPage() {
  const router = useRouter();

  useEffect(() => {
    const href = window.location.href;
    if (!isSignInWithEmailLink(auth, href)) {
      router.replace('/login');
      return;
    }

    const email = window.localStorage.getItem('emailForSignIn');
    if (!email) {
      // Edge case: different device — redirect to login which will handle
      router.replace('/login');
      return;
    }

    (async () => {
      try {
        const result = await signInWithEmailLink(auth, email, href);
        window.localStorage.removeItem('emailForSignIn');
        const idToken = await result.user.getIdToken();

        // Call backend to get JWT
        const { data } = await apiClient.post('/auth/otp/email-login/', { id_token: idToken });
        Cookies.set('access_token', data.access,        { expires: 1 / 24 });
        Cookies.set('refresh_token', data.refresh,      { expires: 7 });
        Cookies.set('user', JSON.stringify(data.user),  { expires: 7 });

        const redirects: Record<string, string> = {
          admin: '/admin', vendor: '/vendor', school: '/school', student: '/',
        };
        router.replace(redirects[data.user.role] ?? '/');
      } catch {
        router.replace('/login?error=email-link-failed');
      }
    })();
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column', gap: '1rem',
    }}>
      <div style={{
        width: 48, height: 48, border: '4px solid #e5e7eb',
        borderTopColor: 'var(--color-primary, #4f46e5)',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: '#6b7280', fontWeight: 500 }}>Verifying your email link…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
