import UserService from "../services/userService.js";
import EmailService from "../services/emailService.js";
import AppError from "../utils/AppError.js";
import fs from "fs";

const userService = new UserService();

class UserController {
  async updateProfile(req, res, next) {
    try {
      const userId = req.session.user.id;
      const { username, email } = req.body;

      if (!username && !email) {
        throw new AppError(
          "At least one field (username or email) is required",
          400
        );
      }

      const result = await userService.updateProfile(userId, {
        username,
        email,
      });

      if (result.emailConfirmationToken) {
        const emailService = new EmailService();
        emailService
          .sendEmailConfirmationToken(
            result.user.email,
            result.emailConfirmationToken
          )
          .catch((err) => console.error("Failed to send email:", err));
      }

      req.session.user = {
        ...req.session.user,
        username: result.user.username,
        email: result.user.email,
      };

      res.status(200).json({
        success: true,
        message: result.emailConfirmationToken
          ? "Profile updated. Please confirm your new email address."
          : "Profile updated successfully.",
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAvatar(req, res, next) {
    try {
      const userId = req.session.user.id;

      if (!req.file) {
        throw new AppError("No file uploaded", 400);
      }

      const avatarPath = `uploads/${req.file.filename}`;

      const user = await userService.updateAvatar(userId, avatarPath);

      req.session.user.profilePicture = user.profilePicture;

      res.status(200).json({
        success: true,
        message: "Avatar updated successfully.",
        user: user,
      });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  }

  async getUserInfo(req, res, next) {
    try {
      const userId = req.params.id;

      if (!userId) {
        throw new AppError("User id is required");
      }

      const user = await userService.getUserInfo(userId);

      res.status(200).json({
        success: true,
        user: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async searchUser(req, res, next) {
    try {
      const { query } = req.query;

      if (!query) {
        throw new AppError("Search query is required", 400);
      }

      const users = await userService.searchUsers(query);

      res.status(200).json({
        success: true,
        count: users.length,
        users,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
