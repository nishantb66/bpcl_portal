import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { connectToDB } from "../../middleware";
import dotenv from "dotenv";
dotenv.config();

import { ObjectId } from "mongodb";

export async function GET(req) {
  // This GET might be your normal "GET /api/teams/track?taskId=..."
  // returning the tracking array. (No SSE here, just a normal fetch.)
  // ---------------------------------------------------------------
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("taskId");
  if (!taskId) {
    return NextResponse.json(
      { message: "taskId is required" },
      { status: 400 }
    );
  }

  // Authenticate user
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
  // 1) Check if this is a "clear-notification" request
  const body = await req.json();
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

    // Leader can clear for a member, or a member can clear for themselves
    if (targetEmail && targetEmail !== decoded.email) {
      // Leader clearing the memberNotification
      await trackingCollection.updateOne(
        { taskId, "tracking.reporterEmail": targetEmail.toLowerCase() },
        {
          $set: {
            "tracking.$.memberNotification": false,
            "tracking.$.updatedAt": currentTime,
          },
        }
      );
    } else {
      // A normal user clearing the leaderNotification
      await trackingCollection.updateOne(
        { taskId, "tracking.reporterEmail": decoded.email },
        {
          $set: {
            "tracking.$.leaderNotification": false,
            "tracking.$.updatedAt": currentTime,
          },
        }
      );
    }
    return new Response(JSON.stringify({ message: "Notification cleared" }), {
      status: 200,
    });
  }

  // 2) Otherwise, handle normal "update" logic
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
    const db = await connectToDB();
    const trackingCollection = db.collection("taskTrackings");

    // Destructure from body
    const { taskId, report, targetEmail } = body;
    if (!taskId || !report) {
      return NextResponse.json(
        { message: "taskId and report are required" },
        { status: 400 }
      );
    }

    // Determine if "user" or "leader" mode
    let mode = "user";
    let effectiveEmail = currentUserEmail;

    if (targetEmail && targetEmail !== currentUserEmail) {
      // => leader updating a specific member’s record
      const teamsCollection = db.collection("teams");
      const team = await teamsCollection.findOne({
        leaderEmail: currentUserEmail,
      });
      if (!team) {
        return NextResponse.json(
          { message: "You are not authorized to update other members" },
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

    // Grab or create doc
    let trackingDoc = await trackingCollection.findOne({ taskId });
    const currentTime = new Date();

    // Prepare update
    const updateData = {};

    if (mode === "user") {
      // normal user writing
      updateData["tracking.$.userReport"] = report;
      updateData["tracking.$.updatedAt"] = currentTime;
      // Leader should see a notification => set memberNotification
      updateData["tracking.$.memberNotification"] = true;
    } else {
      // leader writing
      updateData["tracking.$.leaderReport"] = report;
      updateData["tracking.$.updatedAt"] = currentTime;
      // The member sees a notification => set leaderNotification
      updateData["tracking.$.leaderNotification"] = true;
    }

    if (trackingDoc) {
      // Try to update existing record for effectiveEmail
      const updateResult = await trackingCollection.updateOne(
        { taskId, "tracking.reporterEmail": effectiveEmail },
        { $set: updateData }
      );
      if (updateResult.matchedCount === 0) {
        // No existing record => push a new one
        const newRecord = {
          reporterEmail: effectiveEmail,
          userReport: mode === "user" ? report : "",
          leaderReport: mode === "leader" ? report : "",
          updatedAt: currentTime,
          memberNotification: mode === "user" ? true : false,
          leaderNotification: mode === "leader" ? true : false,
        };
        await trackingCollection.updateOne(
          { taskId },
          { $push: { tracking: newRecord } }
        );
      }
    } else {
      // Create a brand new doc
      const newDoc = {
        taskId,
        tracking: [
          {
            reporterEmail: effectiveEmail,
            userReport: mode === "user" ? report : "",
            leaderReport: mode === "leader" ? report : "",
            updatedAt: currentTime,
            memberNotification: mode === "user" ? true : false,
            leaderNotification: mode === "leader" ? true : false,
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
    console.error("Error in track POST:", error);
    return NextResponse.json(
      { message: "Error updating tracking", error: error.message },
      { status: 500 }
    );
  }
}
