import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './StudyGroups.css';

const StudyGroups = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list', 'create', 'join', 'detail'
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [createForm, setCreateForm] = useState({ name: '', description: '' });
    const [joinCode, setJoinCode] = useState('');
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');
    const [addResourceId, setAddResourceId] = useState('');
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    useEffect(() => { fetchGroups(); }, []);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:3000/api/v1/groups', { headers: { Authorization: `Bearer ${token}` } });
            setGroups(res.data.groups || []);
        } catch (err) { setError('Failed to load groups'); }
        finally { setLoading(false); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setMsg(''); setError('');
        try {
            await axios.post('http://localhost:3000/api/v1/groups', createForm, { headers: { Authorization: `Bearer ${token}` } });
            setMsg('Group created!');
            setCreateForm({ name: '', description: '' });
            fetchGroups();
            setView('list');
        } catch (err) { setError(err.response?.data?.msg || 'Failed to create group'); }
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        setMsg(''); setError('');
        try {
            await axios.post('http://localhost:3000/api/v1/groups/join', { inviteCode: joinCode }, { headers: { Authorization: `Bearer ${token}` } });
            setMsg('Joined group!');
            setJoinCode('');
            fetchGroups();
            setView('list');
        } catch (err) { setError(err.response?.data?.msg || 'Failed to join group'); }
    };

    const viewGroup = async (id) => {
        try {
            const res = await axios.get(`http://localhost:3000/api/v1/groups/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            setSelectedGroup(res.data.group);
            setView('detail');
        } catch (err) { setError('Failed to load group details'); }
    };

    const handleAddResource = async () => {
        if (!addResourceId.trim()) return;
        try {
            await axios.post(`http://localhost:3000/api/v1/groups/${selectedGroup._id}/add-resource`, { resourceId: addResourceId }, { headers: { Authorization: `Bearer ${token}` } });
            setMsg('Resource added!');
            setAddResourceId('');
            viewGroup(selectedGroup._id);
        } catch (err) { setError(err.response?.data?.msg || 'Failed to add resource'); }
    };

    const handleLeave = async (id) => {
        if (!window.confirm('Are you sure you want to leave this group?')) return;
        try {
            await axios.post(`http://localhost:3000/api/v1/groups/${id}/leave`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setMsg('Left group');
            setView('list');
            fetchGroups();
        } catch (err) { setError(err.response?.data?.msg || 'Failed to leave group'); }
    };

    if (!token) return <div className="sg-container"><div className="sg-error">Please log in to use Study Groups.</div></div>;

    return (
        <div className="sg-container">
            <div className="sg-header">
                <h2>📁 Study Groups</h2>
                <div className="sg-header-actions">
                    <button className={`sg-tab ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>My Groups</button>
                    <button className={`sg-tab ${view === 'create' ? 'active' : ''}`} onClick={() => setView('create')}>Create Group</button>
                    <button className={`sg-tab ${view === 'join' ? 'active' : ''}`} onClick={() => setView('join')}>Join Group</button>
                </div>
            </div>

            {msg && <div className="sg-success">{msg}</div>}
            {error && <div className="sg-error">{error}</div>}

            {view === 'list' && (
                loading ? <div className="sg-loading">Loading...</div> :
                    groups.length === 0 ? (
                        <div className="sg-empty">
                            <div className="sg-empty-icon">👥</div>
                            <h3>No study groups yet</h3>
                            <p>Create a group or join one with an invite code!</p>
                        </div>
                    ) : (
                        <div className="sg-grid">
                            {groups.map(g => (
                                <div key={g._id} className="sg-card" onClick={() => viewGroup(g._id)}>
                                    <h3>{g.name}</h3>
                                    <p className="sg-desc">{g.description || 'No description'}</p>
                                    <div className="sg-card-meta">
                                        <span>👥 {g.members?.length || 0} members</span>
                                        <span>📄 {g.resources?.length || 0} resources</span>
                                    </div>
                                    <div className="sg-invite-code">Code: <strong>{g.inviteCode}</strong></div>
                                </div>
                            ))}
                        </div>
                    )
            )}

            {view === 'create' && (
                <form className="sg-form" onSubmit={handleCreate}>
                    <div className="sg-field"><label>Group Name</label><input type="text" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} required placeholder="e.g., DBMS Study Squad" /></div>
                    <div className="sg-field"><label>Description (optional)</label><textarea value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} rows={3} placeholder="What is this group about?" /></div>
                    <button type="submit" className="sg-submit-btn">🚀 Create Group</button>
                </form>
            )}

            {view === 'join' && (
                <form className="sg-form" onSubmit={handleJoin}>
                    <div className="sg-field"><label>Invite Code</label><input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value)} required placeholder="Enter 8-character invite code" /></div>
                    <button type="submit" className="sg-submit-btn">🔗 Join Group</button>
                </form>
            )}

            {view === 'detail' && selectedGroup && (
                <div className="sg-detail">
                    <div className="sg-detail-header">
                        <div>
                            <h3>{selectedGroup.name}</h3>
                            <p className="sg-desc">{selectedGroup.description}</p>
                            <p className="sg-invite">Invite Code: <strong>{selectedGroup.inviteCode}</strong> (share this with classmates!)</p>
                        </div>
                        <button className="sg-leave-btn" onClick={() => handleLeave(selectedGroup._id)}>Leave Group</button>
                    </div>

                    <div className="sg-members">
                        <h4>👥 Members ({selectedGroup.members?.length})</h4>
                        <div className="sg-members-list">
                            {selectedGroup.members?.map(m => (
                                <span key={m._id} className="sg-member-tag">{m.name || m.email?.split('@')[0]}</span>
                            ))}
                        </div>
                    </div>

                    <div className="sg-resources">
                        <h4>📄 Shared Resources ({selectedGroup.resources?.length})</h4>
                        {selectedGroup.resources?.length > 0 ? (
                            <div className="sg-resources-list">
                                {selectedGroup.resources.map(r => (
                                    <div key={r._id} className="sg-resource-item" onClick={() => navigate(`/resource/${r._id}`)}>
                                        <span>{r.title}</span>
                                        <span className="sg-resource-subject">{r.subject} · Sem {r.semester}</span>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="sg-no-resources">No resources shared yet.</p>}

                        <div className="sg-add-resource">
                            <input type="text" value={addResourceId} onChange={e => setAddResourceId(e.target.value)} placeholder="Paste Resource ID to add" />
                            <button onClick={handleAddResource}>+ Add</button>
                        </div>
                    </div>

                    <button className="sg-back-btn" onClick={() => setView('list')}>← Back to Groups</button>
                </div>
            )}
        </div>
    );
};

export default StudyGroups;
