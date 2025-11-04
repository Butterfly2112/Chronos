import express from "express";
import {
    createNotification,
    getUserNotifications,
    markAsDelivered,
    deleteNotification,
    getUpcomingNotifications,
    createTestNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

// Створити нове нагадування
router.post("/", createNotification);

// Отримати всі сповіщення користувача
router.get("/user/:userId", getUserNotifications);

// Позначити як доставлене
router.put("/:id", markAsDelivered);

// Видалити сповіщення
router.delete("/:id", deleteNotification);

// Майбутні (активні) сповіщення
router.get("/upcoming", getUpcomingNotifications);

// Тестове нагадування
router.post("/test", createTestNotification);

export default router;
