import CalendarService from "../services/calendarService.js";
import AppError from "../utils/AppError.js";

const calendarService = new CalendarService();

class CalendarController {
  async createCalendar(req, res, next) {
    try {
      const userId = req.session.user.id;
      const calendarData = req.body;

      if (!calendarData.name) {
        throw new AppError("Calendar name is required", 400);
      }

      const calendar = await calendarService.createCalendar(
        userId,
        calendarData
      );

      res.status(201).json({
        success: true,
        message: "Calendar created successfully",
        calendar,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserCalendars(req, res, next) {
    try {

      const userId = req.session.user.id;

      let calendars = await calendarService.getUserCallendars(userId);

      if (!calendars.length) {
        await calendarService.createDefaultCalendar(userId);
        calendars = await calendarService.getUserCallendars(userId);
      }

      res.status(200).json({
        success: true,
        count: calendars.length,
        calendars,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCalendarById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.session.user.id;

      const calendar = await calendarService.getCalendarById(id, userId);

      res.status(200).json({
        success: true,
        calendar,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default CalendarController;
