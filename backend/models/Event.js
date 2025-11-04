// models/Event.js
import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    description: {
        type: String,
        trim: true,
    },
    type: {
        type: String,
        enum: ["arrangement", "reminder", "task"],
        required: true,
    },
    startDate: {
        type: Date,
        required: function () {
            return this.type === "arrangement" || this.type === "reminder";
        },
    },
    endDate: {
        type: Date,
        required: function () {
            return this.type === "arrangement";
        },
    },
    calendar: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Calendar",
        required: true,
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    invited: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    status: {
        type: String,
        enum: ["pending", "done", "cancelled"],
        default: "pending",
    },
    repeat: {
        type: String,
        enum: ["none", "daily", "weekly", "monthly"],
        default: "none",
    },
    color: {
        type: String,
        default: "#C9ABC3",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export const Event = mongoose.model("Event", eventSchema);
