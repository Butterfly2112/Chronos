import AuthService from "../services/authService";
import EmailService from "../services/emailService";

const authService = new AuthService();
const emailService = new EmailService();

class AuthController {
  async register(req, res) {
    try {
      const userData = req.body;
      const user = await authService.register(userData);
      const token = await authService.getEmailToken(user.email);

      emailService
        .sendEmailConfirmationToken(user.email, token)
        .catch((err) => console.error("Email error:", err));

      res.status(201).json({
        success: true,
        message: "User registered. Please check your email.",
        user,
      });
    } catch (error) {
      if (error.message.includes("already")) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async login(req, res) {}
}

export default AuthController;
