// src/app/api/redis/route.js

import { NextResponse } from "next/server";
import { getRedisClient } from "../../../utils/redis";


export async function GET() {
  try {
    const client = await getRedisClient();

    // Example: set a value
    await client.set("hello", "world");

    // Example: get the value
    const value = await client.get("hello");

    return NextResponse.json({ message: `Redis says: ${value}` });
  } catch (error) {
    console.error("Redis route error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
