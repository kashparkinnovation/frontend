'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useStudent } from '@/context/StudentContext';
import { useCart } from '@/context/CartContext';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface Inventory { id: number; size: string; color: string; quantity: number; effective_price: string; }
interface ProductImage { image: string; is_primary: boolean; }
interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  base_price: string;
  description: string;
  gender: string;
  primary_image_url: string | null;
  images: ProductImage[];
  inventory: Inventory[];
}

export default function ProductDetailPage() {
  const { schoolId, productId } = useParams<{ schoolId: string; productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const { isAuthenticated } = useAuth();
  const { activeStudent } = useStudent();
  const { addItem, totalItems } = useCart();

  useEffect(() => {
    if (!productId) return;
    Promise.all([
      fetch(`${API_URL}/store/${productId}/`).then(r => r.json()),
      fetch(`${API_URL}/schools/public/${schoolId}/`).then(r => r.json())
    ]).then(([prodData, schoolData]) => {
      setProduct(prodData);
      setSchool(schoolData);
      const first = prodData.inventory.find((i: Inventory) => i.quantity > 0);
      if (first) { setSelectedSize(first.size); setSelectedColor(first.color); }
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [productId, schoolId]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem', fontFamily: 'var(--font-sans)', color: '#94a3b8', fontSize: '1.25rem' }}>Loading product details…</div>;
  if (!product) return <div style={{ padding: '10rem', textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: '1.25rem' }}>Product not found. <Link href={`/browse/${schoolId}`} style={{ color: '#4f46e5', textDecoration: 'none' }}>← Back</Link></div>;

  const allImages = [
    ...(product.images.map((img) => img.image.startsWith('http') ? img.image : `${API_BASE}${img.image}`)),
  ];
  if (product.primary_image_url && !allImages.includes(product.primary_image_url)) {
    allImages.unshift(product.primary_image_url);
  }

  const sizes = [...new Set(product.inventory.map((i) => i.size))];
  const colorsForSize = [...new Set(product.inventory.filter((i) => i.size === selectedSize).map((i) => i.color))];
  const selectedVariant = product.inventory.find((i) => i.size === selectedSize && i.color === selectedColor);
  const price = selectedVariant ? parseFloat(selectedVariant.effective_price) : parseFloat(product.base_price);
  const inStock = (selectedVariant?.quantity ?? 0) > 0;

  const canOrder = isAuthenticated && activeStudent?.school === Number(schoolId) && activeStudent?.is_verified;

  const handleAddToCart = () => {
    if (!canOrder || !selectedVariant) return;
    addItem({ productId: product.id, inventoryId: selectedVariant.id, productName: product.name, size: selectedSize, color: selectedColor, quantity: qty, unitPrice: price, schoolId: Number(schoolId) });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column' }}>
      {/* Premium Header */}
      <Header />

      {/* Main Product Area */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '5rem', alignItems: 'flex-start' }}>
          
          {/* Left Column: Image Gallery */}
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: 80, flexShrink: 0 }}>
                {allImages.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} 
                    style={{ width: 80, height: 100, borderRadius: '12px', border: `2px solid ${activeImg === i ? '#4f46e5' : 'transparent'}`, overflow: 'hidden', padding: 0, cursor: 'pointer', background: '#f8fafc', transition: 'all 0.2s', opacity: activeImg === i ? 1 : 0.6 }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = activeImg === i ? '1' : '0.6')}
                  >
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}

            {/* Main Active Image */}
            <div style={{ flex: 1, background: '#f8fafc', borderRadius: '24px', overflow: 'hidden', aspectRatio: '4/5', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {allImages[activeImg] ? (
                <img src={allImages[activeImg]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ color: '#cbd5e1', fontSize: '1.5rem', fontWeight: 600 }}>No Image Available</div>
              )}
            </div>
          </div>

          {/* Right Column: Product Detail & Actions (Sticky) */}
          <div style={{ position: 'sticky', top: '7rem' }}>
            
            {/* Breadcrumb */}
            {school && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#64748b', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <Link href="/" style={{ color: '#64748b', textDecoration: 'none' }}>Home</Link>
                <span>/</span>
                <Link href="/browse" style={{ color: '#64748b', textDecoration: 'none' }}>Schools</Link>
                <span>/</span>
                <Link href={`/browse/${schoolId}`} style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}>{school.name}</Link>
                <span>/</span>
                <span style={{ color: '#0f172a' }}>{product.category}</span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#4f46e5', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em', background: '#eef2ff', padding: '0.3rem 0.75rem', borderRadius: '6px' }}>{product.category}</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>SKU: {product.sku}</span>
            </div>
            
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 1rem', letterSpacing: '-0.03em', color: '#0f172a', lineHeight: 1.1 }}>{product.name}</h1>
            
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '2rem' }}>₹{price.toLocaleString('en-IN')}</div>

            {product.description && (
              <div style={{ marginBottom: '2rem' }}>
                <p style={{ color: '#64748b', lineHeight: 1.8, margin: 0, fontSize: '1rem' }}>{product.description}</p>
              </div>
            )}

            {/* School Info Block */}
            {school && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', marginBottom: '2.5rem', border: '1px solid #e2e8f0' }}>
                <div style={{ width: 48, height: 48, borderRadius: '8px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', overflow: 'hidden', flexShrink: 0, border: '1px solid #e2e8f0', padding: school.logo ? 0 : '0.25rem' }}>
                  {school.logo ? <img src={school.logo.startsWith('http') ? school.logo : `${API_BASE}${school.logo}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : '🏫'}
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.1rem' }}>Official Uniform For</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9375rem' }}>{school.name}</div>
                  {school.city && <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>📍 {school.city}{school.state ? `, ${school.state}` : ''}</div>}
                </div>
              </div>
            )}

            {/* Content Tabs / Additional Content */}
            <div style={{ marginBottom: '2.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                 <div>
                   <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: '#0f172a', fontWeight: 700 }}>🚚 Shipping & Delivery</h4>
                   <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.6 }}>Orders are typically dispatched within 24-48 hours. Delivery to your school or home address.</p>
                 </div>
                 <div>
                   <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: '#0f172a', fontWeight: 700 }}>🔄 Return Policy</h4>
                   <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.6 }}>7-day hassle-free returns for size exchanges. Items must be unused with tags attached.</p>
                 </div>
               </div>
            </div>

            {/* Size selector */}
            {sizes.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a' }}>Select Size</span>
                  <span style={{ fontSize: '0.8125rem', color: '#4f46e5', fontWeight: 600, cursor: 'pointer' }}>Size Guide</span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {sizes.map((size) => {
                    const variant = product.inventory.find((i) => i.size === size);
                    const available = (variant?.quantity ?? 0) > 0;
                    return (
                      <button key={size} onClick={() => { if (available) { setSelectedSize(size); setSelectedColor(''); } }}
                        style={{ minWidth: '3.5rem', padding: '0.75rem 1rem', borderRadius: '12px', border: `2px solid ${selectedSize === size ? '#0f172a' : '#e2e8f0'}`, background: selectedSize === size ? '#0f172a' : available ? 'white' : '#f8fafc', color: !available ? '#cbd5e1' : selectedSize === size ? 'white' : '#0f172a', fontWeight: 700, cursor: available ? 'pointer' : 'not-allowed', fontSize: '0.9375rem', transition: 'all 0.15s' }}>
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color selector */}
            {colorsForSize.filter(Boolean).length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a', display: 'block', marginBottom: '0.875rem' }}>Select Color</span>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {colorsForSize.map((color) => (
                    <button key={color} onClick={() => setSelectedColor(color)}
                      style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', border: `2px solid ${selectedColor === color ? '#0f172a' : '#e2e8f0'}`, background: selectedColor === color ? '#0f172a' : 'white', color: selectedColor === color ? 'white' : '#0f172a', fontWeight: 700, cursor: 'pointer', fontSize: '0.9375rem', transition: 'all 0.15s' }}>
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div style={{ marginBottom: '2.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a', display: 'block', marginBottom: '0.875rem' }}>Quantity</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', width: 'fit-content', padding: '0.25rem' }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 44, height: 44, borderRadius: '8px', border: 'none', background: 'transparent', fontWeight: 700, fontSize: '1.25rem', cursor: 'pointer', color: '#0f172a' }}>−</button>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', minWidth: 28, textAlign: 'center', color: '#0f172a' }}>{qty}</span>
                <button onClick={() => setQty(Math.min(selectedVariant?.quantity ?? 10, qty + 1))} style={{ width: 44, height: 44, borderRadius: '8px', border: 'none', background: 'transparent', fontWeight: 700, fontSize: '1.25rem', cursor: 'pointer', color: '#0f172a' }}>+</button>
              </div>
            </div>

            {/* CTA */}
            {!isAuthenticated ? (
              <div style={{ background: '#fef3c7', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #fcd34d' }}>
                <h4 style={{ margin: '0 0 0.5rem', color: '#92400e', fontSize: '1.0625rem', fontWeight: 800 }}>Sign in to order uniforms</h4>
                <p style={{ margin: '0 0 1rem', color: '#b45309', fontSize: '0.9375rem' }}>Create a parent profile to purchase official uniforms for your child.</p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Link href="/login" style={{ flex: 1, textAlign: 'center', background: '#92400e', color: 'white', padding: '0.875rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.9375rem' }}>Sign In</Link>
                  <Link href="/register" style={{ flex: 1, textAlign: 'center', background: 'white', color: '#92400e', padding: '0.875rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.9375rem', border: '1px solid #92400e' }}>Register</Link>
                </div>
              </div>
            ) : !canOrder ? (
              <div style={{ background: '#fef3c7', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #fcd34d' }}>
                <p style={{ margin: '0 0 1rem', color: '#92400e', fontSize: '1rem', fontWeight: 600 }}>⏳ Your active student is not verified for this school yet.</p>
                <Link href="/store/students" style={{ display: 'block', textAlign: 'center', background: '#92400e', color: 'white', padding: '0.875rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.9375rem' }}>Manage Student Profiles →</Link>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={!inStock || !selectedSize}
                style={{ width: '100%', padding: '1.25rem', borderRadius: '14px', border: 'none', background: added ? '#10b981' : (inStock && selectedSize) ? '#4f46e5' : '#e2e8f0', color: (inStock && selectedSize) ? 'white' : '#94a3b8', fontWeight: 800, fontSize: '1.125rem', cursor: (inStock && selectedSize) ? 'pointer' : 'not-allowed', transition: 'all 0.2s', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', boxShadow: (inStock && selectedSize && !added) ? '0 8px 24px rgba(79,70,229,0.3)' : 'none' }}>
                {added ? '✅ Added to Cart!' : !inStock ? 'Out of Stock' : !selectedSize ? 'Select a Size' : '🛒 Add to Cart'}
              </button>
            )}

            {selectedVariant && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.875rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: inStock ? '#10b981' : '#ef4444' }} />
                {selectedVariant.quantity} unit{selectedVariant.quantity !== 1 ? 's' : ''} available
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
