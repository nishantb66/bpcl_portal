// src/app/api/survey/route.js
import { connectToDB } from "../middleware";

export async function POST(request) {
  const db = await connectToDB();
  const collection = db.collection("survey_responses");

  const body = await request.json();

  // Save the survey response with user information
  await collection.insertOne({
    user: body.user, // User's name or ID
    answers: body.answers, // Survey answers
    timestamp: new Date(), // Timestamp of submission
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
