import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
    const [trending, setTrending] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loadingTrending, setLoadingTrending] = useState(true);
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchTrending();
        if (token) fetchRecommendations();
    }, []);

    const fetchTrending = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/v1/analytics/trending');
            setTrending(res.data.trending || []);
        } catch (err) { /* ignore */ }
        finally { setLoadingTrending(false); }
    };

    const fetchRecommendations = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/v1/analytics/recommendations', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRecommendations(res.data.recommendations || []);
        } catch (err) { /* ignore */ }
    };

    return (
        <div className="home-container">
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">
                        <span className="hero-emoji">📘</span> Study Vault
                    </h1>
                    <p className="hero-subtitle">Upload, Discover & Empower Student Learning Instantly</p>
                    <p className="hero-desc">
                        A dedicated platform where students can securely upload notes, take AI-powered quizzes, 
                        get smart recommendations, and collaborate in study groups.
                    </p>
                    <div className="hero-actions">
                        <button className="hero-btn primary" onClick={() => navigate('/getAllResources')}>🔍 Explore Resources</button>
                        <button className="hero-btn secondary" onClick={() => navigate('/createResource')}>📤 Upload Notes</button>
                    </div>
                </div>
            </section>

            <section className="features-section">
                <h2>✨ Platform Features</h2>
                <div className="features-grid">
                    {[
                        { icon: '🤖', title: 'AI Summaries', desc: 'Auto-generated summaries & key topics for every uploaded PDF' },
                        { icon: '🧠', title: 'Quiz Mode', desc: 'AI-generated MCQ quizzes to test your knowledge' },
                        { icon: '🔖', title: 'Bookmarks', desc: 'Save & organize resources into custom collections' },
                        { icon: '📊', title: 'Analytics', desc: 'Track your contributions with a personal dashboard' },
                        { icon: '📈', title: 'Trending', desc: 'Discover the most popular resources right now' },
                        { icon: '👥', title: 'Study Groups', desc: 'Collaborate with classmates in shared groups' },
                        { icon: '🏆', title: 'Leaderboard', desc: 'Earn badges and climb the contributor rankings' },
                        { icon: '💬', title: 'Chat with PDF', desc: 'Ask AI questions about any uploaded document' },
                    ].map((f, i) => (
                        <div key={i} className="feature-card">
                            <div className="feature-icon">{f.icon}</div>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {trending.length > 0 && (
                <section className="trending-section">
                    <h2>🔥 Trending Resources</h2>
                    <div className="trending-grid">
                        {trending.slice(0, 6).map((r) => (
                            <div key={r._id} className="trending-card" onClick={() => navigate(`/resource/${r._id}`)}>
                                <div className="trending-badge">🔥 Trending</div>
                                <h3>{r.title}</h3>
                                <div className="trending-meta">
                                    <span>📚 {r.subject}</span>
                                    <span>📅 Sem {r.semester}</span>
                                </div>
                                <div className="trending-stats">
                                    <span>⭐ {r.averageRating?.toFixed(1) || 'N/A'}</span>
                                    <span>👁️ {r.viewCount || 0}</span>
                                    <span>📥 {r.downloadCount || 0}</span>
                                </div>
                                {r.difficulty && <span className={`trending-difficulty ${r.difficulty.toLowerCase()}`}>{r.difficulty}</span>}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {recommendations.length > 0 && (
                <section className="recommendations-section">
                    <h2>🎯 Recommended For You</h2>
                    <div className="trending-grid">
                        {recommendations.slice(0, 4).map((r) => (
                            <div key={r._id} className="trending-card" onClick={() => navigate(`/resource/${r._id}`)}>
                                <h3>{r.title}</h3>
                                <div className="trending-meta">
                                    <span>📚 {r.subject}</span>
                                    <span>📅 Sem {r.semester}</span>
                                </div>
                                <div className="trending-stats">
                                    <span>⭐ {r.averageRating?.toFixed(1) || 'N/A'}</span>
                                    <span>👁️ {r.viewCount || 0}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default Home;