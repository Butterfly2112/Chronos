import Calendar from "../models/Calendar.js";
import User from "../models/User.js";
import { Event } from "../models/Event.js";
import AppError from "../utils/AppError.js";

class CalendarService {
  async createCalendar(userId, calendarData) {
    const { name, description, color, includeHolidays } = calendarData;

    const calendar = await Calendar.create({
      name,
      description: description || "",
      color: color || "#4E1E4A",
      owner: userId,
      isDefault: false,
      includeHolidays: includeHolidays || false,
    });

    await User.findOneAndUpdate(
      { _id: userId },
      { $push: { calendars: calendar._id } }
    );

    return calendar;
  }

  async createDefaultCalendar(userId) {
    const hasDefaultCalendar = await Calendar.findOne({
      owner: userId,
      isDefault: true,
    });

    if (hasDefaultCalendar) {
      throw new AppError("Default calendar already exists", 400);
    }

    const calendar = new Calendar({
      name: "My Calendar",
      description: "Default calendar",
      owner: userId,
      isDefault: true,
    });

    await calendar.save();

    await User.findOneAndUpdate(userId, {
      $push: { calendars: calendar._id },
    });

    return calendar;
  }

  async getUserCallendars(userId) {
    return Calendar.findUserCalendars(userId);
  }

  async getCalendarById(calendarId, userId) {
    const calendar = await Calendar.findCalendarById(calendarId);

    if (!calendar) {
      throw new AppError("Calendar not found", 404);
    }

    const hasAccess = this.#checkAccess(calendar, userId);
    if (!hasAccess) {
      throw new AppError("Access denied to this calendar", 403);
    }

    return calendar;
  }

  async updateCalendar(calendarId, userId, updateData) {
    const { name, description, color, includeHolidays } = updateData;

    const calendar = await Calendar.findById(calendarId);
    if (!calendar) {
      throw new AppError("Calendar not found", 404);
    }

    if (calendar.owner.toString() !== userId.toString()) {
      throw new AppError("Only owner can edit calendar", 403);
    }

    if (name !== undefined) calendar.name = name;
    if (description !== undefined) calendar.description = description;
    if (color !== undefined) calendar.color = color;
    if (includeHolidays !== undefined) calendar.includeHolidays = includeHolidays;

    await calendar.save();
    return calendar;
  }

  async deleteCalendar(calendarId, userId) {
    const calendar = await Calendar.findById(calendarId);
    if (!calendar) {
      throw new AppError("Calendar not found", 404);
    }

    if (!calendar.isOwner(userId)) {
      throw new AppError("Only owner can delete calendar", 403);
    }

    await Event.deleteMany({ calendar: calendarId });

    if (calendar.isDefault) {
      return 2;
    } else {
      await User.updateMany(
        { calendars: calendarId },
        { $pull: { calendars: calendarId } }
      );

      await User.updateMany(
        { sharedWithMe: calendarId },
        { $pull: { sharedWithMe: calendarId } }
      );

      await Calendar.deleteOne({ _id: calendarId });

      return 1;
    }
  }

  async shareCalendar(calendarId, userId, shareToUserId) {
    const calendar = await Calendar.findById(calendarId).populate(
      "owner",
      "username email"
    );

    if (!calendar) {
      throw new AppError("Calendar not found", 404);
    }

    if (!calendar.isOwner(userId)) {
      throw new AppError("Only owner can invite to the calendar", 403);
    }

    if (calendar.isDefault) {
      throw new AppError("Cannot share default calendar", 400);
    }

    const shareToUser = await User.findById(shareToUserId);
    if (!shareToUser) {
      throw new AppError("User, who you want to invite, not found", 404);
    }

    if (shareToUser._id.toString() === userId.toString()) {
      throw new AppError("Cannot share calendar with yourself", 400);
    }

    const alreadyShared = calendar.sharedWith.some(
      (share) => share.user.toString() === shareToUserId
    );

    if (alreadyShared) {
      throw new AppError("Calendar already shared with this user", 400);
    }

    calendar.sharedWith.push({
      user: shareToUserId,
      eventColor: this.#generateRandomColor(),
    });

    await calendar.save();

    if (!shareToUser.sharedWithMe) {
      shareToUser.sharedWithMe = [];
    }

    if (!shareToUser.sharedWithMe.includes(calendarId)) {
      shareToUser.sharedWithMe.push(calendarId);
      await shareToUser.save();
    }

    return {
      calendar: calendar,
      shareToUser,
      ownerUsername: calendar.owner.username,
    };
  }

  async getSharedUsers(calendarId, userId) {
    const calendar = await Calendar.findById(calendarId)
      .populate("sharedWith.user", "username email")
      .populate("owner", "username email");
    if (!calendar) {
      throw new AppError("Calendar not found", 404);
    }

    if (!this.#checkAccess(calendar, userId)) {
      throw new AppError("Access denied to this calendar", 403);
    }

    return {
      members: calendar.sharedWith,
      owner: calendar.owner,
    };
  }

  async unshareCalendar(calendarId, userId, unshareToUserId) {
    const calendar = await Calendar.findById(calendarId)
      .populate("sharedWith.user", "username email")
      .populate("owner", "username email");

    if (!calendar) {
      throw new AppError("Calendar not found", 404);
    }

    if (!this.#checkAccess(calendar, userId)) {
      throw new AppError("Access denied to this calendar", 403);
    }

    if (calendar.isOwner(unshareToUserId)) {
      throw new AppError(
        "Owner can't unshare themself from their calendar. Delete calendar instead.",
        400
      );
    }

    const isSharedUser = calendar.sharedWith.some((share) => {
      if (!share.user) return false;
      return share.user._id.toString() === unshareToUserId.toString();
    });

    if (!isSharedUser) {
      throw new AppError("User is not shared with this calendar", 404);
    }

    const isSelfRemoval = userId.toString() === unshareToUserId.toString();
    const isRequesterOwner = calendar.isOwner(userId);

    if (!isSelfRemoval && !isRequesterOwner) {
      throw new AppError("You allow to remove only yourself", 403);
    }

    calendar.sharedWith = calendar.sharedWith.filter((share) => {
      if (!share.user) return false;
      return share.user._id.toString() !== unshareToUserId.toString();
    });

    await calendar.save();

    await User.findByIdAndUpdate(unshareToUserId, {
      $pull: { sharedWithMe: calendarId },
    });

    const removedUser = await User.findById(unshareToUserId).select(
      "username email"
    );

    return {
      calendar,
      removedUser,
    };
  }

  #checkAccess(calendar, userId) {
    const ownerId = calendar.owner._id || calendar.owner;
    if (ownerId.toString() === userId.toString()) {
      return true;
    }

    return calendar.sharedWith.some((share) => {
      if (!share.user) return false;

      const sharedUserId = share.user._id || share.user;
      return sharedUserId.toString() === userId.toString();
    });
  }

  #generateRandomColor() {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FFA07A",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E2",
      "#F8B739",
      "#52B788",
      "#E63946",
      "#457B9D",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  async toggleHideSharedCalendar(calendarId, userId) {
    const calendar = await Calendar.findById(calendarId);
    if (!calendar) {
      throw new AppError("Calendar not found", 404);
    }

    const sharedEntry = calendar.sharedWith.find(s => s.user.toString() === userId.toString());
    if (!sharedEntry) {
      throw new AppError("User is not shared with this calendar", 403);
    }

    sharedEntry.isHidden = !sharedEntry.isHidden;
    await calendar.save();
    return calendar;
  }
}

export default CalendarService;
