'use client';

import React, { useState } from 'react';
import type { ProductInventory } from '@/types';

interface VariantRow {
  id?: number;        // undefined = new (not yet saved)
  size: string;
  color: string;
  price_override: string;
  quantity: number;
  _delete?: boolean;
}

interface VariantBuilderProps {
  variants: VariantRow[];
  onChange: (variants: VariantRow[]) => void;
  basePrice: string;
}

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '26', '28', '30', '32', '34', '36', '38', '40'];

export default function VariantBuilder({ variants, onChange, basePrice }: VariantBuilderProps) {
  const activeVariants = variants.filter((v) => !v._delete);

  const addRow = () => {
    onChange([...variants, { size: '', color: '', price_override: '', quantity: 0 }]);
  };

  const updateRow = (index: number, field: keyof VariantRow, value: string | number) => {
    const updated = variants.map((v, i) => i === index ? { ...v, [field]: value } : v);
    onChange(updated);
  };

  const removeRow = (index: number) => {
    const v = variants[index];
    if (v.id) {
      // Mark existing as deleted
      onChange(variants.map((row, i) => i === index ? { ...row, _delete: true } : row));
    } else {
      onChange(variants.filter((_, i) => i !== index));
    }
  };

  const addQuickSizes = (sizes: string[]) => {
    const existing = new Set(variants.map((v) => `${v.size}::${v.color}`));
    const newRows = sizes
      .filter((s) => !existing.has(`${s}::`))
      .map((s) => ({ size: s, color: '', price_override: '', quantity: 0 }));
    onChange([...variants, ...newRows]);
  };

  return (
    <div>
      {/* Quick-add size groups */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Quick add:</span>
        {[
          { label: 'Clothing (XS–XXL)', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
          { label: 'Trousers (26–38)', sizes: ['26', '28', '30', '32', '34', '36', '38'] },
        ].map((group) => (
          <button
            key={group.label}
            type="button"
            className="btn btn-outline btn-xs"
            onClick={() => addQuickSizes(group.sizes)}
          >
            {group.label}
          </button>
        ))}
      </div>

      {/* Variant table */}
      <div className="table-wrapper" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Size <span style={{ color: 'var(--color-danger)' }}>*</span></th>
              <th>Color</th>
              <th>Price Override (₹)</th>
              <th>Quantity <span style={{ color: 'var(--color-danger)' }}>*</span></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {variants.map((row, idx) =>
              row._delete ? null : (
                <tr key={idx}>
                  <td>
                    <input
                      list={`sizes-${idx}`}
                      className="input"
                      style={{ minWidth: '80px' }}
                      placeholder="e.g. M"
                      value={row.size}
                      onChange={(e) => updateRow(idx, 'size', e.target.value)}
                    />
                    <datalist id={`sizes-${idx}`}>
                      {COMMON_SIZES.map((s) => <option key={s} value={s} />)}
                    </datalist>
                  </td>
                  <td>
                    <input
                      className="input"
                      style={{ minWidth: '80px' }}
                      placeholder="White, Black…"
                      value={row.color}
                      onChange={(e) => updateRow(idx, 'color', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="0.01"
                      style={{ minWidth: '100px' }}
                      placeholder={basePrice || '0.00'}
                      value={row.price_override}
                      onChange={(e) => updateRow(idx, 'price_override', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      style={{ minWidth: '70px' }}
                      value={row.quantity}
                      onChange={(e) => updateRow(idx, 'quantity', parseInt(e.target.value, 10) || 0)}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-xs btn-ghost"
                      style={{ color: 'var(--color-danger)' }}
                      onClick={() => removeRow(idx)}
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              )
            )}
            {activeVariants.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '1.5rem' }}>
                  No variants yet — click "Add Row" or use quick-add above
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: '0.75rem' }} onClick={addRow}>
        + Add Row
      </button>
    </div>
  );
}

export type { VariantRow };
