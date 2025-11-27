import CalendarService from "../services/calendarService.js";
import EmailService from "../services/emailService.js";
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

  async updateCalendar(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.session.user.id;
      const updateData = req.body;

      const calendar = await calendarService.updateCalendar(
        id,
        userId,
        updateData
      );

      res.status(200).json({
        succes: true,
        message: "Calendar updated successfully",
        calendar,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCalendar(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.session.user.id;

      const result = await calendarService.deleteCalendar(id, userId);

      if (result === 2) {
        res.status(200).json({
          success: true,
          message:
            "Events of default calendar deleted, default calendar remains",
        });
      } else {
        res.status(200).json({
          success: true,
          message: "Calendar deleted successfully",
        });
      }
    } catch (error) {
      next(error);
    }
  }

  async shareCalendar(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.session.user.id;
      const { target_user_id } = req.body;

      if (!target_user_id) {
        throw new AppError("Target user ID is required", 400);
      }

      const result = await calendarService.shareCalendar(
        id,
        userId,
        target_user_id
      );

      const emailService = new EmailService();
      emailService
        .shareCallendarMessage(
          result.shareToUser.email,
          result.calendar,
          result.ownerUsername
        )
        .catch((err) => console.error("Email sending error:", err));

      res.status(200).json({
        success: true,
        message: "User were invited successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getSharedUsersOfCalendar(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.session.user.id;

      const sharedUsers = await calendarService.getSharedUsers(id, userId);

      res.status(200).json({
        success: true,
        count: sharedUsers.length,
        owner: sharedUsers.owner,
        members: sharedUsers.members,
      });
    } catch (error) {
      next(error);
    }
  }

  async unshareCalendar(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.session.user.id;
      const { user_to_unshare } = req.body;

      if (!user_to_unshare) {
        throw new AppError("User ID is required", 400);
      }

      const result = await calendarService.unshareCalendar(
        id,
        userId,
        user_to_unshare
      );

      res.status(200).json({
        success: true,
        message: "User removed from calendar successfully",
        calendar: result.calendar,
        removedUser: result.removedUser,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default CalendarController;
