import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: '', bio: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const token = localStorage.getItem('token');

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:3000/api/v1/profile/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(res.data);
            setForm({ name: res.data.user?.name || '', bio: res.data.user?.bio || '' });
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSuccess('');
        try {
            await axios.put('http://localhost:3000/api/v1/profile/me', form, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Profile updated!');
            setEditing(false);
            fetchProfile();
        } catch (err) {
            setError('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (!token) return <div className="profile-container"><div className="profile-error">Please log in to view your profile.</div></div>;
    if (loading) return <div className="profile-container"><div className="profile-loading">Loading profile...</div></div>;
    if (error && !profile) return <div className="profile-container"><div className="profile-error">{error}</div></div>;

    const { user, stats } = profile;

    return (
        <div className="profile-container">
            <div className="profile-header-card">
                <div className="profile-avatar">
                    {(user.name || user.email)[0]?.toUpperCase()}
                </div>
                <div className="profile-info">
                    <h2 className="profile-name">{user.name || user.email.split('@')[0]}</h2>
                    <p className="profile-email">{user.email}</p>
                    {user.bio && <p className="profile-bio">{user.bio}</p>}
                    <p className="profile-joined">Member since {new Date(user.joinedAt || user.createdAt).toLocaleDateString()}</p>
                </div>
                <button className="profile-edit-btn" onClick={() => setEditing(!editing)}>
                    {editing ? '✕ Cancel' : '✏️ Edit Profile'}
                </button>
            </div>

            {editing && (
                <div className="profile-edit-form">
                    <div className="profile-field">
                        <label>Name</label>
                        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
                    </div>
                    <div className="profile-field">
                        <label>Bio</label>
                        <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell us about yourself..." rows={3} />
                    </div>
                    <button className="profile-save-btn" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : '💾 Save Changes'}
                    </button>
                    {success && <div className="profile-success">{success}</div>}
                </div>
            )}

            <div className="profile-stats-row">
                <div className="profile-stat"><span className="profile-stat-val">{stats.uploadCount}</span><span className="profile-stat-lbl">Uploads</span></div>
                <div className="profile-stat"><span className="profile-stat-val">{stats.totalDownloads}</span><span className="profile-stat-lbl">Downloads</span></div>
                <div className="profile-stat"><span className="profile-stat-val">{stats.totalViews}</span><span className="profile-stat-lbl">Views</span></div>
                <div className="profile-stat"><span className="profile-stat-val">{stats.bookmarkCount}</span><span className="profile-stat-lbl">Bookmarks</span></div>
                <div className="profile-stat"><span className="profile-stat-val">{user.reputation || 0}</span><span className="profile-stat-lbl">Reputation</span></div>
            </div>

            {user.badges && user.badges.length > 0 && (
                <div className="profile-badges-section">
                    <h3>🏆 Badges</h3>
                    <div className="profile-badges-grid">
                        {user.badges.map((b, i) => (
                            <div key={i} className="profile-badge">
                                <span className="profile-badge-icon">{b.icon}</span>
                                <span className="profile-badge-name">{b.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
