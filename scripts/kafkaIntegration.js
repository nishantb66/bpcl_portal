// PORTAL/scripts/kafkaIntegration.js

require("dotenv").config(); // If you want to load env variables from .env
const { MongoClient } = require("mongodb");
const { Kafka } = require("kafkajs");
const axios = require("axios");

/**
 * 1. CONNECT TO MONGODB
 */
const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = process.env.MONGODB_DB_NAME;
const COLLECTION_NAME = process.env.MONGODB_COLLECTION;

async function connectToMongoDB() {
  const client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true });
  await client.connect();
  console.log("Connected to MongoDB:", MONGODB_URI);
  return client.db(DATABASE_NAME);
}

/**
 * 2. SET UP KAFKA PRODUCER
 */
const kafka = new Kafka({
  clientId: "my-app",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});
const producer = kafka.producer();

/**
 * 3. SET UP KAFKA CONSUMER
 */
const consumer = kafka.consumer({ groupId: "powerbi-group" });

/**
 * 4. POWER BI PUSH FUNCTION
 *    Adjust the endpoint to match your actual Power BI Streaming Dataset
 */
const POWER_BI_URL = process.env.POWER_BI_URL;

async function pushToPowerBI(data) {
  try {
    // The Power BI REST endpoint expects an array of rows
    // We'll send an array with just one object
    const payload = [data];

    const response = await axios.post(POWER_BI_URL, payload);
    console.log("Data pushed to Power BI:", response.status);
  } catch (error) {
    console.error(
      "Error pushing data to Power BI:",
      error.response?.data || error.message
    );
  }
}

/**
 * 5. FUNCTION TO START EVERYTHING
 */
async function run() {
  try {
    // 5.1 Connect Producer
    await producer.connect();
    console.log("Kafka Producer connected");

    // 5.2 Connect Consumer
    await consumer.connect();
    console.log("Kafka Consumer connected");
    await consumer.subscribe({ topic: "mongo-changes", fromBeginning: false });

    // 5.3 Consumer logic: for each message from Kafka, push to Power BI
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const changeData = JSON.parse(message.value.toString());
        console.log("Received change from Kafka:", changeData);

        // Here we only extract user, answers, and timestamp
        const { user, answers, timestamp } = changeData;

        // Build an object that matches what we want in Power BI
        const dataForPowerBI = {
          userName: user || "Unknown",
          // Convert answers to a string if it's an object, so Power BI can store it in one column
          answers: answers ? JSON.stringify(answers) : "",
          // If timestamp is present, use it; otherwise set a default
          timestamp: timestamp || new Date().toISOString(),
        };

        // Now push this simplified object to Power BI
        await pushToPowerBI(dataForPowerBI);
      },
    });

    // 5.4 Connect to MongoDB and watch changes
    const db = await connectToMongoDB();
    const changeStream = db.collection(COLLECTION_NAME).watch();

    // 5.5 For each change in MongoDB, produce a Kafka message
    changeStream.on("change", async (change) => {
      console.log("Detected MongoDB change:", change);
      try {
        // Flatten the actual document from the change stream
        // Typically, the "fullDocument" contains your user, answers, timestamp
        const doc = change.fullDocument || {};

        // We only want user, answers, and timestamp
        const payloadToKafka = {
          user: doc.user,
          answers: doc.answers,
          timestamp: doc.timestamp,
        };

        await producer.send({
          topic: "mongo-changes",
          messages: [{ value: JSON.stringify(payloadToKafka) }],
        });
        console.log("Change sent to Kafka");
      } catch (err) {
        console.error("Error sending change to Kafka:", err);
      }
    });
  } catch (error) {
    console.error("Error in run():", error);
  }
}

// Start the entire flow
run().catch(console.error);
