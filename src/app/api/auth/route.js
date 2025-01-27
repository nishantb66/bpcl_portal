import { hash, compare } from "bcrypt";
import { connectToDB } from "../middleware";
import { sign } from "jsonwebtoken";

export async function POST(req) {
  const { type, name, email, password } = await req.json();

  // Connect to the database
  const db = await connectToDB();
  const usersCollection = db.collection("users");

  if (type === "signup") {
    // Signup Logic
    if (!name || !email || !password) {
      return new Response(JSON.stringify({ message: "Missing fields" }), {
        status: 400,
      });
    }

    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      return new Response(JSON.stringify({ message: "User already exists" }), {
        status: 409,
      });
    }

    const hashedPassword = await hash(password, 10);

    await usersCollection.insertOne({ name, email, password: hashedPassword });

    return new Response(
      JSON.stringify({ message: "User created successfully" }),
      { status: 201 }
    );
  } else if (type === "login") {
    // Login Logic
    if (!email || !password) {
      return new Response(JSON.stringify({ message: "Missing fields" }), {
        status: 400,
      });
    }

    const user = await usersCollection.findOne({ email });

    if (!user || !(await compare(password, user.password))) {
      return new Response(
        JSON.stringify({ message: "Invalid email or password" }),
        { status: 401 }
      );
    }

    const token = sign(
      { email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return new Response(
      JSON.stringify({ message: "Login successful", token, name: user.name }),
      { status: 200 }
    );
  }

  return new Response(JSON.stringify({ message: "Invalid request type" }), {
    status: 400,
  });
}
