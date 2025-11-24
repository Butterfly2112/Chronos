import { Event } from "../models/Event.js";
import Calendar from "../models/Calendar.js";
import User from "../models/User.js";
import { Notification } from "../models/Notification.js";

import AppError from "../utils/AppError.js";

class EventService {
    // Створити подію
    async createEvent(userId, data) {
        const {
            title,
            description,
            type,
            startDate,
            endDate,
            calendar,
            color,
            repeat,
        } = data;

        if (!calendar) {
            throw new AppError("Calendar ID is required", 400);
        }

        const calendarDoc = await Calendar.findById(calendar);
        if (!calendarDoc) {
            throw new AppError("Calendar not found", 404);
        }

        const hasAccess = this.#checkAccess(calendarDoc, userId);
        if (!hasAccess) {
            throw new AppError("Access denied to this calendar", 403);
        }

        // 1 — створюємо основну подію
        const event = await Event.create({
            title,
            description,
            type,
            startDate,
            endDate,
            calendar,
            creator: userId,
            color: color || "#C9ABC3",
            repeat: repeat || "none",
        });

        calendarDoc.events.push(event._id);
        await calendarDoc.save();

        // 2 — створюємо повтори (DAILY / WEEKLY / MONTHLY)
        if (repeat && repeat !== "none") {
            const start = new Date(startDate);
            const end = new Date(endDate);

            // Сумарно згенеруємо 30 повторів
            for (let i = 1; i <= 30; i++) {
                let newStart = new Date(start);
                let newEnd = new Date(end);

                if (repeat === "daily") {
                    newStart.setDate(start.getDate() + i);
                    newEnd.setDate(end.getDate() + i);
                }

                if (repeat === "weekly") {
                    newStart.setDate(start.getDate() + i * 7);
                    newEnd.setDate(end.getDate() + i * 7);
                }

                if (repeat === "monthly") {
                    newStart.setMonth(start.getMonth() + i);
                    newEnd.setMonth(end.getMonth() + i);
                }

                const repeated = await Event.create({
                    title,
                    description,
                    type,
                    startDate: newStart,
                    endDate: newEnd,
                    calendar,
                    creator: userId,
                    color: color || "#C9ABC3",
                    repeat
                });

                await Calendar.updateOne(
                    { _id: calendar },
                    { $push: { events: repeated._id } }
                );
            }
        }

        // 3 — створюємо нагадування
        if (type === "reminder") {
            await Notification.create({
                user: userId,
                event: event._id,
                message: `Нагадування: ${title}`,
                sendAt: startDate,
                method: "in-app",
            });
        }

        return event;
    }


    // Події календаря
    async getCalendarEvents(calendarId) {
        const events = await Event.find({ calendar: calendarId })
            .populate("creator", "username email")
            .populate("invited", "username email");

        return events;
    }

    // Одна подія
    async getEventById(eventId) {
        const event = await Event.findById(eventId)
            .populate("creator", "username email")
            .populate("invited", "username email")
            .populate("calendar", "name");

        if (!event) throw new AppError("Event not found", 404);

        return event;
    }

    // Оновити подію
    async updateEvent(eventId, updates) {
        const event = await Event.findById(eventId);
        if (!event) throw new AppError("Event not found", 404);

        Object.assign(event, updates);

        await event.save();
        return event;
    }

    // Видалити подію
    async deleteEvent(eventId) {
        const event = await Event.findById(eventId);
        if (!event) throw new AppError("Event not found", 404);

        await Calendar.updateOne(
            { _id: event.calendar },
            { $pull: { events: event._id } }
        );

        await Notification.deleteMany({ event: eventId });

        await Event.findByIdAndDelete(eventId);

        return true;
    }

    // Запросити користувача
    async inviteUser(eventId, userId) {
        const event = await Event.findById(eventId);
        const user = await User.findById(userId);

        if (!event || !user) {
            throw new AppError("Event or user not found", 404);
        }

        const alreadyInvited = event.invited.some(
            (id) => id.toString() === userId.toString()
        );

        if (!alreadyInvited) {
            event.invited.push(userId);
            await event.save();
        }

        await Notification.create({
            user: userId,
            event: eventId,
            message: `Вас запросили на подію "${event.title}"`,
            sendAt: new Date(),
            method: "in-app",
        });

        return event;
    }

    // Події куди запросили користувача
    async getInvitedEvents(userId) {
        const events = await Event.find({ invited: userId })
            .populate("creator", "username email")
            .populate("calendar", "name");

        return events;
    }

    // Статус
    async updateStatus(eventId, status) {
        if (!["pending", "done", "cancelled"].includes(status)) {
            throw new AppError("Invalid status value", 400);
        }

        const event = await Event.findById(eventId);
        if (!event) throw new AppError("Event not found", 404);

        event.status = status;
        await event.save();

        return event;
    }

    // Repeat
    async updateRepeat(eventId, repeat) {
        if (!["none", "daily", "weekly", "monthly"].includes(repeat)) {
            throw new AppError("Invalid repeat type", 400);
        }

        const event = await Event.findById(eventId);
        if (!event) throw new AppError("Event not found", 404);

        event.repeat = repeat;
        await event.save();

        return event;
    }

    // Перевірка доступу
    #checkAccess(calendar, userId) {
        if (calendar.owner.toString() === userId.toString()) return true;

        return calendar.sharedWith?.some(
            (share) => share.user.toString() === userId.toString()
        );
    }
}

export default EventService;
