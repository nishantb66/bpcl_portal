// src/app/api/calendar/ai/route.js
import { connectToDB } from "../../middleware";
import { verify } from "jsonwebtoken";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // 1. Parse the incoming conversation from the request body
    //    { messages: [...the conversation so far...] }
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { message: "Messages must be an array" },
        { status: 400 }
      );
    }

    // 2. Decode the JWT token from Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    let userEmail = null;
    let userName = "User";
    try {
      const decoded = verify(token, process.env.JWT_SECRET);
      userEmail = decoded.email;
      userName = decoded.name || "User";
    } catch (error) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    // 3. Fetch the user’s calendar data from MongoDB
    const db = await connectToDB();
    const calendarEvents = db.collection("calendarEvents");
    const reminders = await calendarEvents
      .find({ email: userEmail })
      .sort({ date: 1 })
      .toArray();

    // Convert the reminders to a text summary
    const remindersText = reminders
      .map((r) => {
        return `- [${r.importance}] ${new Date(r.date).toDateString()} | ${
          r.plans
        } | time: ${r.time || "N/A"} | people: ${r.associatedPeople || "None"}`;
      })
      .join("\n");

    // 4. Build a system message
    //    We also instruct the AI to refuse if user tries to see another user's data
    const systemMessage = `
You are an AI Calendar Assistant. 
The user's name is ${userName}, and the user's email is ${userEmail}.

You have access to the user's personal calendar data:
${remindersText || "No reminders found for this user."}

If the user tries to request calendar data for another user, you must refuse by saying:
"Due to privacy policy, I cannot disclose other users' calendar data."

Be polite, greet the user by name if possible, and only provide info about ${userEmail}'s calendar.
If you cannot find relevant info, say "I'm not sure."
`;

    // 5. Combine system instructions + user conversation
    const updatedMessages = [
      { role: "system", content: systemMessage },
      ...messages,
    ];

    // 6. Initialize Groq with your API key
    const groq = new Groq({ apiKey: process.env.GROQ });

    // 7. Stream the response from the llama3-70b-8192 model
    const chatCompletion = await groq.chat.completions.create({
      messages: updatedMessages,
      model: "llama3-70b-8192",
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: true,
    });

    // 8. Stream the AI’s response chunk by chunk
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of chatCompletion) {
          const tokenPart = chunk.choices[0]?.delta?.content || "";
          controller.enqueue(encoder.encode(tokenPart));
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Calendar AI chat error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
