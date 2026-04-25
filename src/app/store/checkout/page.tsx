'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useStudent } from '@/context/StudentContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import apiClient from '@/lib/api';

const STEPS = [
  { id: 1, label: 'Shipping Details', icon: '📦' },
  { id: 2, label: 'Review Order', icon: '📋' },
  { id: 3, label: 'Payment', icon: '💳' },
];

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { activeStudent } = useStudent();
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('upi');

  const [shipping, setShipping] = useState({
    name: `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim(),
    phone: user?.phone ?? '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const handlePlaceOrder = async () => {
    if (!activeStudent) { showToast('No active student selected', 'error'); return; }
    if (!shipping.name || !shipping.phone) { showToast('Please fill in your name and phone number', 'error'); return; }
    if (items.length === 0) { showToast('Your cart is empty. Please add items to order.', 'error'); return; }
    setPlacing(true);
    try {
      const payload = {
        student_profile: activeStudent.id,
        shipping_name: shipping.name,
        shipping_phone: shipping.phone,
        shipping_address: shipping.address,
        shipping_city: shipping.city,
        shipping_state: shipping.state,
        shipping_pincode: shipping.pincode,
        items: items.map((item) => ({
          inventory_id: item.inventoryId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
        })),
      };
      const { data } = await apiClient.post('/orders/create/', payload);
      setOrderId(data.order_number || String(data.id));
      clearCart();
      setStep(4); // Success step
    } catch (err: any) {
      const msg = err?.response?.data?.detail || Object.values(err?.response?.data ?? {}).flat().join(' ') || 'Failed to place order. Please try again.';
      showToast(String(msg), 'error');
    } finally {
      setPlacing(false);
    }
  };

  const inp = (field: keyof typeof shipping, label: string, placeholder: string, required = true) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--mat-text-2)' }}>{label}{required && <span style={{ color: 'var(--mat-danger)' }}>*</span>}</label>
      <input className="mat-input" required={required} value={shipping[field]} onChange={(e) => setShipping({ ...shipping, [field]: e.target.value })} placeholder={placeholder} />
    </div>
  );

  // Success screen
  if (step === 4) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--mat-bg)', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="mat-scale-in" style={{ background: 'white', borderRadius: '24px', padding: '4rem 3rem', textAlign: 'center', maxWidth: 500, width: '100%', boxShadow: 'var(--mat-shadow-3)', border: '1px solid var(--mat-border)' }}>
          <div style={{ width: 100, height: 100, background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.75rem', margin: '0 auto 2rem', animation: 'mat-bounce-in 0.6s var(--mat-ease)', boxShadow: '0 12px 36px rgba(16,185,129,0.3)' }}>
            ✅
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 0.75rem', color: 'var(--mat-text-1)' }}>Order Placed!</h1>
          <p style={{ color: 'var(--mat-text-2)', fontSize: '1.0625rem', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
            Your uniform order has been successfully placed for <strong>{activeStudent?.student_name}</strong>.
          </p>
          {orderId && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1rem', marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>Order Number</div>
              <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.25rem', color: '#15803d' }}>{orderId}</div>
            </div>
          )}
          <p style={{ color: 'var(--mat-text-3)', fontSize: '0.875rem', margin: '0 0 2rem', lineHeight: 1.7 }}>
            Your school will be notified and uniforms will be distributed when ready. You&apos;ll receive updates in your orders dashboard.
          </p>
          {/* Order status stepper */}
          <div style={{ display: 'flex', marginBottom: '2.5rem', gap: '0' }}>
            {['Ordered', 'Confirmed', 'Processing', 'At School', 'Collected'].map((s, i) => (
              <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {i > 0 && <div style={{ position: 'absolute', top: '14px', right: '50%', width: '100%', height: '2px', background: i === 0 ? '#10b981' : 'var(--mat-border)', zIndex: 0 }} />}
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? '#10b981' : 'var(--mat-border)', color: i === 0 ? 'white' : 'var(--mat-text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, position: 'relative', zIndex: 1 }}>
                  {i === 0 ? '✓' : i + 1}
                </div>
                <div style={{ fontSize: '0.6rem', fontWeight: 600, color: i === 0 ? '#10b981' : 'var(--mat-text-3)', marginTop: '0.375rem', textAlign: 'center' }}>{s}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/store/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--mat-primary)', color: 'white', padding: '0.875rem 1.75rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '0.9375rem', boxShadow: '0 4px 14px rgba(79,70,229,0.3)' }}>
              📦 Track Order
            </Link>
            <Link href="/store" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--mat-surface-2)', color: 'var(--mat-text-2)', padding: '0.875rem 1.75rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9375rem', border: '1.5px solid var(--mat-border)' }}>
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--mat-bg)', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <header style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--mat-border)', boxShadow: 'var(--mat-shadow-1)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 1.5rem', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, background: 'var(--mat-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🎓</div>
            <span style={{ fontSize: '1.125rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--mat-primary)' }}>eSchoolKart</span>
          </Link>
          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {STEPS.map((s, i) => (
              <React.Fragment key={s.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: step >= s.id ? 700 : 500, color: step > s.id ? 'var(--mat-success)' : step === s.id ? 'var(--mat-primary)' : 'var(--mat-text-3)' }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: step > s.id ? 'var(--mat-success)' : step === s.id ? 'var(--mat-primary)' : 'var(--mat-border)', color: step >= s.id ? 'white' : 'var(--mat-text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.3s' }}>
                    {step > s.id ? '✓' : s.id}
                  </div>
                  <span style={{ display: window?.innerWidth < 640 ? 'none' : undefined }}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div style={{ width: 32, height: 2, background: step > s.id ? 'var(--mat-success)' : 'var(--mat-border)', borderRadius: '2px', transition: 'background 0.4s' }} />}
              </React.Fragment>
            ))}
          </div>
          <Link href="/store/cart" style={{ color: 'var(--mat-text-3)', textDecoration: 'none', fontSize: '0.875rem' }}>← Back to Cart</Link>
        </div>
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2.5rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'flex-start' }}>

        {/* Main form */}
        <div>
          {/* Step 1 — Shipping */}
          {step === 1 && (
            <div className="mat-animate">
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 0.5rem' }}>Shipping Details</h2>
              <p style={{ color: 'var(--mat-text-2)', margin: '0 0 2rem', fontSize: '0.9375rem' }}>Uniforms will be delivered to your school. Fill in your contact details for records.</p>

              {/* Student info */}
              {activeStudent && (
                <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--mat-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>{activeStudent.student_name.charAt(0)}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9375rem' }}>Ordering for: {activeStudent.student_name}</div>
                    <div style={{ fontSize: '0.8125rem', color: '#6366f1' }}>Class {activeStudent.class_name} · {activeStudent.school_name}</div>
                  </div>
                  <span style={{ marginLeft: 'auto', background: '#10b981', color: 'white', padding: '0.2rem 0.625rem', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>VERIFIED</span>
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} style={{ background: 'white', borderRadius: '20px', border: '1px solid var(--mat-border)', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: 'var(--mat-shadow-1)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  {inp('name', 'Parent Name', 'Your full name')}
                  {inp('phone', 'Phone Number', '+91 XXXXX XXXXX')}
                </div>
                <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '0.875rem 1rem', fontSize: '0.8125rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📦 <span>Uniforms will be <strong>delivered to your school</strong>, not this address. This is used for contact purposes only.</span>
                </div>
                <button type="submit" style={{ padding: '1rem', background: 'linear-gradient(135deg, var(--mat-primary), #7c3aed)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 6px 20px rgba(79,70,229,0.3)', fontFamily: 'var(--font-sans)', transition: 'all 0.2s' }}>
                  Continue to Review →
                </button>
              </form>
            </div>
          )}

          {/* Step 2 — Review */}
          {step === 2 && (
            <div className="mat-animate">
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 0.5rem' }}>Review Your Order</h2>
              <p style={{ color: 'var(--mat-text-2)', margin: '0 0 2rem' }}>Please review all items before proceeding to payment.</p>

              <div style={{ background: 'white', borderRadius: '20px', border: '1px solid var(--mat-border)', overflow: 'hidden', boxShadow: 'var(--mat-shadow-1)', marginBottom: '1.25rem' }}>
                {items.map((item, i) => (
                  <div key={item.inventoryId} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.125rem 1.5rem', borderBottom: i < items.length - 1 ? '1px solid var(--mat-border-light)' : 'none' }}>
                    <div style={{ width: 60, height: 60, borderRadius: '12px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', flexShrink: 0 }}>👕</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.productName}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--mat-text-3)', marginTop: '0.125rem' }}>
                        {[item.size && `Size: ${item.size}`, item.color && `Color: ${item.color}`, `Qty: ${item.quantity}`].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--mat-primary)', flexShrink: 0 }}>₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--mat-border)', padding: '1.25rem 1.5rem', marginBottom: '1.25rem', boxShadow: 'var(--mat-shadow-1)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.75rem', color: 'var(--mat-text-1)' }}>📦 Contact Details</div>
                {Object.entries({ Name: shipping.name, Phone: shipping.phone }).filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: '0.375rem 0', borderBottom: '1px solid var(--mat-border-light)', color: 'var(--mat-text-2)' }}>
                    <span>{k}:</span>
                    <span style={{ fontWeight: 600, color: 'var(--mat-text-1)' }}>{v}</span>
                  </div>
                ))}
                <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--mat-primary)', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer', padding: '0.5rem 0 0', fontFamily: 'var(--font-sans)' }}>
                  ✏️ Edit Details
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.875rem' }}>
                <button onClick={() => setStep(1)} style={{ flex: '0 0 auto', padding: '0.875rem 1.5rem', background: 'white', color: 'var(--mat-text-2)', border: '1.5px solid var(--mat-border)', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.9375rem' }}>← Back</button>
                <button onClick={() => setStep(3)} style={{ flex: 1, padding: '0.875rem', background: 'linear-gradient(135deg, var(--mat-primary), #7c3aed)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 6px 20px rgba(79,70,229,0.3)', fontFamily: 'var(--font-sans)' }}>
                  Proceed to Payment →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Payment */}
          {step === 3 && (
            <div className="mat-animate">
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 0.5rem' }}>Payment</h2>
              <p style={{ color: 'var(--mat-text-2)', margin: '0 0 2rem' }}>Choose your payment method to complete the order.</p>

              <div style={{ background: 'white', borderRadius: '20px', border: '1px solid var(--mat-border)', padding: '1.75rem', boxShadow: 'var(--mat-shadow-1)', marginBottom: '1.25rem' }}>
                {[
                  { id: 'upi', icon: '📱', label: 'UPI / Google Pay / PhonePe', sub: 'Instant payment' },
                  { id: 'card', icon: '💳', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay' },
                  { id: 'banking', icon: '🏦', label: 'Net Banking', sub: 'All major banks' },
                  { id: 'cod', icon: '💵', label: 'Cash on Delivery', sub: 'Pay when collected at school' },
                ].map((method) => (
                  <label key={method.id} onClick={() => setPaymentMethod(method.id)} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '12px', border: `2px solid ${paymentMethod === method.id ? 'var(--mat-primary)' : 'transparent'}`, marginBottom: '0.75rem', cursor: 'pointer', background: paymentMethod === method.id ? 'var(--mat-primary-light)' : 'transparent', transition: 'all 0.15s' }}>
                    <input type="radio" name="payment" checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)} style={{ accentColor: 'var(--mat-primary)' }} />
                    <span style={{ fontSize: '1.5rem' }}>{method.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{method.label}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--mat-text-3)' }}>{method.sub}</div>
                    </div>
                  </label>
                ))}
                <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '0.875rem 1rem', fontSize: '0.8125rem', color: '#166534', display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  🔒 <span>All payments are processed through RBI-compliant payment gateways with 256-bit SSL encryption.</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.875rem' }}>
                <button onClick={() => setStep(2)} style={{ flex: '0 0 auto', padding: '0.875rem 1.5rem', background: 'white', color: 'var(--mat-text-2)', border: '1.5px solid var(--mat-border)', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.9375rem' }}>← Back</button>
                <button onClick={handlePlaceOrder} disabled={placing}
                  style={{ flex: 1, padding: '0.875rem', background: placing ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '1rem', cursor: placing ? 'not-allowed' : 'pointer', boxShadow: placing ? 'none' : '0 6px 20px rgba(16,185,129,0.35)', fontFamily: 'var(--font-sans)', transition: 'all 0.2s' }}>
                  {placing ? '⏳ Placing Order…' : `✅ Place Order · ₹${totalPrice.toLocaleString('en-IN')}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div style={{ position: 'sticky', top: '88px' }}>
          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid var(--mat-border)', overflow: 'hidden', boxShadow: 'var(--mat-shadow-2)' }}>
            <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', padding: '1.125rem 1.5rem', color: 'white' }}>
              <div style={{ fontWeight: 800, marginBottom: '0.125rem' }}>Order Summary</div>
              <div style={{ fontSize: '0.8125rem', opacity: 0.7 }}>{items.length} items</div>
            </div>
            <div style={{ padding: '1.25rem 1.5rem' }}>
              {items.map((item) => (
                <div key={item.inventoryId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--mat-border-light)', fontSize: '0.875rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.productName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--mat-text-3)' }}>{item.size} · ×{item.quantity}</div>
                  </div>
                  <span style={{ fontWeight: 700, flexShrink: 0, marginLeft: '0.75rem' }}>₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}
              <div style={{ paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '1.0625rem' }}>Total</span>
                <span style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--mat-primary)' }}>₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
