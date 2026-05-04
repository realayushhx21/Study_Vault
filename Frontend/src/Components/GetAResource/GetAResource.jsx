import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './GetAResource.css';
import ChatWithPDF from '../ChatWithPDF';

const GetAResource = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [resource, setResource] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reviewForm, setReviewForm] = useState({ rating: '', comment: '' });
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewError, setReviewError] = useState('');
    const [reviewSuccess, setReviewSuccess] = useState('');
    const [chatOpen, setChatOpen] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const [similar, setSimilar] = useState([]);
    const token = localStorage.getItem('token');

    const fetchResource = async () => {
        setLoading(true);
        setError('');
        try {
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await axios.get(`http://localhost:3000/api/v1/resources/public/get-single-resource/${id}`, { headers });
            setResource(res.data);
        } catch (err) {
            setError(err.response?.data?.msg || err.response?.data?.message || 'Could not load resource.');
        } finally {
            setLoading(false);
        }
    };

    const fetchSimilar = async () => {
        try {
            const res = await axios.get(`http://localhost:3000/api/v1/resources/public/similar/${id}`);
            setSimilar(res.data.similar || []);
        } catch (err) { /* ignore */ }
    };

    const checkBookmark = async () => {
        if (!token) return;
        try {
            const res = await axios.get(`http://localhost:3000/api/v1/bookmarks/check/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookmarked(res.data.bookmarked);
        } catch (err) { /* ignore */ }
    };

    useEffect(() => {
        fetchResource();
        fetchSimilar();
        checkBookmark();
    }, [id]);

    const handleBookmarkToggle = async () => {
        if (!token) { alert('Please log in to bookmark resources'); return; }
        try {
            const res = await axios.post('http://localhost:3000/api/v1/bookmarks/toggle',
                { resourceId: id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setBookmarked(res.data.bookmarked);
        } catch (err) { alert('Failed to toggle bookmark'); }
    };

    const handleTrackDownload = async () => {
        if (!token) return;
        try {
            await axios.post(`http://localhost:3000/api/v1/resources/protected/track-download/${id}`, {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) { /* ignore */ }
    };

    const handleReviewChange = (e) => {
        const { name, value } = e.target;
        setReviewForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        setReviewSubmitting(true);
        setReviewError('');
        setReviewSuccess('');
        try {
            await axios.post(
                `http://localhost:3000/api/v1/resources/protected/add-review/${id}`,
                { rating: reviewForm.rating, comment: reviewForm.comment },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setReviewSuccess('Review added successfully!');
            setReviewForm({ rating: '', comment: '' });
            fetchResource();
        } catch (err) {
            setReviewError(err.response?.data?.message || err.response?.data?.msg || 'Could not submit review.');
        } finally {
            setReviewSubmitting(false);
        }
    };

    if (loading) return <div className="gar-loading">Loading...</div>;
    if (error) return <div className="gar-error">{error}</div>;
    if (!resource) return <div className="gar-loading">Resource not found.</div>;

    return (
        <div className="get-a-resource-container">
            {/* Resource Header */}
            <div className="gar-header">
                <div className="gar-header-top">
                    <h2>{resource.title}</h2>
                    <button className={`gar-bookmark-btn ${bookmarked ? 'active' : ''}`} onClick={handleBookmarkToggle} title={bookmarked ? 'Remove bookmark' : 'Bookmark'}>
                        {bookmarked ? '🔖' : '📑'}
                    </button>
                </div>
                <div className="gar-meta-row">
                    <span className="gar-meta-item">📚 {resource.subject}</span>
                    <span className="gar-meta-item">📅 Semester {resource.semester}</span>
                    <span className="gar-meta-item">👤 {resource.uploadedByEmail || 'Unknown'}</span>
                    {resource.difficulty && (
                        <span className={`gar-difficulty ${resource.difficulty.toLowerCase()}`}>{resource.difficulty}</span>
                    )}
                </div>
                <div className="gar-stats-row">
                    <span>⭐ {resource.averageRating ? resource.averageRating.toFixed(1) : 'No ratings'}</span>
                    <span>👁️ {resource.viewCount || 0} views</span>
                    <span>📥 {resource.downloadCount || 0} downloads</span>
                    <span>💬 {resource.reviews?.length || 0} reviews</span>
                </div>
            </div>

            {/* AI Summary Section */}
            {resource.aiSummary && (
                <div className="gar-ai-summary">
                    <h3>🤖 AI-Generated Summary</h3>
                    <p>{resource.aiSummary}</p>
                    {resource.keyTopics && resource.keyTopics.length > 0 && (
                        <div className="gar-topics">
                            <strong>Key Topics:</strong>
                            <div className="gar-topic-tags">
                                {resource.keyTopics.map((t, i) => <span key={i} className="gar-topic-tag">{t}</span>)}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Description */}
            <div className="gar-description">
                <strong>Description:</strong> {resource.description || 'No description provided'}
            </div>

            {/* Action Buttons */}
            <div className="gar-actions">
                <a href={resource.pdfUrl} target="_blank" rel="noopener noreferrer" className="gar-action-btn view-pdf" onClick={handleTrackDownload}>
                    📄 View PDF
                </a>
                <button className="gar-action-btn chat-pdf" onClick={() => setChatOpen(true)}>
                    💬 Chat with PDF
                </button>
                <button className="gar-action-btn quiz-btn" onClick={() => navigate(`/quiz/${id}`)}>
                    🧠 Take Quiz
                </button>
            </div>

            <hr className="gar-divider" />

            {/* Reviews Section */}
            <h3>Reviews ({resource.reviews?.length || 0})</h3>
            {resource.reviews && resource.reviews.length > 0 ? (
                <div className="get-a-resource-reviews">
                    {resource.reviews.map((rev, idx) => (
                        <div key={idx} className="get-a-resource-review">
                            <div className="get-a-resource-review-email">
                                <strong>{rev.email || 'Anonymous'}</strong> &nbsp;
                                <span className="get-a-resource-review-rating">
                                    {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                                </span>
                            </div>
                            <div className="get-a-resource-review-comment">{rev.comment}</div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="get-a-resource-no-reviews">No reviews yet. Be the first!</div>
            )}

            {/* Add Review Form */}
            <h3>Add a Review</h3>
            <form onSubmit={handleReviewSubmit} className="get-a-resource-add-review-form">
                <div className="get-a-resource-add-review-form-group">
                    <label>
                        Rating:{' '}
                        <select name="rating" value={reviewForm.rating} onChange={handleReviewChange} required className="get-a-resource-add-review-form-group-select">
                            <option value="">Select</option>
                            {[1, 2, 3, 4, 5].map((num) => (
                                <option key={num} value={num}>{num}</option>
                            ))}
                        </select>
                    </label>
                </div>
                <div className="get-a-resource-add-review-form-group">
                    <label>
                        Comment:{' '}
                        <textarea name="comment" value={reviewForm.comment} onChange={handleReviewChange} required rows={3} className="get-a-resource-add-review-form-group-textarea" />
                    </label>
                </div>
                <button type="submit" disabled={reviewSubmitting} className="get-a-resource-add-review-form-group-button">
                    {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
                {reviewError && <div className="get-a-resource-add-review-form-group-error">{reviewError}</div>}
                {reviewSuccess && <div className="get-a-resource-add-review-form-group-success">{reviewSuccess}</div>}
            </form>

            {/* Similar Resources */}
            {similar.length > 0 && (
                <div className="gar-similar">
                    <h3>📎 Similar Resources</h3>
                    <div className="gar-similar-grid">
                        {similar.map((r) => (
                            <div key={r._id} className="gar-similar-card" onClick={() => navigate(`/resource/${r._id}`)}>
                                <h4>{r.title}</h4>
                                <div className="gar-similar-meta">
                                    <span>📚 {r.subject}</span>
                                    <span>⭐ {r.averageRating?.toFixed(1) || 'N/A'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Chat Panel */}
            {chatOpen && (
                <ChatWithPDF resourceId={id} resourceTitle={resource.title} onClose={() => setChatOpen(false)} />
            )}
        </div>
    );
};

export default GetAResource;