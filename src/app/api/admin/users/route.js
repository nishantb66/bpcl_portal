import { connectToDB } from "../../middleware";
import { verify } from "jsonwebtoken";

export async function GET(req) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    // Verify admin token
    const decoded = verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    const db = await connectToDB();
    const users = await db.collection("users").find({}).toArray();

    return new Response(JSON.stringify({ users }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
    });
  }
}

export async function DELETE(req) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    // Verify admin token
    const decoded = verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    const { email } = await req.json();
    const db = await connectToDB();

    await db.collection("users").deleteOne({ email });

    return new Response(
      JSON.stringify({ message: "User deleted successfully" }),
      {
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
    });
  }
}
