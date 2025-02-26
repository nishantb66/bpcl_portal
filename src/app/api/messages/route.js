// src/app/api/messages/route.js
import { connectToDB } from "../middleware";
import { verify } from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    // Check if token is provided
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    let user;
    try {
      user = verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    // Connect to DB and fetch unread messages for the user (using email as identifier)
    const db = await connectToDB();
    const messagesCollection = db.collection("messages");
    const unreadMessages = await messagesCollection
      .find({ recipient: user.email, read: false })
      .sort({ timestamp: -1 })
      .toArray();

    return NextResponse.json({ messages: unreadMessages }, { status: 200 });
  } catch (err) {
    console.error("Messages GET error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    // Check if token is provided
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    let sender;
    try {
      sender = verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    // Parse the incoming message details
    const { recipient, content } = await req.json();
    if (!recipient || !content) {
      return NextResponse.json(
        { message: "Recipient and content are required." },
        { status: 400 }
      );
    }

    const db = await connectToDB();
    const messagesCollection = db.collection("messages");

    // Create a message document. We use sender's name and email from the token.
    const messageDoc = {
      sender: { name: sender.name, email: sender.email },
      recipient,
      content,
      timestamp: new Date(),
      read: false,
    };

    await messagesCollection.insertOne(messageDoc);

    return NextResponse.json(
      { message: "Message sent successfully" },
      { status: 201 }
    );
  } catch (err) {
    console.error("Messages POST error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    // This endpoint marks all unread messages for the authenticated user as read.
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    let user;
    try {
      user = verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const db = await connectToDB();
    const messagesCollection = db.collection("messages");

    // Update all unread messages for this recipient to be read
    const updateResult = await messagesCollection.updateMany(
      { recipient: user.email, read: false },
      { $set: { read: true } }
    );

    return NextResponse.json(
      {
        message: "Messages marked as read",
        updatedCount: updateResult.modifiedCount,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Messages PATCH error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
