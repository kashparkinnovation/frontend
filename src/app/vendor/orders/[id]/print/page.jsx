'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import apiClient from '@/lib/api';

export default function PrintOrderInvoicePage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiClient.get(`/orders/${id}/`)
      .then(res => setOrder(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>Loading invoice...</div>;
  }

  if (!order) {
    return <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif', color: 'red' }}>Order not found.</div>;
  }

  const vendor = order.vendor_details || {};
  const school = order.school_details || {};
  const student = order.student_details || {};
  const invoiceDate = new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const totalQty = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

  return (
    <div style={{ background: '#e2e8f0', minHeight: '100vh', padding: '2rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Non-printable controls */}
      <div className="no-print" style={{ maxWidth: '800px', margin: '0 auto 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => window.history.back()} style={{ padding: '0.5rem 1rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
          ← Back to Orders
        </button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={async () => {
              try {
                const res = await apiClient.get(`/orders/${id}/invoice/`, { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `Invoice_${order.order_number}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.parentNode?.removeChild(link);
              } catch (err) {
                alert('Failed to download PDF');
              }
            }}
            style={{ padding: '0.5rem 1rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            📥 Download PDF
          </button>
          <button onClick={() => window.print()} style={{ padding: '0.5rem 1rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
            🖨️ Print
          </button>
        </div>
      </div>

      {/* A4 Printable Sheet */}
      <div className="print-document" style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '2.5rem 3rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '1.5rem', borderBottom: '3px solid #1a3a5c' }}>
          <div>
            <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.75rem', color: '#1a3a5c', letterSpacing: '0.05em' }}>TAX INVOICE</h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem', fontWeight: 500 }}>ORIGINAL FOR RECIPIENT</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <img 
              src="/api/media/eschoolkart-logo.jpeg" 
              alt="eSchoolKart" 
              style={{ height: '50px', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        </div>

        {/* Vendor / Seller Info */}
        <div style={{ padding: '1rem 0', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', color: '#0f172a' }}>{order.vendor_name}</h3>
          {vendor.gst_number && <p style={{ margin: '0 0 0.125rem', fontSize: '0.8125rem', color: '#475569' }}>GSTIN: <strong>{vendor.gst_number}</strong></p>}
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#475569' }}>
            {[vendor.address, vendor.city, vendor.state, vendor.pincode].filter(Boolean).join(', ')}
          </p>
          <p style={{ margin: '0.125rem 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
            {[vendor.phone && `Mobile: ${vendor.phone}`, vendor.email && `Email: ${vendor.email}`].filter(Boolean).join('  |  ')}
          </p>
        </div>

        {/* Invoice Meta */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Invoice #:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, marginLeft: '0.5rem', color: '#0f172a' }}>{order.order_number}</span>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Invoice Date:</span>
            <span style={{ fontWeight: 500, marginLeft: '0.5rem', color: '#0f172a' }}>{invoiceDate}</span>
          </div>
        </div>

        {/* 3-column: Parent | Student | School */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', padding: '1.25rem 0', borderBottom: '1px solid #e2e8f0' }}>
          {/* Parent */}
          <div>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Parent / Guardian</h4>
            <p style={{ margin: '0 0 0.125rem', fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>{order.parent_name || '—'}</p>
            {order.parent_phone && <p style={{ margin: 0, fontSize: '0.8125rem', color: '#475569' }}>Ph: {order.parent_phone}</p>}
            {order.parent_email && <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>{order.parent_email}</p>}
          </div>

          {/* Student */}
          <div>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Details</h4>
            <p style={{ margin: '0 0 0.125rem', fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>{order.student_name}</p>
            {student.class_name && (
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#475569' }}>
                Class: {student.class_name}{student.section ? ` - ${student.section}` : ''}
              </p>
            )}
            {student.roll_number && <p style={{ margin: 0, fontSize: '0.8125rem', color: '#475569' }}>Roll No: {student.roll_number}</p>}
          </div>

          {/* School (Ship To) */}
          <div>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>School (Ship To)</h4>
            <p style={{ margin: '0 0 0.125rem', fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>{order.school_name}</p>
            {school.address && (
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#475569' }}>
                {[school.address, school.city, school.state, school.pincode].filter(Boolean).join(', ')}
              </p>
            )}
            {school.contact_phone && <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Ph: {school.contact_phone}</p>}
          </div>
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1.25rem 0' }}>
          <thead>
            <tr style={{ background: '#1a3a5c' }}>
              <th style={{ padding: '0.625rem 0.75rem', textAlign: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 700, width: '40px' }}>#</th>
              <th style={{ padding: '0.625rem 0.75rem', textAlign: 'left', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>Item Description</th>
              <th style={{ padding: '0.625rem 0.75rem', textAlign: 'right', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>Rate/Item</th>
              <th style={{ padding: '0.625rem 0.75rem', textAlign: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 700, width: '50px' }}>Qty</th>
              <th style={{ padding: '0.625rem 0.75rem', textAlign: 'right', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 1 ? '#f8fafc' : '#fff' }}>
                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#475569', fontSize: '0.8125rem' }}>{idx + 1}</td>
                <td style={{ padding: '0.75rem' }}>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>{item.product_name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>
                    {[item.size && `Size: ${item.size}`, item.color && `Color: ${item.color}`].filter(Boolean).join(' | ')}
                  </div>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', color: '#475569', fontSize: '0.875rem' }}>₹{parseFloat(item.unit_price).toLocaleString('en-IN')}</td>
                <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>{item.quantity}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>₹{parseFloat(item.line_total).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Row */}
        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
          Total Items: {order.items?.length || 0}  |  Qty: {totalQty}
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
          <div style={{ width: '280px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', color: '#475569', fontSize: '0.875rem' }}>
              <span>Subtotal</span>
              <span>₹{parseFloat(order.subtotal).toLocaleString('en-IN')}</span>
            </div>
            {parseFloat(order.tax_amount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', color: '#475569', fontSize: '0.875rem' }}>
                <span>Tax</span>
                <span>₹{parseFloat(order.tax_amount).toLocaleString('en-IN')}</span>
              </div>
            )}
            {parseFloat(order.shipping_amount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', color: '#475569', fontSize: '0.875rem' }}>
                <span>Shipping</span>
                <span>₹{parseFloat(order.shipping_amount).toLocaleString('en-IN')}</span>
              </div>
            )}
            {parseFloat(order.discount_amount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', color: '#059669', fontSize: '0.875rem' }}>
                <span>Discount</span>
                <span>-₹{parseFloat(order.discount_amount).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '2px solid #1a3a5c', marginTop: '0.5rem', fontWeight: 800, fontSize: '1.25rem', color: '#1a3a5c' }}>
              <span>Total</span>
              <span>₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Payment & Order Status */}
        <div style={{ padding: '0.75rem 0', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#475569' }}>
          <span><strong>Payment:</strong> {order.payment_method?.replace(/_/g, ' ')} ({order.payment_status})</span>
          <span><strong>Order Status:</strong> {order.status?.replace(/_/g, ' ')}</span>
        </div>

        {/* Footer: T&C + Signatory */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', gap: '2rem' }}>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Terms and Conditions:</h4>
            <ol style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.5 }}>
              <li>All disputes are subject to the jurisdiction of the vendor&apos;s city.</li>
              <li>Goods once sold can be exchanged within 7 days of distribution.</li>
              <li>Exchange is subject to product availability and school verification.</li>
              <li>This is a computer-generated invoice; no signature is required.</li>
            </ol>
          </div>
          <div style={{ textAlign: 'right', minWidth: '180px' }}>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>For {order.vendor_name}</p>
            <div style={{ height: '50px', borderBottom: '1px solid #cbd5e1', marginBottom: '0.25rem' }}></div>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>Authorised Signatory</p>
          </div>
        </div>

        {/* Platform Footer */}
        <div style={{ marginTop: '2rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8' }}>
          This invoice was generated by <strong>eSchoolKart.com</strong> — School Uniforms & Stationery Delivered to School
        </div>
      </div>

      {/* Cutout Shipping Label */}
      <div className="print-document" style={{ maxWidth: '800px', margin: '1.5rem auto 0', background: '#fff', padding: '2rem 3rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#94a3b8' }}>
            <span>✂</span>
            <div style={{ flex: 1, borderTop: '2px dashed #cbd5e1' }}></div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Shipping Label</span>
            <div style={{ flex: 1, borderTop: '2px dashed #cbd5e1' }}></div>
            <span style={{ transform: 'scaleX(-1)' }}>✂</span>
          </div>
        </div>
        
        <div style={{ border: '2px solid #0f172a', borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, borderRight: '1px solid #e2e8f0', paddingRight: '1.5rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>FROM:</p>
            <h4 style={{ margin: '0 0 0.25rem', fontSize: '1rem', color: '#0f172a' }}>{order.vendor_name}</h4>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5 }}>
              {vendor.address}<br/>
              {vendor.city}, {vendor.state} {vendor.pincode}<br/>
              {vendor.phone}
            </p>
          </div>
          <div style={{ flex: 1, paddingLeft: '1.5rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', color: '#0f172a', fontWeight: 800 }}>SHIP TO:</p>
            <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', color: '#0f172a' }}>{order.school_name}</h2>
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a', lineHeight: 1.6 }}>
              {school.address}<br/>
              {school.city}, {school.state} <strong style={{ fontSize: '1.1rem' }}>{school.pincode}</strong><br/>
              <span style={{ marginTop: '0.25rem', display: 'inline-block' }}>Ph: <strong>{school.contact_phone || order.shipping_phone}</strong></span>
            </p>
            <div style={{ marginTop: '0.75rem' }}>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: '#64748b' }}>Student: <strong>{order.student_name}</strong></p>
              {student.class_name && <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Class: {student.class_name}{student.section ? `-${student.section}` : ''}</p>}
            </div>
            <div style={{ marginTop: '1rem', padding: '0.5rem', border: '1px solid #cbd5e1', display: 'inline-block', fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '0.1em' }}>
              {order.order_number}
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { visibility: hidden; background: white; }
          .no-print { display: none !important; }
          .print-document {
            visibility: visible !important;
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 2rem !important;
            box-shadow: none !important;
            page-break-after: always;
          }
        }
      `}} />
    </div>
  );
}
