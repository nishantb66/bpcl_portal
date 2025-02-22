import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { connectToDB } from "../middleware";
import dotenv from "dotenv";
dotenv.config();

export async function POST(req) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { message: "Token expired or invalid" },
        { status: 401 }
      );
    }

    const { email } = decoded; // user’s email from token
    const db = await connectToDB();
    const usersCollection = db.collection("users");
    const teamsCollection = db.collection("teams");

    const body = await req.json();
    const { type, teamName, memberEmail, grantAccess } = body;
    // Also note: we’ll parse additional fields from body if needed

    // 1) CREATE TEAM
    if (type === "create-team") {
      const existingTeam = await teamsCollection.findOne({
        $or: [{ leaderEmail: email }, { "members.email": email }],
      });
      if (existingTeam) {
        return NextResponse.json(
          { message: "You are already in a team." },
          { status: 400 }
        );
      }

      const newTeam = {
        leaderEmail: email,
        teamName: teamName || "Untitled Team",
        members: [],
        // new fields
        teamDescription: "", // default blank
        notice: null, // store a single notice object or null
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await teamsCollection.insertOne(newTeam);
      return NextResponse.json(
        { message: "Team created successfully!", teamId: result.insertedId },
        { status: 201 }
      );
    }

    // 2) ADD MEMBER
    if (type === "add-member") {
      // leader or "cap" can add
      const team = await teamsCollection.findOne({
        $or: [
          { leaderEmail: email },
          { "members.email": email, "members.canAddMembers": true },
        ],
      });
      if (!team) {
        return NextResponse.json(
          { message: "You do not have permission to add members." },
          { status: 400 }
        );
      }

      if (!memberEmail) {
        return NextResponse.json(
          { message: "No memberEmail provided" },
          { status: 400 }
        );
      }

      const userToAdd = await usersCollection.findOne({
        email: memberEmail.toLowerCase(),
      });
      if (!userToAdd) {
        return NextResponse.json(
          { message: "User with that email does not exist." },
          { status: 404 }
        );
      }

      const inSomeTeam = await teamsCollection.findOne({
        $or: [
          { leaderEmail: memberEmail.toLowerCase() },
          { "members.email": memberEmail.toLowerCase() },
        ],
      });
      if (inSomeTeam) {
        return NextResponse.json(
          { message: "This user is already part of a team." },
          { status: 400 }
        );
      }

      await teamsCollection.updateOne(
        { _id: team._id },
        {
          $push: {
            members: {
              email: memberEmail.toLowerCase(),
              invitedAt: new Date(),
              canAddMembers: false, // default
            },
          },
          $set: { updatedAt: new Date() },
        }
      );

      return NextResponse.json(
        { message: "Member added successfully!" },
        { status: 200 }
      );
    }

    // 3) REMOVE MEMBER
    if (type === "remove-member") {
      // leader or "cap" can remove
      const team = await teamsCollection.findOne({
        $or: [
          { leaderEmail: email },
          { "members.email": email, "members.canAddMembers": true },
        ],
      });
      if (!team) {
        return NextResponse.json(
          { message: "You do not have permission to remove members." },
          { status: 400 }
        );
      }

      if (!memberEmail) {
        return NextResponse.json(
          { message: "No memberEmail provided" },
          { status: 400 }
        );
      }

      await teamsCollection.updateOne(
        { _id: team._id },
        {
          $pull: {
            members: { email: memberEmail.toLowerCase() },
          },
          $set: { updatedAt: new Date() },
        }
      );

      return NextResponse.json(
        { message: "Member removed successfully!" },
        { status: 200 }
      );
    }

    // 4) UPDATE MEMBER ACCESS
    if (type === "update-member-access") {
      const team = await teamsCollection.findOne({ leaderEmail: email });
      if (!team) {
        return NextResponse.json(
          { message: "You are not the leader or have no team." },
          { status: 400 }
        );
      }
      if (!memberEmail) {
        return NextResponse.json(
          { message: "No memberEmail provided" },
          { status: 400 }
        );
      }
      if (typeof grantAccess !== "boolean") {
        return NextResponse.json(
          { message: "Missing or invalid 'grantAccess' boolean." },
          { status: 400 }
        );
      }

      await teamsCollection.updateOne(
        { _id: team._id, "members.email": memberEmail.toLowerCase() },
        {
          $set: {
            "members.$.canAddMembers": grantAccess,
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json(
        {
          message: `Member access ${
            grantAccess ? "granted" : "revoked"
          } successfully!`,
        },
        { status: 200 }
      );
    }

    // 5) UPDATE TEAM INFO (Leader only)
    //    => update the teamName and/or teamDescription
    if (type === "update-team-info") {
      // We expect: { teamName, teamDescription }
      const { teamDescription } = body;
      const team = await teamsCollection.findOne({ leaderEmail: email });
      if (!team) {
        return NextResponse.json(
          { message: "You are not the leader or have no team." },
          { status: 400 }
        );
      }

      await teamsCollection.updateOne(
        { _id: team._id },
        {
          $set: {
            teamName: teamName || team.teamName,
            teamDescription: teamDescription ?? team.teamDescription,
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json(
        { message: "Team info updated successfully!" },
        { status: 200 }
      );
    }

    // 6) UPDATE NOTICE (Leader only)
    //    => store or edit a notice object in the doc
    if (type === "update-notice") {
      // We expect: { topic, message, importance }
      const { topic, noticeMessage, importance } = body;
      if (!topic || !noticeMessage || !importance) {
        return NextResponse.json(
          { message: "Missing topic, message, or importance." },
          { status: 400 }
        );
      }

      const team = await teamsCollection.findOne({ leaderEmail: email });
      if (!team) {
        return NextResponse.json(
          { message: "You are not the leader or have no team." },
          { status: 400 }
        );
      }

      // We'll store a single notice object in the 'notice' field
      const newNotice = {
        topic,
        message: noticeMessage,
        importance, // "Low" or "High"
        updatedAt: new Date(),
      };

      await teamsCollection.updateOne(
        { _id: team._id },
        {
          $set: {
            notice: newNotice,
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json(
        { message: "Notice updated successfully!" },
        { status: 200 }
      );
    }

    // If none matched
    return NextResponse.json(
      { message: "Invalid request type" },
      { status: 400 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { message: "Token expired or invalid" },
        { status: 401 }
      );
    }

    const { email } = decoded;
    const db = await connectToDB();
    const usersCollection = db.collection("users");
    const teamsCollection = db.collection("teams");

    // Searching for users
    const searchQuery = searchParams.get("search");
    if (searchQuery !== null) {
      const regex = new RegExp(searchQuery, "i");
      const foundUsers = await usersCollection
        .find(
          {
            $or: [{ name: { $regex: regex } }, { email: { $regex: regex } }],
          },
          { projection: { password: 0 } }
        )
        .limit(10)
        .toArray();

      return NextResponse.json({ users: foundUsers }, { status: 200 });
    }

    // If 'myTeam=1', fetch the user’s team
    const myTeamParam = searchParams.get("myTeam");
    if (myTeamParam === "1") {
      const team = await teamsCollection.findOne({
        $or: [{ leaderEmail: email }, { "members.email": email }],
      });
      if (!team) {
        return NextResponse.json({ inTeam: false }, { status: 200 });
      }

      // Fetch the leader's name
      const leaderDoc = await usersCollection.findOne({
        email: team.leaderEmail,
      });
      const leaderName = leaderDoc?.name || team.leaderEmail;

      // Fetch each member's doc to get their names
      const membersWithNames = await Promise.all(
        team.members.map(async (member) => {
          const memberDoc = await usersCollection.findOne({
            email: member.email,
          });
          return {
            email: member.email,
            name: memberDoc?.name || member.email,
            invitedAt: member.invitedAt,
            canAddMembers: !!member.canAddMembers,
          };
        })
      );

      team.leaderName = leaderName;
      team.members = membersWithNames;

      // We'll return 'notice' and 'teamDescription' too, so everyone sees them
      // The doc might look like: { notice: { topic, message, importance, updatedAt }, teamDescription: "...", ... }
      const isLeader = team.leaderEmail === email;
      return NextResponse.json(
        {
          inTeam: true,
          isLeader,
          team,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: "No valid query provided" },
      { status: 400 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
