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

    // Fetch the user’s team
    const userTeam = await teamsCollection.findOne({
      $or: [{ leaderEmail: email }, { "members.email": email }],
    });

    // We’ll decide which tasks to show based on user’s question
    let userTasks = [];

    // If the user specifically asks about "my tasks" or "my assigned tasks",
    // then only fetch tasks where assignedTo.email == user’s email
    if (
      /\bmy tasks\b/i.test(question) ||
      /\bmy assigned tasks\b/i.test(question)
    ) {
      userTasks = await tasksCollection
        .find({
          "assignedTo.email": email,
        })
        .toArray();
    } else if (userTeam) {
      // Otherwise, show tasks that belong to the user’s team
      userTasks = await tasksCollection
        .find({
          teamId: userTeam._id,
        })
        .toArray();
    }

    // Build some context message (system prompt) about the user’s team/tasks
    const systemContext = `
      You have knowledge of the user's team and tasks:
      Team: ${userTeam?.teamName || "No team"}
      Tasks: ${userTasks.map((t) => t.taskName).join(", ") || "None"}
      The user is: ${email}.
      Answer the user's question in a formatted manner and with proper markdown.
      The output you provide should be formatted not always in a whole paragraph.
    `;

    // 4) Call the GROQ AI endpoint
    // Single-turn approach (no streaming in this snippet)
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
