'use client';

import React, { useState } from 'react';
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  ActionCodeSettings,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface EmailOTPProps {
  onVerified: (idToken: string) => void;
  /** Called just before the sign-in link email is sent — use to store intent data in localStorage */
  onBeforeSend?: () => void;
  buttonText?: string;
}

export default function EmailOTP({ onVerified, onBeforeSend, buttonText = 'Continue' }: EmailOTPProps) {
  const [email, setEmail]         = useState('');
  const [sent, setSent]           = useState(false);
  const [manualEmail, setManualEmail] = useState(''); // fallback for different-device scenario
  const [needManual, setNeedManual]   = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Redirect URL — always point to the dedicated verify page
  const getActionCodeSettings = (): ActionCodeSettings => ({
    url: typeof window !== 'undefined'
      ? `${window.location.origin}/auth/email-verify`
      : 'http://localhost:3000/auth/email-verify',
    handleCodeInApp: true,
  });

  // ── Phase 1: send the magic link ──────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      // Let parent store any intent data before we send
      onBeforeSend?.();
      await sendSignInLinkToEmail(auth, email, getActionCodeSettings());
      window.localStorage.setItem('emailForSignIn', email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Phase 2: complete sign-in (called from the "I've clicked it" button) ──
  const completeSignIn = async (targetEmail: string) => {
    const href = window.location.href;
    if (!isSignInWithEmailLink(auth, href)) {
      setError('No valid sign-in link found. Please open the link directly from your email on this device.');
      return;
    }

    setVerifying(true);
    try {
      const result = await signInWithEmailLink(auth, targetEmail, href);
      window.localStorage.removeItem('emailForSignIn');
      const idToken = await result.user.getIdToken();
      onVerified(idToken);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Try sending a new link.');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyClick = async () => {
    setError('');
    const savedEmail = window.localStorage.getItem('emailForSignIn') || email;
    if (savedEmail) {
      await completeSignIn(savedEmail);
    } else {
      // Different device — ask for email
      setNeedManual(true);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!manualEmail) { setError('Please enter your email address.'); return; }
    await completeSignIn(manualEmail);
  };

  // ── Auto-detect sign-in link on mount (same-browser scenario) ─────────────
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isSignInWithEmailLink(auth, window.location.href)) return;

    const savedEmail = window.localStorage.getItem('emailForSignIn');
    if (savedEmail) {
      setEmail(savedEmail);
      setSent(true);
      // Auto-complete
      (async () => {
        setVerifying(true);
        try {
          const result = await signInWithEmailLink(auth, savedEmail, window.location.href);
          window.localStorage.removeItem('emailForSignIn');
          const idToken = await result.user.getIdToken();
          onVerified(idToken);
        } catch (err: any) {
          setError(err.message || 'Auto-verification failed. Please click "Verify" manually.');
        } finally {
          setVerifying(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {error && (
        <div style={{
          background: '#fee2e2', color: '#991b1b', fontSize: '0.875rem',
          padding: '0.625rem 0.875rem', borderRadius: '0.5rem',
          border: '1px solid #fecaca', marginBottom: '1rem',
        }}>
          {error}
        </div>
      )}

      {/* ── Phase 1: Email input ── */}
      {!sent ? (
        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label htmlFor="email-otp-input"
              style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary, #374151)' }}>
              Email address
            </label>
            <input
              id="email-otp-input" type="email" placeholder="you@example.com"
              className="input" value={email} onChange={(e) => setEmail(e.target.value)}
              required autoComplete="email"
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #6b7280)' }}>
              We&apos;ll send a one-time magic link to your inbox
            </span>
          </div>
          <button id="send-email-otp-btn" type="submit" className="btn btn-primary"
            style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Sending…' : '✉️  Send Magic Link'}
          </button>
        </form>

      /* ── Phase 2: Waiting / manual verify ── */
      ) : needManual ? (
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0 }}>
            Please enter the email you used to receive the link:
          </p>
          <input type="email" className="input" placeholder="you@example.com"
            value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} required />
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={verifying}>
            {verifying ? 'Verifying…' : buttonText}
          </button>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            background: '#eff6ff', border: '1px solid #bfdbfe',
            borderRadius: '0.5rem', padding: '1rem',
            display: 'flex', flexDirection: 'column', gap: '0.5rem',
          }}>
            <p style={{ margin: 0, fontWeight: 700, color: '#1e40af', fontSize: '0.95rem' }}>
              ✉️ Check your inbox!
            </p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151' }}>
              We sent a sign-in link to <strong>{email}</strong>.
              Open it <strong>on this device</strong> and click the link — you&apos;ll be signed in automatically.
            </p>
          </div>

          <button id="verify-email-link-btn" type="button" className="btn btn-primary"
            style={{ width: '100%' }} onClick={handleVerifyClick} disabled={verifying}>
            {verifying ? 'Verifying…' : `${buttonText} — I clicked the link`}
          </button>

          <button type="button"
            onClick={() => { setSent(false); setError(''); setNeedManual(false); }}
            style={{
              background: 'none', border: 'none', color: 'var(--color-primary, #4f46e5)',
              fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', textDecoration: 'underline',
            }}>
            ← Change email / resend
          </button>
        </div>
      )}
    </div>
  );
}
