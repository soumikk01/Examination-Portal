import { useState, useEffect } from 'react';
import { Save, Shield, Settings as SettingsIcon, Bell } from 'lucide-react';
import api from '../services/api';
import { getUserFriendlyApiError } from '../utils/apiError';

const Settings = () => {
  const [formData, setFormData] = useState({
    academicYear: '2023-2024',
    semester: 'Even',
    maintenanceMode: false,
    dateFormat: 'DD/MM/YYYY',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    sessionTimeout: 30,
    noticeBoardMessage: '',
  });

  useEffect(() => {
    api.get('/settings').then((data) => {
      setFormData(prev => ({ ...prev, ...data }));
    }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch settings:', err);
    });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const saveSettings = async (updates, successMsg) => {
    try {
      await api.put('/settings', updates);
      alert(successMsg || 'Settings saved successfully!');
    } catch (err) {
      alert(getUserFriendlyApiError(err, 'Failed to save settings'));
    }
  };

  const handleSaveGeneral = (e) => {
    e.preventDefault();
    saveSettings({
      academicYear: formData.academicYear,
      semester: formData.semester,
      dateFormat: formData.dateFormat,
      maintenanceMode: formData.maintenanceMode,
    }, 'General settings saved!');
  };

  const handleUpdateNotice = (e) => {
    e.preventDefault();
    saveSettings({ noticeBoardMessage: formData.noticeBoardMessage }, 'Notice board message updated!');
  };

  const handleUpdateSession = (e) => {
    e.preventDefault();
    saveSettings({ sessionTimeout: formData.sessionTimeout }, 'Session timeout updated!');
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    try {
      await api.put('/auth/admin/password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      alert('Password updated successfully!');
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err) {
      alert(getUserFriendlyApiError(err, 'Failed to update password'));
    }
  };

  return (
    <div className="settings-page">
      <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>System Settings</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* General Settings */}
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <SettingsIcon size={20} color="var(--admin-primary)" />
            <h2 style={{ margin: 0 }}>General Settings</h2>
          </div>
          
          <form onSubmit={handleSaveGeneral} style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Academic Year</label>
                <select name="academicYear" value={formData.academicYear} onChange={handleChange} style={inputStyle}>
                  <option value="2023-2024">2023-2024</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Semester</label>
                <select name="semester" value={formData.semester} onChange={handleChange} style={inputStyle}>
                  <option value="Odd">Odd Semester</option>
                  <option value="Even">Even Semester</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Date Format</label>
                <select name="dateFormat" value={formData.dateFormat} onChange={handleChange} style={inputStyle}>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <button type="submit" className="admin-btn admin-btn-primary">
                <Save size={16} /> Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Maintenance Mode */}
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <SettingsIcon size={20} color="var(--admin-primary)" />
            <h2 style={{ margin: 0 }}>Maintenance Mode</h2>
          </div>
          <form onSubmit={handleSaveGeneral}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '1rem', border: '1px solid var(--admin-border)', borderRadius: '8px', background: '#fafafa', width: 'max-content', paddingRight: '2rem', marginBottom: '1rem' }}>
                <input 
                  type="checkbox" 
                  name="maintenanceMode" 
                  checked={formData.maintenanceMode} 
                  onChange={handleChange}
                  style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--admin-primary)', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Maintenance Mode</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>Temporarily lock students out of the portal</div>
                </div>
              </label>
            </div>
            <div>
              <button type="submit" className="admin-btn admin-btn-primary">
                <Save size={16} /> Save Maintenance Toggle
              </button>
            </div>
          </form>
        </div>

        {/* Notice Board & UI */}
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Bell size={20} color="var(--admin-primary)" />
            <h2 style={{ margin: 0 }}>Notice Board (Student Dashboard)</h2>
          </div>
          
          <form style={{ display: 'grid', gap: '1rem' }} onSubmit={handleUpdateNotice}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Important Notice Message</label>
              <textarea 
                name="noticeBoardMessage" 
                value={formData.noticeBoardMessage} 
                onChange={handleChange} 
                style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                placeholder="Enter the notice message to display on the student dashboard..."
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginTop: '0.5rem' }}>This message will be visible to all students when they log into their portal.</p>
            </div>
            
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem' }}>
              <button type="submit" className="admin-btn admin-btn-primary">
                <Save size={16} /> Update Notice
              </button>
              <button 
                type="button" 
                className="admin-btn" 
                style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5' }}
                onClick={(e) => {
                  e.preventDefault();
                  if (window.confirm('Are you sure you want to remove the notice from the student portal?')) {
                    setFormData(prev => ({ ...prev, noticeBoardMessage: '' }));
                    saveSettings({ noticeBoardMessage: '' }, 'Notice removed successfully!');
                  }
                }}
              >
                Delete Notice
              </button>
            </div>
          </form>
        </div>

        {/* Security Settings */}
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Shield size={20} color="var(--admin-primary)" />
            <h2 style={{ margin: 0 }}>Security & Access</h2>
          </div>
          
          <form onSubmit={handleUpdatePassword} style={{ display: 'grid', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Update Password</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Current Password</label>
                <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} style={inputStyle} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>New Password</label>
                <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} style={inputStyle} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Confirm New Password</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} style={inputStyle} required />
              </div>
            </div>
            
            <div style={{ marginTop: '0.5rem' }}>
              <button type="submit" className="admin-btn admin-btn-primary">
                <Save size={16} /> Update Password
              </button>
            </div>
          </form>
        </div>

        {/* Session Settings */}
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Shield size={20} color="var(--admin-primary)" />
            <h2 style={{ margin: 0 }}>Session Settings</h2>
          </div>
          
          <form style={{ display: 'grid', gap: '1rem', alignContent: 'start' }} onSubmit={handleUpdateSession}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Idle Session Timeout (minutes)</label>
              <input 
                type="number" 
                name="sessionTimeout" 
                value={formData.sessionTimeout} 
                onChange={handleChange} 
                style={{ ...inputStyle, maxWidth: '300px' }} 
                min="5" 
                max="1440" 
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginTop: '0.5rem' }}>
                Users will be automatically logged out after this period of inactivity.
              </p>
            </div>
            
            <div style={{ marginTop: '0.5rem' }}>
              <button type="submit" className="admin-btn admin-btn-primary">
                <Save size={16} /> Save Session Settings
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

// Reusable styling for form inputs to keep it neat
const inputStyle = {
  width: '100%',
  padding: '0.65rem 0.8rem',
  fontSize: '0.95rem',
  border: '1px solid var(--admin-border)',
  borderRadius: '6px',
  outline: 'none',
  transition: 'border-color 0.2s',
  fontFamily: 'inherit',
  backgroundColor: '#fff',
  color: 'var(--admin-text)',
  boxSizing: 'border-box'
};

export default Settings;
