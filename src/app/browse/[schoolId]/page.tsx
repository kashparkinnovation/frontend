'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useStudent } from '@/context/StudentContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface School { id: number; name: string; code: string; city: string; state: string; logo: string | null; address: string; contact_email: string; contact_phone: string; }
interface Inventory { id: number; size: string; color: string; quantity: number; effective_price: string; }
interface Product { id: number; name: string; sku: string; category: string; base_price: string; description: string; gender: string; primary_image_url: string | null; images: { image: string; is_primary: boolean }[]; inventory: Inventory[]; tags: string; }

const CAT_ICON: Record<string, string> = { shirt: '👔', trouser: '👖', skirt: '👗', blazer: '🧥', tie: '👔', belt: '🔵', shoes: '👟', socks: '🧦', sweater: '🧶', jacket: '🧥', tracksuit: '🏃', shorts: '🩳', other: '👕' };
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '22', '24', '26', '28', '30', '32', '34', '36', '38', '40'];
const GENDERS = [{ value: 'boys', label: '👦 Boys' }, { value: 'girls', label: '👧 Girls' }, { value: 'unisex', label: '🧒 Unisex' }];

const SORT_OPTIONS = [
  { value: 'default', label: 'Default Sorting' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A-Z' },
  { value: 'stock', label: 'In Stock First' },
];

function ProductSkeleton() {
  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      <div className="mat-shimmer" style={{ height: 260 }} />
      <div style={{ padding: '1rem' }}>
        <div className="mat-shimmer" style={{ height: 14, borderRadius: '6px', marginBottom: '0.5rem', width: '60%' }} />
        <div className="mat-shimmer" style={{ height: 20, borderRadius: '6px', marginBottom: '0.75rem' }} />
        <div className="mat-shimmer" style={{ height: 16, borderRadius: '6px', width: '40%' }} />
      </div>
    </div>
  );
}

