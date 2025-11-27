import mongoose from "mongoose";

const calendarSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  color: {
    type: String,
    default: "#4E1E4A",
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sharedWith: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      eventColor: {
        type: String,
        default: "#3788d8",
      },
    },
  ],
  events: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },
  ],
  isDefault: {
    type: Boolean,
    default: false,
  },
  isHidden: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

calendarSchema.index({ owner: 1 });
calendarSchema.index({ "sharedWith.user": 1 });

calendarSchema.statics.findUserCalendars = function (userId) {
  return this.find({
    $or: [{ owner: userId }, { "sharedWith.user": userId }],
  })
    .populate("owner", "username email")
    .populate("sharedWith.user", "username email");
};

calendarSchema.statics.findCalendarById = function (calendarId) {
  return this.findOne({ _id: calendarId })
    .populate("owner", "username email")
    .populate("sharedWith.user", "username email")
    .populate({
      path: "events",
      populate: { path: "creator", select: "username email" },
    });
};

calendarSchema.methods.isOwner = function (userId) {
  const ownerId = this.owner._id || this.owner;
  return ownerId.toString() === userId.toString();
};

export default mongoose.model("Calendar", calendarSchema);
