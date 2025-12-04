import EventService from "../services/eventService.js";
import RegionCalendarService from "../services/regionCalendarService.js";
import AppError from "../utils/AppError.js";

const eventService = new EventService();
const regionCalendarService = new RegionCalendarService();

class EventController {
    // Створити подію
    async createEvent(req, res, next) {
        try {
            const userId = req.session.user.id;
            const data = req.body;

            if (!data.title || !data.type) {
                throw new AppError("Event title and type are required", 400);
            }

            // Регіональні календарі
            if (data.calendarId && regionCalendarService.isRegionalCalendarId(data.calendarId)) {
                throw new AppError("Cannot create events in regional calendars", 403);
            }

            const event = await eventService.createEvent(userId, data);

            res.status(201).json({
                success: true,
                message: "Event created successfully",
                event,
            });
        } catch (error) {
            next(error);
        }
    }

    // Події в конкретному календарі
    async getCalendarEvents(req, res, next) {
        try {
            const { calendarId } = req.params;

            // Регіональні календарі
            if (regionCalendarService.isRegionalCalendarId(calendarId)) {
                const events = await regionCalendarService.getCalendarEvents(calendarId);
                return res.status(200).json({
                    success: true,
                    count: events.length,
                    events,
                });
            }

            const events = await eventService.getCalendarEvents(calendarId);

            res.status(200).json({
                success: true,
                count: events.length,
                events,
            });
        } catch (error) {
            next(error);
        }
    }

    // Конкретна подія
    async getEventById(req, res, next) {
        try {
            const { id } = req.params;

            // Регіональні календарі
            if (regionCalendarService.isRegionalEventId(id)) {
                const event = await regionCalendarService.getEventById(id);
                return res.status(200).json({
                    success: true,
                    event,
                });
            }
            
            const event = await eventService.getEventById(id);

            res.status(200).json({
                success: true,
                event,
            });
        } catch (error) {
            next(error);
        }
    }

    // Оновити подію
    async updateEvent(req, res, next) {
        try {
            const { id } = req.params;
            const updates = req.body;

            // Регіональні календарі
            if (regionCalendarService.isRegionalEventId(id)) {
                throw new AppError("Cannot update regional events", 403);
            }

            const event = await eventService.updateEvent(id, updates);

            res.status(200).json({
                success: true,
                message: "Event updated successfully",
                event,
            });
        } catch (error) {
            next(error);
        }
    }

    // Видалити подію
    async deleteEvent(req, res, next) {
        try {
            const { id } = req.params;

            // Регіональні календарі
            if (regionCalendarService.isRegionalEventId(id)) {
                throw new AppError("Cannot delete regional holiday events", 403);
            }
            
            await eventService.deleteEvent(id);

            res.status(200).json({
                success: true,
                message: "Event deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    // Запросити користувача
    async inviteUser(req, res, next) {
        try {
            const { id } = req.params;
            const { userId } = req.body;

            // Регіональні календарі
            if (regionCalendarService.isRegionalEventId(id)) {
                throw new AppError("Cannot invite users to regional holiday events", 403);
            }

            const event = await eventService.inviteUser(id, userId);

            res.status(200).json({
                success: true,
                message: "User invited successfully",
                event,
            });
        } catch (error) {
            next(error);
        }
    }

    // Події, куди запросили user
    async getInvitedEvents(req, res, next) {
        try {
            const { userId } = req.params;

            const events = await eventService.getInvitedEvents(userId);

            res.status(200).json({
                success: true,
                count: events.length,
                events,
            });
        } catch (error) {
            next(error);
        }
    }

    // Оновити статус
    async updateStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            // Регіональні календарі
            if (regionCalendarService.isRegionalEventId(id)) {
                throw new AppError("Cannot update status of regional holiday events", 403);
            }

            const event = await eventService.updateStatus(id, status);

            res.status(200).json({
                success: true,
                message: "Event status updated",
                event,
            });
        } catch (error) {
            next(error);
        }
    }

    // робити подію повторюваною
    async updateRepeat(req, res, next) {
        try {
            const { id } = req.params;
            const { repeat } = req.body;

            // Регіональні календарі
            if (regionCalendarService.isRegionalEventId(id)) {
                throw new AppError("Cannot change repeat of regional holiday events", 403);
            }

            const event = await eventService.updateRepeat(id, repeat);

            res.status(200).json({
                success: true,
                message: "Repeat updated",
                event,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default EventController;
