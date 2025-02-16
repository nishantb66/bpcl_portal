import { connectToDB } from "../middleware";
import { verify } from "jsonwebtoken";

export async function GET(request) {
  try {
    // Connect to DB
    const db = await connectToDB();
    const meetingRooms = db.collection("meetingRooms");

    // Fetch all rooms
    const rooms = await meetingRooms.find({}).toArray();

    return new Response(JSON.stringify(rooms), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}

export async function POST(request) {
  try {
    // 1. Verify the user’s token to ensure they’re logged in
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ message: "No token provided" }), {
        status: 401,
      });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verify(token, process.env.JWT_SECRET);

    // 2. Parse the incoming form data
    const {
      roomId,
      meetingTime,
      topic,
      department,
      duration,
      numEmployees,
      hostDesignation,
    } = await request.json();

    // 3. Connect to DB
    const db = await connectToDB();
    const meetingRooms = db.collection("meetingRooms");

    // 4. Check if that room is already booked
    const existingBooking = await meetingRooms.findOne({ roomId });
    if (existingBooking && existingBooking.booked) {
      return new Response(
        JSON.stringify({ message: "Room is already booked" }),
        { status: 400 }
      );
    }

    // 5. Insert or update the booking in the DB
    // If you never created the docs for each room beforehand, we can do upsert:
    await meetingRooms.updateOne(
      { roomId },
      {
        $set: {
          roomId,
          booked: true,
          bookingDetails: {
            hostName: decoded.name, // from token
            hostEmail: decoded.email, // from token
            hostDesignation,
            topic,
            department,
            meetingTime,
            duration,
            numEmployees,
          },
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
