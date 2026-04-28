'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import PhoneOTP from '@/components/auth/PhoneOTP';
import styles from './auth.module.css';

export default function LoginPage() {
  const { login, loginWithOTP } = useAuth();
  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerified = async (idToken: string) => {
    setError('');
    setLoading(true);
    try {
      await loginWithOTP(idToken);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'OTP verification failed on backend. Please sign up if you don\'t have an account.');
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
        <h2 className={styles.heading}>Welcome back</h2>
        <p className={styles.subheading}>Sign in to your account</p>

        {/* Tab Selector for Auth Method */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '0.5rem'
        }}>
          <button
            type="button"
            onClick={() => setAuthMethod('password')}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              fontWeight: 600,
              color: authMethod === 'password' ? 'var(--color-primary)' : '#6b7280',
              borderBottom: authMethod === 'password' ? '2px solid var(--color-primary)' : 'none',
              paddingBottom: '0.5rem',
              cursor: 'pointer'
            }}
          >
            Password
          </button>
          <button
            id="otp-tab"
            type="button"
            onClick={() => setAuthMethod('otp')}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              fontWeight: 600,
              color: authMethod === 'otp' ? 'var(--color-primary)' : '#6b7280',
              borderBottom: authMethod === 'otp' ? '2px solid var(--color-primary)' : 'none',
              paddingBottom: '0.5rem',
              cursor: 'pointer'
            }}
          >
            Phone OTP
          </button>
        </div>

        {error && <div className={styles.errorMsg}>{error}</div>}

        {authMethod === 'password' ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email address</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className={styles.label}>Password</label>
                <Link
                  href="/forgot-password"
                  style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textDecoration: 'underline' }}
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button id="login-btn" type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        ) : (
          <PhoneOTP onVerified={handleOTPVerified} buttonText="Sign In" />
        )}

        <p className={styles.switchLink}>
          Don&apos;t have an account?{' '}
          <Link href="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
