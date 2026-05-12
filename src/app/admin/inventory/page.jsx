'use client';

import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/api';
import Drawer, { DrawerRow, DrawerSection } from '@/components/ui/Drawer';
import { useToast } from '@/context/ToastContext';

export default function AdminInventoryPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [schools, setSchools] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [vendorFilter, setVendorFilter] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (schoolFilter) params.school = schoolFilter;
      if (vendorFilter) params.vendor = vendorFilter;
      
      const [prodRes, schoolsRes, vendorsRes] = await Promise.all([
        apiClient.get('/store/', { params }),
        apiClient.get('/schools/'),
        apiClient.get('/vendors/'),
      ]);

      const prods = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data.results ?? []);
      setProducts(prods);
      setSchools(Array.isArray(schoolsRes.data) ? schoolsRes.data : (schoolsRes.data.results ?? []));
      setVendors(Array.isArray(vendorsRes.data) ? vendorsRes.data : (vendorsRes.data.results ?? []));
    } catch {
      showToast('Failed to load inventory data', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, schoolFilter, vendorFilter, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Flatten products to variant-level rows
  const variants = products.flatMap(prod => 
    (prod.inventory || []).map(inv => ({
      ...inv,
      product_id: prod.id,
      product_name: prod.name,
      product_sku: prod.sku,
      school_name: prod.school_name,
      vendor_name: prod.vendor_name,
      category: prod.category,
      base_price: prod.base_price,
    }))
  );

  const totalVariants = variants.length;
  const outOfStock = variants.filter(v => v.quantity === 0).length;
  const lowStock = variants.filter(v => v.quantity > 0 && v.quantity <= 5).length;
  const totalValue = variants.reduce((sum, v) => sum + parseFloat(v.effective_price) * v.quantity, 0);

  const stockColor = (qty) =>
    qty === 0 ? 'var(--color-danger)' : qty <= 5 ? '#92400e' : 'var(--color-success)';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Inventory Overview</h1>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>{totalVariants}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Variants</div>
        </div>
        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)' }}>{totalVariants - outOfStock - lowStock}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>In Stock</div>
        </div>
        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#92400e' }}>{lowStock}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Low Stock</div>
        </div>
        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-danger)' }}>{outOfStock}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Out of Stock</div>
        </div>
        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Value</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 2, minWidth: '200px' }}>
          <div className="search-bar">
            <span>🔍</span>
            <input placeholder="Search product name, SKU…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>School</label>
          <select value={schoolFilter} onChange={(e) => setSchoolFilter(e.target.value)} className="form-input">
            <option value="">All Schools</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Vendor</label>
          <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)} className="form-input">
            <option value="">All Vendors</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.business_name}</option>)}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}><span className="spinner" /></div>
        ) : variants.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <p className="empty-state-title">No inventory found</p>
            <p className="empty-state-desc">Adjust filters to see inventory across vendors</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Vendor</th>
                  <th>School</th>
                  <th>Size</th>
                  <th>Color</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => setSelected(v)}
                    style={{
                      cursor: 'pointer',
                      background: v.quantity === 0 ? '#fff1f2' : v.quantity <= 5 ? '#fffbeb' : undefined,
                    }}
                  >
                    <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{v.product_name}</td>
                    <td><span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{v.product_sku}</span></td>
                    <td style={{ fontSize: '0.85rem' }}>{v.vendor_name}</td>
                    <td style={{ fontSize: '0.85rem' }}>{v.school_name || <span style={{ color: '#94a3b8' }}>All</span>}</td>
                    <td><strong>{v.size}</strong></td>
                    <td>{v.color || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                    <td style={{ fontWeight: 600 }}>₹{parseFloat(v.effective_price).toLocaleString('en-IN')}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: stockColor(v.quantity) }}>
                        {v.quantity}{v.quantity === 0 && ' ⚠️'}{v.quantity > 0 && v.quantity <= 5 && ' ⚡'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#475569' }}>
                      ₹{(parseFloat(v.effective_price) * v.quantity).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <Drawer isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.product_name} subtitle={`SKU: ${selected?.product_sku}`}>
        {selected && (
          <>
            <DrawerSection title="Variant Details" />
            <DrawerRow label="Product" value={selected.product_name} />
            <DrawerRow label="SKU" value={<span style={{ fontFamily: 'monospace' }}>{selected.product_sku}</span>} />
            <DrawerRow label="Vendor" value={selected.vendor_name} />
            <DrawerRow label="School" value={selected.school_name || 'All Schools'} />
            <DrawerRow label="Category" value={selected.category?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} />
            <DrawerRow label="Size" value={<strong>{selected.size}</strong>} />
            <DrawerRow label="Color" value={selected.color || '—'} />
            
            <DrawerSection title="Pricing" />
            <DrawerRow label="Base Price" value={`₹${parseFloat(selected.base_price).toLocaleString('en-IN')}`} />
            <DrawerRow label="Price Override" value={selected.price_override ? `₹${parseFloat(selected.price_override).toLocaleString('en-IN')}` : '—'} />
            <DrawerRow label="Effective Price" value={<strong style={{ color: '#059669' }}>₹{parseFloat(selected.effective_price).toLocaleString('en-IN')}</strong>} />

            <DrawerSection title="Stock" />
            <DrawerRow label="Current Stock" value={<strong style={{ color: stockColor(selected.quantity), fontSize: '1.1rem' }}>{selected.quantity}</strong>} />
            <DrawerRow label="Stock Value" value={`₹${(parseFloat(selected.effective_price) * selected.quantity).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} />
            {selected.school_commission_percent && (
              <DrawerRow label="School Commission" value={`${selected.school_commission_percent}%`} />
            )}

            <p style={{ margin: '1rem 0 0', fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
              Admin view is read-only. Stock is managed by the vendor through their panel.
            </p>
          </>
        )}
      </Drawer>
    </div>
  );
}
