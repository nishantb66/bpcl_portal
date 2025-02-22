import { NextResponse } from "next/server";
import { connectToDB } from "../../middleware"; // go up 2 directories from /teams/calendar
import { verify } from "jsonwebtoken";
import { ObjectId } from "mongodb";

export async function POST(req) {
  try {
    // 1) Verify token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "No auth token" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // 2) Connect to DB & parse body
    const db = await connectToDB();
    const calendarEvents = db.collection("calendarEvents");

    const body = await req.json();
    const { date, plans, importance } = body; // we won't handle time/associatedPeople here

    if (!date || !plans || !importance) {
      return NextResponse.json(
        { message: "Missing date, plans, or importance" },
        { status: 400 }
      );
    }

    // 3) Insert a new doc for the user
    await calendarEvents.insertOne({
      email: decoded.email, // the user
      date,
      plans,
      time: "", // blank
      importance,
      associatedPeople: [], // blank
      createdAt: new Date(),
    });

    return NextResponse.json(
      { message: "Task added to your calendar!" },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// (Optional) GET if you want to fetch from here
export async function GET(req) {
  try {
    // ...similar logic as your main calendar route, if needed...
    return NextResponse.json(
      { message: "GET not implemented here" },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
