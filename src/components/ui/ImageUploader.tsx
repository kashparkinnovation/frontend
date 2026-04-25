'use client';

import React, { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import type { ProductImage } from '@/types';

interface ImageUploaderProps {
  images: ProductImage[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (imageId: number) => Promise<void>;
  onSetPrimary: (imageId: number) => Promise<void>;
  uploading?: boolean;
}

export default function ImageUploader({
  images,
  onUpload,
  onDelete,
  onSetPrimary,
  uploading = false,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      await onUpload(file);
    }
  }, [onUpload]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

  const resolveUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  return (
    <div>
      {/* Drop zone */}
      <div
        className={`file-drop-zone ${dragOver ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          {uploading ? '⏳' : '📸'}
        </div>
        <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
          {uploading ? 'Uploading…' : 'Click or drag images here'}
        </p>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          PNG, JPG, WEBP — multiple files supported
        </p>
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="image-grid" style={{ marginTop: '1rem' }}>
          {images.map((img) => (
            <div key={img.id} className={`image-thumb ${img.is_primary ? 'primary' : ''}`}>
              <img src={resolveUrl(img.image)} alt={img.caption || 'Product image'} />
              {img.is_primary && (
                <div style={{
                  position: 'absolute', top: '4px', left: '4px',
                  background: 'var(--color-primary)', color: 'white',
                  fontSize: '0.625rem', fontWeight: 700, padding: '1px 5px',
                  borderRadius: '4px',
                }}>PRIMARY</div>
              )}
              <div className="image-thumb-actions">
                {!img.is_primary && (
                  <button
                    className="image-thumb-btn"
                    onClick={(e) => { e.stopPropagation(); onSetPrimary(img.id); }}
                    title="Set as primary"
                  >⭐</button>
                )}
                <button
                  className="image-thumb-btn"
                  style={{ color: 'var(--color-danger)' }}
                  onClick={(e) => { e.stopPropagation(); onDelete(img.id); }}
                  title="Delete image"
                >🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && !uploading && (
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8125rem', marginTop: '0.75rem' }}>
          No images uploaded yet
        </p>
      )}
    </div>
  );
}
