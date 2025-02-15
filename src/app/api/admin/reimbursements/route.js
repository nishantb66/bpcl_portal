import { verify } from "jsonwebtoken";
import { connectToDB } from "../../middleware";
import dotenv from "dotenv";
import { ObjectId } from "mongodb";
dotenv.config();

export async function GET(req) {
  try {
    // Verify admin token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ message: "No token provided" }), {
        status: 401,
      });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verify(token, process.env.JWT_SECRET);
    // (Optionally) check if decoded user is indeed an admin

    // Connect DB
    const db = await connectToDB();
    const reimbursementsCollection = db.collection("reimbursements");

    // Get all reimbursements
    const allReimbursements = await reimbursementsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return new Response(JSON.stringify({ reimbursements: allReimbursements }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}

export async function PUT(req) {
  try {
    // Verify admin token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ message: "No token provided" }), {
        status: 401,
      });
    }
    const token = authHeader.split(" ")[1];
    verify(token, process.env.JWT_SECRET);
    // (Optionally) check if decoded user is indeed an admin

    const { id, status, adminMessage } = await req.json();
    if (!id) {
      return new Response(
        JSON.stringify({ message: "Missing reimbursement ID" }),
        {
          status: 400,
        }
      );
    }

    // Connect DB
    const db = await connectToDB();
    const reimbursementsCollection = db.collection("reimbursements");

    // Update the doc
    const result = await reimbursementsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, adminMessage } }
    );

    if (result.modifiedCount === 0) {
      return new Response(JSON.stringify({ message: "No document updated" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ message: "Reimbursement updated" }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}
