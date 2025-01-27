const bcrypt = require("bcrypt");
const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env" });

async function initializeAdmin() {
  let client;
  try {
    client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db();
    const adminCollection = db.collection("admins");

    // Clear existing admin (optional)
    await adminCollection.deleteMany({});

    // Create new admin
    const hashedPassword = await bcrypt.hash("admin_bpcl2025", 10);
    await adminCollection.insertOne({
      username: "admin@2025",
      password: hashedPassword,
      createdAt: new Date(),
    });

    console.log("Admin credentials initialized successfully");
  } catch (error) {
    console.error("Error initializing admin:", error);
    process.exit(1);
  } finally {
    if (client) await client.close();
  }
}

// Run the initialization
initializeAdmin();
