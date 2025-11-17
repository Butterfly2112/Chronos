import UserService from "../services/userService.js";
import EmailService from "../services/emailService.js";
import AppError from "../utils/AppError.js";

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
}

export default UserController;
