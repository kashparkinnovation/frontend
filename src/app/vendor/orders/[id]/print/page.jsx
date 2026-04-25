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

  const handlePrint = () => {
    window.print();
  };

  const vendor = order.vendor_details || { business_name: order.vendor_name };

  return (
    <div style={{ background: '#e2e8f0', minHeight: '100vh', padding: '2rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Non-printable controls */}
      <div className="no-print" style={{ maxWidth: '800px', margin: '0 auto 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => window.history.back()} style={{ padding: '0.5rem 1rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
          ← Back to Orders
        </button>
        <button onClick={handlePrint} style={{ padding: '0.5rem 1rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
          🖨️ Print Document
        </button>
      </div>

      {/* A4 Printable Sheet */}
      <div className="print-document" style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '3rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        
        {/* INVOICE SECTION */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '2rem', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem', fontSize: '2rem', color: '#0f172a' }}>TAX INVOICE</h1>
            <p style={{ margin: 0, color: '#475569', fontSize: '0.875rem' }}>Receipt for Order #<strong style={{ color: '#0f172a' }}>{order.order_number}</strong></p>
            <p style={{ margin: '0.2rem 0 0', color: '#475569', fontSize: '0.875rem' }}>Date: {new Date(order.created_at).toLocaleDateString('en-IN')}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', color: '#0f172a' }}>{order.vendor_name}</h2>
            {vendor && (
              <div style={{ color: '#475569', fontSize: '0.875rem', lineHeight: 1.5 }}>
                {vendor.address && <div>{vendor.address}</div>}
                {(vendor.city || vendor.state) && <div>{vendor.city}, {vendor.state} {vendor.pincode}</div>}
                {vendor.email && <div>{vendor.email}</div>}
                {vendor.phone && <div>{vendor.phone}</div>}
                {vendor.gst_number && <div style={{ marginTop: '0.5rem', fontWeight: 500 }}>GSTIN: {vendor.gst_number}</div>}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bill To (Student)</h3>
            <p style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>{order.student_name}</p>
            <p style={{ margin: '0.2rem 0', color: '#475569', fontSize: '0.875rem' }}>{order.school_name}</p>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ship To</h3>
            <p style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>{order.shipping_name}</p>
            <p style={{ margin: '0.2rem 0 0', color: '#475569', fontSize: '0.875rem', lineHeight: 1.5 }}>
              {order.shipping_address}<br/>
              {order.shipping_city}, {order.shipping_state} {order.shipping_pincode}<br/>
              Phone: {order.shipping_phone}
            </p>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '0.75rem 0', textAlign: 'left', color: '#64748b', fontSize: '0.875rem' }}>Item Description</th>
              <th style={{ padding: '0.75rem 0', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>Qty</th>
              <th style={{ padding: '0.75rem 0', textAlign: 'right', color: '#64748b', fontSize: '0.875rem' }}>Price</th>
              <th style={{ padding: '0.75rem 0', textAlign: 'right', color: '#64748b', fontSize: '0.875rem' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem 0' }}>
                  <div style={{ fontWeight: 500, color: '#0f172a' }}>{item.product_name}</div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>Size: {item.size} {item.color ? `| Color: ${item.color}` : ''}</div>
                </td>
                <td style={{ padding: '1rem 0', textAlign: 'center', color: '#475569' }}>{item.quantity}</td>
                <td style={{ padding: '1rem 0', textAlign: 'right', color: '#475569' }}>₹{parseFloat(item.unit_price).toLocaleString('en-IN')}</td>
                <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>₹{parseFloat(item.line_total).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '3rem' }}>
          <div style={{ width: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: '#475569' }}>
              <span>Subtotal</span>
              <span>₹{parseFloat(order.subtotal).toLocaleString('en-IN')}</span>
            </div>
            {parseFloat(order.shipping_amount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: '#475569' }}>
                <span>Shipping</span>
                <span>₹{parseFloat(order.shipping_amount).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderTop: '2px solid #e2e8f0', marginTop: '0.5rem', fontWeight: 700, fontSize: '1.25rem', color: '#0f172a' }}>
              <span>Grand Total</span>
              <span>₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* CUTOUT SHIPPING LABEL SECTION */}
        <div style={{ margin: '4rem 0 2rem', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-14px', left: 0, right: 0, display: 'flex', alignItems: 'center', gap: '1rem', color: '#94a3b8' }}>
            <span>✂</span>
            <div style={{ flex: 1, borderTop: '2px dashed #cbd5e1' }}></div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cut Here For Shipping Label</span>
            <div style={{ flex: 1, borderTop: '2px dashed #cbd5e1' }}></div>
            <span style={{ transform: 'scaleX(-1)' }}>✂</span>
          </div>
          
          <div style={{ border: '2px solid #0f172a', borderRadius: '12px', padding: '2rem', marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, borderRight: '1px solid #e2e8f0', paddingRight: '2rem' }}>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>FROM:</p>
              <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', color: '#0f172a' }}>{order.vendor_name}</h4>
              {vendor && (
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
                  {vendor.address}<br/>
                  {vendor.city}, {vendor.state} {vendor.pincode}<br/>
                  {vendor.phone}
                </p>
              )}
            </div>
            <div style={{ flex: 1, paddingLeft: '2rem' }}>
              <p style={{ margin: '0 0 1rem', fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>SHIP TO:</p>
              <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', color: '#0f172a' }}>{order.shipping_name}</h2>
              <p style={{ margin: 0, fontSize: '1.125rem', color: '#0f172a', lineHeight: 1.6 }}>
                {order.shipping_address}<br/>
                {order.shipping_city}, {order.shipping_state} <strong style={{ fontSize: '1.25rem' }}>{order.shipping_pincode}</strong><br/>
                <span style={{ marginTop: '0.5rem', display: 'inline-block' }}>Ph: <strong>{order.shipping_phone}</strong></span>
              </p>
              <div style={{ marginTop: '1.5rem', padding: '0.5rem', border: '1px solid #cbd5e1', display: 'inline-block', fontFamily: 'monospace', fontSize: '1.25rem', letterSpacing: '0.1em' }}>
                {order.order_number}
              </div>
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
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
        }
      `}} />
    </div>
  );
}
