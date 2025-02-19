import { connectToDB } from "../middleware";
import { verify } from "jsonwebtoken";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // 1. Parse incoming JSON (the entire conversation from the frontend)
    const { messages } = await req.json();

    // 2. Get the token from the Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    const token = authHeader.split(" ")[1];

    // 3. Decode token to get user name (for personalizing AI responses)
    const decoded = verify(token, process.env.JWT_SECRET);
    const userName = decoded.name || "User";

    // 4. Fetch all complaints from DB to use as knowledge base
    const db = await connectToDB();
    const complaints = await db.collection("complaints").find({}).toArray();

    // 5. Construct a system message that includes user name & complaint data
    const systemMessage = `
      You are an AI Complaints Assistant. 
      The user's name is ${userName}.
      The user wants to ask questions about the following complaints data:
      ${JSON.stringify(complaints, null, 2)}

      Please use this data to answer the user's questions. 
      Be concise, helpful, and polite.
    `;

    // 6. Combine system instructions + conversation
    const updatedMessages = [
      { role: "system", content: systemMessage },
      ...messages,
    ];

    // 7. Initialize Groq with your API key
    const groq = new Groq({
      apiKey: process.env.GROQ, // from .env
    });

    // 8. Call the model "deepseek-r1-distill-llama-70b" with streaming
    const chatCompletion = await groq.chat.completions.create({
      messages: updatedMessages,
      model: "llama3-70b-8192",
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: true,
    });

    // 9. Stream the response back to the client
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
    console.error("AI route error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
