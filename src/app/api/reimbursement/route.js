import { verify } from "jsonwebtoken";
import { connectToDB } from "../middleware";
import dotenv from "dotenv";
dotenv.config();

export async function POST(req) {
  try {
    // 1. Verify token from header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ message: "No token provided" }), {
        status: 401,
      });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verify(token, process.env.JWT_SECRET);
    const userEmail = decoded.email;

    // 2. Parse body
    const body = await req.json();
    const { cost, reason, fileData, fileName, fileType } = body;
    if (!cost || !reason || !fileData || !fileType) {
      return new Response(
        JSON.stringify({ message: "Missing required fields" }),
        { status: 400 }
      );
    }

    // 3. Connect to DB
    const db = await connectToDB();
    const reimbursementsCollection = db.collection("reimbursements");

    // 4. Insert new doc (note adminMessage defaults to "")
    await reimbursementsCollection.insertOne({
      email: userEmail,
      cost,
      reason,
      fileData,
      fileName,
      fileType,
      status: "pending",
      adminMessage: "", // <--- Default empty string
      createdAt: new Date(),
    });

    return new Response(
      JSON.stringify({ message: "Reimbursement submitted" }),
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ message: "Error creating reimbursement" }),
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    // 1. Verify token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ message: "No token provided" }), {
        status: 401,
      });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verify(token, process.env.JWT_SECRET);
    const userEmail = decoded.email;

    // 2. Connect to DB
    const db = await connectToDB();
    const reimbursementsCollection = db.collection("reimbursements");

    // 3. Fetch user reimbursements
    const userReimbursements = await reimbursementsCollection
      .find({ email: userEmail })
      .sort({ createdAt: -1 })
      .toArray();

    return new Response(
      JSON.stringify({ reimbursements: userReimbursements }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ message: "Error fetching reimbursements" }),
      { status: 500 }
    );
  }
}
