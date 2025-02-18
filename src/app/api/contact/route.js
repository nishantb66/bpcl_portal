import { connectToDB } from "../middleware";

export async function POST(req) {
  try {
    const { name, email, message } = await req.json();

    // Basic validation
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ message: "All fields are required." }),
        { status: 400 }
      );
    }

    // Connect to DB
    const db = await connectToDB();
    const contactsCollection = db.collection("contacts");

    // Insert the new message
    await contactsCollection.insertOne({
      name,
      email,
      message,
      createdAt: new Date(),
    });

    return new Response(
      JSON.stringify({ message: "Message received successfully." }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving contact message:", error);
    return new Response(
      JSON.stringify({ message: "Failed to send message." }),
      { status: 500 }
    );
  }
}
