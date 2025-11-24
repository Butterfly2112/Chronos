import React from "react";
import api from "../../services/api";

export default function EventDeleteModal({ isOpen, eventId, onClose, onDeleted }) {
    if (!isOpen) return null;

    async function handleDelete() {
        try {
            await api.delete(`/event/${eventId}`);
            onDeleted();
            onClose();
        } catch (err) {
            console.error("Delete failed", err);
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h3 className="modal-h3">Delete Event</h3>

                <p>Are you sure you want to delete this event?</p>

                <div className="modal-actions">
                    <button type="button" onClick={onClose}>
                        Cancel
                    </button>

                    <button className="button" onClick={handleDelete}>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
