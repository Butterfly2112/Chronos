import React, { useState, useEffect } from "react";
import api from "../../services/api";

export default function EventEditModal({ isOpen, event, onClose, onUpdated }) {
    const [form, setForm] = useState({
        title: "",
        description: "",
        type: "",
        startDate: "",
        endDate: "",
        color: "",
        repeat: "",
    });

    useEffect(() => {
        if (event) {
            setForm({
                title: event.title,
                description: event.description,
                type: event.type,
                startDate: event.startDate.slice(0, 16),
                endDate: event.endDate.slice(0, 16),
                color: event.color,
                repeat: event.repeat,
            });
        }
    }, [event]);

    if (!isOpen || !event) return null;

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            await api.put(`/event/${event._id}`, form);
            onUpdated();
            onClose();
        } catch (err) {
            console.error("Update failed", err);
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h3 className="modal-h3">Edit Event</h3>

                <form onSubmit={handleSubmit}>

                    <label>Title:</label>
                    <input
                        className="input"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        required
                    />

                    <label>Description:</label>
                    <textarea
                        className="textarea"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />

                    <label>Type:</label>
                    <select
                        className="select"
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                    >
                        <option value="arrangement">Arrangement</option>
                        <option value="reminder">Reminder</option>
                        <option value="task">Task</option>
                    </select>

                    {/* START + END INLINE */}
                    <div className="date-row">
                        <div className="date-col">
                            <label>Start:</label>
                            <input
                                type="datetime-local"
                                className="input"
                                value={form.startDate}
                                onChange={(e) =>
                                    setForm({ ...form, startDate: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div className="date-col">
                            <label>End:</label>
                            <input
                                type="datetime-local"
                                className="input"
                                value={form.endDate}
                                onChange={(e) =>
                                    setForm({ ...form, endDate: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    {/* COLOR PICKER */}
                    <label>Color:</label>
                    <div className="color-picker">
                        {[
                            "#d2965c",
                            "#8e6b4f",
                            "#c7585b",
                            "#a07c45",
                            "#7b5738",
                            "#593f2a"
                        ].map((color) => (
                            <button
                                key={color}
                                type="button"
                                className={
                                    "color-option" +
                                    (form.color === color ? " selected" : "")
                                }
                                style={{ backgroundColor: color }}
                                onClick={() => setForm({ ...form, color })}
                            />
                        ))}
                    </div>

                    <label>Repeat:</label>
                    <select
                        className="select"
                        value={form.repeat}
                        onChange={(e) => setForm({ ...form, repeat: e.target.value })}
                    >
                        <option value="none">None</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
