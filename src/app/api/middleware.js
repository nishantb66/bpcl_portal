import { MongoClient } from "mongodb";

let client;

export async function connectToDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
  }
  return client.db();
}
