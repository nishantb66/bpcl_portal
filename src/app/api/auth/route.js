import { hash, compare } from "bcrypt";
import { connectToDB } from "../middleware";
import { sign, verify } from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Input validation helpers
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPassword = (password) => {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const isValidUsername = (name) => {
  // 3-30 chars, letters, numbers, underscore, hyphen
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  return usernameRegex.test(name);
};

export async function POST(req) {
  const { type, name, email, password, otp, role, emp_id, token } =
    await req.json();
  const db = await connectToDB();
  const usersCollection = db.collection("users");
  const otpCollection = db.collection("otps");

  // Create TTL index for OTP expiration (10 minutes)
  await otpCollection.createIndex(
    { createdAt: 1 },
    { expireAfterSeconds: 600 }
  );

  // Ensure indexes for uniqueness
  await usersCollection.createIndex({ email: 1 }, { unique: true });
  await usersCollection.createIndex({ name: 1 }, { unique: true });
  await usersCollection.createIndex({ emp_id: 1 }, { unique: true });

  // ---------------------------
  // 1) SIGNUP
  // ---------------------------
  if (type === "signup") {
    if (!name || !email || !password || !role || !emp_id) {
      return new Response(
        JSON.stringify({ message: "All fields are required" }),
        { status: 400 }
      );
    }

    const allowedRoles = [
      "Executive",
      "Staff grade 1",
      "Staff grade 2",
      "Staff grade 3",
    ];
    if (!allowedRoles.includes(role)) {
      return new Response(
        JSON.stringify({ message: "Invalid role selected." }),
        { status: 400 }
      );
    }

    // Validate format of username, email and password
    if (!isValidUsername(name)) {
      return new Response(
        JSON.stringify({
          message:
            "Invalid username format. Use 3-30 characters, letters, numbers, underscore or hyphen",
        }),
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ message: "Invalid email format" }), {
        status: 400,
      });
    }

    if (!isValidPassword(password)) {
      return new Response(
        JSON.stringify({
          message:
            "Password must be at least 8 characters long and contain uppercase, lowercase, number and special character",
        }),
        { status: 400 }
      );
    }

    // Check if user already exists by username, email, or employee id
    const existingUser = await usersCollection.findOne({
      $or: [{ email: email.toLowerCase() }, { name }, { emp_id }],
    });
    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return new Response(
          JSON.stringify({ message: "Email already exists" }),
          { status: 409 }
        );
      } else if (existingUser.name === name) {
        return new Response(
          JSON.stringify({ message: "Username already exists" }),
          { status: 409 }
        );
      } else if (existingUser.emp_id === emp_id) {
        return new Response(
          JSON.stringify({ message: "Employee ID already exists" }),
          { status: 409 }
        );
      }
    }

    // Generate and save OTP along with user data (including role & emp_id)
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await hash(password, 10);

    await otpCollection.insertOne({
      email: email.toLowerCase(),
      otp: generatedOtp,
      purpose: "signup",
      createdAt: new Date(),
      userData: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        emp_id,
      },
    });

    // Send OTP via email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL, pass: process.env.APP_PASS },
    });

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Verify Your Email",
      text: `Your OTP is: ${generatedOtp}`,
    });

    return new Response(JSON.stringify({ message: "OTP sent to email" }), {
      status: 200,
    });
  }

  // ---------------------------
  // 2) VERIFY SIGNUP OTP
  // ---------------------------
  if (type === "verify-signup-otp") {
    const otpDoc = await otpCollection.findOne({
      email: email.toLowerCase(),
      otp,
      purpose: "signup",
    });

    if (!otpDoc) {
      return new Response(JSON.stringify({ message: "Invalid OTP" }), {
        status: 401,
      });
    }

    await usersCollection.insertOne(otpDoc.userData);
    await otpCollection.deleteOne({ _id: otpDoc._id });

    return new Response(JSON.stringify({ message: "Account created" }), {
      status: 201,
    });
  }

  // ---------------------------
  // 3) LOGIN (Single-Session Logic)
  // ---------------------------
  if (type === "login") {
    if (!email || !password) {
      return new Response(JSON.stringify({ message: "Missing fields" }), {
        status: 400,
      });
    }

    // Make sure to compare emails in lowercase
    const user = await usersCollection.findOne({ email: email.toLowerCase() });
    if (!user || !(await compare(password, user.password))) {
      return new Response(
        JSON.stringify({ message: "Invalid email or password" }),
        { status: 401 }
      );
    }

    // Generate new token
    const newToken = sign(
      {
        email: user.email,
        name: user.name,
        role: user.role,
        emp_id: user.emp_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Store new token in DB so old token is invalidated
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { activeToken: newToken } }
    );

    return new Response(
      JSON.stringify({
        message: "Login successful",
        token: newToken,
        name: user.name,
      }),
      { status: 200 }
    );
  }

  // ---------------------------
  // 4) LOGOUT (Invalidate Current Session)
  // ---------------------------
  if (type === "logout") {
    // We expect the client to send the token (stored in localStorage) in the request body
    if (!token) {
      return new Response(JSON.stringify({ message: "No token provided" }), {
        status: 400,
      });
    }

    try {
      // Verify the token to extract user info
      const decoded = verify(token, process.env.JWT_SECRET);
      const { email: userEmail } = decoded;

      // Set activeToken to null (or any invalid value) in DB
      await usersCollection.updateOne(
        { email: userEmail.toLowerCase() },
        { $set: { activeToken: null } }
      );

      return new Response(JSON.stringify({ message: "Logout successful" }), {
        status: 200,
      });
    } catch (error) {
      return new Response(JSON.stringify({ message: "Invalid token" }), {
        status: 401,
      });
    }
  }

  return new Response(JSON.stringify({ message: "Invalid request type" }), {
    status: 400,
  });
}
