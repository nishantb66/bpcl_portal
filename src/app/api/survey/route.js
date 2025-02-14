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

export async function GET(request) {
  try {
    const db = await connectToDB();
    // Fetch from survey_responses instead of surveys
    const surveys = await db.collection("survey_responses").find({}).toArray();
    return new Response(JSON.stringify(surveys), { status: 200 });
  } catch (error) {
    console.error("Error fetching survey data:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
    });
  }
}
