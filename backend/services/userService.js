import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import Calendar from "../models/Calendar.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";

class UserService {
  async updateProfile(userId, data) {
    const { username, email } = data;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
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

  async updateAvatar(userId, avatarPath) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.avatar && user.avatar !== "uploads/default_avatar.svg") {
      const oldAvatarPath = path.join(process.cwd(), user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        try {
          fs.unlinkSync(oldAvatarPath);
        } catch (err) {
          console.error("Failed to delete old avatar:", err);
        }
      }
    }

    user.avatar = avatarPath;
    await user.save();

    return this.#getSafeUser(user);
  }

  async getUserInfo(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    return this.#getSafeUser(user);
  }

  async searchUsers(query) {
    const users = await User.find({
      $or: [
        { login: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
      ],
    }).select("login username email avatar");

    return users.map((user) => ({
      id: user._id.toString(),
      login: user.login,
      username: user.username,
      email: user.email,
      profilePicture: user.avatar,
    }));
  }

  async deleteUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.avatar && user.avatar !== "uploads/default_avatar.svg") {
      const avatarPath = path.join(process.cwd(), user.avatar);
      if (fs.existsSync(avatarPath)) {
        try {
          fs.unlinkSync(avatarPath);
        } catch (err) {
          console.error("Failed to delete avatar:", err);
        }
      }
    }

    await Calendar.deleteMany({ owner: userId });

    await Calendar.updateMany(
      { "sharedWith.user": userId },
      { $pull: { sharedWith: { user: userId } } }
    );

    await User.updateMany(
      { sharedWithMe: { $in: user.calendars } },
      { $pull: { sharedWithMe: { $in: user.calendars } } }
    );

    await user.deleteOne();

    return { message: "User deleted successfully" };
  }

  #getSafeUser(user) {
    return {
      id: user._id,
      login: user.login,
      username: user.username,
      email: user.email,
      profilePicture: user.avatar,
      emailConfirmed: user.emailConfirmed,
    };
  }
}

export default UserService;
