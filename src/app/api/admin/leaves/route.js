import { connectToDB } from "../../middleware";
import { ObjectId } from "mongodb"; // Correct import for ObjectId
import { verify } from "jsonwebtoken";

export async function GET() {
  try {
    const db = await connectToDB();
    const leaves = await db.collection("leaves").find().toArray();
    return Response.json({ leaves });
  } catch (error) {
    return Response.json({ message: "Error fetching leaves" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const db = await connectToDB();
    const { searchParams } = new URL(req.url); // Correct way to parse query params
    const id = searchParams.get("id");

    if (!ObjectId.isValid(id)) {
      return Response.json({ message: "Invalid ID" }, { status: 400 });
    }

    const result = await db
      .collection("leaves")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return Response.json({ message: "Leave not found" }, { status: 404 });
    }

    return Response.json({ message: "Leave deleted successfully" });
  } catch (error) {
    return Response.json({ message: "Error deleting leave" }, { status: 500 });
  }
}
