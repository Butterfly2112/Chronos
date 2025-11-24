import React from "react";

export default function CreateEventModal({
                                             isOpen,
                                             formData,
                                             setFormData,
                                             onSubmit,
                                             onClose
                                         }) {

    if (!isOpen) return null;

    // 6 дозволених кольорів
    const colorOptions = [
        "#d2965c",
        "#8e6b4f",
        "#c7585b",
        "#a07c45",
        "#7b5738",
        "#593f2a"
    ];

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h3 className="modal-h3">Create Event</h3>

                <form onSubmit={onSubmit}>

                    <label>Title:</label>
                    <input
                        className="input"
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />

                    <label>Description:</label>
                    <textarea
                        className="textarea"
                        value={formData.description}
                        onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                        }
                    />

                    <label>Type:</label>
                    <select
                        className="select"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                        <option value="arrangement">Arrangement</option>
                        <option value="reminder">Reminder</option>
                        <option value="task">Task</option>
                    </select>

                    <div className="date-row">
                        <div className="date-col">
                            <label>Start:</label>
                            <input
                                className="input"
                                type="datetime-local"
                                required
                                value={formData.startDate}
                                onChange={(e) =>
                                    setFormData({ ...formData, startDate: e.target.value })
                                }
                            />
                        </div>

                        <div className="date-col">
                            <label>End:</label>
                            <input
                                className="input"
                                type="datetime-local"
                                value={formData.endDate}
                                onChange={(e) =>
                                    setFormData({ ...formData, endDate: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <label>Color:</label>
                    <div className="color-picker">
                        {colorOptions.map((color) => (
                            <button
                                key={color}
                                type="button"
                                className={
                                    "color-option" +
                                    (formData.color === color ? " selected" : "")
                                }
                                style={{ backgroundColor: color }}
                                onClick={() => setFormData({ ...formData, color })}
                            />
                        ))}
                    </div>

                    <label>Repeat:</label>
                    <select
                        className="select"
                        value={formData.repeat}
                        onChange={(e) =>
                            setFormData({ ...formData, repeat: e.target.value })
                        }
                    >
                        <option value="none">None</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit">Create</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
