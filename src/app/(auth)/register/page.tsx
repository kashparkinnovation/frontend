'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import Cookies from 'js-cookie';
import PhoneOTP from '@/components/auth/PhoneOTP';
import EmailOTP from '@/components/auth/EmailOTP';
import type { AuthTokens } from '@/types';
import styles from '../login/auth.module.css';

type Method = 'password' | 'phone' | 'email';

const TABS: { id: Method; label: string; icon: string }[] = [
  { id: 'password', label: 'Password',   icon: '🔑' },
  { id: 'phone',    label: 'Phone OTP',  icon: '📱' },
  { id: 'email',    label: 'Email Link', icon: '✉️' },
];

function saveAndRedirect(data: AuthTokens, router: ReturnType<typeof useRouter>) {
  Cookies.set('access_token', data.access,        { expires: 1 / 24 });
  Cookies.set('refresh_token', data.refresh,      { expires: 7 });
  Cookies.set('user', JSON.stringify(data.user),  { expires: 7 });
  const redirects: Record<string, string> = {
    admin: '/admin', vendor: '/vendor', school: '/school', student: '/',
  };
  router.push(redirects[data.user.role] ?? '/');
}

export default function RegisterPage() {
  const router = useRouter();
  const [method, setMethod]   = useState<Method>('password');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: '', first_name: '', last_name: '',
    password: '', password2: '',
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleError = (err: any) => {
    const d = err?.response?.data;
    if (typeof d === 'object') {
      setError(Object.values(d).flat().join(' '));
    } else {
      setError('Registration failed. Please try again.');
    }
  };

  // ── Password registration ──────────────────────────────────────────────────
  const handlePasswordRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.password2) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const { data } = await apiClient.post<AuthTokens>('/auth/register/', {
        ...form, role: 'student',
      });
      saveAndRedirect(data, router);
    } catch (err) { handleError(err); }
    finally { setLoading(false); }
  };

  // ── Phone OTP registration ─────────────────────────────────────────────────
  const handlePhoneOTPVerified = async (idToken: string) => {
    setError('');
    if (!form.email || !form.first_name || !form.last_name) {
      setError('Please fill in your name and email above first.'); return;
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post<AuthTokens>('/auth/otp/register/', {
        id_token: idToken,
        email:      form.email,
        first_name: form.first_name,
        last_name:  form.last_name,
        role: 'student',
      });
      saveAndRedirect(data, router);
    } catch (err) { handleError(err); }
    finally { setLoading(false); }
  };

  // ── Email OTP registration ─────────────────────────────────────────────────
  const handleEmailOTPVerified = async (idToken: string) => {
    setError('');
    if (!form.first_name || !form.last_name) {
      setError('Please fill in your name above first.'); return;
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post<AuthTokens>('/auth/otp/email-register/', {
        id_token:   idToken,
        first_name: form.first_name,
        last_name:  form.last_name,
        role: 'student',
      });
      saveAndRedirect(data, router);
    } catch (err) { handleError(err); }
    finally { setLoading(false); }
  };

  const nameFields = (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
      <div className={styles.formGroup}>
        <label className={styles.label}>First Name</label>
        <input name="first_name" className="input" placeholder="Ravi"
          value={form.first_name} onChange={handleChange} required />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label}>Last Name</label>
        <input name="last_name" className="input" placeholder="Sharma"
          value={form.last_name} onChange={handleChange} required />
      </div>
    </div>
  );

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        {/* Logo */}
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🎓</span>
          <h1 className={styles.logoText}>eSchoolKart</h1>
        </div>
        <h2 className={styles.heading}>Create account</h2>
        <p className={styles.subheading}>Join as a Parent / Student</p>

        {/* 3-tab selector */}
        <div style={{
          display: 'flex', borderBottom: '2px solid #e5e7eb',
          marginBottom: '1.5rem',
        }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              id={`tab-${t.id}`}
              onClick={() => { setMethod(t.id); setError(''); }}
              style={{
                flex: 1, background: 'none', border: 'none',
                fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
                paddingBottom: '0.625rem', paddingTop: '0.25rem',
                color: method === t.id ? 'var(--color-primary, #4f46e5)' : '#6b7280',
                borderBottom: method === t.id
                  ? '2px solid var(--color-primary, #4f46e5)' : '2px solid transparent',
                marginBottom: '-2px', whiteSpace: 'nowrap',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {error && <div className={styles.errorMsg}>{error}</div>}

        {/* ── Password ── */}
        {method === 'password' && (
          <form onSubmit={handlePasswordRegister} className={styles.form}>
            {nameFields}
            <div className={styles.formGroup}>
              <label className={styles.label}>Email address</label>
              <input name="email" type="email" className="input"
                placeholder="you@example.com" value={form.email}
                onChange={handleChange} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Password</label>
              <input name="password" type="password" className="input"
                placeholder="Min 8 characters" value={form.password}
                onChange={handleChange} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Confirm Password</label>
              <input name="password2" type="password" className="input"
                placeholder="••••••••" value={form.password2}
                onChange={handleChange} required />
            </div>
            <button id="register-btn" type="submit" className="btn btn-primary"
              style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        )}

        {/* ── Phone OTP ── */}
        {method === 'phone' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {nameFields}
            <div className={styles.formGroup}>
              <label className={styles.label}>Email address</label>
              <input name="email" type="email" className="input"
                placeholder="you@example.com" value={form.email}
                onChange={handleChange} required />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                Verify your mobile number
              </p>
              <PhoneOTP onVerified={handlePhoneOTPVerified} buttonText="Register" />
            </div>
          </div>
        )}

        {/* ── Email magic-link OTP ── */}
        {method === 'email' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {nameFields}
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                Verify your email address
              </p>
              <EmailOTP onVerified={handleEmailOTPVerified} buttonText="Register" />
            </div>
          </div>
        )}

        <p className={styles.switchLink}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
