import express from "express";
const calendarRouter = express.Router();

import CalendarController from "../controllers/calendarController.js";
const calendarController = new CalendarController();

import { isAuthenticated } from "../middleware/auth.js";

calendarRouter.use(isAuthenticated);

calendarRouter.get("/my", (req, res, next) => {
  calendarController.getUserCalendars(req, res, next);
});

calendarRouter.post("/create", (req, res, next) => {
  calendarController.createCalendar(req, res, next);
});

calendarRouter.get("/:id", (req, res, next) => {
  calendarController.getCalendarById(req, res, next);
});

export default calendarRouter;
