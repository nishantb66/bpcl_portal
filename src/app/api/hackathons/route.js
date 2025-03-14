import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { connectToDB } from "../middleware";
import { ObjectId } from "mongodb";
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
      return NextResponse.json({ message: "Session expired" }, { status: 401 });
    }

    const { email } = decoded;
    const db = await connectToDB();
    const teamsCollection = db.collection("teams");
    const hackathonsCollection = db.collection("hackathons");

    const body = await req.json();
    const {
      type,
      topic,
      description,
      startDateTime,
      endDateTime,
      hackathonId,
      ideaTitle,
      ideaDescription,
      ideaId,
    } = body;

    // Find any team where the user is leader
    const leaderTeam = await teamsCollection.findOne({ leaderEmail: email });
    // Find a team where the user is either leader or member
    const userTeam = await teamsCollection.findOne({
      $or: [{ leaderEmail: email }, { "members.email": email }],
    });

    /****************************************
     * CREATE HACKATHON
     ****************************************/
    if (type === "create-hackathon") {
      if (!leaderTeam) {
        return NextResponse.json(
          { message: "You are not a team leader or have no team." },
          { status: 403 }
        );
      }
      // Check if a hackathon already exists for this team
      const existing = await hackathonsCollection.findOne({
        teamId: leaderTeam._id,
      });
      if (existing) {
        return NextResponse.json(
          {
            message:
              "A hackathon already exists for this team. Update or delete the existing one first.",
          },
          { status: 400 }
        );
      }

      // Insert new hackathon
      const hackathonDoc = {
        teamId: leaderTeam._id,
        topic,
        description,
        startDateTime: new Date(
          new Date(startDateTime).getTime() - 5.5 * 60 * 60000
        ),
        endDateTime: new Date(
          new Date(endDateTime).getTime() - 5.5 * 60 * 60000
        ),
        createdAt: new Date(),
        updatedAt: new Date(),
        ideas: [], // array to hold ideas
      };

      const result = await hackathonsCollection.insertOne(hackathonDoc);
      return NextResponse.json(
        {
          message: "Hackathon created successfully!",
          hackathonId: result.insertedId,
        },
        { status: 201 }
      );
    }

    /****************************************
     * UPDATE HACKATHON
     ****************************************/
    if (type === "update-hackathon") {
      if (!leaderTeam) {
        return NextResponse.json(
          { message: "You are not a team leader or have no team." },
          { status: 403 }
        );
      }
      if (!hackathonId) {
        return NextResponse.json(
          { message: "No hackathonId provided" },
          { status: 400 }
        );
      }
      // Update the hackathon document
      await hackathonsCollection.updateOne(
        { _id: new ObjectId(hackathonId), teamId: leaderTeam._id },
        {
          $set: {
            topic,
            description,
            startDateTime: new Date(
              new Date(startDateTime).getTime() - 5.5 * 60 * 60000
            ),
            endDateTime: new Date(
              new Date(endDateTime).getTime() - 5.5 * 60 * 60000
            ),
            updatedAt: new Date(),
          },
        }
      );
      return NextResponse.json(
        { message: "Hackathon updated successfully!" },
        { status: 200 }
      );
    }

    /****************************************
     * DELETE HACKATHON
     ****************************************/
    if (type === "delete-hackathon") {
      if (!leaderTeam) {
        return NextResponse.json(
          { message: "You are not a team leader or have no team." },
          { status: 403 }
        );
      }
      if (!hackathonId) {
        return NextResponse.json(
          { message: "No hackathonId provided" },
          { status: 400 }
        );
      }
      const deleteResult = await hackathonsCollection.deleteOne({
        _id: new ObjectId(hackathonId),
        teamId: leaderTeam._id,
      });
      if (deleteResult.deletedCount === 0) {
        return NextResponse.json(
          { message: "Hackathon not found or already deleted." },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { message: "Hackathon deleted successfully!" },
        { status: 200 }
      );
    }

    /****************************************
     * ADD IDEA
     ****************************************/
    if (type === "add-idea") {
      // User must be in a team (leader or member)
      if (!userTeam) {
        return NextResponse.json(
          { message: "You are not in any team." },
          { status: 403 }
        );
      }
      // Find the hackathon for user's team
      const hackathon = await hackathonsCollection.findOne({
        teamId: userTeam._id,
      });
      if (!hackathon) {
        return NextResponse.json(
          { message: "No hackathon found for your team." },
          { status: 400 }
        );
      }

      if (!ideaTitle || !ideaDescription) {
        return NextResponse.json(
          { message: "Missing ideaTitle or ideaDescription." },
          { status: 400 }
        );
      }

      const newIdea = {
        _id: new ObjectId(),
        authorEmail: email,
        title: ideaTitle.trim(),
        description: ideaDescription.trim(),
        likes: [], // array of user emails who liked
        createdAt: new Date(),
      };

      await hackathonsCollection.updateOne(
        { _id: hackathon._id },
        {
          $push: { ideas: newIdea },
          $set: { updatedAt: new Date() },
        }
      );

      return NextResponse.json(
        { message: "Idea added successfully!" },
        { status: 200 }
      );
    }

    /****************************************
     * LIKE IDEA
     ****************************************/
    if (type === "like-idea") {
      // User must be in a team
      if (!userTeam) {
        return NextResponse.json(
          { message: "You are not in any team." },
          { status: 403 }
        );
      }
      // Find hackathon
      const hackathon = await hackathonsCollection.findOne({
        teamId: userTeam._id,
      });
      if (!hackathon) {
        return NextResponse.json(
          { message: "No hackathon found for your team." },
          { status: 400 }
        );
      }

      if (!ideaId) {
        return NextResponse.json(
          { message: "No ideaId provided." },
          { status: 400 }
        );
      }

      // Find the idea in hackathon.ideas
      const ideaIndex = hackathon.ideas.findIndex(
        (i) => i._id.toString() === ideaId
      );
      if (ideaIndex === -1) {
        return NextResponse.json(
          { message: "Idea not found." },
          { status: 404 }
        );
      }

      const idea = hackathon.ideas[ideaIndex];

      // Ensure user is not the author
      if (idea.authorEmail === email) {
        return NextResponse.json(
          { message: "You cannot like your own idea." },
          { status: 400 }
        );
      }

      // Ensure user hasn't already liked the idea
      if (idea.likes.includes(email)) {
        return NextResponse.json(
          { message: "You have already liked this idea." },
          { status: 400 }
        );
      }

      const updatedLikes = [...idea.likes, email];
      hackathon.ideas[ideaIndex].likes = updatedLikes;

      await hackathonsCollection.updateOne(
        { _id: hackathon._id, "ideas._id": idea._id },
        {
          $set: {
            "ideas.$.likes": updatedLikes,
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json(
        { message: "Idea liked successfully!" },
        { status: 200 }
      );
    }

    // If none matched
    return NextResponse.json(
      { message: "Invalid hackathon request type" },
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
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ message: "Session expired" }, { status: 401 });
    }

    const { email } = decoded;
    const db = await connectToDB();
    const teamsCollection = db.collection("teams");
    const hackathonsCollection = db.collection("hackathons");

    // Check if user is in a team (leader or member)
    const userTeam = await teamsCollection.findOne({
      $or: [{ leaderEmail: email }, { "members.email": email }],
    });
    if (!userTeam) {
      return NextResponse.json({ hackathon: null }, { status: 200 });
    }

    // Return the hackathon for that team, if any
    const hackathon = await hackathonsCollection.findOne({
      teamId: userTeam._id,
    });

    return NextResponse.json({ hackathon }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
