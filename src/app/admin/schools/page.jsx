'use client';

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import apiClient from '@/lib/api';
import Drawer, { DrawerRow, DrawerSection } from '@/components/ui/Drawer';

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);

  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [newVendorId, setNewVendorId] = useState('');

  // Create state
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({
    name: '', code: '', school_email: '', school_password: '',
    address: '', city: '', state: '', pincode: '', contact_email: '', contact_phone: ''
  });

  useEffect(() => {
    apiClient.get('/admin/vendors/')
      .then(({ data }) => setVendors(Array.isArray(data) ? data : (data.results ?? [])))
      .catch(console.error);
  }, []);

  const handleVendorChangeRequest = async (e) => {
    e.preventDefault();
    if (!selected || !newVendorId) return;
    setSaving(true);
    try {
      await apiClient.post(`/schools/${selected.id}/request-vendor-change/`, { new_vendor: newVendorId });
      alert('Vendor change request sent to school successfully!');
      setNewVendorId('');
    } catch (err) {
      alert(err.response?.data?.detail || 'Error requesting vendor change');
    } finally {
      setSaving(false);
    }
  };

  const [search, setSearch] = useState('');

  const fetchSchools = React.useCallback(() => {
    setLoading(true);
    let params = [];
    if (filter) params.push(`approval_status=${filter}`);
    if (search) params.push(`search=${search}`);
    const qs = params.length > 0 ? `?${params.join('&')}` : '';
    
    apiClient.get(`/schools/${qs}`)
      .then(({ data }) => setSchools(Array.isArray(data) ? data : (data.results ?? [])))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSchools();
    }, 400);
    return () => clearTimeout(timer);
  }, [filter, search, fetchSchools]);

  const handleCreateSchool = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/schools/admin-create/', createData);
      alert('School created successfully!');
      setShowCreate(false);
      setCreateData({ name: '', code: '', school_email: '', school_password: '', address: '', city: '', state: '', pincode: '', contact_email: '', contact_phone: '' });
      fetchSchools();
    } catch (err) {
      alert('Error creating school. Please verify unique code.');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, action, e) => {
    if (e) e.stopPropagation();
    try {
      await apiClient.patch(`/schools/${id}/approve/`, { approval_status: action });
      fetchSchools();
      if (selected && selected.id === id) {
        setSelected({ ...selected, approval_status: action });
      }
    } catch (err) {
      alert('Error updating status');
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      const { data: updated } = await apiClient.patch(`/schools/${selected.id}/`, editData);
      setSelected(updated);
      fetchSchools();
      alert('School updated successfully');
    } catch (err) {
      alert('Error saving school');
    } finally {
      setSaving(false);
    }
  };

  const handleDelegateLogin = async () => {
    if (!selected) return;
    if (!selected.school_user) {
      alert('This school does not have a linked admin user.');
      return;
    }
    if (!confirm(`Are you sure you want to log in as ${selected.name}? You will need to fully log out to return to the admin panel.`)) return;
    
    try {
      const { data } = await apiClient.post('/auth/delegate-access/', { user_id: selected.school_user });

      const token = Cookies.get('access_token');
      // Save admin tokens before overriding
      Cookies.set('admin_access_token', token || '', { expires: 1, path: '/' });
      const currentRefresh = Cookies.get('refresh_token');
      if (currentRefresh) Cookies.set('admin_refresh_token', currentRefresh, { expires: 7, path: '/' });
      const currentUser = Cookies.get('user');
      if (currentUser) Cookies.set('admin_user', currentUser, { expires: 1, path: '/' });
      
      Cookies.set('access_token', data.access, { expires: 1, path: '/' });
      Cookies.set('refresh_token', data.refresh, { expires: 7, path: '/' });
      Cookies.set('user', JSON.stringify(data.user), { expires: 7, path: '/' });
      window.location.href = '/school/orders';
    } catch (err) {
      alert('Delegate login failed');
    }
  };

  const handleToggleUserActive = async () => {
    if (!selected?.school_user) return;
    try {
      await apiClient.patch(`/auth/users/${selected.school_user}/toggle-active/`);
      alert('School user active status toggled successfully.');
    } catch (err) {
      alert('Failed to toggle user active status.');
    }
  };

  const openDrawer = (s) => {
    setSelected(s);
    setEditData({
      name: s.name,
      address: s.address || '',
      city: s.city || '',
      state: s.state || '',
      pincode: s.pincode || '',
      contact_email: s.contact_email || '',
      contact_phone: s.contact_phone || '',
    });
  };

  const statusColor = (s) => {
    switch (s) {
      case 'approved': return { bg: '#dcfce7', fg: '#166534' };
      case 'rejected': return { bg: '#fee2e2', fg: '#991b1b' };
      default: return { bg: '#fef9c3', fg: '#854d0e' };
    }
  };

  const tabs = [
    { key: '', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 800 }}>School Management</h1>
        <button onClick={() => setShowCreate(true)} style={{ background: '#4f46e5', color: 'white', padding: '0.625rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          + Add New School
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: filter === t.key ? '#4f46e5' : 'white', color: filter === t.key ? 'white' : '#475569', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
              {t.label}
            </button>
          ))}
        </div>
        <input 
          type="text" 
          value={search}
          placeholder="Search schools..." 
          onChange={(e) => setSearch(e.target.value)} 
          style={{ padding: '0.625rem', borderRadius: '8px', border: '1px solid #cbd5e1', flex: 1, minWidth: '200px', maxWidth: '300px' }}
        />
      </div>

      {loading ? <p>Loading...</p> : schools.length === 0 ? (
        <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <p style={{ color: '#64748b' }}>No schools found.</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '1rem', color: '#64748b', fontSize: '0.875rem' }}>School</th>
                <th style={{ padding: '1rem', color: '#64748b', fontSize: '0.875rem' }}>Code</th>
                <th style={{ padding: '1rem', color: '#64748b', fontSize: '0.875rem' }}>City</th>
                <th style={{ padding: '1rem', color: '#64748b', fontSize: '0.875rem' }}>Status</th>
                <th style={{ padding: '1rem', color: '#64748b', fontSize: '0.875rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schools.map(s => {
                const sc = statusColor(s.approval_status);
                return (
                  <tr key={s.id} onClick={() => openDrawer(s)} style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{s.contact_email || ''}</div>
                    </td>
                    <td style={{ padding: '1rem', fontFamily: 'monospace', color: '#64748b', fontSize: '0.875rem' }}>{s.code}</td>
                    <td style={{ padding: '1rem', color: '#64748b' }}>{s.city || '—'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: sc.bg, color: sc.fg, textTransform: 'uppercase' }}>
                        {s.approval_status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {s.approval_status !== 'approved' && <button onClick={(e) => updateStatus(s.id, 'approved', e)} style={{ background: '#4f46e5', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>Approve</button>}
                      {s.approval_status !== 'rejected' && <button onClick={(e) => updateStatus(s.id, 'rejected', e)} style={{ background: '#ef4444', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>Reject</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Drawer isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.name || 'School Details'}>
        {selected && (
          <form onSubmit={handleSaveEdit}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {selected.approval_status !== 'approved' && <button type="button" onClick={() => updateStatus(selected.id, 'approved')} style={{ padding: '0.625rem 1rem', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', flex: 1 }}>Approve School</button>}
              {selected.approval_status !== 'rejected' && <button type="button" onClick={() => updateStatus(selected.id, 'rejected')} style={{ padding: '0.625rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', flex: 1 }}>Reject/Suspend</button>}
              <button type="button" onClick={handleDelegateLogin} style={{ padding: '0.625rem 1rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', flex: 1 }}>Login As School ⚡</button>
              <button type="button" onClick={handleToggleUserActive} style={{ padding: '0.625rem 1rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', flex: 1 }}>Toggle Active Status</button>
            </div>

            <DrawerSection title="Edit Details" />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>School Name</label>
                <input type="text" value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Contact Email</label>
                  <input type="email" value={editData.contact_email || ''} onChange={e => setEditData({...editData, contact_email: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Contact Phone</label>
                  <input type="text" value={editData.contact_phone || ''} onChange={e => setEditData({...editData, contact_phone: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Address</label>
                <input type="text" value={editData.address || ''} onChange={e => setEditData({...editData, address: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>City</label>
                  <input type="text" value={editData.city || ''} onChange={e => setEditData({...editData, city: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>State</label>
                  <input type="text" value={editData.state || ''} onChange={e => setEditData({...editData, state: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Pincode</label>
                <input type="text" value={editData.pincode || ''} onChange={e => setEditData({...editData, pincode: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: '0.875rem', background: '#4f46e5', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            <DrawerSection title="Account & Vendor Information" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Current Vendor:</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>{selected.vendor_name || 'No Vendor Assigned'}</span>
              </div>
              
              <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Request Vendor Change</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select 
                    value={newVendorId} 
                    onChange={e => setNewVendorId(e.target.value)} 
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  >
                    <option value="">Select Alternative Vendor...</option>
                    {vendors.filter(v => v.id !== selected.vendor).map(v => (
                      <option key={v.id} value={v.id}>{v.business_name}</option>
                    ))}
                  </select>
                  <button 
                    onClick={handleVendorChangeRequest} 
                    disabled={!newVendorId || saving} 
                    style={{ padding: '0.5rem 1rem', background: '#4f46e5', color: 'white', borderRadius: '6px', border: 'none', fontWeight: 600, fontSize: '0.8125rem', cursor: (saving || !newVendorId) ? 'not-allowed' : 'pointer', opacity: (saving || !newVendorId) ? 0.6 : 1 }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
            <DrawerRow label="Unique Code" value={<span style={{ fontFamily: 'monospace' }}>{selected.code}</span>} />
            <DrawerRow label="Registered Date" value={new Date(selected.created_at).toLocaleDateString()} />
          </form>
        )}
      </Drawer>

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Create New School</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <form onSubmit={handleCreateSchool} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>School Name</label>
                  <input type="text" value={createData.name} onChange={e => setCreateData({...createData, name: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Unique Code</label>
                  <input type="text" value={createData.code} onChange={e => setCreateData({...createData, code: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>School User Email</label>
                  <input type="email" value={createData.school_email} onChange={e => setCreateData({...createData, school_email: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>School User Password</label>
                  <input type="password" value={createData.school_password} onChange={e => setCreateData({...createData, school_password: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Contact Email</label>
                  <input type="email" value={createData.contact_email} onChange={e => setCreateData({...createData, contact_email: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Contact Phone</label>
                  <input type="text" value={createData.contact_phone} onChange={e => setCreateData({...createData, contact_phone: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Address</label>
                <input type="text" value={createData.address} onChange={e => setCreateData({...createData, address: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>City</label>
                  <input type="text" value={createData.city} onChange={e => setCreateData({...createData, city: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>State</label>
                  <input type="text" value={createData.state} onChange={e => setCreateData({...createData, state: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Pincode</label>
                <input type="text" value={createData.pincode} onChange={e => setCreateData({...createData, pincode: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <button type="submit" disabled={saving} style={{ marginTop: '1rem', padding: '0.875rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Creating...' : 'Create School'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
