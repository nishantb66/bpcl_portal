import { connectToDB } from "../middleware";
import { ObjectId } from "mongodb";

export async function POST(req) {
  try {
    const db = await connectToDB();
    const complaintData = await req.json();

    // Validate required fields
    if (!complaintData.customerName || !complaintData.complaintDetails) {
      return new Response(
        JSON.stringify({ message: "Missing required fields" }),
        { status: 400 }
      );
    }

    await db.collection("complaints").insertOne({
      ...complaintData,
      petrolPumpLocation: complaintData.petrolPumpLocation || "Not specified",
      action: "Pending", // Add default action
      message: "No action taken yet", // Add default message
      status: "Open",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return new Response(
      JSON.stringify({ message: "Complaint registered successfully" }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving complaint:", error);
    return new Response(
      JSON.stringify({ message: "Failed to register complaint" }),
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const db = await connectToDB();
    const complaints = await db
      .collection("complaints")
      .find({})
      .project({
        _id: 1,
        customerName: 1,
        petrolPumpLocation: 1,
        complaintDetails: 1,
        type: 1,
        urgency: 1,
        status: 1,
        createdAt: 1,
        action: 1, // Add this
        message: 1, // Add this
      })
      .toArray();
    return new Response(JSON.stringify(complaints), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
    });
  }
}

export async function PUT(req) {
  try {
    const db = await connectToDB();
    const { id, status, action, message } = await req.json();

    if (!id || !status) {
      return new Response(
        JSON.stringify({ message: "Missing required fields" }),
        { status: 400 }
      );
    }

    const validStatuses = ["Open", "In Progress", "Resolved", "Ignored"];
    if (!validStatuses.includes(status)) {
      return new Response(JSON.stringify({ message: "Invalid status value" }), {
        status: 400,
      });
    }

    const result = await db
      .collection("complaints")
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { status, action, message, updatedAt: new Date() } }
      );

    if (result.matchedCount === 0) {
      return new Response(JSON.stringify({ message: "Complaint not found" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({ message: "Status updated successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating status:", error);
    return new Response(
      JSON.stringify({ message: "Failed to update status" }),
      { status: 500 }
    );
  }
}
