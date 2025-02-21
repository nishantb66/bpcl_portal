import { createClient } from "redis";

let client;

// This function returns a connected Redis client.
// If it's already connected, it just returns it.
export async function getRedisClient() {
  if (!client) {
    client = createClient({
      url: process.env.REDIS_URL, // from your .env
    });

    client.on("error", (err) => {
      console.error("Redis Client Error", err);
    });

    // Connect once
    await client.connect();
  }
  return client;
}
