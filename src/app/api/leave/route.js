import { connectToDB } from "../middleware";
import { verify } from "jsonwebtoken";

export async function POST(req) {
  try {
    const db = await connectToDB();
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verify(token, process.env.JWT_SECRET);
    const userEmail = decoded.email;

    const { fromDate, toDate, reason } = await req.json();

    // Validation
    if (!fromDate || !toDate || !reason) {
      return new Response(
        JSON.stringify({ message: "All fields are required" }),
        { status: 400 }
      );
    }

    if (new Date(toDate) < new Date(fromDate)) {
      return new Response(JSON.stringify({ message: "Invalid date range" }), {
        status: 400,
      });
    }

    // Save to database
    await db.collection("leaves").insertOne({
      userEmail,
      name: decoded.name,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      reason,
      status: "Pending",
      createdAt: new Date(),
    });

    return new Response(
      JSON.stringify({ message: "Leave application submitted successfully" }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Leave submission error:", error);
    if (error.name === "JsonWebTokenError") {
      return new Response(JSON.stringify({ message: "Invalid token" }), {
        status: 401,
      });
    }
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
    });
  }
}
