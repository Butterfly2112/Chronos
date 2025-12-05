import React from "react";

export default function EventViewModal({
                                           isOpen,
                                           event,
                                           onClose,
                                           onEdit,
                                           onInvite,
                                           onDelete,
                                           currentUserId
                                       }) {
    if (!isOpen || !event) return null;

    const isCreator = event.creator && event.creator._id === currentUserId;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h3 className="modal-h3">Event Details</h3>

                <p><strong>Title:</strong> {event.title}</p>
                <p><strong>Description:</strong> {event.description || "—"}</p>
                <p><strong>Type:</strong> {event.type}</p>
                <p><strong>Start:</strong> {event.type === 'holiday' ? new Date(event.startDate).toLocaleDateString() + ', 00:00:00' : new Date(event.startDate).toLocaleString()}</p>
                <p><strong>End:</strong> {event.type === 'holiday' ? new Date(event.startDate).toLocaleDateString() + ', 23:59:59' : new Date(event.endDate).toLocaleString()}</p>

                <div className="modal-actions">
                    {isCreator && (
                        <>
                            <button type="button" onClick={onEdit}>Edit</button>
                            <button type="button" onClick={onInvite}>Invite</button>
                            <button type="button" className="danger" onClick={onDelete}>Delete</button>
                        </>
                    )}

                    <button type="button" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}

