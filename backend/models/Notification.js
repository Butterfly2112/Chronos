// models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: false,
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    sendAt: {
        type: Date,
        required: true,
    },
    delivered: {
        type: Boolean,
        default: false,
    },
    method: {
        type: String,
        enum: ["push", "email", "in-app"],
        default: "in-app",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

notificationSchema.methods.markAsDelivered = async function () {
    this.delivered = true;
    await this.save();
};

export const Notification = mongoose.model("Notification", notificationSchema);
