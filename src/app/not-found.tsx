import React from 'react';
import Link from 'next/link';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#fafafa' }}>
      <Header />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '600px' }}>
          <div style={{ fontSize: '6rem', fontWeight: 900, color: '#4f46e5', lineHeight: 1, marginBottom: '1rem', letterSpacing: '-0.05em' }}>
            404
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            Page not found
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#64748b', lineHeight: 1.6, marginBottom: '2.5rem' }}>
            Sorry, we couldn’t find the page you’re looking for. It might have been moved, deleted, or perhaps the URL was mistyped.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link 
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#4f46e5',
                color: 'white',
                padding: '0.875rem 2rem',
                borderRadius: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 10px 25px rgba(79, 70, 229, 0.25)',
                transition: 'all 0.2s',
              }}
            >
              Back to Homepage
            </Link>
            <Link 
              href="/contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'white',
                color: '#0f172a',
                border: '1px solid #e2e8f0',
                padding: '0.875rem 2rem',
                borderRadius: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.02)',
                transition: 'all 0.2s',
              }}
            >
              Contact Support
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
