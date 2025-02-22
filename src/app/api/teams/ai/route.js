import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { connectToDB } from "../../middleware"; // Adjust if your middleware path differs
import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ });

export async function POST(req) {
  try {
    // 1) Decode the token
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { message: "Token expired or invalid" },
        { status: 401 }
      );
    }

    const { email } = decoded;

    // 2) Parse question from body
    const body = await req.json();
    const { question } = body;
    if (!question || !question.trim()) {
      return NextResponse.json(
        { message: "No question provided." },
        { status: 400 }
      );
    }

    // 3) Connect to DB, gather relevant data for context
    const db = await connectToDB();
    const teamsCollection = db.collection("teams");
    const tasksCollection = db.collection("tasks");

    // Fetch the user’s team(s) or tasks if needed
    const userTeam = await teamsCollection.findOne({
      $or: [{ leaderEmail: email }, { "members.email": email }],
    });

    // Maybe fetch tasks for that team
    let userTasks = [];
    if (userTeam) {
      userTasks = await tasksCollection
        .find({ teamId: userTeam._id })
        .toArray();
    }

    // Build some big context message or system prompt with your team & tasks
    // For a simple example, we’ll just store them in a string:
    const systemContext = `
      You have knowledge of the user's team and tasks:
      Team: ${userTeam?.teamName || "No team"}
      Tasks: ${userTasks.map((t) => t.taskName).join(", ")}
      The user is: ${email}.
    `;

    // 4) Call the GROQ AI endpoint
    // Here’s a simple single-turn approach (no streaming in this snippet)
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemContext },
        { role: "user", content: question },
      ],
      model: "llama3-70b-8192",
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: false,
    });

    // The AI’s text is in completion.choices[0].message.content
    const aiText = completion.choices?.[0]?.message?.content || "No response";

    return NextResponse.json({ aiAnswer: aiText }, { status: 200 });
  } catch (err) {
    console.error("AI Route Error:", err);
    return NextResponse.json(
      { message: "Internal server error in AI route." },
      { status: 500 }
    );
  }
}
