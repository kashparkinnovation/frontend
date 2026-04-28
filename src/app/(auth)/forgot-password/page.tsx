'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import PhoneOTP from '@/components/auth/PhoneOTP';
import EmailOTP from '@/components/auth/EmailOTP';
import styles from '../login/auth.module.css';

type Method = 'phone' | 'email';

export default function ForgotPasswordPage() {
  const router   = useRouter();
  const [method, setMethod]     = useState<Method>('phone');
  const [idToken, setIdToken]   = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);

  const handleOTPVerified = (token: string) => {
    setIdToken(token); setError('');
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== password2) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const endpoint = method === 'phone'
        ? '/auth/otp/forgot-password/'
        : '/auth/otp/email-forgot-password/';
      await apiClient.post(endpoint, { id_token: idToken, password, password2 });
      setSuccess('Password updated! Redirecting to login…');
      setTimeout(() => router.push('/login'), 2500);
    } catch (err: any) {
      const d = err?.response?.data;
      setError(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Reset failed.');
    } finally { setLoading(false); }
  };

  const TAB_STYLE = (active: boolean) => ({
    flex: 1, background: 'none', border: 'none', fontWeight: 600 as const,
    fontSize: '0.85rem', cursor: 'pointer' as const,
    paddingBottom: '0.625rem', paddingTop: '0.25rem',
    color: active ? 'var(--color-primary, #4f46e5)' : '#6b7280',
    borderBottom: active ? '2px solid var(--color-primary, #4f46e5)' : '2px solid transparent',
    marginBottom: '-2px',
  });

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🎓</span>
          <h1 className={styles.logoText}>eSchoolKart</h1>
        </div>
        <h2 className={styles.heading}>Reset password</h2>
        <p className={styles.subheading}>Verify your identity to set a new password</p>

        {error   && <div className={styles.errorMsg}>{error}</div>}
        {success && (
          <div style={{
            background: '#d1fae5', color: '#065f46', fontSize: '0.875rem',
            padding: '0.625rem 0.875rem', borderRadius: '0.5rem',
            border: '1px solid #a7f3d0', marginBottom: '1rem',
          }}>{success}</div>
        )}

        {!idToken ? (
          <>
            {/* Method tabs */}
            <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: '1.5rem' }}>
              <button type="button" id="tab-phone" style={TAB_STYLE(method === 'phone')}
                onClick={() => { setMethod('phone'); setError(''); }}>
                📱 Phone OTP
              </button>
              <button type="button" id="tab-email" style={TAB_STYLE(method === 'email')}
                onClick={() => { setMethod('email'); setError(''); }}>
                ✉️ Email Link
              </button>
            </div>

            {method === 'phone' && (
              <>
                <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '1rem' }}>
                  Enter your registered mobile number to receive an OTP.
                </p>
                <PhoneOTP onVerified={handleOTPVerified} buttonText="Verify Phone" />
              </>
            )}

            {method === 'email' && (
              <>
                <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '1rem' }}>
                  Enter your registered email address to receive a reset link.
                </p>
                <EmailOTP onVerified={handleOTPVerified} buttonText="Verify Email" />
              </>
            )}
          </>
        ) : (
          /* New password form */
          <form onSubmit={handleReset} className={styles.form}>
            <p style={{ fontSize: '0.875rem', color: '#16a34a', fontWeight: 600, marginBottom: '0.5rem' }}>
              ✓ Identity verified securely.
            </p>

            <div className={styles.formGroup}>
              <label className={styles.label}>New Password</label>
              <input type="password" className="input" placeholder="Min 8 characters"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Confirm New Password</label>
              <input type="password" className="input" placeholder="••••••••"
                value={password2} onChange={(e) => setPassword2(e.target.value)} required />
            </div>

            <button id="reset-password-btn" type="submit" className="btn btn-primary"
              style={{ width: '100%' }} disabled={loading || !!success}>
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        )}

        <p className={styles.switchLink}>
          Back to{' '}
          <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
