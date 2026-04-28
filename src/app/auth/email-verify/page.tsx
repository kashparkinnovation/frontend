'use client';

/**
 * /auth/email-verify
 * Firebase redirects here after the user clicks the magic-link in their email.
 * Reads intent from localStorage to decide: login or register.
 * If emailForSignIn is missing, shows a prompt instead of redirecting to /login.
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Cookies from 'js-cookie';
import apiClient from '@/lib/api';

const ROLE_REDIRECTS: Record<string, string> = {
  admin: '/admin', vendor: '/vendor', school: '/school', student: '/',
};

export default function EmailVerifyPage() {
  const router = useRouter();
  const [status, setStatus]       = useState<'loading' | 'need-email' | 'error'>('loading');
  const [errorMsg, setErrorMsg]   = useState('');
  const [manualEmail, setManualEmail] = useState('');

  const completeSignIn = async (email: string) => {
    const href = window.location.href;

    try {
      const result = await signInWithEmailLink(auth, email, href);
      window.localStorage.removeItem('emailForSignIn');

      const idToken = await result.user.getIdToken();

      // Decide intent: register or login?
      const signupRaw = window.localStorage.getItem('emailSignupIntent');
      let data;

      if (signupRaw) {
        // ── Signup flow ────────────────────────────────────────────────────
        const intent = JSON.parse(signupRaw);
        window.localStorage.removeItem('emailSignupIntent');

        try {
          const res = await apiClient.post('/auth/otp/email-register/', {
            id_token:   idToken,
            first_name: intent.first_name || 'User',
            last_name:  intent.last_name  || '',
            role:       intent.role       || 'student',
          });
          data = res.data;
        } catch (regErr: any) {
          // If user already exists, fall back to login
          const errData = regErr?.response?.data;
          const msg = typeof errData === 'object'
            ? Object.values(errData).flat().join(' ')
            : 'Registration failed.';

          // If it's a "already exists" error, try login instead
          if (regErr?.response?.status === 400 && msg.includes('already exists')) {
            const res = await apiClient.post('/auth/otp/email-login/', { id_token: idToken });
            data = res.data;
          } else {
            throw new Error(msg);
          }
        }
      } else {
        // ── Login flow ────────────────────────────────────────────────────
        const res = await apiClient.post('/auth/otp/email-login/', { id_token: idToken });
        data = res.data;
      }

      // Persist session
      Cookies.set('access_token', data.access,        { expires: 1 / 24 });
      Cookies.set('refresh_token', data.refresh,      { expires: 7 });
      Cookies.set('user', JSON.stringify(data.user),  { expires: 7 });

      router.replace(ROLE_REDIRECTS[data.user.role] ?? '/');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message || 'Verification failed. Please try again.');
    }
  };

  useEffect(() => {
    const href = window.location.href;

    if (!isSignInWithEmailLink(auth, href)) {
      // Not a sign-in link URL — redirect to login
      router.replace('/login');
      return;
    }

    const savedEmail = window.localStorage.getItem('emailForSignIn');
    if (savedEmail) {
      completeSignIn(savedEmail);
    } else {
      // Different device / browser — ask the user to enter their email
      setStatus('need-email');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail) return;
    setStatus('loading');
    completeSignIn(manualEmail);
  };

  // ── Loading spinner ─────────────────────────────────────────────────────────
  if (status === 'loading') {
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

  // ── Error state ─────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', gap: '1rem', padding: '2rem',
      }}>
        <p style={{ color: '#dc2626', fontWeight: 600, fontSize: '1rem', textAlign: 'center' }}>
          ⚠️ {errorMsg}
        </p>
        <button className="btn btn-primary" onClick={() => router.replace('/login')}>
          Back to Login
        </button>
      </div>
    );
  }

  // ── Need email (different device) ───────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '2rem',
    }}>
      <div style={{
        background: 'white', borderRadius: '1rem', padding: '2rem',
        boxShadow: '0 4px 24px rgba(0,0,0,0.1)', maxWidth: 400, width: '100%',
        display: 'flex', flexDirection: 'column', gap: '1rem',
      }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Confirm your email</h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
          It looks like you opened this link on a different device.
          Please enter the email address you used to request the sign-in link.
        </p>
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            type="email" className="input" placeholder="you@example.com"
            value={manualEmail} onChange={(e) => setManualEmail(e.target.value)}
            required autoFocus
          />
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Verify &amp; Sign In
          </button>
        </form>
        <button type="button" style={{
          background: 'none', border: 'none', color: 'var(--color-primary, #4f46e5)',
          cursor: 'pointer', textDecoration: 'underline', fontSize: '0.875rem',
        }} onClick={() => router.replace('/login')}>
          Back to login
        </button>
      </div>
    </div>
  );
}
