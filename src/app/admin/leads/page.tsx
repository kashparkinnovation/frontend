'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import Drawer, { DrawerSection } from '@/components/ui/Drawer';
import { useToast } from '@/context/ToastContext';

interface ContactLead {
  id: number;
  name: string;
  email: string;
  user_type: string;
  message: string;
  status: string;
  created_at: string;
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<ContactLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactLead | null>(null);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = () => {
    setLoading(true);
    apiClient.get('/auth/admin/leads/')
      .then((r) => setLeads(r.data.results ?? r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const deleteLead = async (id: number) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await apiClient.delete(`/auth/admin/leads/${id}/`);
      showToast('Lead deleted successfully', 'success');
      setSelected(null);
      fetchLeads();
    } catch {
      showToast('Failed to delete lead', 'error');
    }
  };

  const updateStatus = async (lead: ContactLead, newStatus: string) => {
    setSaving(true);
    try {
      const res = await apiClient.put(`/auth/admin/leads/${lead.id}/`, { ...lead, status: newStatus });
      setSelected(res.data);
      showToast('Lead status updated', 'success');
      fetchLeads();
    } catch {
      showToast('Failed to update status', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Contact Leads</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Manage inbound messages from our public contact form.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <span className="spinner dark" style={{ width: '2rem', height: '2rem' }} />
          </div>
        ) : leads.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📞</div>
            <p className="empty-state-title">No leads yet</p>
            <p className="empty-state-desc">When users fill out the contact form, they will appear here.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sender Focus</th>
                  <th>Persona</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} onClick={() => setSelected(l)}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{l.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{l.email}</div>
                    </td>
                    <td>{l.user_type}</td>
                    <td>
                      <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: l.status === 'New' ? '#dbeafe' : l.status === 'Responded' ? '#dcfce7' : '#f1f5f9', color: l.status === 'New' ? '#1e40af' : l.status === 'Responded' ? '#166534' : '#475569' }}>
                        {l.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{new Date(l.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer isOpen={!!selected} onClose={() => setSelected(null)} title="Lead Details" subtitle={selected?.name}>
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <DrawerSection title="Contact Info" />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0f172a' }}>{selected.name}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <a href={`mailto:${selected.email}`} style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4f46e5', textDecoration: 'none' }}>{selected.email}</a>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Context</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0f172a' }}>{selected.user_type}</span>
            </div>

            <DrawerSection title="Message" />
            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.875rem', lineHeight: 1.6, color: '#334155', whiteSpace: 'pre-wrap' }}>
              {selected.message}
            </div>

            <DrawerSection title="Actions" />
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button 
                disabled={saving || selected.status === 'Responded'} 
                onClick={() => updateStatus(selected, 'Responded')} 
                className="btn btn-outline"
                style={{ borderColor: '#166534', color: '#166534' }}
              >
                {saving && selected.status !== 'Responded' ? 'Saving...' : 'Mark as Responded'}
              </button>
              
              <button 
                disabled={saving || selected.status === 'Archived'} 
                onClick={() => updateStatus(selected, 'Archived')} 
                className="btn btn-outline"
              >
                Archive Lead
              </button>

              <button 
                onClick={() => deleteLead(selected.id)} 
                className="btn btn-outline"
                style={{ borderColor: '#ef4444', color: '#ef4444' }}
              >
                Delete Lead
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