export default function SchoolCataloguePage() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const [school, setSchool] = useState<School | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [sortBy, setSortBy] = useState('default');
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const { isAuthenticated } = useAuth();
  const { activeStudent } = useStudent();
  const { addItem, totalItems } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    if (!schoolId) return;
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/schools/public/${schoolId}/`).then((r) => r.json()),
      fetch(`${API_URL}/store/?school=${schoolId}`).then((r) => r.json()),
    ]).then(([s, p]) => {
      setSchool(s);
      const prods = Array.isArray(p) ? p : (p.results ?? []);
      setProducts(prods);
      // Set max price from products
      const prices = prods.map((pr: Product) => parseFloat(pr.base_price));
      if (prices.length) setMaxPrice(Math.ceil(Math.max(...prices) / 100) * 100 + 200);
    }).catch(console.error).finally(() => setLoading(false));
  }, [schoolId]);

  const logoUrl = (logo: string | null) => logo ? (logo.startsWith('http') ? logo : `${API_BASE}${logo}`) : null;
  const imgUrl = useCallback((p: Product, secondary = false) => {
    const imgs = p.images;
    if (secondary && imgs.length > 1) {
      const nonPrimary = imgs.find((i) => !i.is_primary) || imgs[1];
      return nonPrimary?.image ? (nonPrimary.image.startsWith('http') ? nonPrimary.image : `${API_BASE}${nonPrimary.image}`) : null;
    }
    if (p.primary_image_url) return p.primary_image_url;
    const primary = imgs.find((i) => i.is_primary) || imgs[0];
    return primary?.image ? (primary.image.startsWith('http') ? primary.image : `${API_BASE}${primary.image}`) : null;
  }, []);

  const categories = [...new Set(products.map((p) => p.category))];

  const toggleFilter = <T,>(arr: T[], val: T): T[] => arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const filteredProducts = products
    .filter((p) => {
      const matchCat = selectedCats.length === 0 || selectedCats.includes(p.category);
      const matchGender = selectedGenders.length === 0 || selectedGenders.includes(p.gender);
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchPrice = parseFloat(p.base_price) <= maxPrice;
      const matchSize = selectedSizes.length === 0 || p.inventory.some((i) => selectedSizes.includes(i.size) && i.quantity > 0);
      return matchCat && matchGender && matchSearch && matchPrice && matchSize;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return parseFloat(a.base_price) - parseFloat(b.base_price);
      if (sortBy === 'price_desc') return parseFloat(b.base_price) - parseFloat(a.base_price);
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'stock') {
        const aStock = a.inventory.reduce((s, i) => s + i.quantity, 0);
        const bStock = b.inventory.reduce((s, i) => s + i.quantity, 0);
        return bStock - aStock;
      }
      return 0;
    });

  const canOrder = isAuthenticated && activeStudent?.school === Number(schoolId) && activeStudent?.is_verified;
  const needsVerification = isAuthenticated && activeStudent?.school === Number(schoolId) && !activeStudent?.is_verified;

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canOrder) { showToast('You need a verified student profile for this school to order.', 'error'); return; }
    const first = product.inventory.find((i) => i.quantity > 0);
    if (!first) { showToast('Out of stock', 'error'); return; }
    addItem({ productId: product.id, inventoryId: first.id, productName: product.name, size: first.size, color: first.color, quantity: 1, unitPrice: parseFloat(first.effective_price), schoolId: Number(schoolId) });
    showToast(`${product.name} added to cart ✅`, 'success');
  };

  const activeFiltersCount = selectedCats.length + selectedGenders.length + selectedSizes.length + (maxPrice < 4999 ? 1 : 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--mat-bg)', fontFamily: 'var(--font-sans)' }}>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <header style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 200, boxShadow: 'var(--mat-shadow-1)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 1.5rem', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, background: 'var(--mat-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', boxShadow: '0 4px 12px rgba(79,70,229,0.3)' }}>🎓</div>
            <span style={{ fontSize: '1.125rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--mat-primary)' }}>eSchoolKart</span>
          </Link>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--mat-text-3)', flex: 1, minWidth: 0 }}>
            <Link href="/" style={{ color: 'var(--mat-text-3)', textDecoration: 'none', whiteSpace: 'nowrap' }}>Home</Link>
            <span>›</span>
            <Link href="/browse" style={{ color: 'var(--mat-text-3)', textDecoration: 'none', whiteSpace: 'nowrap' }}>Browse</Link>
            <span>›</span>
            <span style={{ color: 'var(--mat-text-1)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{school?.name || '…'}</span>
          </div>
          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            {isAuthenticated ? (
              <Link href="/store/cart" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--mat-primary)', color: 'white', padding: '0.5rem 1rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem', boxShadow: '0 4px 12px rgba(79,70,229,0.3)' }}>
                🛒 Cart {totalItems > 0 && <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '9999px', padding: '0 0.375rem', fontSize: '0.75rem' }}>{totalItems}</span>}
              </Link>
            ) : (
              <>
                <Link href="/login" style={{ fontSize: '0.875rem', color: 'var(--mat-text-2)', textDecoration: 'none' }}>Sign In</Link>
                <Link href="/register" style={{ background: 'var(--mat-primary)', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem' }}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── SCHOOL BANNER ────────────────────────────────────────────────── */}
      {school && (
        <div style={{ position: 'relative', background: '#0f172a', color: 'white', padding: '4rem 1.5rem 4rem', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("https://images.unsplash.com/photo-1594938298596-70f56fb3cecb?auto=format&fit=crop&w=2000&q=80")', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.4 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.7) 100%)' }} />
          
          <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              <div style={{ width: 100, height: 100, borderRadius: '20px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', overflow: 'hidden', flexShrink: 0, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', padding: logoUrl(school.logo) ? 0 : '1rem' }}>
                {logoUrl(school.logo) ? <img src={logoUrl(school.logo) ?? undefined} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : '🏫'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="mat-badge mat-badge-green" style={{ background: 'rgba(16,185,129,0.2)', color: '#6ee7b7', border: '1px solid rgba(110,231,183,0.3)' }}>✓ Verified Partner</span>
                  {products.length > 0 && <span className="mat-badge mat-badge-blue" style={{ background: 'rgba(59,130,246,0.2)', color: '#93c5fd', border: '1px solid rgba(147,197,253,0.3)' }}>{products.length} Products</span>}
                </div>
                <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, margin: '0 0 0.5rem', letterSpacing: '-0.03em' }}>{school.name}</h1>
                <p style={{ margin: 0, opacity: 0.8, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  {school.city && <span>📍 {school.city}{school.state ? `, ${school.state}` : ''}</span>}
                  {school.code && <span>· Code: <strong>{school.code}</strong></span>}
                </p>
              </div>
              {/* Active student pill */}
              {canOrder && activeStudent && (
                <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(110,231,183,0.3)', borderRadius: '14px', padding: '1rem 1.25rem', backdropFilter: 'blur(8px)' }}>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Shopping for</div>
                  <div style={{ fontWeight: 800, fontSize: '1.125rem' }}>{activeStudent.student_name} ✅</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CONTEXTUAL BANNERS ───────────────────────────────────────────── */}
      {!isAuthenticated && (
        <div style={{ background: '#fef3c7', borderBottom: '1px solid #fcd34d', padding: '0.875rem 1.5rem' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e', fontWeight: 500 }}>🔒 <strong>Sign in to order.</strong> Browse freely — add to cart after logging in.</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <Link href="/login" style={{ background: '#92400e', color: 'white', padding: '0.4rem 0.875rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 700 }}>Sign In</Link>
              <Link href="/register" style={{ background: '#fef3c7', color: '#92400e', padding: '0.4rem 0.875rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 600, border: '1px solid #f59e0b' }}>Register</Link>
            </div>
          </div>
        </div>
      )}
      {needsVerification && activeStudent && (
        <div style={{ background: '#fff7ed', borderBottom: '1px solid #fed7aa', padding: '0.875rem 1.5rem' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#9a3412', fontWeight: 500 }}>⏳ <strong>{activeStudent.student_name}</strong> is not yet verified for this school.</p>
            <Link href={`/store/students/${activeStudent.id}`} style={{ background: '#ea580c', color: 'white', padding: '0.4rem 0.875rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 700, flexShrink: 0 }}>Request Verification →</Link>
          </div>
        </div>
      )}

      {/* ── MAIN LAYOUT: SIDEBAR + GRID ─────────────────────────────────── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>

        {/* ── FILTER SIDEBAR ──── */}
        <aside className="mat-filter-sidebar" style={{ display: 'flex' }}>
          {/* Header */}
          <div style={{ padding: '1.125rem 1.25rem', borderBottom: '1px solid var(--mat-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--mat-text-1)' }}>Filters {activeFiltersCount > 0 && <span style={{ background: 'var(--mat-primary)', color: 'white', borderRadius: '99px', padding: '0.1rem 0.5rem', fontSize: '0.7rem', marginLeft: '0.375rem' }}>{activeFiltersCount}</span>}</span>
            {activeFiltersCount > 0 && (
              <button onClick={() => { setSelectedCats([]); setSelectedGenders([]); setSelectedSizes([]); setMaxPrice(5000); }} style={{ background: 'none', border: 'none', color: 'var(--mat-primary)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Clear all</button>
            )}
          </div>

          {/* Category */}
          <div className="mat-filter-section">
            <p className="mat-filter-title">Category</p>
            {categories.map((cat) => (
              <label key={cat} className="mat-filter-option">
                <input type="checkbox" checked={selectedCats.includes(cat)} onChange={() => setSelectedCats(toggleFilter(selectedCats, cat))} />
                <span>{CAT_ICON[cat] || '👕'} {cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--mat-text-3)' }}>({products.filter((p) => p.category === cat).length})</span>
              </label>
            ))}
          </div>

          {/* Gender */}
          <div className="mat-filter-section">
            <p className="mat-filter-title">Gender</p>
            {GENDERS.map((g) => (
              <label key={g.value} className="mat-filter-option">
                <input type="checkbox" checked={selectedGenders.includes(g.value)} onChange={() => setSelectedGenders(toggleFilter(selectedGenders, g.value))} />
                {g.label}
              </label>
            ))}
          </div>

          {/* Price Range */}
          <div className="mat-filter-section">
            <p className="mat-filter-title">Max Price</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.625rem', fontSize: '0.8125rem', color: 'var(--mat-text-2)' }}>
              <span>₹0</span>
              <strong style={{ color: 'var(--mat-primary)' }}>₹{maxPrice.toLocaleString('en-IN')}</strong>
            </div>
            <input type="range" min={200} max={10000} step={100} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="mat-range" />
          </div>

          {/* Available Sizes */}
          <div className="mat-filter-section">
            <p className="mat-filter-title">Size</p>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {SIZES.filter((s) => products.some((p) => p.inventory.some((i) => i.size === s && i.quantity > 0))).map((size) => (
                <button key={size} onClick={() => setSelectedSizes(toggleFilter(selectedSizes, size))}
                  style={{ padding: '0.3rem 0.625rem', borderRadius: '6px', border: `1.5px solid ${selectedSizes.includes(size) ? 'var(--mat-primary)' : 'var(--mat-border)'}`, background: selectedSizes.includes(size) ? 'var(--mat-primary-light)' : 'white', color: selectedSizes.includes(size) ? 'var(--mat-primary)' : 'var(--mat-text-2)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s' }}>
                  {size}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── PRODUCT GRID AREA ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Action bar */}
          <div style={{ display: 'flex', gap: '0.875rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1.5px solid var(--mat-border)', borderRadius: '10px', padding: '0.625rem 1rem', flex: 1, minWidth: 200, maxWidth: 360, boxShadow: 'var(--mat-shadow-1)' }}>
              <span style={{ color: 'var(--mat-text-3)' }}>🔍</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search uniforms in this school…" style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.875rem', flex: 1, color: 'var(--mat-text-1)' }} />
            </div>
            {/* Sort */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1.5px solid var(--mat-border)', borderRadius: '10px', padding: '0.625rem 1rem', boxShadow: 'var(--mat-shadow-1)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--mat-text-3)', whiteSpace: 'nowrap' }}>Sort:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.875rem', color: 'var(--mat-text-1)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {/* Results count */}
            <span style={{ fontSize: '0.8125rem', color: 'var(--mat-text-3)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
              {filteredProducts.length} of {products.length} items
            </span>
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
              {[...Array(8)].map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '16px', padding: '4rem', textAlign: 'center', border: '1px solid var(--mat-border)' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔍</div>
              <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800 }}>No uniforms found</h3>
              <p style={{ color: 'var(--mat-text-2)', margin: '0 0 1.5rem' }}>Try adjusting your filters or search terms.</p>
              <button onClick={() => { setSearch(''); setSelectedCats([]); setSelectedGenders([]); setSelectedSizes([]); }} style={{ background: 'var(--mat-primary)', color: 'white', border: 'none', borderRadius: '10px', padding: '0.75rem 1.5rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Clear All Filters</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
              {filteredProducts.map((product, idx) => {
                const primaryImg = imgUrl(product);
                const secondaryImg = imgUrl(product, true);
                const totalStock = product.inventory.reduce((s, i) => s + i.quantity, 0);
                const minPrice = product.inventory.reduce((min, i) => Math.min(min, parseFloat(i.effective_price)), parseFloat(product.base_price));
                const availSizes = [...new Set(product.inventory.filter((i) => i.quantity > 0).map((i) => i.size))].slice(0, 5);
                const isHovered = hoveredCard === product.id;
                const isLowStock = totalStock > 0 && totalStock <= 5;
                const isBestseller = idx < 3;

                return (
                  <Link key={product.id} href={`/browse/${schoolId}/${product.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                    className={`mat-animate mat-animate-${Math.min((idx % 6) + 1, 6)}`}>
                    <div className="mat-product-card"
                      onMouseEnter={() => setHoveredCard(product.id)}
                      onMouseLeave={() => setHoveredCard(null)}>
                      {/* Image container */}
                      <div style={{ position: 'relative', overflow: 'hidden', background: '#f8fafc', aspectRatio: '3/4' }}>
                        {/* Primary image */}
                        {primaryImg ? (
                          <img src={primaryImg} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, transition: 'opacity 0.4s, transform 0.6s var(--mat-ease-soft)', opacity: (isHovered && secondaryImg) ? 0 : 1, transform: isHovered ? 'scale(1.06)' : 'scale(1)' }} />
                        ) : (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, #e2e8f0 0%, #cbd5e1 100%)' }}>
                            <img src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=400&q=80" alt="Placeholder" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15, mixBlendMode: 'multiply' }} />
                          </div>
                        )}
                        {/* Secondary image on hover */}
                        {secondaryImg && isHovered && (
                          <img src={secondaryImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, animation: 'mat-fade-in 0.3s ease' }} />
                        )}
                        {/* Badges */}
                        <div style={{ position: 'absolute', top: '0.625rem', left: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          {isBestseller && <span className="mat-badge mat-badge-amber">⭐ Bestseller</span>}
                          {isLowStock && <span className="mat-badge mat-badge-red">🔥 Low Stock</span>}
                          {totalStock === 0 && <span className="mat-badge" style={{ background: '#475569', color: 'white' }}>Out of Stock</span>}
                        </div>
                        {/* Quick add overlay */}
                        <button className="mat-quick-add" onClick={(e) => handleQuickAdd(e, product)} style={{ fontFamily: 'var(--font-sans)' }}>
                          + Quick Add
                        </button>
                      </div>
                      {/* Card body */}
                      <div style={{ padding: '0.875rem' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--mat-text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>{product.category}</div>
                        <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.5rem', color: 'var(--mat-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
                        {/* Size swatches */}
                        {availSizes.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.625rem', flexWrap: 'wrap' }}>
                            {availSizes.map((s) => (
                              <span key={s} style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid var(--mat-border)', fontSize: '0.65rem', fontWeight: 600, color: 'var(--mat-text-2)', background: '#f8fafc' }}>{s}</span>
                            ))}
                            {product.inventory.filter((i) => i.quantity > 0).length > 5 && <span style={{ fontSize: '0.65rem', color: 'var(--mat-text-3)' }}>+{product.inventory.filter((i) => i.quantity > 0).length - 5}</span>}
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 900, fontSize: '1.0625rem', color: 'var(--mat-primary)' }}>₹{minPrice.toLocaleString('en-IN')}</span>
                          <span style={{ fontSize: '0.7rem', color: totalStock === 0 ? 'var(--mat-danger)' : isLowStock ? '#f59e0b' : 'var(--mat-success)', fontWeight: 700 }}>
                            {totalStock === 0 ? 'Out of Stock' : isLowStock ? `Only ${totalStock} left` : 'In Stock'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
