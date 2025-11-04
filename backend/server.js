import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { User } from "./models/User.js";
import { Calendar } from "./models/Calendar.js";
import { Event } from "./models/Event.js";
import { Notification } from "./models/Notification.js";

import userRoutes from "./routes/userRoutes.js";
import calendarRoutes from "./routes/calendarRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());

// Підключення до бази
connectDB();

app.use("/api/users", userRoutes);
app.use("/api/calendars", calendarRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/notifications", notificationRoutes);

// Тестовий маршрут
app.get("/", (req, res) => {
    res.send("Chronos backend is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
