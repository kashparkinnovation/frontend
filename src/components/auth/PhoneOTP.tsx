'use client';

import React, { useState, useEffect, useRef } from 'react';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

interface PhoneOTPProps {
  onVerified: (idToken: string) => void;
  buttonText?: string;
}

export default function PhoneOTP({ onVerified, buttonText = "Submit OTP" }: PhoneOTPProps) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {
          // ignore clear errors on unmount
        }
      }
    };
  }, []);

  const initRecaptcha = () => {
    if (!recaptchaVerifierRef.current && recaptchaContainerRef.current) {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved
          },
          'expired-callback': () => {
            setError('reCAPTCHA expired. Please try again.');
          }
        });
      } catch (err: any) {
        setError(err.message || 'Failed to initialize reCAPTCHA');
      }
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!phone || !phone.startsWith('+')) {
      setError('Please enter a valid phone number with country code (e.g., +919999999999).');
      setLoading(false);
      return;
    }

    try {
      initRecaptcha();
      const appVerifier = recaptchaVerifierRef.current;
      if (!appVerifier) throw new Error('Recaptcha verifier not initialized.');

      const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);
      confirmationResultRef.current = confirmationResult;
      setCodeSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send SMS OTP. Please ensure the phone number is correct.');
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!otp || otp.length < 6) {
      setError('Please enter a valid 6-digit OTP.');
      setLoading(false);
      return;
    }

    try {
      if (!confirmationResultRef.current) {
        throw new Error('Verification session expired. Please resend OTP.');
      }
      
      const result = await confirmationResultRef.current.confirm(otp);
      const user = result.user;
      const idToken = await user.getIdToken();
      
      onVerified(idToken);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div style={{
          background: '#fee2e2',
          color: '#991b1b',
          fontSize: '0.875rem',
          padding: '0.625rem 0.875rem',
          borderRadius: '0.375rem',
          border: '1px solid #fecaca',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      <div ref={recaptchaContainerRef} id="recaptcha-container"></div>

      {!codeSent ? (
        <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary, #374151)' }}>
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="+919999999999"
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #6b7280)' }}>
              Must include country code (e.g., +91 for India)
            </span>
          </div>

          <button
            id="send-otp-btn"
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Sending SMS...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary, #374151)' }}>
              Enter 6-digit OTP
            </label>
            <input
              type="text"
              placeholder="123456"
              maxLength={6}
              className="input"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              style={{
                textAlign: 'center',
                letterSpacing: '0.25rem',
                fontSize: '1.25rem'
              }}
            />
          </div>

          <button
            id="verify-otp-btn"
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Verifying...' : buttonText}
          </button>

          <button
            type="button"
            onClick={() => setCodeSent(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary, #4f46e5)',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              marginTop: '0.5rem',
              textDecoration: 'underline'
            }}
          >
            Change Phone Number
          </button>
        </form>
      )}
    </div>
  );
}
