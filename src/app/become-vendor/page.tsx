'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/api';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import styles from '../(auth)/login/auth.module.css';

export default function BecomeVendorPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const vendorFaqs = [
    { q: 'How do I receive payments?', a: 'All parent transactions map securely to your gateway, disbursed automatically per order settlement windows.' },
    { q: 'Can I restrict sizing profiles?', a: 'Yes! Product templates are mapped individually matching precise school design guidelines.' },
    { q: 'What is the standard commission fee?', a: 'Standard administrative cuts cover gateway integrations appropriately.' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiClient.post('/auth/leads/', {
        name: formData.name,
        email: formData.email,
        user_type: 'Vendor',
        message: formData.message,
      });
      setSuccess('Your application has been received! Our team will contact you shortly.');
      setFormData({ name: '', email: '', message: '' });
    } catch (err: any) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      
      <div style={{ maxWidth: '1200px', width: '100%', margin: '4rem auto', padding: '0 1rem', flex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem' }}>
            Partner with eSchoolKart
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#64748b', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
            Grow your uniform distribution business by joining the platform that thousands of parents trust. Manage inventories and orders seamlessly.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'start', marginBottom: '5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>
              Why Become an eSchoolKart Vendor?
            </h2>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', color: '#475569', lineHeight: 1.5 }}>
              <li><strong>Broad Market Access:</strong> Instantly target thousands of parents associated with premium schools.</li>
              <li><strong>Consolidated Dashboard:</strong> Order routing, size filters, payments, and returns sorted optimally.</li>
              <li><strong>Verified Transactions:</strong> Zero drop-offs or fraudulent operations.</li>
            </ul>
          </div>

          <div className={styles.authCard} style={{ margin: 0, padding: '2rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem', textAlign: 'center' }}>
              Apply for Vendor Access
            </h3>

            {success && (
              <div style={{ background: '#d1fae5', color: '#065f46', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {success}
              </div>
            )}

            {error && (
              <div className={styles.errorMsg} style={{ marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Full Name / Contact Name</label>
                <input type="text" className="input" placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Business Email Address</label>
                <input type="email" className="input" placeholder="vendor@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Business Overview & Scale</label>
                <textarea className="input" style={{ height: '100px', resize: 'vertical' }} placeholder="Tell us about the areas you service and scale of uniform distribution..." value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
                {loading ? 'Submitting…' : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto 4rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', textAlign: 'center', marginBottom: '2rem' }}>Vendor FAQs</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {vendorFaqs.map((faq, i) => (
              <div key={i} onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer' }}>
                <div style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{faq.q}</h4>
                  <span style={{ color: '#4f46e5', fontSize: '1.25rem', transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
                </div>
                {openFaq === i && (
                  <div style={{ padding: '0 1.25rem 1.25rem', color: '#64748b', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
