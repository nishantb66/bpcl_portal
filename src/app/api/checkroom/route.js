import { connectToDB } from "../middleware";

export async function GET(request) {
  try {
    // 1) Define the complete list of possible rooms
    //    e.g. R1..R25
    const ALL_ROOMS = Array.from({ length: 25 }, (_, i) => `R${i + 1}`);

    // 2) Connect to the DB and fetch all docs from 'meetingRooms'
    const db = await connectToDB();
    const meetingRooms = db.collection("meetingRooms");
    const docs = await meetingRooms.find({}, { roomId: 1 }).toArray();

    // 3) Gather the roomIds that already exist in the collection
    const existingRoomIds = docs.map((doc) => doc.roomId);

    // 4) Filter out any existing rooms from ALL_ROOMS
    //    So we only return rooms that have no doc in the collection
    const available = ALL_ROOMS.filter(
      (roomId) => !existingRoomIds.includes(roomId)
    );

    return new Response(JSON.stringify(available), { status: 200 });
  } catch (err) {
    console.error("checkroom GET error:", err);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}
