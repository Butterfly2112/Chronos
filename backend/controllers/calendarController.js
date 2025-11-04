// controllers/calendarController.js
import { Calendar } from "../models/Calendar.js";
import { User } from "../models/User.js";
import { Event } from "../models/Event.js";

// 1. Створити новий календар
export const createCalendar = async (req, res) => {
    try {
        const { name, description, color, owner } = req.body;

        const user = await User.findById(owner);
        if (!user) return res.status(404).json({ message: "User not found" });

        const calendar = await Calendar.create({
            name,
            description,
            color: color || "#C9ABC3",
            owner: user._id,
        });

        user.calendars.push(calendar._id);
        await user.save();

        return res.status(201).json({
            message: "Calendar created successfully",
            calendar,
        });
    } catch (error) {
        console.error("Create calendar error:", error);
        return res.status(500).json({ message: "Server error while creating calendar" });
    }
};

// 2. Отримати всі календарі користувача
export const getUserCalendars = async (req, res) => {
    try {
        const { userId } = req.params;
        const calendars = await Calendar.find({ owner: userId }).populate("members", "username email");
        return res.status(200).json(calendars);
    } catch (error) {
        console.error("Get user calendars error:", error);
        return res.status(500).json({ message: "Server error while getting calendars" });
    }
};

// 3. Отримати один календар
export const getCalendarById = async (req, res) => {
    try {
        const { id } = req.params;
        const calendar = await Calendar.findById(id)
            .populate("members", "username email")
            .populate({
                path: "events",
                populate: [
                    { path: "creator", select: "username email" },
                    { path: "invited", select: "username email" },
                ],
            });

        if (!calendar) return res.status(404).json({ message: "Calendar not found" });

        return res.status(200).json(calendar);
    } catch (error) {
        console.error("Get calendar by id error:", error);
        return res.status(500).json({ message: "Server error while getting calendar" });
    }
};

// 4. Оновити календар
export const updateCalendar = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, color } = req.body;

        const calendar = await Calendar.findById(id);
        if (!calendar) return res.status(404).json({ message: "Calendar not found" });

        calendar.name = name ?? calendar.name;
        calendar.description = description ?? calendar.description;
        calendar.color = color ?? calendar.color;

        await calendar.save();
        return res.status(200).json({ message: "Calendar updated successfully", calendar });
    } catch (error) {
        console.error("Update calendar error:", error);
        return res.status(500).json({ message: "Server error while updating calendar" });
    }
};

// 5. Видалити календар
export const deleteCalendar = async (req, res) => {
    try {
        const { id } = req.params;

        const calendar = await Calendar.findById(id);
        if (!calendar) return res.status(404).json({ message: "Calendar not found" });

        if (calendar.isDefault) {
            return res.status(400).json({ message: "Default calendar cannot be deleted" });
        }

        await Event.deleteMany({ calendar: id });

        await Calendar.findByIdAndDelete(id);

        await User.updateOne(
            { _id: calendar.owner },
            { $pull: { calendars: calendar._id } }
        );

        return res.status(200).json({ message: "Calendar and related events deleted" });
    } catch (error) {
        console.error("Delete calendar error:", error);
        return res.status(500).json({ message: "Server error while deleting calendar" });
    }
};

// 6. Поділитися календарем із користувачем
export const shareCalendar = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        const calendar = await Calendar.findById(id);
        const user = await User.findById(userId);

        if (!calendar || !user)
            return res.status(404).json({ message: "User or calendar not found" });

        const isAlreadyMember = calendar.members.some(
            (memberId) => memberId.toString() === userId.toString()
        );
        if (!isAlreadyMember) {
            calendar.members.push(userId);
            await calendar.save();
        }

        const isAlreadyShared = user.sharedWithMe?.some(
            (calId) => calId.toString() === id.toString()
        );
        if (!isAlreadyShared) {
            user.sharedWithMe.push(id);
            await user.save();
        }

        return res.status(200).json({ message: "Calendar shared successfully", calendar });
    } catch (error) {
        console.error("Share calendar error:", error);
        return res.status(500).json({ message: "Server error while sharing calendar" });
    }
};

// 7. Переглянути, з ким поділений календар
export const getCalendarMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const calendar = await Calendar.findById(id).populate("members", "username email");

        if (!calendar) return res.status(404).json({ message: "Calendar not found" });

        return res.status(200).json(calendar.members);
    } catch (error) {
        console.error("Get calendar members error:", error);
        return res.status(500).json({ message: "Server error while getting members" });
    }
};

// 8. Додати подію до календаря
export const addEventToCalendar = async (req, res) => {
    try {
        const { id } = req.params;
        const { eventId } = req.body;

        const calendar = await Calendar.findById(id);
        const event = await Event.findById(eventId);

        if (!calendar) return res.status(404).json({ message: "Calendar not found" });
        if (!event) return res.status(404).json({ message: "Event not found" });

        const alreadyInCalendar = calendar.events.some(
            (evId) => evId.toString() === eventId.toString()
        );

        if (!alreadyInCalendar) {
            calendar.events.push(eventId);
            await calendar.save();
        }

        if (!event.calendar || event.calendar.toString() !== id.toString()) {
            event.calendar = id;
            await event.save();
        }

        return res.status(200).json({ message: "Event added to calendar", calendar });
    } catch (error) {
        console.error("Add event to calendar error:", error);
        return res.status(500).json({ message: "Server error while adding event to calendar" });
    }
};

// 9. Видалити подію з календаря
export const removeEventFromCalendar = async (req, res) => {
    try {
        const { id } = req.params;     // calendar id
        const { eventId } = req.body;  // event id

        const calendar = await Calendar.findById(id);
        const event = await Event.findById(eventId);

        if (!calendar) return res.status(404).json({ message: "Calendar not found" });
        if (!event) return res.status(404).json({ message: "Event not found" });

        calendar.events = calendar.events.filter(
            (evId) => evId.toString() !== eventId.toString()
        );
        await calendar.save();

        return res.status(200).json({ message: "Event removed from calendar", calendar });
    } catch (error) {
        console.error("Remove event from calendar error:", error);
        return res.status(500).json({ message: "Server error while removing event from calendar" });
    }
};
