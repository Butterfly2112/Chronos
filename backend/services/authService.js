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

  async getByEmail(email) {
    const user = await User.findByEmail(email);
    return user;
  }

  #getSafeUser(user) {
    return {
      id: user._id,
      login: user.login,
      username: user.username,
      email: user.email,
      profilePicture: user.avatar,
      role: user.role,
    };
  }
}

export default AuthService;
