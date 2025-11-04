import express from "express";
import {
    createCalendar,
    getUserCalendars,
    getCalendarById,
    updateCalendar,
    deleteCalendar,
    shareCalendar,
    getCalendarMembers,
    addEventToCalendar,
    removeEventFromCalendar,
} from "../controllers/calendarController.js";

const router = express.Router();

// Створити новий календар
router.post("/", createCalendar);

// Отримати всі календарі користувача
router.get("/user/:userId", getUserCalendars);

// Отримати один календар
router.get("/:id", getCalendarById);

// Оновити календар
router.put("/:id", updateCalendar);

// Видалити календар
router.delete("/:id", deleteCalendar);

// Поділитися календарем із користувачем
router.post("/:id/share", shareCalendar);

// Переглянути, з ким поділений календар
router.get("/:id/members", getCalendarMembers);

// Додавання і видалення івентів
router.post("/:id/events", addEventToCalendar);
router.delete("/:id/events", removeEventFromCalendar);

export default router;
