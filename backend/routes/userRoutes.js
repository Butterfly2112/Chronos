import express from "express";
import {
    registerUser,
    loginUser,
    getUserProfile,
    updateUser,
    deleteUser,
    getSharedCalendars,
    shareCalendar,
} from "../controllers/userController.js";

const router = express.Router();

// Реєстрація / Логін
router.post("/register", registerUser);
router.post("/login", loginUser);

// Профіль користувача
router.get("/profile/:id", getUserProfile);

// Оновлення / Видалення
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

// Спільні календарі
router.get("/:id/shared", getSharedCalendars);
router.post("/:id/share", shareCalendar);

export default router;
