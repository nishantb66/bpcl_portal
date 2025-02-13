import { connectToDB } from "../middleware";
import { hash, compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();


// Initialize admin credentials in DB
async function initializeAdmin() {
  const db = await connectToDB();
  const adminCollection = db.collection("admins");

  const existingAdmin = await adminCollection.findOne({
    username: "admin@2025",
  });
  if (!existingAdmin) {
    const hashedPassword = await hash("admin_bpcl2025", 10);
    await adminCollection.insertOne({
      username: "admin@2025",
      password: hashedPassword,
    });
  }
}

export async function POST(req) {
  try {
    await initializeAdmin();

    const { username, password } = await req.json();
    const db = await connectToDB();
    const adminCollection = db.collection("admins");

    const admin = await adminCollection.findOne({ username });
    if (!admin || !(await compare(password, admin.password))) {
      return new Response(JSON.stringify({ message: "Invalid credentials" }), {
        status: 401,
      });
    }

    const token = sign(
      { username: admin.username, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return new Response(
      JSON.stringify({ message: "Login successful", token }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
    });
  }
}
