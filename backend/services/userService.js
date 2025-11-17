import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import crypto from "crypto";

class UserService {
  async updateProfile(userId, data) {
    const { username, email } = data;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (email && email !== user.email) {
      const emailExists = await User.findByEmail(email);
      if (emailExists) {
        throw new AppError("Email already in use", 409);
      }
      const newToken = crypto.randomBytes(32).toString("hex");

      user.email = email;
      user.emailConfirmed = false;
      user.emailConfirmationToken = newToken;
    }

    if (username && username !== user.username) {
      user.username = username;
    }

    await user.save();

    return {
      user: this.#getSafeUser(user),
      emailConfirmationToken: user.emailConfirmationToken,
    };
  }

  #getSafeUser(user) {
    return {
      id: user._id,
      login: user.login,
      username: user.username,
      email: user.email,
      profilePicture: user.avatar,
      role: user.role,
      emailConfirmed: user.emailConfirmed,
    };
  }
}

export default UserService;
