// dbInit.js
const { MongoClient } = require("mongodb");

async function initializeDB() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db("petrolpump");
    await db.collection("leaves").createIndex({ userEmail: 1 });
    await db.collection("leaves").createIndex({ status: 1 });
    console.log("Database indexes created successfully");
  } catch (error) {
    console.error("Error creating indexes:", error);
  } finally {
    await client.close();
  }
}

initializeDB();
