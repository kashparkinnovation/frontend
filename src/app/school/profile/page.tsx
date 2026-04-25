'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export default function SchoolProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await apiClient.get('/schools/profile/');
        setProfile(data);
      } catch (err) {
        showToast('Failed to load profile', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.patch('/schools/profile/', profile);
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      showToast('Update failed', 'error');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">School Profile</h1>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>School Name</label>
            <input name="name" value={profile?.name || ''} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Code</label>
            <input value={profile?.code || ''} disabled style={{ background: '#f3f4f6' }} />
          </div>
          <div className="form-group">
            <label>Vendor</label>
            <input value={profile?.vendor_name || ''} disabled style={{ background: '#f3f4f6' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Contact Email</label>
              <input name="contact_email" type="email" value={profile?.contact_email || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Contact Phone</label>
              <input name="contact_phone" value={profile?.contact_phone || ''} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Address</label>
            <input name="address" value={profile?.address || ''} onChange={handleChange} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>City</label>
              <input name="city" value={profile?.city || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>State</label>
              <input name="state" value={profile?.state || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Pincode</label>
              <input name="pincode" value={profile?.pincode || ''} onChange={handleChange} />
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
