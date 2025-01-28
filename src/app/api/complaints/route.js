import { connectToDB } from "../middleware";

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
    const complaints = await db.collection("complaints").find({}).toArray();
    return new Response(JSON.stringify(complaints), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
    });
  }
}
