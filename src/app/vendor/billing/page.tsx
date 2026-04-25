'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';
import Drawer, { DrawerRow, DrawerSection } from '@/components/ui/Drawer';
import { useToast } from '@/context/ToastContext';

interface BillingOrder {
  id: number;
  order_number: string;
  student_name: string;
  school_name: string;
  total_amount: string;
  status: string;
  distribution_status: string;
  created_at: string;
  items?: { product_name: string; size: string; color: string; quantity: number; unit_price: string; line_total: string }[];
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  shipping_phone: string;
  subtotal: string;
  tax_amount: string;
  shipping_amount: string;
  platform_fee: string;
  vendor_payout_amount: string;
  payout_status: string;
}

export default function VendorBillingPage() {
  const [orders, setOrders] = useState<BillingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BillingOrder | null>(null);
  const [filter, setFilter] = useState('');
  const [ledger, setLedger] = useState<any>(null);
  const { showToast } = useToast();

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (filter) params.status = filter;
    
    Promise.all([
      apiClient.get('/orders/', { params }),
      apiClient.get('/vendors/ledger/')
    ])
      .then(([ordersRes, ledgerRes]) => {
        setOrders(ordersRes.data.results ?? ordersRes.data);
        setLedger(ledgerRes.data.summary);
      })
      .catch(() => showToast('Failed to load billing records', 'error'))
      .finally(() => setLoading(false));
  }, [filter, showToast]);

  const totalRevenue = orders
    .filter((o) => ['confirmed','processing','shipped','delivered'].includes(o.status))
    .reduce((sum, o) => sum + parseFloat(o.total_amount), 0);

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const printInvoice = (order: BillingOrder) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Invoice ${order.order_number}</title>
      <style>
        body { font-family: system-ui,sans-serif; padding: 2rem; color: #0f172a; max-width: 640px; margin: auto; }
        h1 { color: #4f46e5; } table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        th,td { padding: 0.6rem; border: 1px solid #e2e8f0; font-size: 0.875rem; }
        th { background: #f8fafc; font-weight: 700; }
        .total { font-size: 1.1rem; font-weight: 700; }
        .footer { margin-top: 2rem; font-size: 0.75rem; color: #94a3b8; }
      </style></head><body>
      <h1>Invoice</h1>
      <p><strong>Order #:</strong> ${order.order_number} &nbsp;|&nbsp; <strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString('en-IN')}</p>
      <h3>Bill To</h3>
      <p>${order.shipping_name}<br>${order.shipping_address}<br>${order.shipping_city}, ${order.shipping_state} — ${order.shipping_pincode}<br>📞 ${order.shipping_phone}</p>
      <table>
        <thead><tr><th>Product</th><th>Size/Color</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
        <tbody>
          ${(order.items ?? []).map(item => `<tr><td>${item.product_name}</td><td>${item.size}${item.color ? ' / ' + item.color : ''}</td><td>${item.quantity}</td><td>₹${item.unit_price}</td><td>₹${item.line_total}</td></tr>`).join('')}
        </tbody>
      </table>
      <p class="total" style="text-align:right">Total: ₹${order.total_amount}</p>
      <p class="footer">Thank you for your order. This is a computer-generated invoice.</p>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const exportCSV = () => {
    const rows = [
      ['Order #','Student','School','Amount','Status','Date'],
      ...orders.map((o) => [o.order_number, o.student_name, o.school_name, o.total_amount, o.status, new Date(o.created_at).toLocaleDateString('en-IN')]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), { href: 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv), download: 'vendor_billing.csv' });
    a.click();
  };

  const tabs = [
    { key: '', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'refunded', label: 'Refunded' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Billing & Payouts</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Manage your revenue, platform fees, and pending settlements.
          </p>
        </div>
        <button onClick={exportCSV} className="btn btn-outline btn-sm">⬇ Export CSV</button>
      </div>

      {ledger && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600, marginBottom: '0.5rem' }}>Pending Clearance</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>{fmt(ledger.pending?.payout || 0)}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>From {ledger.pending?.orders || 0} recent orders</div>
          </div>
          <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600, marginBottom: '0.5rem' }}>Ready for Payout</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>{fmt(ledger.cleared?.payout || 0)}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Cleared & waiting settlement</div>
          </div>
          <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600, marginBottom: '0.5rem' }}>Total Settled</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4f46e5' }}>{fmt(ledger.settled?.payout || 0)}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Successfully paid out</div>
          </div>
        </div>
      )}

      <div className="tabs">
        {tabs.map(({ key, label }) => (
          <button key={key} className={`tab-btn ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>{label}</button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <span className="spinner dark" style={{ width: '2rem', height: '2rem' }} />
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🧾</div>
            <p className="empty-state-title">No billing records</p>
            <p className="empty-state-desc">Orders will appear here once placed</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Student</th>
                  <th>School</th>
                  <th>Amount Details</th>
                  <th>Order Status</th>
                  <th>Payout Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} onClick={() => setSelected(o)}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary)' }}>{o.order_number}</td>
                    <td>{o.student_name}</td>
                    <td>{o.school_name}</td>
                    <td>
                      <div style={{ fontWeight: 700 }}>₹{parseFloat(o.total_amount).toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>- Fee: ₹{o.platform_fee || 0}</div>
                      <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>Earned: ₹{o.vendor_payout_amount || o.total_amount}</div>
                    </td>
                    <td><StatusBadge status={o.status} /></td>
                    <td>
                      <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: o.payout_status === 'settled' ? '#e0e7ff' : o.payout_status === 'cleared' ? '#dcfce7' : '#fef3c7', color: o.payout_status === 'settled' ? '#3730a3' : o.payout_status === 'cleared' ? '#166534' : '#92400e', textTransform: 'uppercase' }}>
                        {o.payout_status || 'Pending'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer isOpen={!!selected} onClose={() => setSelected(null)} title={`Invoice — ${selected?.order_number ?? ''}`} subtitle={selected?.student_name}>
        {selected && (
          <>
            <DrawerSection title="Invoice Details" />
            <DrawerRow label="Order #" value={<span style={{ fontFamily: 'monospace' }}>{selected.order_number}</span>} />
            <DrawerRow label="Date" value={new Date(selected.created_at).toLocaleDateString('en-IN')} />
            <DrawerRow label="Status" value={<StatusBadge status={selected.status} />} />
            <DrawerRow label="Distribution" value={<StatusBadge status={selected.distribution_status} />} />

            <DrawerSection title="Bill To" />
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
              {selected.shipping_name}<br />
              {selected.shipping_address}<br />
              {selected.shipping_city}, {selected.shipping_state} — {selected.shipping_pincode}<br />
              📞 {selected.shipping_phone}
            </p>

            {selected.items && selected.items.length > 0 && (
              <>
                <DrawerSection title="Line Items" />
                {selected.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{item.product_name}</div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{item.size}{item.color ? ` / ${item.color}` : ''} × {item.quantity}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>₹{item.line_total}</div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>@₹{item.unit_price}</div>
                    </div>
                  </div>
                ))}

                <div style={{ borderTop: '2px solid var(--color-border)', marginTop: '0.5rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem' }}>
                  <span>Total</span>
                  <span>₹{parseFloat(selected.total_amount).toLocaleString('en-IN')}</span>
                </div>
              </>
            )}

            <div className="drawer-actions">
              <button onClick={() => printInvoice(selected)} className="btn btn-primary">🖨 Print Invoice</button>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}
