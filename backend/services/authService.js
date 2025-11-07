import User from "../models/User";
import crypto from "crypto";

class AuthService {
  async register(userData) {
    const { login, username, email, password } = userData;

    const userExists = await User.findOne({
      $or: [{ login }, { email }],
    });

    if (userExists) {
      if (userExists.login === login) throw new Error("Login already in use.");
      throw new Error("Email already in use");
    }

    const emailConfirmationToken = crypto.randomBytes(32).toString("hex");

    const user = await User.create({
      login,
      username,
      email,
      password,
      emailConfirmationToken,
    });

    return this.#getSafeUser(user);
  }

  async login(identifier, password) {
    const user = await User.findOne({
      $or: [{ login: identifier }, { email: identifier.toLowerCase() }],
    });

    if (!user) {
      throw new Error("User with such login or email not found");
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw new Error("Invalid email, login or password");
    }
    if (!user.emailConfirmed) {
      throw new Error("Please confirm your email first");
    }

    return this.#getSafeUser(user);
  }

  async confirmEmail(token) {
    const user = await User.findOne({ emailConfirmationToken: token });

    if (!user) {
      throw new Error("Invalid token or this email already confirmed");
    }

    user.emailConfirmed = true;
    user.emailConfirmationToken = undefined;
    await user.save();

    return { message: "Email confirmed successfully" };
  }

  async getEmailToken(email) {
    const user = await User.findOne({ email: email });
    return user.emailConfirmationToken;
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
