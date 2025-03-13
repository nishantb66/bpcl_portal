// route.js (SSE handler)
import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { connectToDB } from "../../middleware";
import dotenv from "dotenv";
dotenv.config();

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("taskId");
  const token = searchParams.get("token"); // <-- Get token from query param

  if (!taskId) {
    return new Response("taskId is required", { status: 400 });
  }
  if (!token) {
    return new Response("Unauthorized: missing token", { status: 401 });
  }

  let decoded;
  try {
    decoded = verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return new Response("Token expired or invalid", { status: 401 });
  }

  // Now you have `decoded` with user info
  const userEmail = decoded.email;
  const db = await connectToDB();
  const trackingCollection = db.collection("taskTrackings");

  // Prepare SSE response
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Poll the DB every 5 seconds (just an example)
      const interval = setInterval(async () => {
        let notification = false;
        const trackingDoc = await trackingCollection.findOne({ taskId });
        if (trackingDoc) {
          if (decoded.isLeader) {
            // If user is leader, check if there's any memberNotification
            notification = trackingDoc.tracking.some(
              (r) => r.memberNotification
            );
          } else {
            // If user is normal member, check leaderNotification on their record
            const rec = trackingDoc.tracking.find(
              (r) => r.reporterEmail === userEmail
            );
            notification = rec ? rec.leaderNotification : false;
          }
        }
        const data = JSON.stringify({ notification });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      }, 5000);

      this.interval = interval;
    },
    cancel() {
      clearInterval(this.interval);
    },
  });

  return new Response(stream, { headers });
}
