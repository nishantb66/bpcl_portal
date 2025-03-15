import { NextResponse } from "next/server";
import { connectToDB } from "../middleware";
import { verify } from "jsonwebtoken";
import { ObjectId } from "mongodb";

/**
 * GET: Fetch all reminders for the logged-in user.
 */
export async function GET(req) {
  try {
    const db = await connectToDB();
    const calendarEvents = db.collection("calendarEvents");

    // Check token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "No auth token" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verify(token, process.env.JWT_SECRET);

    // Find reminders for that user
    const reminders = await calendarEvents
      .find({ email: decoded.email })
      .sort({ date: 1 })
      .toArray();

    return NextResponse.json({ reminders }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

/**
 * POST: Create a new reminder with a single "time" field.
 */
export async function POST(req) {
  try {
    const db = await connectToDB();
    const calendarEvents = db.collection("calendarEvents");

    // Check token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "No auth token" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verify(token, process.env.JWT_SECRET);

    const body = await req.json();
    const { date, plans, time, importance, associatedPeople } = body;

    if (!date || !time) {
      return NextResponse.json(
        { message: "Date and time are required" },
        { status: 400 }
      );
    }

    // Insert doc, note emailed=false so we only send mail once
    await calendarEvents.insertOne({
      email: decoded.email,
      date,
      plans,
      time, // e.g. "13:30"
      importance,
      associatedPeople,
      createdAt: new Date(),
      emailed: false,
    });

    return NextResponse.json({ message: "Reminder created" }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

/**
 * PUT: Update an existing reminder (replace startTime/endTime with "time").
 */
export async function PUT(req) {
  try {
    const db = await connectToDB();
    const calendarEvents = db.collection("calendarEvents");

    // Check token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "No auth token" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verify(token, process.env.JWT_SECRET);

    const body = await req.json();
    const { _id, date, plans, time, importance, associatedPeople } = body;

    if (!_id) {
      return NextResponse.json(
        { message: "Reminder ID (_id) is required" },
        { status: 400 }
      );
    }

    // If user changes the time or date, reset emailed=false to send again
    const filter = { _id: new ObjectId(_id), email: decoded.email };
    const updateDoc = {
      $set: {
        date,
        plans,
        time,
        importance,
        associatedPeople,
        emailed: false, // so if user changes time, we can re-send
      },
    };

    const result = await calendarEvents.updateOne(filter, updateDoc);
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "No reminder found or you don’t own this reminder" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Reminder updated" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

/**
 * DELETE: Remove a reminder by _id.
 */
export async function DELETE(req) {
  try {
    const db = await connectToDB();
    const calendarEvents = db.collection("calendarEvents");

    // Check token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "No auth token" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verify(token, process.env.JWT_SECRET);

    const body = await req.json();
    const { _id } = body;

    if (!_id) {
      return NextResponse.json(
        { message: "Reminder ID (_id) is required" },
        { status: 400 }
      );
    }

    const filter = { _id: new ObjectId(_id), email: decoded.email };
    const result = await calendarEvents.deleteOne(filter);

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "No reminder found or you don’t own this reminder" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Reminder deleted" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
