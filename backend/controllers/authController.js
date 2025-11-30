import AuthService from "../services/authService.js";
import EmailService from "../services/emailService.js";
import CalendarService from "../services/calendarService.js";
import AppError from "../utils/AppError.js";
import User from "../models/User.js";
import Calendar from "../models/Calendar.js";

const authService = new AuthService();
const calendarService = new CalendarService();

class AuthController {
  async register(req, res, next) {
    try {
      const userData = req.body;
      const { user, userId, token } = await authService.register(userData);

      await calendarService.createDefaultCalendar(user.id);

      const emailService = new EmailService();
      emailService
        .sendEmailConfirmationToken(user.email, token)
        .catch((err) => console.error("Email sending error:", err));

      const calendarService = new CalendarService();
      calendarService
        .createDefaultCalendar(userId)
        .catch((error) =>
          console.error("Failed to create default calendar:", error)
        );

      res.status(201).json({
        success: true,
        message: "User registered successfully. Please check your email.",
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { identifier, password } = req.body;
      const user = await authService.login(identifier, password);

      const fullUser = await User.findById(user.id);
      if (!fullUser.calendars.length) {
        try {
          await calendarService.createDefaultCalendar(user.id);
        } catch (err) {
            // Якщо створення дефолтного календаря провалилось з повідомленням
            // "Default calendar already exists" (тобто документ календаря
            // вже існує в колекції, але поле `user.calendars` порожнє), то не провалюємо логін
          if (
            err?.message?.includes("Default calendar already exists") ||
            err?.statusCode === 400
          ) {
            const existingDefault = await Calendar.findOne({ owner: user.id, isDefault: true });
            if (existingDefault) {
              await User.findByIdAndUpdate(user.id, { $addToSet: { calendars: existingDefault._id } });
            }
          } else {
            throw err;
          }
        }
      }

      req.session.user = user;

      res.status(200).json({
        success: true,
        message: "Login successful",
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  async confirmEmail(req, res, next) {
    try {
      const { token } = req.query;
      if (!token) {
        throw new AppError("Confirmation token is required", 400);
      }
      const result = await authService.confirmEmail(token);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async resendConfirmation(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) {
        throw new AppError("Email is required", 400);
      }

      const newToken = await authService.resetEmailConfirmationToken(email);

      const emailService = new EmailService();
      await emailService.sendEmailConfirmationToken(email, newToken);

      res.status(200).json({
        success: true,
        message: "Confirmation email sent",
      });
    } catch (error) {
      next(error);
    }
  }

  logout(req, res, next) {
    req.session.destroy((err) => {
      if (err) {
        return next(new AppError("Failed to logout", 500));
      }

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    });
  }

  getCurrentUser(req, res, next) {
    if (!req.session || !req.session.user) {
      return next(new AppError("Not authenticated", 401));
    }
    res.status(200).json({
      success: true,
      user: req.session.user,
    });
  }

  async requestPasswordReset(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) {
        throw new AppError("Email is required", 400);
      }

      const token = await authService.resetPasswordRequest(email);

      const emailService = new EmailService();
      await emailService.sendPasswordResetToken(email, token);

      res.status(200).json({
        success: true,
        message: "Password reset email sent",
      });
    } catch (error) {
      next(error);
    }
  }

  async givePasswordTokenInfo(req, res, next) {
    try {
      const { token } = req.query;
      if (!token) {
        throw new AppError("Password reset token is required", 400);
      }

      res.status(200).json({
        success: true,
        message:
          "Put this request: /api/auth/reset-password and put this token in this request body",
        token: token,
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;

      const result = await authService.resetPassword(token, password);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
