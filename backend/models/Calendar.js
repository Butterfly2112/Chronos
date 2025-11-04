import mongoose from "mongoose";

const calendarSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    color: {
        type: String,
        default: "#4E1E4A"
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    events: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event"
        }
    ],
    isDefault: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const Calendar = mongoose.model("Calendar", calendarSchema);
