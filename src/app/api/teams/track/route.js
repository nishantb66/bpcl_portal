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

    // Read and validate request body
    const body = await req.json();
    const { taskId, report, targetEmail } = body;
    if (!taskId || !report) {
      return NextResponse.json(
        { message: "taskId and report are required" },
        { status: 400 }
      );
    }

    // Determine mode:
    // - If targetEmail is provided and is different from current user's email, we assume leader mode.
    // - Otherwise, it is a normal member updating their own report.
    let mode = "user";
    let effectiveEmail = currentUserEmail;
    if (targetEmail && targetEmail !== currentUserEmail) {
      // Verify that current user is team leader
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
      // Also check that the target user is a member of this team
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

    // Update tracking record in the "taskTrackings" collection
    const db = await connectToDB();
    const trackingCollection = db.collection("taskTrackings");
    let trackingDoc = await trackingCollection.findOne({ taskId });
    const currentTime = new Date();
    const updateData = {};
    if (mode === "user") {
      updateData["tracking.$.userReport"] = report;
      updateData["tracking.$.updatedAt"] = currentTime;
    } else {
      updateData["tracking.$.leaderReport"] = report;
      updateData["tracking.$.updatedAt"] = currentTime;
    }

    if (trackingDoc) {
      // Try updating an existing record for effectiveEmail
      const updateResult = await trackingCollection.updateOne(
        { taskId, "tracking.reporterEmail": effectiveEmail },
        { $set: updateData }
      );
      if (updateResult.matchedCount === 0) {
        // No existing record; push a new one
        const newRecord = {
          reporterEmail: effectiveEmail,
          userReport: mode === "user" ? report : "",
          leaderReport: mode === "leader" ? report : "",
          updatedAt: currentTime,
        };
        await trackingCollection.updateOne(
          { taskId },
          { $push: { tracking: newRecord } }
        );
      }
    } else {
      // Create a new document for this task
      const newDoc = {
        taskId,
        tracking: [
          {
            reporterEmail: effectiveEmail,
            userReport: mode === "user" ? report : "",
            leaderReport: mode === "leader" ? report : "",
            updatedAt: currentTime,
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
