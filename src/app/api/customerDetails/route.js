import { connectToDB } from "../middleware";

export async function POST(req) {
  try {
    const db = await connectToDB();
    const customerData = await req.json();

    await db.collection("customerDetails").insertOne({
      ...customerData,
      createdAt: new Date(),
    });

    return new Response(
      JSON.stringify({ message: "Customer details saved successfully" }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving customer details:", error);
    return new Response(
      JSON.stringify({ message: "Failed to save customer details" }),
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const db = await connectToDB();
    const customerDetails = await db
      .collection("customerDetails")
      .find({})
      .toArray();
    return new Response(JSON.stringify(customerDetails), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
    });
  }
}
