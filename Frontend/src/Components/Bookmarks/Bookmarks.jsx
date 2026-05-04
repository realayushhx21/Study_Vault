import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Bookmarks.css';

const Bookmarks = () => {
    const [bookmarks, setBookmarks] = useState([]);
    const [collections, setCollections] = useState([]);
    const [activeCollection, setActiveCollection] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchCollections();
        fetchBookmarks();
    }, []);

    const fetchCollections = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/v1/bookmarks/collections', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCollections(res.data.collections || []);
        } catch (err) { /* ignore */ }
    };

    const fetchBookmarks = async (collection = '') => {
        setLoading(true);
        try {
            const url = collection
                ? `http://localhost:3000/api/v1/bookmarks?collection=${encodeURIComponent(collection)}`
                : 'http://localhost:3000/api/v1/bookmarks';
            const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
            setBookmarks(res.data.bookmarks || []);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to load bookmarks');
        } finally {
            setLoading(false);
        }
    };

    const handleCollectionFilter = (name) => {
        setActiveCollection(name);
        fetchBookmarks(name);
    };

    const handleRemove = async (bookmarkId) => {
        try {
            await axios.delete(`http://localhost:3000/api/v1/bookmarks/${bookmarkId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookmarks(b => b.filter(bk => bk._id !== bookmarkId));
            fetchCollections();
        } catch (err) {
            alert('Failed to remove bookmark');
        }
    };

    if (!token) return <div className="bookmarks-container"><div className="bookmarks-error">Please log in to view bookmarks.</div></div>;

    return (
        <div className="bookmarks-container">
            <h2 className="bookmarks-title">🔖 My Bookmarks</h2>

            {collections.length > 0 && (
                <div className="bookmarks-collections">
                    <button className={`collection-tab ${!activeCollection ? 'active' : ''}`} onClick={() => handleCollectionFilter('')}>
                        All ({collections.reduce((s, c) => s + c.count, 0)})
                    </button>
                    {collections.map((c, i) => (
                        <button key={i} className={`collection-tab ${activeCollection === c.name ? 'active' : ''}`}
                            onClick={() => handleCollectionFilter(c.name)}>
                            {c.name} ({c.count})
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="bookmarks-loading">Loading...</div>
            ) : error ? (
                <div className="bookmarks-error">{error}</div>
            ) : bookmarks.length === 0 ? (
                <div className="bookmarks-empty">
                    <div className="bookmarks-empty-icon">📚</div>
                    <h3>No bookmarks yet</h3>
                    <p>Bookmark resources while browsing to save them here!</p>
                    <button onClick={() => navigate('/getAllResources')} className="bookmarks-browse-btn">Browse Resources</button>
                </div>
            ) : (
                <div className="bookmarks-grid">
                    {bookmarks.map((bk) => (
                        <div key={bk._id} className="bookmark-card">
                            <div className="bookmark-card-header">
                                <span className="bookmark-collection-tag">{bk.collection}</span>
                                <button className="bookmark-remove-btn" onClick={() => handleRemove(bk._id)} title="Remove bookmark">✕</button>
                            </div>
                            <h3 className="bookmark-resource-title" onClick={() => navigate(`/resource/${bk.resource?._id}`)}>{bk.resource?.title || 'Unknown Resource'}</h3>
                            <div className="bookmark-meta">
                                <span>📚 {bk.resource?.subject}</span>
                                <span>📅 Sem {bk.resource?.semester}</span>
                                <span>⭐ {bk.resource?.averageRating?.toFixed(1) || 'N/A'}</span>
                            </div>
                            {bk.resource?.difficulty && <span className={`bookmark-difficulty ${bk.resource.difficulty.toLowerCase()}`}>{bk.resource.difficulty}</span>}
                            <div className="bookmark-date">Saved {new Date(bk.createdAt).toLocaleDateString()}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Bookmarks;
