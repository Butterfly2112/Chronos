// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 30,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    calendars: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Calendar",
        },
    ],
    sharedWithMe: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Calendar",
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export const User = mongoose.model("User", userSchema);
