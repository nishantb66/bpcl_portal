import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { connectToDB } from "../../middleware";
import dotenv from "dotenv";
dotenv.config();

import { ObjectId } from "mongodb";

export async function GET(req) {
  // Expect query parameter "taskId"
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("taskId");
  if (!taskId) {
    return NextResponse.json(
      { message: "taskId is required" },
      { status: 400 }
    );
  }

  // Authenticate user via token
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  let decoded;
  try {
    decoded = verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  const db = await connectToDB();
  const trackingCollection = db.collection("taskTrackings");
  const trackingDoc = await trackingCollection.findOne({ taskId });
  return NextResponse.json({
    tracking: trackingDoc ? trackingDoc.tracking : [],
  });
}

export async function POST(req) {
  const body = await req.json();
  // First, handle clear-notification requests
  if (body.type === "clear-notification") {
    const { taskId, targetEmail } = body;
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return new Response("Unauthorized", { status: 401 });
    let decoded;
    try {
      decoded = verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return new Response("Token expired", { status: 401 });
    }
    const db = await connectToDB();
    const trackingCollection = db.collection("taskTrackings");
    const currentTime = new Date();
    let update;
    if (targetEmail && targetEmail !== decoded.email) {
      // Leader clears notification for a specific member
      update = {
        "tracking.$.memberNotification": false,
        "tracking.$.updatedAt": currentTime,
      };
      await trackingCollection.updateOne(
        { taskId, "tracking.reporterEmail": targetEmail.toLowerCase() },
        { $set: update }
      );
    } else {
      // Member clears their own notification (clears leaderNotification)
      update = {
        "tracking.$.leaderNotification": false,
        "tracking.$.updatedAt": currentTime,
      };
      await trackingCollection.updateOne(
        { taskId, "tracking.reporterEmail": decoded.email },
        { $set: update }
      );
    }
    return new Response(JSON.stringify({ message: "Notification cleared" }), {
      status: 200,
    });
  }

  // Otherwise, process tracking updates
  try {
    // Authenticate user
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    let decoded;
    try {
      decoded = verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { message: "Session expired, please re-login" },
        { status: 401 }
      );
    }
    const currentUserEmail = decoded.email;

    // Read request body
    const { taskId, report, targetEmail } = body;
    if (!taskId || !report) {
      return NextResponse.json(
        { message: "taskId and report are required" },
        { status: 400 }
      );
    }

    // Determine mode: if targetEmail is provided (and different), assume leader mode.
    let mode = "user";
    let effectiveEmail = currentUserEmail;
    if (targetEmail && targetEmail !== currentUserEmail) {
      const db = await connectToDB();
      const teamsCollection = db.collection("teams");
      const team = await teamsCollection.findOne({
        leaderEmail: currentUserEmail,
      });
      if (!team) {
        return NextResponse.json(
          {
            message:
              "You are not authorized to update tracking for other members",
          },
          { status: 403 }
        );
      }
      const isMember = team.members.some(
        (m) => m.email === targetEmail.toLowerCase()
      );
      if (!isMember) {
        return NextResponse.json(
          { message: "Target user is not a member of your team" },
          { status: 400 }
        );
      }
      mode = "leader";
      effectiveEmail = targetEmail.toLowerCase();
    }

    // Update tracking record
    const db = await connectToDB();
    const trackingCollection = db.collection("taskTrackings");
    let trackingDoc = await trackingCollection.findOne({ taskId });
    const currentTime = new Date();
    const updateData = {};
    if (mode === "user") {
      updateData["tracking.$.userReport"] = report;
      updateData["tracking.$.updatedAt"] = currentTime;
      updateData["tracking.$.memberNotification"] = true; // flag for leader notification
    } else {
      updateData["tracking.$.leaderReport"] = report;
      updateData["tracking.$.updatedAt"] = currentTime;
      updateData["tracking.$.leaderNotification"] = true; // flag for member notification
    }

    if (trackingDoc) {
      const updateResult = await trackingCollection.updateOne(
        { taskId, "tracking.reporterEmail": effectiveEmail },
        { $set: updateData }
      );
      if (updateResult.matchedCount === 0) {
        const newRecord = {
          reporterEmail: effectiveEmail,
          userReport: mode === "user" ? report : "",
          leaderReport: mode === "leader" ? report : "",
          updatedAt: currentTime,
          memberNotification: mode === "user",
          leaderNotification: mode === "leader",
        };
        await trackingCollection.updateOne(
          { taskId },
          { $push: { tracking: newRecord } }
        );
      }
    } else {
      const newDoc = {
        taskId,
        tracking: [
          {
            reporterEmail: effectiveEmail,
            userReport: mode === "user" ? report : "",
            leaderReport: mode === "leader" ? report : "",
            updatedAt: currentTime,
            memberNotification: mode === "user",
            leaderNotification: mode === "leader",
          },
        ],
      };
      await trackingCollection.insertOne(newDoc);
    }

    return NextResponse.json(
      { message: "Tracking report updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Error updating tracking", error: error.message },
      { status: 500 }
    );
  }
}
