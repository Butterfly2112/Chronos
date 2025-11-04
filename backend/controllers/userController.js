// controllers/userController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Calendar } from "../models/Calendar.js";
import { Event } from "../models/Event.js";

// 1. Реєстрація нового користувача
export const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser)
            return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            email,
            password: hashedPassword,
        });

        const calendar = await Calendar.create({
            name: "Main",
            description: "Default calendar",
            owner: user._id,
            isDefault: true,
            color: "#4E1E4A",
        });

        user.calendars.push(calendar._id);
        await user.save();

        return res.status(201).json({
            message: "User registered successfully",
            user,
        });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ message: "Server error during registration" });
    }
};

// 2. Авторизація користувача
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid)
            return res.status(401).json({ message: "Invalid password" });

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET || "SECRET_KEY",
            { expiresIn: "1d" }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user,
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Server error during login" });
    }
};

// 3. Отримати профіль користувача
export const getUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id)
            .populate("calendars")
            .populate("sharedWithMe");

        if (!user) return res.status(404).json({ message: "User not found" });

        return res.status(200).json(user);
    } catch (error) {
        console.error("Get profile error:", error);
        return res.status(500).json({ message: "Server error while getting profile" });
    }
};

// 4. Оновити дані користувача
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, password } = req.body;

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.username = username || user.username;
        user.email = email || user.email;

        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();
        return res
            .status(200)
            .json({ message: "User updated successfully", user });
    } catch (error) {
        console.error("Update user error:", error);
        return res.status(500).json({ message: "Server error while updating user" });
    }
};

// 5. Видалити користувача
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) return res.status(404).json({ message: "User not found" });

        const userCalendars = await Calendar.find({ owner: id });

        const calendarIds = userCalendars.map((c) => c._id);
        await Event.deleteMany({ calendar: { $in: calendarIds } });

        await Calendar.deleteMany({ owner: id });

        return res
            .status(200)
            .json({ message: "User and related calendars deleted" });
    } catch (error) {
        console.error("Delete user error:", error);
        return res.status(500).json({ message: "Server error while deleting user" });
    }
};

// 6. Календарі, якими поділились з користувачем
export const getSharedCalendars = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).populate("sharedWithMe");

        if (!user) return res.status(404).json({ message: "User not found" });

        return res.status(200).json(user.sharedWithMe);
    } catch (error) {
        console.error("Get shared calendars error:", error);
        return res.status(500).json({ message: "Server error while getting shared calendars" });
    }
};

// 7. Поділитися календарем із користувачем
export const shareCalendar = async (req, res) => {
    try {
        const { id } = req.params;
        const { calendarId } = req.body;

        const user = await User.findById(id);
        const calendar = await Calendar.findById(calendarId);

        if (!user || !calendar)
            return res.status(404).json({ message: "User or calendar not found" });

        const alreadyHasCalendar = user.sharedWithMe.some(
            (calId) => calId.toString() === calendarId.toString()
        );
        if (!alreadyHasCalendar) {
            user.sharedWithMe.push(calendarId);
            await user.save();
        }

        const alreadyMember = calendar.members.some(
            (mId) => mId.toString() === id.toString()
        );
        if (!alreadyMember) {
            calendar.members.push(id);
            await calendar.save();
        }

        return res.status(200).json({ message: "Calendar shared successfully", user });
    } catch (error) {
        console.error("Share calendar error:", error);
        return res.status(500).json({ message: "Server error while sharing calendar" });
    }
};
