import { connectToDB } from "../middleware";
import { verify } from "jsonwebtoken";

export async function GET(req) {
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

    const existingLeave = await db.collection("leaves").findOne({
      userEmail: decoded.email,
      status: "Pending",
    });

    if (existingLeave) {
      return new Response(JSON.stringify({ pending: true }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ pending: false }), { status: 200 });
    }
  } catch (error) {
    console.error("Leave status check error:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
    });
  }
}
