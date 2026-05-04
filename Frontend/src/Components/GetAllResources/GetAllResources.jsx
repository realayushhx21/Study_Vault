import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './GetAllResources.css';

const GetAllResources = () => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({ search: '', subject: '', semester: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate();

    const buildQueryString = (filtersObj, page) => {
        const params = Object.entries(filtersObj)
            .filter(([_, v]) => v)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
        if (page) params.push(`page=${page}`);
        return params.length ? `?${params.join('&')}` : '';
    };

    const fetchResources = async (page = 1, filtersObj = filters) => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(
                `http://localhost:3000/api/v1/resources/public/get-all-resources${buildQueryString(filtersObj, page)}`
            );
            setResources(res.data.resources || []);
            setTotalPages(res.data.totalPages || 1);
            setCurrentPage(res.data.currentPage || 1);
        } catch (err) {
            setError(err.response?.data?.msg || 'Could not load resources.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchResources(1, filters); }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchResources(1, filters);
    };

    return (
        <div className="get-all-resources-container">
            <h2 className="get-all-resources-title">📚 Explore Resources</h2>
            <form onSubmit={handleFilterSubmit} className="get-all-resources-form">
                <input type="text" name="search" placeholder="🔍 Search by title or description" value={filters.search} onChange={handleFilterChange} className="get-all-resources-input" />
                <input type="text" name="subject" placeholder="📖 Subject" value={filters.subject} onChange={handleFilterChange} className="get-all-resources-input" />
                <input type="number" name="semester" placeholder="📅 Semester" value={filters.semester} onChange={handleFilterChange} className="get-all-resources-input" />
                <button type="submit" className="get-all-resources-button">Apply Filters</button>
            </form>

            {loading ? (
                <div className="get-all-resources-loading">Loading...</div>
            ) : error ? (
                <div className="get-all-resources-error">{error}</div>
            ) : (
                <>
                    <div className="get-all-resources-grid">
                        {resources.length === 0 ? (
                            <div className="get-all-resources-no-resources">No resources found.</div>
                        ) : (
                            resources.map((resource) => (
                                <div key={resource._id} className="get-all-resources-resource" onClick={() => navigate(`/resource/${resource._id}`)}>
                                    <div className="gar-card-top">
                                        {resource.difficulty && (
                                            <span className={`gar-card-difficulty ${resource.difficulty.toLowerCase()}`}>{resource.difficulty}</span>
                                        )}
                                        <span className="gar-card-rating">⭐ {resource.averageRating?.toFixed(1) ?? 'N/A'}</span>
                                    </div>
                                    <h3 className="get-all-resources-resource-title">{resource.title}</h3>
                                    <div className="get-all-resources-resource-subject">
                                        📚 {resource.subject} &nbsp;·&nbsp; 📅 Sem {resource.semester}
                                    </div>
                                    <div className="gar-card-stats">
                                        <span>👁️ {resource.viewCount || 0}</span>
                                        <span>📥 {resource.downloadCount || 0}</span>
                                        <span>💬 {resource.reviews?.length || 0}</span>
                                    </div>
                                    {resource.keyTopics && resource.keyTopics.length > 0 && (
                                        <div className="gar-card-topics">
                                            {resource.keyTopics.slice(0, 3).map((t, i) => (
                                                <span key={i} className="gar-card-topic">{t}</span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="get-all-resources-resource-uploaded-by">
                                        👤 {resource.uploadedByEmail || 'Unknown'}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {totalPages > 1 && (
                        <div className="get-all-resources-pagination">
                            {Array.from({ length: totalPages }, (_, idx) => (
                                <button key={idx + 1} className={`get-all-resources-pagination-button ${currentPage === idx + 1 ? 'active' : ''}`}
                                    onClick={() => fetchResources(idx + 1, filters)} disabled={currentPage === idx + 1}>
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default GetAllResources;
