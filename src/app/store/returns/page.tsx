'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';

interface ReturnRequest {
  id: number;
  order: number;
  order_number: string;
  student_name: string;
  school_name: string;
  request_type: string;
  reason: string;
  status: string;
  exchange_size: string;
  exchange_color: string;
  admin_notes: string;
  created_at: string;
}

export default function MyReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/orders/returns/')
      .then((r) => setReturns(r.data.results ?? r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>Returns & Exchanges</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>Track your active and past return requests.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading…</div>
      ) : returns.length === 0 ? (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '4rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>↩️</div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 0.5rem' }}>No Returns Found</h2>
          <p style={{ color: '#64748b', margin: '0 0 1.5rem', fontSize: '0.9rem' }}>You haven&apos;t requested any returns or exchanges yet.</p>
          <Link href="/store/orders" style={{ display: 'inline-block', background: '#4f46e5', color: 'white', fontWeight: 700, padding: '0.75rem 1.75rem', borderRadius: '10px', textDecoration: 'none' }}>View My Orders</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {returns.map((req) => (
            <div key={req.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem 1.5rem', display: 'flex', gap: '1rem' }}>
              <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                {req.request_type === 'exchange' ? '🔄' : '💰'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.125rem' }}>
                      {req.request_type === 'exchange' ? 'Exchange Requested' : 'Refund Requested'}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                      Order: <Link href="/store/orders" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}>{req.order_number}</Link>
                    </div>
                  </div>
                  <StatusBadge status={req.status} />
                </div>

                <div style={{ background: '#f8fafc', padding: '0.875rem', borderRadius: '8px', fontSize: '0.875rem', color: '#334155', marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Reason:</div>
                  <div>{req.reason}</div>
                  
                  {req.request_type === 'exchange' && (
                    <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                      <span style={{ fontWeight: 600 }}>Requested Size:</span> {req.exchange_size || 'N/A'} 
                      {req.exchange_color && <span style={{ marginLeft: '1rem' }}><span style={{ fontWeight: 600 }}>Color:</span> {req.exchange_color}</span>}
                    </div>
                  )}
                </div>

                {req.admin_notes && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '0.875rem', borderRadius: '8px', fontSize: '0.875rem', color: '#92400e' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.125rem' }}>Note from Vendor:</div>
                    {req.admin_notes}
                  </div>
                )}
                
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.75rem' }}>
                  Requested on {new Date(req.created_at).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
