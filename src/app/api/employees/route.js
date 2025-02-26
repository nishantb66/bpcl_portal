// src/app/api/employees/route.js
import { connectToDB } from "../middleware";
import { verify } from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    // 1. Check if token is provided
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    // 2. Verify token & role
    let user;
    try {
      user = verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    if (user.role !== "Executive") {
      return NextResponse.json(
        {
          message:
            "Access denied: only Executives can view Employee Directory.",
        },
        { status: 403 }
      );
    }

    // 3. Parse query parameter: ?q=someValue
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    // 4. Connect to DB and search partial match on name or email
    const db = await connectToDB();
    const usersCollection = db.collection("users");

    // Partial match (case-insensitive)
    const regexQuery = new RegExp(query, "i");
    const results = await usersCollection
      .find(
        {
          $or: [
            { name: { $regex: regexQuery } },
            { email: { $regex: regexQuery } },
          ],
        },
        {
          // Exclude password and any sensitive fields
          projection: { password: 0, _id: 0 },
        }
      )
      .limit(10) // limit to 10 matches
      .toArray();

    return NextResponse.json({ employees: results }, { status: 200 });
  } catch (err) {
    console.error("Employee Directory error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
