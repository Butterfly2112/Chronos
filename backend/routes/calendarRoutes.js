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

calendarRouter.post("/:id/share", (req, res, next) => {
  calendarController.shareCalendar(req, res, next);
});

calendarRouter.post("/:id/unshare", (req, res, next) => {
  calendarController.unshareCalendar(req, res, next);
});

calendarRouter.get("/:id/members", (req, res, next) => {
  calendarController.getSharedUsersOfCalendar(req, res, next);
});

calendarRouter.get("/:id", (req, res, next) => {
  calendarController.getCalendarById(req, res, next);
});

calendarRouter.put("/:id", (req, res, next) => {
  calendarController.updateCalendar(req, res, next);
});

calendarRouter.delete("/:id", (req, res, next) => {
  calendarController.deleteCalendar(req, res, next);
});

calendarRouter.get('/regional/countries', (req, res, next) => 
  calendarController.getAvailableCountries(req, res, next)
);

calendarRouter.post('/regional/set-country', (req, res, next) => 
  calendarController.setRegionalCountry(req, res, next)
);

calendarRouter.get('/regional/current-country', (req, res, next) => 
  calendarController.getCurrentCountry(req, res, next)
);

export default calendarRouter;
