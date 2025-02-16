import { connectToDB } from "../middleware";
import jwt from "jsonwebtoken";

export async function GET(req) {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return new Response(JSON.stringify({ message: "Invalid token" }), {
      status: 401,
    });
  }
  const userEmpId = decoded.emp_id;
  const db = await connectToDB();
  const meetingsCollection = db.collection("meetings");
  const meetings = await meetingsCollection
    .find({
      $or: [{ hostEmpId: userEmpId }, { invitedEmpIds: userEmpId }],
    })
    .toArray();
  return new Response(JSON.stringify({ meetings }), { status: 200 });
}

export async function POST(req) {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return new Response(JSON.stringify({ message: "Invalid token" }), {
      status: 401,
    });
  }
  if (decoded.role !== "Executive") {
    return new Response(JSON.stringify({ message: "Access denied" }), {
      status: 403,
    });
  }
  const {
    startTime,
    endTime,
    department,
    hostName,
    hostDesignation,
    expectedMembers,
    meetingRoom,
  } = await req.json();
  if (
    !startTime ||
    !endTime ||
    !department ||
    !hostName ||
    !hostDesignation ||
    !expectedMembers ||
    !meetingRoom
  ) {
    return new Response(
      JSON.stringify({ message: "All fields are required" }),
      { status: 400 }
    );
  }
  const db = await connectToDB();
  const meetingsCollection = db.collection("meetings");
  const meeting = {
    startTime,
    endTime,
    department,
    hostName,
    hostDesignation,
    expectedMembers,
    meetingRoom,
    hostEmpId: decoded.emp_id,
    invitedEmpIds: [],
  };
  const result = await meetingsCollection.insertOne(meeting);
  if (result.insertedId) {
    return new Response(
      JSON.stringify({ message: "Meeting scheduled", meeting }),
      { status: 201 }
    );
  } else {
    return new Response(
      JSON.stringify({ message: "Failed to schedule meeting" }),
      { status: 500 }
    );
  }
}
