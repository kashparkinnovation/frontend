'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api';
import type { Product, School, ProductImage } from '@/types';
import ImageUploader from '@/components/ui/ImageUploader';
import VariantBuilder, { VariantRow } from '@/components/ui/VariantBuilder';
import { useToast } from '@/context/ToastContext';

const CATEGORIES = [
  { value: 'shirt', label: 'Shirt' },
  { value: 'trouser', label: 'Trouser' },
  { value: 'skirt', label: 'Skirt' },
  { value: 'blazer', label: 'Blazer' },
  { value: 'tie', label: 'Tie' },
  { value: 'belt', label: 'Belt' },
  { value: 'shoes', label: 'Shoes' },
  { value: 'socks', label: 'Socks' },
  { value: 'sweater', label: 'Sweater' },
  { value: 'jacket', label: 'Jacket' },
  { value: 'tracksuit', label: 'Tracksuit' },
  { value: 'shorts', label: 'Shorts' },
  { value: 'other', label: 'Other' },
];

interface ProductFormProps {
  productId?: number;
  backHref?: string;
}

type Tab = 'details' | 'images' | 'variants';

export default function ProductForm({ productId, backHref = '/vendor/products' }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!productId;

  const [tab, setTab] = useState<Tab>('details');
  const [schools, setSchools] = useState<School[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [savedProductId, setSavedProductId] = useState<number | undefined>(productId);

  const [form, setForm] = useState({
    school: '',
    name: '',
    description: '',
    sku: '',
    category: 'other',
    gender: 'unisex',
    base_price: '',
    material: '',
    care_instructions: '',
    tags: '',
    is_active: true,
  });

  // Load approved schools
  useEffect(() => {
    apiClient.get('/schools/', { params: { approval_status: 'approved' } })
      .then((r) => setSchools(r.data.results ?? r.data))
      .catch(console.error);
  }, []);

  // Load product if editing
  useEffect(() => {
    if (!productId) return;
    apiClient.get(`/store/vendor/products/${productId}/`)
      .then((r) => {
        const p: Product = r.data;
        setForm({
          school: p.school ? String(p.school) : '',
          name: p.name,
          description: p.description,
          sku: p.sku,
          category: p.category,
          gender: p.gender,
          base_price: p.base_price,
          material: p.material,
          care_instructions: p.care_instructions,
          tags: p.tags,
          is_active: p.is_active,
        });
        setImages(p.images);
        setVariants(p.inventory.map((inv) => ({
          id: inv.id,
          size: inv.size,
          color: inv.color,
          price_override: inv.price_override ?? '',
          quantity: inv.quantity,
        })));
      })
      .catch(() => toast('Failed to load product', 'error'));
  }, [productId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  // Save product details (step 1)
  const saveDetails = async (): Promise<number | null> => {
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        name: form.name,
        description: form.description,
        sku: form.sku,
        category: form.category,
        gender: form.gender,
        base_price: form.base_price,
        material: form.material,
        care_instructions: form.care_instructions,
        tags: form.tags,
        is_active: form.is_active,
        school: form.school || null,
      };
      let id: number;
      if (isEdit && savedProductId) {
        const r = await apiClient.patch(`/store/vendor/products/${savedProductId}/`, payload);
        id = r.data.id;
        toast('Product details saved', 'success');
      } else {
        const r = await apiClient.post('/store/vendor/products/', payload);
        id = r.data.id;
        setSavedProductId(id);
        toast('Product created! Now upload images.', 'success');
      }
      return id;
    } catch (err: any) {
      const detail = err?.response?.data;
      toast(typeof detail === 'string' ? detail : JSON.stringify(detail), 'error');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleDetailsNext = async () => {
    const id = await saveDetails();
    if (id) setTab('images');
  };

  // Image upload
  const handleImageUpload = useCallback(async (file: File) => {
    if (!savedProductId) { toast('Save product details first', 'error'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const r = await apiClient.post(`/store/vendor/products/${savedProductId}/images/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImages((prev) => [...prev, r.data]);
      toast('Image uploaded', 'success');
    } catch {
      toast('Image upload failed', 'error');
    } finally {
      setUploading(false);
    }
  }, [savedProductId]);

  const handleImageDelete = useCallback(async (imageId: number) => {
    if (!savedProductId) return;
    try {
      await apiClient.delete(`/store/vendor/products/${savedProductId}/images/${imageId}/`);
      setImages((prev) => prev.filter((i) => i.id !== imageId));
      toast('Image removed', 'success');
    } catch {
      toast('Failed to delete image', 'error');
    }
  }, [savedProductId]);

  const handleSetPrimary = useCallback(async (imageId: number) => {
    if (!savedProductId) return;
    try {
      const r = await apiClient.patch(`/store/vendor/products/${savedProductId}/images/${imageId}/set-primary/`);
      setImages((prev) => prev.map((img) => ({ ...img, is_primary: img.id === imageId })));
      toast('Primary image set', 'success');
    } catch {
      toast('Failed to set primary image', 'error');
    }
  }, [savedProductId]);

  // Save variants
  const saveVariants = async () => {
    if (!savedProductId) { toast('Save product details first', 'error'); return; }
    setSaving(true);
    try {
      const toSave = variants.filter((v) => !v._delete && v.size.trim());
      if (!toSave.length) { toast('Add at least one variant', 'error'); setSaving(false); return; }
      const payload = toSave.map((v) => ({
        size: v.size.trim(),
        color: v.color.trim(),
        quantity: v.quantity,
        price_override: v.price_override ? parseFloat(v.price_override) : null,
      }));
      const r = await apiClient.post(`/store/vendor/products/${savedProductId}/inventory/`, { variants: payload });
      toast('Inventory saved!', 'success');
      router.push('/vendor/products');
    } catch (err: any) {
      toast('Failed to save variants', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <Link href={backHref} style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>← Back to Products</Link>
          <h1 className="page-title" style={{ marginTop: '0.25rem' }}>
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h1>
        </div>
        {savedProductId && (
          <Link href={`/vendor/products/${savedProductId}`} className="btn btn-ghost btn-sm">Preview →</Link>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {([
          { key: 'details', label: '1. Details', icon: '📋' },
          { key: 'images',  label: '2. Images',  icon: '📸' },
          { key: 'variants', label: '3. Variants', icon: '📦' },
        ] as { key: Tab; label: string; icon: string }[]).map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Details ────────────────────────────────────────── */}
      {tab === 'details' && (
        <div className="card">
          <p className="section-heading">Basic Information</p>

          <div className="form-grid" style={{ marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Product Name <span className="required">*</span></label>
              <input className="input" name="name" value={form.name} onChange={handleChange} required placeholder="e.g. School White Button-Down Shirt" />
            </div>
            <div className="form-group">
              <label className="form-label">SKU <span className="required">*</span></label>
              <input className="input" name="sku" value={form.sku} onChange={handleChange} required placeholder="SHIRT-WHT-001" />
              <span className="form-hint">Unique product code</span>
            </div>
            <div className="form-group">
              <label className="form-label">School</label>
              <select className="select" name="school" value={form.school} onChange={handleChange}>
                <option value="">— All Schools —</option>
                {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-grid" style={{ marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Category <span className="required">*</span></label>
              <select className="select" name="category" value={form.category} onChange={handleChange}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="select" name="gender" value={form.gender} onChange={handleChange}>
                <option value="unisex">Unisex</option>
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Base Price (₹) <span className="required">*</span></label>
              <input className="input" type="number" name="base_price" value={form.base_price} onChange={handleChange} required min="0" step="0.01" placeholder="0.00" />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Description</label>
            <textarea className="textarea" name="description" value={form.description} onChange={handleChange} placeholder="Describe the product — fabric, design, purpose…" rows={4} />
          </div>

          <hr className="divider" />
          <p className="section-heading">Additional Details</p>

          <div className="form-grid" style={{ marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Material / Fabric</label>
              <input className="input" name="material" value={form.material} onChange={handleChange} placeholder="e.g. 65% Polyester, 35% Cotton" />
            </div>
            <div className="form-group">
              <label className="form-label">Tags</label>
              <input className="input" name="tags" value={form.tags} onChange={handleChange} placeholder="summer, formal, cotton (comma-separated)" />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Care Instructions</label>
            <textarea className="textarea" name="care_instructions" value={form.care_instructions} onChange={handleChange} placeholder="Machine wash cold. Do not bleach. Tumble dry low." rows={3} />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem', flexDirection: 'row', alignItems: 'center', gap: '0.625rem' }}>
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <label htmlFor="is_active" style={{ cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
              Product is active (visible to students)
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Link href={backHref} className="btn btn-ghost">Cancel</Link>
            <button className="btn btn-primary" onClick={handleDetailsNext} disabled={saving}>
              {saving && <span className="spinner" />}
              {saving ? 'Saving…' : 'Save & Continue →'}
            </button>
          </div>
        </div>
      )}

      {/* ── Tab: Images ─────────────────────────────────────────── */}
      {tab === 'images' && (
        <div className="card">
          <p className="section-heading">Product Images</p>
          {!savedProductId ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <p className="empty-state-title">Save product details first</p>
              <button className="btn btn-primary" onClick={() => setTab('details')}>← Go to Details</button>
            </div>
          ) : (
            <>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: 0 }}>
                Upload multiple photos from different angles. The first uploaded image (or the one you mark as primary) will be shown in listings.
              </p>
              <ImageUploader
                images={images}
                onUpload={handleImageUpload}
                onDelete={handleImageDelete}
                onSetPrimary={handleSetPrimary}
                uploading={uploading}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                <button className="btn btn-ghost" onClick={() => setTab('details')}>← Details</button>
                <button className="btn btn-primary" onClick={() => setTab('variants')}>Continue to Variants →</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Tab: Variants ───────────────────────────────────────── */}
      {tab === 'variants' && (
        <div className="card">
          <p className="section-heading">Size & Color Variants</p>
          {!savedProductId ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <p className="empty-state-title">Save product details first</p>
              <button className="btn btn-primary" onClick={() => setTab('details')}>← Go to Details</button>
            </div>
          ) : (
            <>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: 0 }}>
                Define all size/color combinations with their stock quantity. Leave Price Override blank to use the base price.
              </p>
              <VariantBuilder
                variants={variants}
                onChange={setVariants}
                basePrice={form.base_price}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                <button className="btn btn-ghost" onClick={() => setTab('images')}>← Images</button>
                <button className="btn btn-primary" onClick={saveVariants} disabled={saving}>
                  {saving && <span className="spinner" />}
                  {saving ? 'Saving…' : isEdit ? '✓ Save All Changes' : '✓ Publish Product'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
