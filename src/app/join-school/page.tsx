'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/api';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import styles from '../(auth)/login/auth.module.css';

export default function JoinSchoolPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const schoolFaqs = [
    { q: 'Is there an onboarding setup fee for schools?', a: 'No, integrating your custom uniform specifications into eSchoolKart is completely free.' },
    { q: 'How is sizing verification handled?', a: 'Parents map fits per custom size profiles safely supported digitally.' },
    { q: 'What safeguards prevent unauthorized orders?', a: 'No products unlock until students secure explicit clearance triggers.' },
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
        user_type: 'School',
        message: formData.message,
      });
      setSuccess('Your query has been logged! Our academic partners team will reach out.');
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
            Bring your School to eSchoolKart
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#64748b', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
            Modernize the uniform distribution process for your students. Provide seamless delivery and authentic merchandise effortlessly.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'start', marginBottom: '5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>
              Why Join as a Partner School?
            </h2>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', color: '#475569', lineHeight: 1.5 }}>
              <li><strong>Reduce Operational Burden:</strong> No manual on-premise inventory tracking or distribution clusters.</li>
              <li><strong>Reliable Vendors:</strong> Vetted supply chains keeping quality control in check.</li>
              <li><strong>Transparent Auditing:</strong> Full digital transaction receipts accessible via the administrative dashboard.</li>
            </ul>
          </div>

          <div className={styles.authCard} style={{ margin: 0, padding: '2rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem', textAlign: 'center' }}>
              Onboard Your Institution
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
                <label className={styles.label}>School Name / Administrator</label>
                <input type="text" className="input" placeholder="St. Xavier's Academy" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Official Email</label>
                <input type="email" className="input" placeholder="admin@stxaviers.edu" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Requirements Overview</label>
                <textarea className="input" style={{ height: '100px', resize: 'vertical' }} placeholder="Indicate student volume, current suppliers, or onboarding timelines..." value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
                {loading ? 'Submitting…' : 'Submit Details'}
              </button>
            </form>
          </div>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto 4rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', textAlign: 'center', marginBottom: '2rem' }}>School FAQs</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {schoolFaqs.map((faq, i) => (
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
