'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api';
import type { Product } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import ImageUploader from '@/components/ui/ImageUploader';
import { useToast } from '@/context/ToastContext';
import type { ProductImage } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeImg, setActiveImg] = useState<string | null>(null);

  const fetchProduct = React.useCallback(() => {
    apiClient.get(`/store/vendor/products/${id}/`)
      .then((r) => {
        setProduct(r.data);
        const primary = r.data.images?.find((i: ProductImage) => i.is_primary) || r.data.images?.[0];
        if (primary) setActiveImg(resolveUrl(primary.image));
      })
      .catch(() => toast('Failed to load product', 'error'))
      .finally(() => setLoading(false));
  }, [id, toast]);

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  const resolveUrl = (url: string) => url.startsWith('http') ? url : `${API_BASE}${url}`;

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      await apiClient.post(`/store/vendor/products/${id}/images/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast('Image uploaded', 'success');
      fetchProduct();
    } catch { toast('Upload failed', 'error'); }
    finally { setUploading(false); }
  };

  const handleImageDelete = async (imageId: number) => {
    try {
      await apiClient.delete(`/store/vendor/products/${id}/images/${imageId}/`);
      toast('Image removed', 'success');
      fetchProduct();
    } catch { toast('Delete failed', 'error'); }
  };

  const handleSetPrimary = async (imageId: number) => {
    try {
      await apiClient.patch(`/store/vendor/products/${id}/images/${imageId}/set-primary/`);
      toast('Primary image updated', 'success');
      fetchProduct();
    } catch { toast('Failed', 'error'); }
  };

  const toggleActive = async () => {
    if (!product) return;
    try {
      const r = await apiClient.patch(`/store/vendor/products/${id}/`, { is_active: !product.is_active });
      setProduct((p) => p ? { ...p, is_active: r.data.is_active } : p);
      toast(`Product ${r.data.is_active ? 'activated' : 'deactivated'}`, 'success');
    } catch { toast('Failed', 'error'); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><span className="spinner dark" style={{ width: '2rem', height: '2rem' }} /></div>;
  if (!product) return <div className="card"><p>Product not found.</p></div>;

  const totalStock = product.inventory.reduce((s, i) => s + i.quantity, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <Link href="/vendor/products" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>← Back to Products</Link>
          <h1 className="page-title" style={{ marginTop: '0.25rem' }}>{product.name}</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={toggleActive}
            style={{ color: product.is_active ? 'var(--color-success)' : 'var(--color-danger)' }}
          >
            {product.is_active ? '● Active' : '○ Inactive'}
          </button>
          <Link href={`/vendor/products/${id}/edit`} className="btn btn-primary btn-sm">✏️ Edit Product</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Image panel */}
        <div className="card">
          <div style={{
            aspectRatio: '4/3', borderRadius: 'var(--radius)', overflow: 'hidden',
            background: 'var(--color-bg)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '4rem', marginBottom: '1rem',
          }}>
            {activeImg
              ? <img src={activeImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              : '👕'}
          </div>

          {/* Thumbnails */}
          {product.images.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {product.images.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setActiveImg(resolveUrl(img.image))}
                  style={{
                    width: 56, height: 56, borderRadius: 'var(--radius)',
                    overflow: 'hidden', cursor: 'pointer',
                    border: activeImg === resolveUrl(img.image) ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <img src={resolveUrl(img.image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}

          <hr className="divider" />
          <p className="section-heading">Manage Images</p>
          <ImageUploader
            images={product.images}
            onUpload={handleImageUpload}
            onDelete={handleImageDelete}
            onSetPrimary={handleSetPrimary}
            uploading={uploading}
          />
        </div>

        {/* Product info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <span className="chip">{product.category}</span>
              <span className="chip">{product.gender}</span>
              {product.school_name && <span className="chip">🏫 {product.school_name}</span>}
              <StatusBadge status={product.is_active ? 'active' : 'inactive'} />
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>SKU</span>
              <p style={{ margin: '0.125rem 0 0', fontFamily: 'monospace', fontWeight: 600 }}>{product.sku}</p>
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Base Price</span>
              <p style={{ margin: '0.125rem 0 0', fontSize: '1.5rem', fontWeight: 800 }}>₹{parseFloat(product.base_price).toLocaleString('en-IN')}</p>
            </div>

            {product.description && (
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Description</span>
                <p style={{ margin: '0.125rem 0 0', fontSize: '0.875rem', lineHeight: 1.6 }}>{product.description}</p>
              </div>
            )}

            {product.material && (
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Material</span>
                <p style={{ margin: '0.125rem 0 0', fontSize: '0.875rem' }}>{product.material}</p>
              </div>
            )}

            {product.care_instructions && (
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Care Instructions</span>
                <p style={{ margin: '0.125rem 0 0', fontSize: '0.875rem' }}>{product.care_instructions}</p>
              </div>
            )}

            {product.tags && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Tags</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                  {product.tags.split(',').map((t) => t.trim()).filter(Boolean).map((tag) => (
                    <span key={tag} className="chip">#{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Inventory table */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700 }}>
                Inventory <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>({totalStock} units total)</span>
              </h3>
              <Link href={`/vendor/products/${id}/edit`} style={{ fontSize: '0.8125rem', color: 'var(--color-primary)' }}>
                Manage variants →
              </Link>
            </div>

            {product.inventory.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No variants added yet</p>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Size</th>
                      <th>Color</th>
                      <th>Price</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.inventory.map((inv) => (
                      <tr key={inv.id}>
                        <td><strong>{inv.size}</strong></td>
                        <td>{inv.color || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}</td>
                        <td>₹{parseFloat(inv.effective_price).toLocaleString('en-IN')}</td>
                        <td>
                          <span style={{
                            fontWeight: 600,
                            color: inv.quantity === 0 ? 'var(--color-danger)' : inv.quantity <= 5 ? 'var(--color-warning)' : 'var(--color-success)',
                          }}>
                            {inv.quantity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
