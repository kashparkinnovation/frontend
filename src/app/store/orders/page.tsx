'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';
import Drawer, { DrawerRow, DrawerSection } from '@/components/ui/Drawer';
import { useStudent } from '@/context/StudentContext';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';

interface Order {
  id: number;
  order_number: string;
  student_name: string;
  school_name: string;
  total_amount: string;
  status: string;
  distribution_status: string;
  created_at: string;
  items?: { product_name: string; size: string; color: string; quantity: number; unit_price: string; line_total: string }[];
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const { activeStudent } = useStudent();
  const { showToast } = useToast();
  const router = useRouter();

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnType, setReturnType] = useState('return');
  const [returnReason, setReturnReason] = useState('');
  const [exchangeSize, setExchangeSize] = useState('');
  const [exchangeColor, setExchangeColor] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (statusFilter) params.status = statusFilter;
    // For students the API returns their own orders
    apiClient.get('/orders/', { params })
      .then((r) => {
        const all: Order[] = r.data.results ?? r.data;
        // Optionally filter client-side by student if we have active student
        setOrders(all);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!returnReason.trim()) { showToast('Please provide a reason', 'error'); return; }
    
    setSubmittingReturn(true);
    try {
      await apiClient.post(`/orders/${selected.id}/return/`, {
        request_type: returnType,
        reason: returnReason,
        exchange_size: exchangeSize,
        exchange_color: exchangeColor,
      });
      showToast('Return request submitted successfully!', 'success');
      setReturnModalOpen(false);
      setReturnReason('');
      setExchangeSize('');
      setExchangeColor('');
      router.push('/store/returns');
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to submit request', 'error');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const fmt = (n: string | number) => `₹${parseFloat(String(n)).toLocaleString('en-IN')}`;

  const STATUS_LABEL: Record<string, { icon: string; color: string }> = {
    pending: { icon: '⏳', color: '#92400e' },
    confirmed: { icon: '✅', color: '#1d4ed8' },
    processing: { icon: '⚙️', color: '#6d28d9' },
    shipped: { icon: '📦', color: '#0369a1' },
    delivered: { icon: '🎉', color: '#15803d' },
    collected: { icon: '✅', color: '#15803d' },
    cancelled: { icon: '❌', color: '#b91c1c' },
    refunded: { icon: '↩️', color: '#4b5563' },
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>My Orders</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>Track all uniform orders across your students.</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[{ key: '', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'processing', label: 'Processing' }, { key: 'shipped', label: 'Shipped' }, { key: 'delivered', label: 'Delivered' }, { key: 'cancelled', label: 'Cancelled' }].map(({ key, label }) => (
          <button key={key} onClick={() => setStatusFilter(key)} style={{ padding: '0.4rem 0.875rem', background: statusFilter === key ? '#4f46e5' : '#f8fafc', color: statusFilter === key ? 'white' : '#64748b', border: '1px solid', borderColor: statusFilter === key ? '#4f46e5' : '#e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '0.8125rem', fontFamily: 'inherit' }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading…</div>
      ) : orders.length === 0 ? (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '4rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🛒</div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 0.5rem' }}>No orders found</h2>
          <p style={{ color: '#64748b', margin: '0 0 1.5rem', fontSize: '0.9rem' }}>Get started by shopping your school's uniform catalogue.</p>
          <Link href="/store" style={{ display: 'inline-block', background: '#4f46e5', color: 'white', fontWeight: 700, padding: '0.75rem 1.75rem', borderRadius: '10px', textDecoration: 'none' }}>Browse Now →</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {orders.map((order) => {
            const st = STATUS_LABEL[order.status];
            return (
              <div key={order.id} onClick={() => setSelected(order)}
                style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#a5b4fc'; el.style.boxShadow = '0 4px 14px rgb(79 70 229/0.08)'; }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#e2e8f0'; el.style.boxShadow = ''; }}>
                {/* Status icon */}
                <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>{st?.icon ?? '📋'}</div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.2rem' }}>Order {order.order_number}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{order.student_name} · {order.school_name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.125rem' }}>{new Date(order.created_at).toLocaleDateString('en-IN')}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--mat-primary)' }}>{fmt(order.total_amount)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <StatusBadge status={order.status} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700, color: '#4f46e5', background: '#eef2ff', padding: '0.25rem 0.625rem', borderRadius: '6px', cursor: 'pointer' }}>
                      Details
                      <span style={{ fontSize: '0.9rem' }}>→</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order detail drawer */}
      <Drawer isOpen={!!selected} onClose={() => { setSelected(null); setReturnModalOpen(false); }} title={`Order ${selected?.order_number ?? ''}`} subtitle={selected?.student_name}>
        {selected && !returnModalOpen && (
          <>
            <DrawerSection title="Order Summary" />
            <DrawerRow label="Order #" value={<span style={{ fontFamily: 'monospace' }}>{selected.order_number}</span>} />
            <DrawerRow label="Student" value={selected.student_name} />
            <DrawerRow label="School" value={selected.school_name} />
            <DrawerRow label="Date" value={new Date(selected.created_at).toLocaleString('en-IN')} />
            <DrawerRow label="Total" value={<strong style={{ color: '#4f46e5' }}>{fmt(selected.total_amount)}</strong>} />
            <DrawerRow label="Order Status" value={<StatusBadge status={selected.status} />} />
            <DrawerRow label="Distribution" value={<StatusBadge status={selected.distribution_status} />} />

            {selected.items && selected.items.length > 0 && (
              <>
                <DrawerSection title="Items" />
                {selected.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{item.size}{item.color ? ` / ${item.color}` : ''} × {item.quantity}</div>
                    </div>
                    <div style={{ fontWeight: 700 }}>₹{item.line_total}</div>
                  </div>
                ))}
              </>
            )}

            {/* Status timeline hint */}
            <DrawerSection title="What's Next?" />
            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '1rem', fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>
              {selected.status === 'pending' && '⏳ Your order has been placed and is awaiting confirmation from the school.'}
              {selected.status === 'confirmed' && '✅ Order confirmed! It will be processed and delivered to your school.'}
              {selected.status === 'processing' && '⚙️ Your uniforms are being prepared by the vendor.'}
              {selected.status === 'shipped' && '📦 Your order is on its way to the school.'}
              {selected.status === 'delivered' && '🏫 Uniforms delivered to school. Collect them from the school office.'}
              {selected.status === 'cancelled' && '❌ This order was cancelled. Contact the school for details.'}
              {selected.status === 'refunded' && '↩️ This order was refunded.'}
            </div>

            {selected.status === 'delivered' && (
              <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.75rem' }}>Need a different size or received a defective item?</p>
                <button 
                  onClick={() => setReturnModalOpen(true)}
                  style={{ background: 'white', color: '#dc2626', border: '1.5px solid #dc2626', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Request Return / Exchange
                </button>
              </div>
            )}
          </>
        )}

        {selected && returnModalOpen && (
          <form onSubmit={handleReturnSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <DrawerSection title="Request Return or Exchange" />
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', border: `1.5px solid ${returnType === 'return' ? '#4f46e5' : '#e2e8f0'}`, background: returnType === 'return' ? '#eef2ff' : 'white', padding: '1rem', borderRadius: '10px', cursor: 'pointer' }}>
                <input type="radio" checked={returnType === 'return'} onChange={() => setReturnType('return')} style={{ accentColor: '#4f46e5' }} />
                <span style={{ fontWeight: 600 }}>Refund</span>
              </label>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', border: `1.5px solid ${returnType === 'exchange' ? '#4f46e5' : '#e2e8f0'}`, background: returnType === 'exchange' ? '#eef2ff' : 'white', padding: '1rem', borderRadius: '10px', cursor: 'pointer' }}>
                <input type="radio" checked={returnType === 'exchange'} onChange={() => setReturnType('exchange')} style={{ accentColor: '#4f46e5' }} />
                <span style={{ fontWeight: 600 }}>Exchange</span>
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Reason for {returnType}</label>
              <textarea 
                value={returnReason} onChange={(e) => setReturnReason(e.target.value)} required
                placeholder="Please describe why you want to return or exchange..." 
                style={{ width: '100%', minHeight: '80px', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: 'inherit' }} 
              />
            </div>

            {returnType === 'exchange' && (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Replacement Size</label>
                  <input type="text" value={exchangeSize} onChange={(e) => setExchangeSize(e.target.value)} placeholder="e.g. 34, M" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Replacement Color</label>
                  <input type="text" value={exchangeColor} onChange={(e) => setExchangeColor(e.target.value)} placeholder="(Optional)" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button 
                type="button" onClick={() => setReturnModalOpen(false)}
                style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.875rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="submit" disabled={submittingReturn}
                style={{ flex: 2, background: '#4f46e5', color: 'white', border: 'none', padding: '0.875rem', borderRadius: '10px', fontWeight: 700, cursor: submittingReturn ? 'not-allowed' : 'pointer', opacity: submittingReturn ? 0.7 : 1 }}
              >
                {submittingReturn ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}
      </Drawer>
    </div>
  );
}
