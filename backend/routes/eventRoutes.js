import express from "express";
const eventRouter = express.Router();

import EventController from "../controllers/eventController.js";
const eventController = new EventController();

import { isAuthenticated } from "../middleware/auth.js";

eventRouter.use(isAuthenticated);

eventRouter.get("/calendar/:calendarId", (req, res, next) => {
    eventController.getCalendarEvents(req, res, next);
});

eventRouter.post("/create", (req, res, next) => {
    eventController.createEvent(req, res, next);
});

eventRouter.put("/:id", (req, res, next) => {
    eventController.updateEvent(req, res, next);
});

eventRouter.delete("/:id", (req, res, next) => {
    eventController.deleteEvent(req, res, next);
});

eventRouter.post("/:id/invite", (req, res, next) => {
    eventController.inviteUser(req, res, next);
});

eventRouter.get("/invited/:userId", (req, res, next) => {
    eventController.getInvitedEvents(req, res, next);
});

eventRouter.patch("/:id/status", (req, res, next) => {
    eventController.updateStatus(req, res, next);
});

eventRouter.post("/:id/repeat", (req, res, next) => {
    eventController.updateRepeat(req, res, next);
});

eventRouter.get("/:id", (req, res, next) => {
    eventController.getEventById(req, res, next);
});

export default eventRouter;
