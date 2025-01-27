import { hash, compare } from "bcrypt";
import { connectToDB } from "../middleware";
import { sign, verify } from "jsonwebtoken";

// Input validation helpers
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPassword = (password) => {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const isValidUsername = (name) => {
  // 3-30 chars, letters, numbers, underscore, hyphen
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  return usernameRegex.test(name);
};

export async function POST(req) {
  const { type, name, email, password } = await req.json();
  const db = await connectToDB();
  const usersCollection = db.collection("users");

  // Ensure indexes for uniqueness
  await usersCollection.createIndex({ "email": 1 }, { unique: true });
  await usersCollection.createIndex({ "name": 1 }, { unique: true });

  if (type === "signup") {
    // Validate input fields
    if (!name || !email || !password) {
      return new Response(JSON.stringify({ 
        message: "All fields are required" 
      }), { status: 400 });
    }

    // Validate format
    if (!isValidUsername(name)) {
      return new Response(JSON.stringify({ 
        message: "Invalid username format. Use 3-30 characters, letters, numbers, underscore or hyphen" 
      }), { status: 400 });
    }

    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ 
        message: "Invalid email format" 
      }), { status: 400 });
    }

    if (!isValidPassword(password)) {
      return new Response(JSON.stringify({ 
        message: "Password must be at least 8 characters long and contain uppercase, lowercase, number and special character" 
      }), { status: 400 });
    }

    try {
      const hashedPassword = await hash(password, 10);
      await usersCollection.insertOne({ 
        name, 
        email: email.toLowerCase(), 
        password: hashedPassword 
      });

      return new Response(JSON.stringify({ 
        message: "Account created successfully" 
      }), { status: 201 });
      
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return new Response(JSON.stringify({ 
          message: `Username already exists` 
        }), { status: 409 });
      }
      throw error;
    }
  }

  if (type === "login") {
    if (!email || !password) {
      return new Response(JSON.stringify({ message: "Missing fields" }), {
        status: 400,
      });
    }

    const user = await usersCollection.findOne({ email });
    if (!user || !(await compare(password, user.password))) {
      return new Response(
        JSON.stringify({ message: "Invalid email or password" }),
        {
          status: 401,
        }
      );
    }

    const token = sign(
      { email: user.email, name: user.name },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    return new Response(
      JSON.stringify({ message: "Login successful", token, name: user.name }),
      {
        status: 200,
      }
    );
  }

  return new Response(JSON.stringify({ message: "Invalid request type" }), {
    status: 400,
  });
}
