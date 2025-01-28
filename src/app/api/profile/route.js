import { connectToDB } from "../middleware";
import { verify } from "jsonwebtoken";

// Token validation helper
const validateToken = (req) => {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    throw new Error("No token provided");
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET);
    return decoded.email;
  } catch (err) {
    throw new Error("Session expired, please Re-login");
  }
};

// Default profile template
const defaultProfile = {
  name: "",
  surname: "",
  email: "",
  joiningDate: "",
  city: "",
  localArea: "",
  previousCompany: "",
  addressLine1: "",
  addressLine2: "",
  designation: "",
  shiftTimings: "",
};

export async function GET(req) {
  try {
    const email = validateToken(req);
    const db = await connectToDB();
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return new Response(
        JSON.stringify({ profile: { ...defaultProfile, email } }),
        { status: 200 }
      );
    }

    return new Response(
      JSON.stringify({
        profile: user.profile || { ...defaultProfile, email },
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: error.message.includes("token") ? 401 : 500,
    });
  }
}

export async function POST(req) {
  try {
    const email = validateToken(req);
    const profileData = await req.json();
    const db = await connectToDB();

    await db.collection("users").updateOne(
      { email },
      {
        $set: {
          profile: { ...profileData, email },
        },
      },
      { upsert: true }
    );

    return new Response(
      JSON.stringify({ message: "Profile saved successfully" }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: error.message.includes("token") ? 401 : 500,
    });
  }
}
