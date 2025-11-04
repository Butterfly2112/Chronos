import express from "express";
import {
    createEvent,
    getCalendarEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    inviteUserToEvent,
    getInvitedEvents,
    updateEventStatus,
    repeatEvent,
} from "../controllers/eventController.js";

const router = express.Router();

// Створити нову подію
router.post("/", createEvent);

// Отримати всі події календаря
router.get("/calendar/:calendarId", getCalendarEvents);

// Отримати конкретну подію
router.get("/:id", getEventById);

// Оновити подію
router.put("/:id", updateEvent);

// Видалити подію
router.delete("/:id", deleteEvent);

// Запросити користувача на подію
router.post("/:id/invite", inviteUserToEvent);

// Події, на які користувача запросили
router.get("/invited/:userId", getInvitedEvents);

// Змінити статус завдання
router.patch("/:id/status", updateEventStatus);

// Повторювана подія
router.post("/:id/repeat", repeatEvent);

export default router;
