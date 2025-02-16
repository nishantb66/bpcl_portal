import { connectToDB } from "../../middleware";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

export async function PUT(req, { params }) {
  const { meetingId } = params;
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

  const db = await connectToDB();
  const meetingsCollection = db.collection("meetings");
  const body = await req.json();

  // If inviteEmpId is provided, update invitedEmpIds array (only host can invite)
  if (body.inviteEmpId) {
    // Check if the provided employee id exists in the users collection
    const usersCollection = db.collection("users");
    const invitedUser = await usersCollection.findOne({
      emp_id: body.inviteEmpId,
    });
    if (!invitedUser) {
      return new Response(
        JSON.stringify({ message: "Employee id not found" }),
        { status: 404 }
      );
    }

    const meeting = await meetingsCollection.findOne({
      _id: new ObjectId(meetingId),
    });
    if (!meeting) {
      return new Response(JSON.stringify({ message: "Meeting not found" }), {
        status: 404,
      });
    }
    if (meeting.hostEmpId !== decoded.emp_id) {
      return new Response(JSON.stringify({ message: "Only host can invite" }), {
        status: 403,
      });
    }
    const result = await meetingsCollection.updateOne(
      { _id: new ObjectId(meetingId) },
      { $addToSet: { invitedEmpIds: body.inviteEmpId } }
    );
    if (result.modifiedCount > 0) {
      return new Response(JSON.stringify({ message: "Invitation sent" }), {
        status: 200,
      });
    } else {
      return new Response(
        JSON.stringify({ message: "Failed to send invitation" }),
        { status: 500 }
      );
    }
  } else {
    // Otherwise, update meeting details (only host can update)
    const {
      startTime,
      endTime,
      department,
      hostName,
      hostDesignation,
      expectedMembers,
      meetingRoom,
    } = body;
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
    const meeting = await meetingsCollection.findOne({
      _id: new ObjectId(meetingId),
    });
    if (!meeting) {
      return new Response(JSON.stringify({ message: "Meeting not found" }), {
        status: 404,
      });
    }
    if (meeting.hostEmpId !== decoded.emp_id) {
      return new Response(
        JSON.stringify({ message: "Only host can update meeting" }),
        { status: 403 }
      );
    }
    const result = await meetingsCollection.updateOne(
      { _id: new ObjectId(meetingId) },
      {
        $set: {
          startTime,
          endTime,
          department,
          hostName,
          hostDesignation,
          expectedMembers,
          meetingRoom,
        },
      }
    );
    if (result.modifiedCount > 0) {
      return new Response(JSON.stringify({ message: "Meeting updated" }), {
        status: 200,
      });
    } else {
      return new Response(JSON.stringify({ message: "No changes made" }), {
        status: 200,
      });
    }
  }
}

export async function DELETE(req, { params }) {
  const { meetingId } = params;
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
  const db = await connectToDB();
  const meetingsCollection = db.collection("meetings");
  const meeting = await meetingsCollection.findOne({
    _id: new ObjectId(meetingId),
  });
  if (!meeting) {
    return new Response(JSON.stringify({ message: "Meeting not found" }), {
      status: 404,
    });
  }
  if (meeting.hostEmpId !== decoded.emp_id) {
    return new Response(
      JSON.stringify({ message: "Only host can delete meeting" }),
      { status: 403 }
    );
  }
  const result = await meetingsCollection.deleteOne({
    _id: new ObjectId(meetingId),
  });
  if (result.deletedCount > 0) {
    return new Response(JSON.stringify({ message: "Meeting deleted" }), {
      status: 200,
    });
  } else {
    return new Response(
      JSON.stringify({ message: "Failed to delete meeting" }),
      { status: 500 }
    );
  }
}
