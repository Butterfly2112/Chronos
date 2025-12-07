import CalendarService from "../services/calendarService.js";
import EmailService from "../services/emailService.js";
import RegionCalendarService from "../services/regionCalendarService.js";
import UserService from "../services/userService.js";
import AppError from "../utils/AppError.js";

const calendarService = new CalendarService();
const regionCalendarService = new RegionCalendarService();
const userService = new UserService();

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

      const regionalCalendars = await this.#getRegionalCalendarsForUser(req);
      const allCalendars = [...regionalCalendars, ...calendars];

      res.status(200).json({
        success: true,
        count: allCalendars.length,
        calendars: allCalendars,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCalendarById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.session.user.id;

      if (regionCalendarService.isRegionalCalendarId(id)) {
        const countryCode = regionCalendarService.extractCountryCode(id);
        const parts = String(id).split("_");
        const year = parts[2] ? parseInt(parts[2]) : new Date().getFullYear();

        const calendar = await regionCalendarService.getRegionCalendar(
          countryCode,
          year
        );

        if (!calendar) {
          throw new AppError("Regional calendar not found", 404);
        }

        return res.status(200).json({
          success: true,
          calendar,
        });
      }

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

      if (regionCalendarService.isRegionalCalendarId(id)) {
        throw new AppError("Cannot delete regional calendars", 403);
      }

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

      if (regionCalendarService.isRegionalCalendarId(id)) {
        throw new AppError("Cannot delete regional calendars", 403);
      }

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

      if (regionCalendarService.isRegionalCalendarId(id)) {
        throw new AppError("Cannot share regional calendars", 403);
      }

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

      if (regionCalendarService.isRegionalCalendarId(id)) {
        return res.status(200).json({
          success: true,
          count: 0,
          owner: null,
          members: [],
        });
      }

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

      if (regionCalendarService.isRegionalCalendarId(id)) {
        throw new AppError("Cannot unshare regional calendars", 403);
      }

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

  async getAvailableCountries(req, res, next) {
    try {
      const countries = [
        { code: "ua", name: "Ukraine", flag: "🇺🇦" },
        { code: "us", name: "United States", flag: "🇺🇸" },
        { code: "gb", name: "United Kingdom", flag: "🇬🇧" },
        { code: "de", name: "Germany", flag: "🇩🇪" },
        { code: "fr", name: "France", flag: "🇫🇷" },
        { code: "pl", name: "Poland", flag: "🇵🇱" },
        { code: "ca", name: "Canada", flag: "🇨🇦" },
        { code: "au", name: "Australia", flag: "🇦🇺" },
        { code: "jp", name: "Japan", flag: "🇯🇵" },
        { code: "kr", name: "South Korea", flag: "🇰🇷" },
        { code: "br", name: "Brazil", flag: "🇧🇷" },
        { code: "mx", name: "Mexico", flag: "🇲🇽" },
        { code: "es", name: "Spain", flag: "🇪🇸" },
        { code: "it", name: "Italy", flag: "🇮🇹" },
        { code: "nl", name: "Netherlands", flag: "🇳🇱" },
        { code: "se", name: "Sweden", flag: "🇸🇪" },
        { code: "no", name: "Norway", flag: "🇳🇴" },
        { code: "dk", name: "Denmark", flag: "🇩🇰" },
        { code: "fi", name: "Finland", flag: "🇫🇮" },
        { code: "in", name: "India", flag: "🇮🇳" },
        { code: "cn", name: "China", flag: "🇨🇳" },
      ].sort((a, b) => a.name.localeCompare(b.name));

      res.status(200).json({
        success: true,
        count: countries.length,
        countries,
      });
    } catch (error) {
      next(error);
    }
  }

  async setRegionalCountry(req, res, next) {
    try {
      const userId = req.session.user.id;
      const { countryCode } = req.body;

      if (!countryCode || countryCode.length !== 2) {
        throw new AppError("Valid country code is required", 400);
      }

      const updatedUser = await userService.updateProfile(userId, {
        region: countryCode,
      });

      req.session.user = {
        ...req.session.user,
        region: updatedUser.region,
      };

      res.status(200).json({
        success: true,
        message: "Regional calendar country updated",
        countryCode,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentCountry(req, res, next) {
    try {
      const country = this.#getUserCountry(req);

      res.status(200).json({
        success: true,
        country,
      });
    } catch (error) {
      next(error);
    }
  }

  async #getRegionalCalendarsForUser(req) {
    try {
      const userCountry = this.#getUserCountry(req);
      const currentYear = new Date().getFullYear();

      const calendar = await regionCalendarService.getRegionCalendar(
        userCountry,
        currentYear
      );

      return calendar ? [calendar] : [];
    } catch (error) {
      console.error("Failed to load regional calendar:", error.message);
      return [];
    }
  }

  #getUserCountry(req) {
    return req.session.user.region;
  }

  async toggleHideSharedCalendar(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.session.user.id;

      const calendar = await calendarService.toggleHideSharedCalendar(id, userId);

      res.status(200).json({
        success: true,
        message: "Calendar hide status toggled",
        calendar,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default CalendarController;
