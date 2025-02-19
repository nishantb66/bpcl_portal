import { connectToDB } from "../middleware";
import { verify } from "jsonwebtoken";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req) {
  try {
    // 1. Parse the incoming conversation from the request body
    const { messages } = await req.json();

    // 2. Retrieve the JWT token from the Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    const token = authHeader.split(" ")[1];

    // 3. Decode the token to get the user’s email
    const decoded = verify(token, process.env.JWT_SECRET);
    const userEmail = decoded.email;

    // 4. Check the user's latest message for any email mention
    //    If the user tries to request data for a different email, disclaim.
    const userMessage = messages[messages.length - 1]?.content || "";
    const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
    const foundEmail = userMessage.match(emailRegex)?.[0];

    let systemMessage = "";

    if (foundEmail && foundEmail.toLowerCase() !== userEmail.toLowerCase()) {
      // The user is asking for someone else’s data
      systemMessage =
        "Due to privacy policy, I cannot disclose you the leave data of other users.";
    } else {
      // The user is asking about their own email or no email was mentioned
      const db = await connectToDB();
      const leaves = await db
        .collection("leaves")
        .find({ userEmail: userEmail })
        .toArray();

      // Provide the user’s leave data in the system message
      systemMessage = `User's leave data (for ${userEmail}):\n${JSON.stringify(
        leaves,
        null,
        2
      )}\n\nUse this data to answer the user's questions about leaves.`;
    }

    // 5. Construct system instructions + user conversation
    const updatedMessages = [
      {
        role: "system",
        content:
          "You are a helpful assistant that provides details about the user's leaves. If user tries to see other people's data, you must refuse.",
      },
      { role: "system", content: systemMessage },
      ...messages,
    ];

    // 6. Initialize Groq with your API key from .env
    const groq = new Groq({
      apiKey: process.env.GROQ, // Make sure .env has GROQ=your_key
    });

    // 7. Create a streaming chat completion
    const chatCompletion = await groq.chat.completions.create({
      messages: updatedMessages,
      model: "llama-3.3-70b-versatile",
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: true,
    });

    // 8. Stream the AI response back to the client
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
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("AI route error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
