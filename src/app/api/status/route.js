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
    const userEmail = decoded.email;

    const leaveApplication = await db.collection("leaves").findOne({
      userEmail,
      status: "Pending",
    });

    return new Response(
      JSON.stringify({
        pending: !!leaveApplication,
        application: leaveApplication,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking leave status:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
    });
  }
}
