import Calendar from "../models/Calendar.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";

class CalendarService {
  async createCalendar(userId, calendarData) {
    const { name, description, color } = calendarData;

    const calendar = await Calendar.create({
      name,
      description: description || "",
      color: color || "#4E1E4A",
      owner: userId,
      isDefault: false,
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

  #checkAccess(calendar, userId) {
    if (calendar.owner._id.toString() === userId.toString()) {
      return true;
    }

    return calendar.sharedWith.some(
      (share) => share.user.toString() === userId.toString()
    );
  }
}

export default CalendarService;
