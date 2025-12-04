import cron from "node-cron";
import { Event } from "../models/Event.js";
import EmailService from "../services/emailService.js";

const emailService = new EmailService();

cron.schedule("* * * * *", async () => {
    try {
        const now = new Date();
        const nowMs = now.getTime();
        const in10Ms = nowMs + 10 * 60 * 1000;

        // Лог для дебагу
        console.log(
            "[CRON] now:", now.toISOString(),
            "| window 10min at:", new Date(in10Ms).toISOString()
        );

        // Події, що почнуться через 10 хв
        const upcoming = await Event.find({
            startDate: {
                $gte: new Date(in10Ms - 30000),
                $lte: new Date(in10Ms + 30000)
            }
        }).populate("creator invited");

        console.log("[CRON] upcoming.length =", upcoming.length);

        for (const event of upcoming) {
            const emails = [];

            if (event.creator?.email) emails.push(event.creator.email);
            if (event.invited?.length)
                emails.push(...event.invited.map(u => u.email).filter(Boolean));

            for (const email of emails) {
                await emailService.transporter.sendMail({
                    from: `"Chronos" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject: `Event reminder: ${event.title}`,
                    text: `Your event "${event.title}" starts in 10 minutes.`,
                    html: `
                        <h2>Reminder</h2>
                        <p>Your event "<strong>${event.title}</strong>" starts in <b>10 minutes</b>.</p>
                    `
                });
            }
        }

        // Нагадування типу "reminder" — прямо зараз
        const rightNowEvents = await Event.find({
            type: "reminder",
            startDate: {
                $gte: new Date(nowMs - 30000),
                $lte: new Date(nowMs + 30000)
            }
        }).populate("creator");

        console.log("[CRON] rightNowEvents.length =", rightNowEvents.length);

        for (const ev of rightNowEvents) {
            if (!ev.creator?.email) continue;

            await emailService.transporter.sendMail({
                from: `"Chronos" <${process.env.EMAIL_USER}>`,
                to: ev.creator.email,
                subject: `Reminder: ${ev.title} starts now`,
                text: `Your reminder "${ev.title}" is happening now.`,
                html: `
                    <h2>Your reminder is now</h2>
                    <p><strong>${ev.title}</strong> starts right now.</p>
                `
            });
        }

    } catch (err) {
        console.error("Reminder cron error:", err);
    }
});
