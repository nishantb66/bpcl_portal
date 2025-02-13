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
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const isValidUsername = (name) => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  return usernameRegex.test(name);
};


const sendOTP = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.APP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Password Reset OTP",
    text: `Your OTP for password reset is: ${otp}`,
  };

  await transporter.sendMail(mailOptions);
};

export async function POST(req) {
  const { type, name, email, password, otp, newPassword } = await req.json();
  const db = await connectToDB();
  const usersCollection = db.collection("users");

  if (type === "forgot-password") {
    if (!email) {
      return new Response(JSON.stringify({ message: "Email is required" }), {
        status: 400,
      });
    }

    const user = await usersCollection.findOne({ email });
    if (!user) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }

    const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    await usersCollection.updateOne({ email }, { $set: { otp: generatedOTP } });

    await sendOTP(email, generatedOTP);

    return new Response(JSON.stringify({ message: "OTP sent to email" }), {
      status: 200,
    });
  }

  if (type === "verify-otp") {
    if (!email || !otp) {
      return new Response(
        JSON.stringify({ message: "Email and OTP are required" }),
        { status: 400 }
      );
    }

    const user = await usersCollection.findOne({ email });
    if (!user || user.otp !== otp) {
      return new Response(JSON.stringify({ message: "Invalid OTP" }), {
        status: 400,
      });
    }

    return new Response(
      JSON.stringify({ message: "OTP verified successfully" }),
      { status: 200 }
    );
  }

  if (type === "reset-password") {
    if (!email || !newPassword) {
      return new Response(
        JSON.stringify({ message: "Email and new password are required" }),
        { status: 400 }
      );
    }

    if (!isValidPassword(newPassword)) {
      return new Response(
        JSON.stringify({ message: "Invalid password format" }),
        { status: 400 }
      );
    }

    const hashedPassword = await hash(newPassword, 10);
    await usersCollection.updateOne(
      { email },
      { $set: { password: hashedPassword, otp: null } }
    );

    return new Response(
      JSON.stringify({ message: "Password reset successfully" }),
      { status: 200 }
    );
  }

  return new Response(JSON.stringify({ message: "Invalid request type" }), {
    status: 400,
  });
}
