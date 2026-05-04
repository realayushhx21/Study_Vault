import React from 'react'
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Navbar.css';

const Navbar = () => {
    const [user, setUser] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { setUser(null); return; }
        const fetchUser = async () => {
            try {
                const res = await axios.get('http://localhost:3000/api/v1/auth/get-user', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.data && res.data.success && res.data.user) {
                    setUser(res.data.user);
                }
            } catch (err) { setUser(null); }
        };
        fetchUser();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
        navigate('/');
    };

    return (
        <nav className="navbar-container">
            <Link to="/" className="navbar-brand">📘 Study Vault</Link>

            <button className="navbar-toggle" onClick={() => setMenuOpen(!menuOpen)}>☰</button>

            <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
                <Link to="/" className="navbar-link" onClick={() => setMenuOpen(false)}>Home</Link>
                <Link to="/getAllResources" className="navbar-link" onClick={() => setMenuOpen(false)}>Explore</Link>
                {user && (
                    <>
                        <Link to="/createResource" className="navbar-link" onClick={() => setMenuOpen(false)}>Upload</Link>
                        <Link to="/getMyResources" className="navbar-link" onClick={() => setMenuOpen(false)}>My Resources</Link>
                        <Link to="/bookmarks" className="navbar-link" onClick={() => setMenuOpen(false)}>Bookmarks</Link>
                        <Link to="/dashboard" className="navbar-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                        <Link to="/groups" className="navbar-link" onClick={() => setMenuOpen(false)}>Groups</Link>
                    </>
                )}
                <Link to="/leaderboard" className="navbar-link" onClick={() => setMenuOpen(false)}>Leaderboard</Link>
            </div>

            <div className="navbar-user">
                {user ? (
                    <div className="navbar-user-info">
                        <span className="navbar-avatar" onClick={() => navigate('/profile')} title="My Profile">
                            {(user.name || user.email)[0]?.toUpperCase()}
                        </span>
                        <button className="navbar-logout" onClick={handleLogout}>Logout</button>
                    </div>
                ) : (
                    <button className="navbar-login-btn" onClick={() => navigate('/login')}>Login</button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;