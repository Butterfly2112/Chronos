// controllers/notificationController.js
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { Event } from "../models/Event.js";

// 1. Створити нове нагадування
export const createNotification = async (req, res) => {
    try {
        const { user, event, message, sendAt, method } = req.body;

        const userDoc = await User.findById(user);
        if (!userDoc) {
            return res.status(404).json({ message: "User not found" });
        }

        let eventDoc = null;
        if (event) {
            eventDoc = await Event.findById(event);
            if (!eventDoc) {
                return res.status(404).json({ message: "Event not found" });
            }
        }

        const notification = await Notification.create({
            user,
            event: event || null,
            message,
            sendAt,
            method: method || "in-app",
        });

        return res.status(201).json({
            message: "Notification created successfully",
            notification,
        });
    } catch (error) {
        console.error("Create notification error:", error);
        return res.status(500).json({ message: "Server error while creating notification" });
    }
};

// 2. Отримати всі сповіщення користувача
export const getUserNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const notifications = await Notification.find({ user: userId })
            .populate("event", "title startDate")
            .sort({ sendAt: 1 });

        return res.status(200).json(notifications);
    } catch (error) {
        console.error("Get user notifications error:", error);
        return res.status(500).json({ message: "Server error while getting notifications" });
    }
};

// 3. Позначити сповіщення як доставлене
export const markAsDelivered = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findById(id);

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        notification.delivered = true;
        await notification.save();

        return res.status(200).json({
            message: "Notification marked as delivered",
            notification,
        });
    } catch (error) {
        console.error("Mark as delivered error:", error);
        return res.status(500).json({ message: "Server error while updating notification" });
    }
};

// 4. Видалити сповіщення
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findByIdAndDelete(id);

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        return res.status(200).json({ message: "Notification deleted successfully" });
    } catch (error) {
        console.error("Delete notification error:", error);
        return res.status(500).json({ message: "Server error while deleting notification" });
    }
};

// 5. Отримати всі майбутні (активні) нагадування
export const getUpcomingNotifications = async (req, res) => {
    try {
        const now = new Date();
        const notifications = await Notification.find({
            sendAt: { $gte: now },
            delivered: false,
        })
            .populate("user", "username email")
            .populate("event", "title startDate");

        return res.status(200).json(notifications);
    } catch (error) {
        console.error("Get upcoming notifications error:", error);
        return res.status(500).json({ message: "Server error while getting upcoming notifications" });
    }
};

// 6. Створити тестове нагадування (для перевірки Atlas / фронта)
export const createTestNotification = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found for test notification" });
        }

        const notification = await Notification.create({
            user: userId,
            event: null,
            message: "This is a test notification for Chronos!",
            sendAt: new Date(Date.now() + 5 * 60 * 1000),
            method: "in-app",
        });

        return res.status(201).json({
            message: "Test notification created successfully",
            notification,
        });
    } catch (error) {
        console.error("Create test notification error:", error);
        return res.status(500).json({ message: "Server error while creating test notification" });
    }
};
