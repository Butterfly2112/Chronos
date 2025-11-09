import AuthService from "../services/authService.js";
import EmailService from "../services/emailService.js";
import AppError from "../utils/AppError.js";
import crypto from "crypto";

const authService = new AuthService();

class AuthController {
  async register(req, res, next) {
    try {
      const userData = req.body;
      const { user, token } = await authService.register(userData);

      const emailService = new EmailService();
      emailService
        .sendEmailConfirmationToken(user.email, token)
        .catch((err) => console.error("Email sending error:", err));

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

      const user = await authService.getByEmail(email);
      if (!user) {
        throw new AppError("User with this email does not exist", 404);
      }

      if (user.emailConfirmed) {
        throw new AppError("Email already confirmed", 400);
      }

      const newToken = crypto.randomBytes(32).toString("hex");
      user.emailConfirmationToken = newToken;
      await user.save();

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
}

export default AuthController;
