import { connectToDB } from "../middleware";
import { verify } from "jsonwebtoken";

export async function GET(request) {
  try {
    const db = await connectToDB();
    const meetingRooms = db.collection("meetingRooms");

    // Ensure TTL index is created (for auto-deletion after meetingEnd)
    await meetingRooms.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });

    const rooms = await meetingRooms.find({}).toArray();
    return new Response(JSON.stringify(rooms), { status: 200 });
  } catch (error) {
    console.error("GET error:", error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}

export async function POST(request) {
  try {
    // 1. Verify token
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ message: "No token provided" }), {
        status: 401,
      });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verify(token, process.env.JWT_SECRET);

    // 2. Parse incoming data
    const {
      roomId,
      meetingStart, // ISO string, e.g. "2025-02-16T08:12:00.000Z"
      meetingEnd, // ISO string, e.g. "2025-02-16T09:12:00.000Z"
      topic,
      department,
      numEmployees,
      hostDesignation,
    } = await request.json();

    const startDate = new Date(meetingStart);
    const endDate = new Date(meetingEnd);

    if (endDate <= startDate) {
      return new Response(
        JSON.stringify({
          message: "Meeting End Time must be after Start Time",
        }),
        { status: 400 }
      );
    }

    // 3. Connect to DB and ensure TTL index exists
    const db = await connectToDB();
    const meetingRooms = db.collection("meetingRooms");
    await meetingRooms.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });

    // 4. Check if room is already booked
    const existing = await meetingRooms.findOne({ roomId });
    if (existing && existing.booked) {
      return new Response(
        JSON.stringify({ message: "Room is already booked" }),
        { status: 400 }
      );
    }

    // 5. Upsert the booking with UTC times and TTL field
    await meetingRooms.updateOne(
      { roomId },
      {
        $set: {
          roomId,
          booked: true,
          bookingDetails: {
            hostName: decoded.name,
            hostEmail: decoded.email,
            hostDesignation,
            topic,
            department,
            meetingStart: startDate.toISOString(),
            meetingEnd: endDate.toISOString(),
            numEmployees,
          },
          // TTL: Mongo will remove the doc once expireAt is past
          expireAt: endDate,
        },
      },
      { upsert: true }
    );

    return new Response(
      JSON.stringify({ message: "Room booked successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Booking error:", error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}
