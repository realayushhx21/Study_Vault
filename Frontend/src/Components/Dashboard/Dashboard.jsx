import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) { setError('Please log in to view your dashboard'); setLoading(false); return; }
                const res = await axios.get('http://localhost:3000/api/v1/analytics/dashboard', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(res.data);
            } catch (err) {
                setError(err.response?.data?.msg || 'Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) return <div className="dashboard-container"><div className="dashboard-loading">Loading dashboard...</div></div>;
    if (error) return <div className="dashboard-container"><div className="dashboard-error">{error}</div></div>;
    if (!data) return null;

    const { stats, badges, recentViews } = data;
    const maxStat = Math.max(stats.totalUploads, stats.totalDownloads, stats.totalViews, stats.totalReviews, 1);

    return (
        <div className="dashboard-container">
            <h2 className="dashboard-title">📊 My Dashboard</h2>

            <div className="dashboard-stats-grid">
                <div className="dashboard-stat-card uploads">
                    <div className="stat-icon">📤</div>
                    <div className="stat-value">{stats.totalUploads}</div>
                    <div className="stat-label">Uploads</div>
                </div>
                <div className="dashboard-stat-card downloads">
                    <div className="stat-icon">📥</div>
                    <div className="stat-value">{stats.totalDownloads}</div>
                    <div className="stat-label">Downloads Received</div>
                </div>
                <div className="dashboard-stat-card views">
                    <div className="stat-icon">👁️</div>
                    <div className="stat-value">{stats.totalViews}</div>
                    <div className="stat-label">Views Received</div>
                </div>
                <div className="dashboard-stat-card rating">
                    <div className="stat-icon">⭐</div>
                    <div className="stat-value">{stats.avgRating || 0}</div>
                    <div className="stat-label">Avg Rating</div>
                </div>
                <div className="dashboard-stat-card reviews">
                    <div className="stat-icon">📝</div>
                    <div className="stat-value">{stats.totalReviews}</div>
                    <div className="stat-label">Reviews Written</div>
                </div>
                <div className="dashboard-stat-card reputation">
                    <div className="stat-icon">🏅</div>
                    <div className="stat-value">{stats.reputation}</div>
                    <div className="stat-label">Reputation Score</div>
                </div>
            </div>

            <div className="dashboard-charts-row">
                <div className="dashboard-chart-card">
                    <h3>📈 Activity Overview</h3>
                    <div className="dashboard-bar-chart">
                        {[
                            { label: 'Uploads', value: stats.totalUploads, color: '#6c5ce7' },
                            { label: 'Downloads', value: stats.totalDownloads, color: '#00b894' },
                            { label: 'Views', value: stats.totalViews, color: '#0984e3' },
                            { label: 'Reviews', value: stats.totalReviews, color: '#fdcb6e' },
                            { label: 'Bookmarks', value: stats.totalBookmarks, color: '#e17055' },
                        ].map((item, i) => (
                            <div key={i} className="bar-row">
                                <span className="bar-label">{item.label}</span>
                                <div className="bar-track">
                                    <div className="bar-fill" style={{
                                        width: `${maxStat > 0 ? (item.value / maxStat) * 100 : 0}%`,
                                        background: item.color
                                    }}></div>
                                </div>
                                <span className="bar-value">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="dashboard-chart-card">
                    <h3>🏆 Badges Earned ({badges.length})</h3>
                    <div className="dashboard-badges">
                        {badges.length > 0 ? badges.map((b, i) => (
                            <div key={i} className="badge-item">
                                <span className="badge-icon">{b.icon}</span>
                                <span className="badge-name">{b.name}</span>
                            </div>
                        )) : (
                            <p className="no-badges">Start uploading and reviewing to earn badges!</p>
                        )}
                    </div>
                </div>
            </div>

            {recentViews && recentViews.length > 0 && (
                <div className="dashboard-recent">
                    <h3>👁️ Recent Views on Your Resources</h3>
                    <div className="recent-views-list">
                        {recentViews.map((v, i) => (
                            <div key={i} className="recent-view-item">
                                <span className="recent-view-title">{v.resource?.title || 'Unknown'}</span>
                                <span className="recent-view-time">{new Date(v.viewedAt).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="dashboard-actions">
                <button onClick={() => navigate('/leaderboard')} className="dashboard-action-btn">🏅 View Leaderboard</button>
                <button onClick={() => navigate('/profile')} className="dashboard-action-btn">👤 My Profile</button>
            </div>
        </div>
    );
};

export default Dashboard;
