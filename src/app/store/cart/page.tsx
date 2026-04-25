'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useStudent } from '@/context/StudentContext';
import { useToast } from '@/context/ToastContext';
import apiClient from '@/lib/api';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const { activeStudent } = useStudent();
  const { showToast } = useToast();
  const router = useRouter();
  const [placing, setPlacing] = useState(false);

  const schoolId = items[0]?.schoolId;
  const subtotal = totalPrice;
  const shipping = 0; // Free
  const total = subtotal + shipping;

  const handleCheckout = () => {
    if (items.length === 0) return;
    if (!activeStudent) { showToast('Please select a student profile first', 'error'); return; }
    if (!activeStudent.is_verified) { showToast('Student must be verified before ordering', 'error'); return; }
    router.push('/store/checkout');
  };

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--mat-bg)', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ background: 'white', borderRadius: '24px', padding: '4rem', textAlign: 'center', maxWidth: 440, width: '100%', boxShadow: 'var(--mat-shadow-2)', border: '1px solid var(--mat-border)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.25rem' }}>🛒</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.75rem', letterSpacing: '-0.03em' }}>Your cart is empty</h2>
          <p style={{ color: 'var(--mat-text-2)', margin: '0 0 2rem', lineHeight: 1.6 }}>Browse your school's catalogue and add uniforms for your child.</p>
          <Link href="/browse" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--mat-primary)', color: 'white', padding: '0.875rem 2rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '1rem', boxShadow: '0 4px 14px rgba(79,70,229,0.3)' }}>
            Browse Schools →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--mat-bg)', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <header style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--mat-border)', position: 'sticky', top: 0, zIndex: 100, boxShadow: 'var(--mat-shadow-1)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, background: 'var(--mat-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🎓</div>
            <span style={{ fontSize: '1.125rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--mat-primary)' }}>eSchoolKart</span>
          </Link>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.875rem', color: 'var(--mat-text-3)' }}>
            <Link href={schoolId ? `/browse/${schoolId}` : '/browse'} style={{ color: 'var(--mat-primary)', textDecoration: 'none', fontWeight: 600 }}>← Continue Shopping</Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 0.375rem' }}>Your Cart</h1>
        <p style={{ color: 'var(--mat-text-2)', margin: '0 0 2rem' }}>{totalItems} item{totalItems !== 1 ? 's' : ''} for <strong>{activeStudent?.student_name ?? 'your student'}</strong></p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'flex-start' }}>
          {/* Items list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {items.map((item, idx) => (
              <div key={item.inventoryId} className="mat-animate" style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--mat-border)', padding: '1.25rem', display: 'flex', gap: '1.25rem', alignItems: 'center', boxShadow: 'var(--mat-shadow-1)' }}>
                {/* Image placeholder */}
                <div style={{ width: 80, height: 80, borderRadius: '12px', background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>
                  👕
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--mat-text-1)', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.productName}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--mat-text-2)', marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {item.size && <span style={{ background: 'var(--mat-surface-2)', border: '1px solid var(--mat-border)', borderRadius: '6px', padding: '0.1rem 0.5rem', fontWeight: 600 }}>Size: {item.size}</span>}
                    {item.color && <span style={{ background: 'var(--mat-surface-2)', border: '1px solid var(--mat-border)', borderRadius: '6px', padding: '0.1rem 0.5rem', fontWeight: 600 }}>Color: {item.color}</span>}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--mat-primary)' }}>₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}</div>
                  {item.quantity > 1 && <div style={{ fontSize: '0.75rem', color: 'var(--mat-text-3)' }}>₹{item.unitPrice.toLocaleString('en-IN')} each</div>}
                </div>
                {/* Qty controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
                  <button onClick={() => item.quantity > 1 ? updateQuantity(item.inventoryId, item.quantity - 1) : removeItem(item.inventoryId)}
                    style={{ width: 34, height: 34, borderRadius: '8px', border: '1.5px solid var(--mat-border)', background: 'white', fontWeight: 700, fontSize: '1.125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mat-text-2)', transition: 'all 0.15s' }}
                    onMouseEnter={(e) => { const el = e.currentTarget; el.style.borderColor = 'var(--mat-danger)'; el.style.color = 'var(--mat-danger)'; }}
                    onMouseLeave={(e) => { const el = e.currentTarget; el.style.borderColor = 'var(--mat-border)'; el.style.color = 'var(--mat-text-2)'; }}>
                    −
                  </button>
                  <span style={{ fontWeight: 800, fontSize: '1.125rem', minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.inventoryId, item.quantity + 1)}
                    style={{ width: 34, height: 34, borderRadius: '8px', border: '1.5px solid var(--mat-border)', background: 'white', fontWeight: 700, fontSize: '1.125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mat-text-2)', transition: 'all 0.15s' }}
                    onMouseEnter={(e) => { const el = e.currentTarget; el.style.borderColor = 'var(--mat-primary)'; el.style.color = 'var(--mat-primary)'; }}
                    onMouseLeave={(e) => { const el = e.currentTarget; el.style.borderColor = 'var(--mat-border)'; el.style.color = 'var(--mat-text-2)'; }}>
                    +
                  </button>
                </div>
                {/* Remove */}
                <button onClick={() => removeItem(item.inventoryId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mat-text-3)', fontSize: '1.125rem', padding: '0.25rem', borderRadius: '6px', transition: 'color 0.15s', flexShrink: 0 }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--mat-danger)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--mat-text-3)')}>
                  ✕
                </button>
              </div>
            ))}

            {/* Clear cart */}
            <button onClick={() => { if (confirm('Clear your entire cart?')) clearCart(); }}
              style={{ background: 'none', border: '1.5px dashed var(--mat-border)', borderRadius: '12px', padding: '0.875rem', color: 'var(--mat-text-3)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.15s' }}
              onMouseEnter={(e) => { const el = e.currentTarget; el.style.borderColor = 'var(--mat-danger)'; el.style.color = 'var(--mat-danger)'; }}
              onMouseLeave={(e) => { const el = e.currentTarget; el.style.borderColor = 'var(--mat-border)'; el.style.color = 'var(--mat-text-3)'; }}>
              🗑 Clear Cart
            </button>
          </div>

          {/* Order Summary */}
          <div style={{ position: 'sticky', top: '88px' }}>
            <div style={{ background: 'white', borderRadius: '20px', border: '1px solid var(--mat-border)', overflow: 'hidden', boxShadow: 'var(--mat-shadow-2)' }}>
              <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', padding: '1.25rem 1.5rem', color: 'white' }}>
                <div style={{ fontWeight: 800, fontSize: '1.0625rem', marginBottom: '0.25rem' }}>Order Summary</div>
                {activeStudent && <div style={{ fontSize: '0.8125rem', opacity: 0.75 }}>For {activeStudent.student_name}</div>}
              </div>
              <div style={{ padding: '1.375rem 1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  {[
                    { label: `Subtotal (${totalItems} items)`, value: `₹${subtotal.toLocaleString('en-IN')}` },
                    { label: 'Shipping', value: <span style={{ color: 'var(--mat-success)', fontWeight: 700 }}>FREE</span> },
                    { label: 'Tax (GST)', value: '—' },
                  ].map(({ label, value }, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: 'var(--mat-text-2)' }}>
                      <span>{label}</span>
                      <span style={{ fontWeight: 600, color: 'var(--mat-text-1)' }}>{value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '2px solid var(--mat-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.0625rem' }}>Total</span>
                  <span style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--mat-primary)' }}>₹{total.toLocaleString('en-IN')}</span>
                </div>
                <button onClick={handleCheckout} disabled={placing}
                  style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, var(--mat-primary), #7c3aed)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '1.0625rem', cursor: placing ? 'not-allowed' : 'pointer', boxShadow: '0 6px 20px rgba(79,70,229,0.35)', fontFamily: 'var(--font-sans)', transition: 'all 0.2s', opacity: placing ? 0.7 : 1 }}>
                  {placing ? 'Processing…' : 'Proceed to Checkout →'}
                </button>
                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--mat-text-3)', margin: '1rem 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                  🔒 Secured by SSL encryption
                </p>
              </div>
            </div>

            {/* Trust badges */}
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { icon: '✅', text: 'School-verified products only' },
                { icon: '📦', text: 'Delivered directly to school' },
                { icon: '↩️', text: '7-day hassle-free returns' },
              ].map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--mat-text-2)', padding: '0.5rem 0.75rem', background: 'white', borderRadius: '8px', border: '1px solid var(--mat-border)' }}>
                  <span>{b.icon}</span>
                  <span>{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
