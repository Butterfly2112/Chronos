// controllers/eventController.js
import { Event } from "../models/Event.js";
import { Calendar } from "../models/Calendar.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";

// 1. Створити нову подію
export const createEvent = async (req, res) => {
    try {
        const {
            title,
            description,
            type,
            startDate,
            endDate,
            calendar,
            creator,
            color,
            repeat,
        } = req.body;

        const calendarDoc = await Calendar.findById(calendar);
        if (!calendarDoc) {
            return res.status(404).json({ message: "Calendar not found" });
        }

        const creatorDoc = await User.findById(creator);
        if (!creatorDoc) {
            return res.status(404).json({ message: "Creator (user) not found" });
        }

        const event = await Event.create({
            title,
            description,
            type,
            startDate,
            endDate,
            calendar,
            creator,
            color: color || "#C9ABC3",
            repeat: repeat || "none",
        });

        calendarDoc.events.push(event._id);
        await calendarDoc.save();

        if (type === "reminder") {
            await Notification.create({
                user: creator,
                event: event._id,
                message: `Нагадування: ${title}`,
                sendAt: startDate,
                method: "in-app",
            });
        }

        return res.status(201).json({
            message: "Event created successfully",
            event,
        });
    } catch (error) {
        console.error("Create event error:", error);
        return res.status(500).json({ message: "Server error while creating event" });
    }
};

// 2. Отримати всі події календаря
export const getCalendarEvents = async (req, res) => {
    try {
        const { calendarId } = req.params;
        const events = await Event.find({ calendar: calendarId })
            .populate("creator", "username email")
            .populate("invited", "username email");

        return res.status(200).json(events);
    } catch (error) {
        console.error("Get calendar events error:", error);
        return res.status(500).json({ message: "Server error while getting events" });
    }
};

// 3. Отримати конкретну подію
export const getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await Event.findById(id)
            .populate("creator", "username email")
            .populate("invited", "username email")
            .populate("calendar", "name");

        if (!event) return res.status(404).json({ message: "Event not found" });

        return res.status(200).json(event);
    } catch (error) {
        console.error("Get event by id error:", error);
        return res.status(500).json({ message: "Server error while getting event" });
    }
};

// 4. Оновити подію
export const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            startDate,
            endDate,
            type,
            color,
            status,
            repeat,
        } = req.body;

        const event = await Event.findById(id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        event.title = title ?? event.title;
        event.description = description ?? event.description;
        event.startDate = startDate ?? event.startDate;
        event.endDate = endDate ?? event.endDate;
        event.type = type ?? event.type;
        event.color = color ?? event.color;
        event.status = status ?? event.status;
        event.repeat = repeat ?? event.repeat;

        await event.save();
        return res.status(200).json({ message: "Event updated successfully", event });
    } catch (error) {
        console.error("Update event error:", error);
        return res.status(500).json({ message: "Server error while updating event" });
    }
};

// 5. Видалити подію
export const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await Event.findById(id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        await Calendar.updateOne(
            { _id: event.calendar },
            { $pull: { events: event._id } }
        );

        await Notification.deleteMany({ event: id });

        await Event.findByIdAndDelete(id);

        return res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error("Delete event error:", error);
        return res.status(500).json({ message: "Server error while deleting event" });
    }
};

// 6. Запросити користувача на подію
export const inviteUserToEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        const event = await Event.findById(id);
        const user = await User.findById(userId);

        if (!event || !user)
            return res.status(404).json({ message: "Event or user not found" });

        const alreadyInvited = event.invited.some(
            (invId) => invId.toString() === userId.toString()
        );
        if (!alreadyInvited) {
            event.invited.push(userId);
            await event.save();
        }

        // створити сповіщення
        await Notification.create({
            user: userId,
            event: id,
            message: `Вас запросили на подію "${event.title}"`,
            sendAt: new Date(),
            method: "in-app",
        });

        return res.status(200).json({ message: "User invited successfully", event });
    } catch (error) {
        console.error("Invite user error:", error);
        return res.status(500).json({ message: "Server error while inviting user" });
    }
};

// 7. Події, на які користувача запросили
export const getInvitedEvents = async (req, res) => {
    try {
        const { userId } = req.params;
        const events = await Event.find({ invited: userId })
            .populate("creator", "username email")
            .populate("calendar", "name");

        return res.status(200).json(events);
    } catch (error) {
        console.error("Get invited events error:", error);
        return res.status(500).json({ message: "Server error while getting invited events" });
    }
};

// 8. Змінити статус завдання
export const updateEventStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const event = await Event.findById(id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        if (!["pending", "done", "cancelled"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        event.status = status;
        await event.save();

        return res.status(200).json({ message: "Event status updated", event });
    } catch (error) {
        console.error("Update event status error:", error);
        return res.status(500).json({ message: "Server error while updating status" });
    }
};

// 9. Зробити подію повторюваною
export const repeatEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { repeat } = req.body; // "daily", "weekly", "monthly", "none"

        const event = await Event.findById(id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        if (!["none", "daily", "weekly", "monthly"].includes(repeat)) {
            return res.status(400).json({ message: "Invalid repeat type" });
        }

        event.repeat = repeat;
        await event.save();

        return res.status(200).json({ message: "Repeat setting updated", event });
    } catch (error) {
        console.error("Repeat event error:", error);
        return res.status(500).json({ message: "Server error while updating repeat" });
    }
};
