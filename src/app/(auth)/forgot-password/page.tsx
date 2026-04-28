'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import PhoneOTP from '@/components/auth/PhoneOTP';
import styles from '../login/auth.module.css';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [idToken, setIdToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOTPVerified = (token: string) => {
    setIdToken(token);
    setError('');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== password2) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/otp/forgot-password/', {
        id_token: idToken,
        password,
        password2
      });
      setSuccess('Password updated successfully! You can now log in.');
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: any) {
      const errData = err?.response?.data;
      if (typeof errData === 'object') {
        const msgs = Object.values(errData).flat().join(' ');
        setError(msgs);
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🎓</span>
          <h1 className={styles.logoText}>eSchoolKart</h1>
        </div>
        <h2 className={styles.heading}>Reset password</h2>
        <p className={styles.subheading}>Recover your account using SMS OTP</p>

        {error && <div className={styles.errorMsg}>{error}</div>}
        {success && (
          <div style={{
            background: '#d1fae5',
            color: '#065f46',
            fontSize: '0.875rem',
            padding: '0.625rem 0.875rem',
            borderRadius: '0.375rem',
            border: '1px solid #a7f3d0',
            marginBottom: '1rem'
          }}>
            {success}
          </div>
        )}

        {!idToken ? (
          <div>
            <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '1rem' }}>
              Enter your registered phone number below to receive an OTP.
            </p>
            <PhoneOTP onVerified={handleOTPVerified} buttonText="Verify Phone" />
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className={styles.form}>
            <p style={{ fontSize: '0.875rem', color: '#16a34a', fontWeight: 600, marginBottom: '0.5rem' }}>
              ✓ Phone number verified securely.
            </p>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>New Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Confirm New Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
              />
            </div>

            <button
              id="reset-password-btn"
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading || !!success}
            >
              {loading ? 'Updating password…' : 'Update Password'}
            </button>
          </form>
        )}

        <p className={styles.switchLink}>
          Back to{' '}
          <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
