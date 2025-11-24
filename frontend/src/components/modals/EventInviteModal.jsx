import React, { useState } from "react";
import api from "../../services/api";
import "../../styles/modal.css";

export default function EventInviteModal({ isOpen, eventId, onClose }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);

    if (!isOpen) return null;

    async function searchUsers() {
        try {
            const res = await api.get(`/user/search?query=${query}`);
            setResults(res.data.users);
        } catch (err) {
            console.error("Search failed", err);
        }
    }

    async function invite(userId) {
        try {
            await api.post(`/event/${eventId}/invite`, { userId });
            alert("User invited!");
            onClose();
        } catch (err) {
            console.error("Invite failed", err);
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h3 className="modal-h3">Invite User</h3>

                {/* INPUT FIELD */}
                <input
                    className="input"
                    placeholder="Search user..."
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

                {/* RESULTS */}
                <ul className="invite-list">
                    {results.map((u) => (
                        <li key={u.id || u._id} className="invite-item">
      <span>
        {u.username || u.login} ({u.email})
      </span>

                            <button
                                type="button"
                                className="invite-btn"
                                onClick={() => invite(u.id || u._id)}
                            >
                                Invite
                            </button>
                        </li>
                    ))}
                </ul>

                <div className="modal-actions">
                    <button type="button" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
