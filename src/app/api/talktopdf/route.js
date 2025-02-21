import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { connectToDB } from "../middleware";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Our new helper from pdf2json
import { extractPdfText } from "../../../utils/extractPdfText";

// If you're using an AI service:
import Groq from "groq-sdk";

// Initialize Groq with your API key
const groq = new Groq({
  apiKey: process.env.GROQ,
});

export async function POST(request) {
  try {
    // 1) Verify JWT
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    let decodedUser;
    try {
      decodedUser = verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2) Connect to DB
    const db = await connectToDB();
    const pdfCollection = db.collection("pdf_texts");

    // 3) Check if file upload or JSON request
    const contentType = request.headers.get("content-type") || "";

    // --- A) File Upload (multipart/form-data) ---
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("pdfFile");

      if (!file || typeof file === "string") {
        return NextResponse.json(
          { message: "No PDF file found in form data" },
          { status: 400 }
        );
      }

      // Convert the uploaded file to a Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Extract text using pdf2json
      const text = await extractPdfText(buffer);

      // Store ONLY the extracted text in MongoDB for this user
      await pdfCollection.updateOne(
        { userEmail: decodedUser.email },
        {
          $set: {
            text,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      return NextResponse.json({
        message: "PDF Uploaded Successfully.",
      });
    }

    // --- B) JSON-based requests (chat or send-email) ---
    const body = await request.json();
    const { type } = body;

    // 1) Chat with PDF text
    if (type === "chat") {
      const { messages, userName, userEmail } = body;
      if (!messages) {
        return NextResponse.json(
          { message: "No messages provided" },
          { status: 400 }
        );
      }

      // Fetch the PDF text from DB for this user
      const doc = await pdfCollection.findOne({ userEmail: decodedUser.email });
      const pdfText = doc?.text || "";

      // Build system prompt for the AI
      const systemPrompt = `You are an AI that can answer questions based on the following PDF text:
${pdfText}

The user's name is ${userName || "Unknown"}. The user's email is ${
        userEmail || "Unknown"
      }. 

Always greet them by name if you like, and respond with relevant info from the PDF.`;

      // Combine system prompt + conversation
      const conversation = [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ];

      // Stream response from Groq
      const chatCompletion = await groq.chat.completions.create({
        messages: conversation,
        model: "llama-3.3-70b-versatile",
        temperature: 1,
        max_completion_tokens: 1024,
        top_p: 1,
        stream: true,
        stop: null,
      });

      // Return streaming response
      const { readable, writable } = new TransformStream();
      (async () => {
        const writer = writable.getWriter();
        for await (const chunk of chatCompletion) {
          const textChunk = chunk.choices[0]?.delta?.content || "";
          const encoder = new TextEncoder();
          await writer.write(encoder.encode(textChunk));
        }
        writer.close();
      })();

      return new Response(readable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    // 2) Send Email with chat history
    if (type === "send-email") {
      const { messages, userEmail } = body;
      if (!messages || !userEmail) {
        return NextResponse.json(
          { message: "No messages or userEmail provided" },
          { status: 400 }
        );
      }

      let textFileContent = "Chat History:\n\n";
      messages.forEach((m) => {
        textFileContent += `${m.role.toUpperCase()}: ${m.content}\n\n`;
      });

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.APP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL,
        to: userEmail,
        subject: "Your PDF Chat History",
        text: "Attached is your PDF chat history in .txt format.",
        attachments: [
          {
            filename: "chat_history.txt",
            content: textFileContent,
          },
        ],
      });

      return NextResponse.json({ message: "Email sent" });
    }

    // If none of the above
    return NextResponse.json(
      { message: "Invalid request type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("talktopdf error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
