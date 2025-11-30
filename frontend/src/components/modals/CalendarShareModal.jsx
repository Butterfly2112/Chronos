import React, { useState } from "react";
import api from "../../services/api";
import "../../styles/modal.css";

export default function CalendarShareModal({ isOpen, calendarId, onClose, onShared }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    async function searchUsers() {
        try {
            if (!query || !query.trim()) return;
            const res = await api.get(`/user/search?query=${encodeURIComponent(query)}`);
            setResults(res.data.users || []);
        } catch (err) {
            console.error("Search failed", err);
            setResults([]);
        }
    }

    async function shareWith(userId) {
        try {
            setLoading(true);
            await api.post(`/calendar/${calendarId}/share`, { target_user_id: userId });
            alert("Calendar shared successfully");
            if (onShared) onShared();
            onClose();
        } catch (err) {
            console.error("Share failed", err);
            const msg = err?.response?.data?.message || err?.response?.data?.error || 'Failed to share calendar';
            alert(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h3 className="modal-h3">Share Calendar</h3>

                <input
                    className="input"
                    placeholder="Search user by name, login or email..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />

                <button
                    type="button"
                    className="invite-search-btn"
                    onClick={searchUsers}
                >
                    Search
                </button>

                <ul className="invite-list">
                    {results.map((u) => (
                        <li key={u.id || u._id} className="invite-item">
                            <span>{u.username || u.login} ({u.email})</span>
                            <button
                                type="button"
                                className="invite-btn"
                                onClick={() => shareWith(u.id || u._id)}
                                disabled={loading}
                            >
                                {loading ? 'Sharing...' : 'Share'}
                            </button>
                        </li>
                    ))}
                </ul>

                <div className="modal-actions">
                    <button type="button" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}
