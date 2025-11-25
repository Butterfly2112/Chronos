import User from "../models/User.js";
import crypto from "crypto";
import AppError from "../utils/AppError.js";

class AuthService {
  async register(userData) {
    const { login, username, email, password } = userData;

    const userExists = await User.findOne({
      $or: [{ login }, { email }],
    });

    if (userExists) {
      if (userExists.login === login)
        throw new AppError("Login already in use", 409);
      throw new AppError("Email already in use", 409);
    }

    const emailConfirmationToken = crypto.randomBytes(32).toString("hex");

    const user = await User.create({
      login,
      username,
      email,
      password,
      emailConfirmationToken,
    });

    return {
      user: this.#getSafeUser(user),
      userId: user._id,
      token: emailConfirmationToken,
    };
  }

  async login(identifier, password) {
    const user = await User.findOne({
      $or: [{ login: identifier }, { email: identifier.toLowerCase() }],
    });

    if (!user) {
      throw new AppError("User with such login or email not found", 401);
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw new AppError("Invalid email, login or password", 401);
    }
    if (!user.emailConfirmed) {
      throw new AppError("Please confirm your email first", 403);
    }

    return this.#getSafeUser(user);
  }

  async confirmEmail(token) {
    const user = await User.findOne({ emailConfirmationToken: token });

    if (!user) {
      throw new AppError("Invalid token or this email already confirmed", 400);
    }

    user.emailConfirmed = true;
    user.emailConfirmationToken = undefined;
    await user.save();

    return { message: "Email confirmed successfully" };
  }

  async resetEmailConfirmationToken(email) {
    const user = await User.findByEmail(email);
    if (!user) {
      throw new AppError("User with this email does not exist", 404);
    }

    if (user.emailConfirmed) {
      throw new AppError("Email already confirmed", 400);
    }

    const newToken = crypto.randomBytes(32).toString("hex");
    user.emailConfirmationToken = newToken;
    await user.save();
    return newToken;
  }

  async getByEmail(email) {
    const user = await User.findByEmail(email);
    return user;
  }

  async resetPasswordRequest(email) {
    const user = await User.findByEmail(email);

    if (!user) {
      throw new AppError("User wiht this email not found", 404);
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = token;
    const expire = new Date();
    user.passwordResetExpires = expire.setMinutes(expire.getMinutes() + 15); // 15 minutes
    await user.save();

    return token;
  }

  async resetPassword(token, newPassword) {
    const user = await User.findOne({ passwordResetToken: token });

    if (!user) {
      throw new AppError("Invalid token", 400);
    }

    if (new Date() > user.passwordResetExpires) {
      throw new AppError("Token has expired", 400);
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return { message: "Password has been reset successfully" };
  }

  #getSafeUser(user) {
    return {
      id: user._id,
      login: user.login,
      username: user.username,
      email: user.email,
      profilePicture: user.avatar,
    };
  }
}

export default AuthService;
