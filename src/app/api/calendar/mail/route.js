export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { connectToDB } from "../../middleware";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

/**
 * parseDateTime: converts the stored date and "time" (HH:MM in 24-hour format)
 * into a local JavaScript Date.
 */
function parseDateTime(eventDate, eventTime) {
  if (!eventTime) return null;

  // Convert eventDate (e.g. "2025-03-16T00:00:00.000Z" or a local date string)
  const rawDate = new Date(eventDate);
  if (isNaN(rawDate.getTime())) {
    console.log("Invalid date:", eventDate);
    return null;
  }
  const year = rawDate.getFullYear();
  const month = rawDate.getMonth(); // 0-based
  const day = rawDate.getDate();

  // "time" is expected as "HH:MM" in 24-hour format
  const [hourStr, minuteStr] = eventTime.split(":");
  if (!hourStr || !minuteStr) return null;

  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  return new Date(year, month, day, hour, minute, 0, 0);
}

// Create a nodemailer transporter using credentials from .env
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL, // e.g. "simplearticle1@gmail.com"
    pass: process.env.APP_PASS, // e.g. "boxz mqzw jkvs qtgn"
  },
});

/**
 * sendReminderEmail: sends an email reminder for the given event.
 */
async function sendReminderEmail(userEmail, event) {
  const { plans, time, date } = event;
  const subject = `Reminder: "${plans}" is scheduled now!`;
  const textBody = `
Hello,

This is your reminder for "${plans}" scheduled at ${time} on ${new Date(
    date
  ).toDateString()}.

Regards,
Portal Notification
  `;
  try {
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: userEmail,
      subject,
      text: textBody,
    });
    console.log("Email sent to:", userEmail, "for event:", plans);
  } catch (err) {
    console.error("Error sending mail:", err);
  }
}

/**
 * GET handler: This route is intended to be invoked by a scheduled cron job.
 * It first checks for a valid secret, then processes all calendar events
 * (across all users) that have not been emailed yet.
 */
export async function GET(req) {
  // Verify the CRON_SECRET via a query parameter
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Connect to your database and get the calendarEvents collection
  let db, calendarEvents;
  try {
    db = await connectToDB();
    calendarEvents = db.collection("calendarEvents");
  } catch (err) {
    return new Response(JSON.stringify({ message: "DB connection failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Get all events that haven't been emailed yet
    const events = await calendarEvents.find({ emailed: false }).toArray();
    const now = new Date();
    for (const ev of events) {
      const eventDateTime = parseDateTime(ev.date, ev.time);
      if (!eventDateTime) continue;
      const diffMs = eventDateTime - now;
      // If the event time is within the next 60 seconds (0 to 60,000 ms),
      // consider it "due" and send the email.
      if (diffMs <= 60000 && diffMs >= 0) {
        await sendReminderEmail(ev.email, ev);
        await calendarEvents.updateOne(
          { _id: ev._id },
          { $set: { emailed: true } }
        );
      }
    }
    return new Response(
      JSON.stringify({ message: "Mail reminders processed" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error processing mail reminders:", err);
    return new Response(JSON.stringify({ message: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
