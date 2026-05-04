import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Leaderboard.css';

const Leaderboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await axios.get('http://localhost:3000/api/v1/analytics/leaderboard');
                setLeaderboard(res.data.leaderboard || []);
            } catch (err) { /* ignore */ }
            finally { setLoading(false); }
        };
        fetchLeaderboard();
    }, []);

    if (loading) return <div className="leaderboard-container"><div className="leaderboard-loading">Loading leaderboard...</div></div>;

    const medals = ['🥇', '🥈', '🥉'];

    return (
        <div className="leaderboard-container">
            <h2 className="leaderboard-title">🏅 Top Contributors</h2>
            <p className="leaderboard-subtitle">Students making the biggest impact on the community</p>

            {leaderboard.length === 0 ? (
                <div className="leaderboard-empty">No contributors yet. Be the first!</div>
            ) : (
                <>
                    <div className="leaderboard-podium">
                        {leaderboard.slice(0, 3).map((user, i) => (
                            <div key={user._id} className={`podium-card rank-${i + 1}`}>
                                <div className="podium-medal">{medals[i]}</div>
                                <div className="podium-avatar">{(user.name || user.email)[0]?.toUpperCase()}</div>
                                <div className="podium-name">{user.name || user.email.split('@')[0]}</div>
                                <div className="podium-rep">{user.reputation} pts</div>
                                <div className="podium-stats">
                                    <span>📤 {user.uploadCount}</span>
                                    <span>📥 {user.totalDownloads}</span>
                                </div>
                                {user.badges && user.badges.length > 0 && (
                                    <div className="podium-badges">{user.badges.map(b => b.icon).join(' ')}</div>
                                )}
                            </div>
                        ))}
                    </div>

                    {leaderboard.length > 3 && (
                        <div className="leaderboard-table">
                            <div className="leaderboard-row header">
                                <span className="lb-rank">Rank</span>
                                <span className="lb-name">Contributor</span>
                                <span className="lb-uploads">Uploads</span>
                                <span className="lb-downloads">Downloads</span>
                                <span className="lb-reputation">Reputation</span>
                            </div>
                            {leaderboard.slice(3).map((user, i) => (
                                <div key={user._id} className="leaderboard-row">
                                    <span className="lb-rank">#{i + 4}</span>
                                    <span className="lb-name">{user.name || user.email.split('@')[0]}</span>
                                    <span className="lb-uploads">{user.uploadCount}</span>
                                    <span className="lb-downloads">{user.totalDownloads}</span>
                                    <span className="lb-reputation">{user.reputation}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Leaderboard;
