import { connectToDB } from "../../middleware";
import { verify } from "jsonwebtoken";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // 1. Get conversation from request
    const { messages } = await req.json();

    // 2. Decode token
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

    // 3. Connect to DB & find docs
    const db = await connectToDB();

    // Find user docs
    const userDocs = await db
      .collection("documents")
      .find({ userEmail })
      .toArray();

    let docTexts = "";
    if (userDocs.length > 0) {
      // Combine all user doc texts
      docTexts = userDocs.map((doc) => doc.text).join("\n\n");
    } else {
      // Use default doc(s)
      const defaultDocs = await db
        .collection("documents")
        .find({ isDefault: true })
        .toArray();
      if (defaultDocs.length > 0) {
        docTexts = defaultDocs.map((doc) => doc.text).join("\n\n");
      } else {
        docTexts = "No default documents found.";
      }
    }

    // 4. Build system instructions with doc text
    const systemMessage = `
      You are a helpful personal AI assistant. 
      The user's name is ${userName}. 
       The user will ask you questions and you have to answer it very accuratly.
       Also the user might guve you content of thier document. 
      Use that content as knowledge base to answer the user's questions based on the content.
      If you don't find relevant info, you can say "I am not sure."
      As the user chats with you, you have to memorise the chats so that you can answer them accurately.
      But when the user tell you to forget the chat, you have to forget the chat.
      You should be excellent at maths, reasoning and answering questions.
      If the user asks you mathamatical and reasoning questions, you have to use your excellent intelligence to answer it so that to avoid mistakes
      Be polite and helpful, greet them by name if possible.
    `;

    // 5. Combine system message + user conversation
    const updatedMessages = [
      { role: "system", content: systemMessage },
      ...messages,
    ];

    // 6. Initialize Groq
    const groq = new Groq({ apiKey: process.env.GROQ });

    // 7. Call the model with streaming
    const chatCompletion = await groq.chat.completions.create({
      messages: updatedMessages,
      model: "llama3-70b-8192",
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: true,
    });

    // 8. Stream back
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
    console.error("AI chat error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


  const handleAddIdea = async () => {
    if (!ideaTitle.trim() || !ideaDescription.trim()) {
      toast.error("Please fill out both fields.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login again.");
      return;
    }

    try {
      const res = await fetch("/api/hackathons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "add-idea",
          ideaTitle,
          ideaDescription,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to add idea.");
        return;
      }
      toast.success(data.message || "Idea added!");
      setIdeaTitle("");
      setIdeaDescription("");
      refreshHackathon();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong adding idea.");
    }
  };
