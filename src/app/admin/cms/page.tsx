'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import Drawer, { DrawerSection } from '@/components/ui/Drawer';
import { useToast } from '@/context/ToastContext';

interface StaticPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  is_published: boolean;
  custom_head?: string;
  custom_body_end?: string;
  updated_at: string;
}

export default function CMSPagesAdmin() {
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StaticPage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ title: '', slug: '', content: '', is_published: true, custom_head: '', custom_body_end: '' });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = () => {
    setLoading(true);
    apiClient.get('/admin/blog/pages/')
      .then((r) => setPages(r.data.results ?? r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isCreating) {
        await apiClient.post('/admin/blog/pages/', formData);
        showToast('Page created successfully', 'success');
      } else if (selected) {
        await apiClient.put(`/admin/blog/pages/${selected.slug}/`, formData);
        showToast('Page updated successfully', 'success');
      }
      fetchPages();
      setSelected(null);
      setIsCreating(false);
    } catch {
      showToast('Failed to save page', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (page: StaticPage) => {
    setFormData({ title: page.title, slug: page.slug, content: page.content, is_published: page.is_published, custom_head: page.custom_head || '', custom_body_end: page.custom_body_end || '' });
    setSelected(page);
    setIsCreating(false);
  };

  const openCreate = () => {
    setFormData({ title: '', slug: '', content: '', is_published: true, custom_head: '', custom_body_end: '' });
    setSelected(null);
    setIsCreating(true);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Page CMS</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Manage your dynamic static pages like Privacy Policy and Terms of Service.
          </p>
        </div>
        <button onClick={openCreate} className="btn btn-primary btn-sm">+ New Page</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <span className="spinner dark" style={{ width: '2rem', height: '2rem' }} />
          </div>
        ) : pages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <p className="empty-state-title">No pages found</p>
            <p className="empty-state-desc">Create pages to display them dynamically on the storefront.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>URL Slug</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr key={p.id} onClick={() => openEdit(p)}>
                    <td style={{ fontWeight: 600 }}>{p.title}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--color-primary)' }}>/{p.slug}</td>
                    <td>
                      <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: p.is_published ? '#dcfce7' : '#f1f5f9', color: p.is_published ? '#166534' : '#475569' }}>
                        {p.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{new Date(p.updated_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer isOpen={!!selected || isCreating} onClose={() => { setSelected(null); setIsCreating(false); }} title={isCreating ? "New CMS Page" : "Edit CMS Page"} subtitle={formData.title}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <DrawerSection title="Details" />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Page Title</label>
            <input type="text" className="input" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required placeholder="e.g. Terms of Service" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>URL Slug (Optional)</label>
            <input type="text" className="input" value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} placeholder="e.g. terms-of-service" />
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>Leave blank to auto-generate from title.</p>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={formData.is_published} onChange={(e) => setFormData({...formData, is_published: e.target.checked})} style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Published (Visible to public)</span>
          </label>

          <DrawerSection title="Content" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>HTML Content</label>
            <textarea 
              className="input" 
              value={formData.content} 
              onChange={(e) => setFormData({...formData, content: e.target.value})} 
              required 
              placeholder="<h1>Title</h1><p>Content goes here...</p>"
              style={{ minHeight: '300px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: 1.5 }}
            />
          </div>

          <DrawerSection title="Code Injection" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Header Code (Optional)</label>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>Injected into the &lt;head&gt; of this page. Useful for custom CSS or meta tags.</p>
            <textarea 
              className="input" 
              value={formData.custom_head} 
              onChange={(e) => setFormData({...formData, custom_head: e.target.value})} 
              placeholder="<style>...</style> or <script>...</script>"
              style={{ minHeight: '100px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8rem' }}
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Footer Code (Optional)</label>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>Injected just before &lt;/body&gt;. Useful for custom JS trackers or scripts.</p>
            <textarea 
              className="input" 
              value={formData.custom_body_end} 
              onChange={(e) => setFormData({...formData, custom_body_end: e.target.value})} 
              placeholder="<script>...</script>"
              style={{ minHeight: '100px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8rem' }}
            />
          </div>

          <div className="drawer-actions" style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Page'}
            </button>
            {!isCreating && selected && (
              <button 
                type="button" 
                className="btn btn-outline" 
                style={{ borderColor: '#ef4444', color: '#ef4444' }}
                onClick={async () => {
                  if (confirm('Are you sure you want to delete this page?')) {
                    try {
                      await apiClient.delete(`/admin/blog/pages/${selected.slug}/`);
                      showToast('Page deleted successfully', 'success');
                      fetchPages();
                      setSelected(null);
                    } catch {
                      showToast('Failed to delete page', 'error');
                    }
                  }
                }}
              >
                Delete Page
              </button>
            )}
          </div>
        </form>
      </Drawer>
    </div>
  );
}
