import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { connectToDB } from "../../middleware";
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

    const { email } = decoded;
    const db = await connectToDB();
    const teamsCollection = db.collection("teams");

    const body = await req.json();
    const { type } = body;

    // 1) CREATE A NEW CHECKPOINT
    //    => type === "create-checkpoint", { name: string }
    if (type === "create-checkpoint") {
      const { name } = body;
      if (!name || !name.trim()) {
        return NextResponse.json(
          { message: "Checkpoint name is required." },
          { status: 400 }
        );
      }

      // Must be leader or cap
      const team = await teamsCollection.findOne({
        $or: [
          { leaderEmail: email },
          { "members.email": email, "members.canAddMembers": true },
        ],
      });
      if (!team) {
        return NextResponse.json(
          { message: "You do not have permission to create checkpoints." },
          { status: 403 }
        );
      }

      const newCheckpoint = {
        _id: new ObjectId(),
        name: name.trim(),
        checks: [],
        updatedAt: new Date(),
      };

      await teamsCollection.updateOne(
        { _id: team._id },
        {
          $push: { checkpoints: newCheckpoint },
          $set: { updatedAt: new Date() },
        }
      );

      return NextResponse.json(
        { message: "Checkpoint created successfully!" },
        { status: 201 }
      );
    }

    // 2) ADD or UPDATE A CHECK
    //    => type === "add-check" or "update-check"
    //    => { checkpointId, checkId (if update), description, done? }
    if (type === "add-check" || type === "update-check") {
      const { checkpointId, checkId, description, done } = body;

      // Must be leader or cap
      const team = await teamsCollection.findOne({
        $or: [
          { leaderEmail: email },
          { "members.email": email, "members.canAddMembers": true },
        ],
      });
      if (!team) {
        return NextResponse.json(
          { message: "You do not have permission to modify checks." },
          { status: 403 }
        );
      }
      if (!checkpointId) {
        return NextResponse.json(
          { message: "checkpointId is required." },
          { status: 400 }
        );
      }

      // If adding a new check
      if (type === "add-check") {
        if (!description || !description.trim()) {
          return NextResponse.json(
            { message: "Description is required." },
            { status: 400 }
          );
        }
        const newCheck = {
          _id: new ObjectId(),
          description: description.trim(),
          done: false,
          // for the toggle-check-done feature, you might also store:
          // doneBy: []
        };

        await teamsCollection.updateOne(
          { _id: team._id, "checkpoints._id": new ObjectId(checkpointId) },
          {
            $push: {
              "checkpoints.$.checks": newCheck,
            },
            $set: { updatedAt: new Date() },
          }
        );

        return NextResponse.json(
          { message: "Check added successfully!" },
          { status: 201 }
        );
      }

      // If updating an existing check
      if (type === "update-check") {
        if (!checkId) {
          return NextResponse.json(
            { message: "checkId is required for update-check." },
            { status: 400 }
          );
        }
        await teamsCollection.updateOne(
          {
            _id: team._id,
            "checkpoints._id": new ObjectId(checkpointId),
            "checkpoints.checks._id": new ObjectId(checkId),
          },
          {
            $set: {
              "checkpoints.$[cp].checks.$[c].description": description || "",
              "checkpoints.$[cp].checks.$[c].done": !!done,
              updatedAt: new Date(),
            },
          },
          {
            arrayFilters: [
              { "cp._id": new ObjectId(checkpointId) },
              { "c._id": new ObjectId(checkId) },
            ],
          }
        );

        return NextResponse.json(
          { message: "Check updated successfully!" },
          { status: 200 }
        );
      }
    }

    // 3) EDIT CHECKPOINT NAME
    //    => type === "update-checkpoint"
    //    => { checkpointId, newName }
    if (type === "update-checkpoint") {
      const { checkpointId, newName } = body;
      if (!checkpointId || !newName) {
        return NextResponse.json(
          { message: "checkpointId and newName are required." },
          { status: 400 }
        );
      }

      // leader or cap
      const team = await teamsCollection.findOne({
        $or: [
          { leaderEmail: email },
          { "members.email": email, "members.canAddMembers": true },
        ],
      });
      if (!team) {
        return NextResponse.json(
          { message: "No permission to update checkpoint name." },
          { status: 403 }
        );
      }

      await teamsCollection.updateOne(
        {
          _id: team._id,
          "checkpoints._id": new ObjectId(checkpointId),
        },
        {
          $set: {
            "checkpoints.$.name": newName.trim(),
            "checkpoints.$.updatedAt": new Date(),
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json(
        { message: "Checkpoint name updated!" },
        { status: 200 }
      );
    }

    // 4) DELETE A CHECKPOINT
    //    => type === "delete-checkpoint"
    //    => { checkpointId }
    if (type === "delete-checkpoint") {
      const { checkpointId } = body;
      if (!checkpointId) {
        return NextResponse.json(
          { message: "checkpointId is required." },
          { status: 400 }
        );
      }

      // leader or cap
      const team = await teamsCollection.findOne({
        $or: [
          { leaderEmail: email },
          { "members.email": email, "members.canAddMembers": true },
        ],
      });
      if (!team) {
        return NextResponse.json(
          { message: "No permission to delete checkpoint." },
          { status: 403 }
        );
      }

      await teamsCollection.updateOne(
        { _id: team._id },
        {
          $pull: {
            checkpoints: { _id: new ObjectId(checkpointId) },
          },
          $set: { updatedAt: new Date() },
        }
      );

      return NextResponse.json(
        { message: "Checkpoint deleted successfully!" },
        { status: 200 }
      );
    }

    // 5) TOGGLE CHECK DONE (Multi-user approach)
    //    => type === "toggle-check-done"
    //    => { checkpointId, checkId }
    // This approach stores a `doneBy` array in each check item.
    if (type === "toggle-check-done") {
      const { checkpointId, checkId } = body;
      if (!checkpointId || !checkId) {
        return NextResponse.json(
          { message: "checkpointId and checkId are required." },
          { status: 400 }
        );
      }

      // Any team member can mark themselves done, so just ensure they're in the team
      const team = await teamsCollection.findOne({
        $or: [{ leaderEmail: email }, { "members.email": email }],
      });
      if (!team) {
        return NextResponse.json(
          { message: "You are not in any team." },
          { status: 403 }
        );
      }

      // Find the checkpoint and check
      const checkpoint = team.checkpoints?.find((cp) =>
        cp._id.equals(checkpointId)
      );
      if (!checkpoint) {
        return NextResponse.json(
          { message: "Checkpoint not found." },
          { status: 404 }
        );
      }
      const checkItem = checkpoint.checks?.find((ch) => ch._id.equals(checkId));
      if (!checkItem) {
        return NextResponse.json(
          { message: "Check not found." },
          { status: 404 }
        );
      }

      // We'll store an array doneBy: string[]
      // If the user is in doneBy, remove them; if not, add them
      const userAlreadyDone = checkItem.doneBy?.includes(email);

      // Build the update operator
      const updateOperator = userAlreadyDone
        ? {
            $pull: {
              "checkpoints.$[cp].checks.$[c].doneBy": email,
            },
          }
        : {
            $addToSet: {
              "checkpoints.$[cp].checks.$[c].doneBy": email,
            },
          };

      await teamsCollection.updateOne(
        {
          _id: team._id,
          "checkpoints._id": new ObjectId(checkpointId),
          "checkpoints.checks._id": new ObjectId(checkId),
        },
        {
          ...updateOperator,
          $set: { updatedAt: new Date() },
        },
        {
          arrayFilters: [
            { "cp._id": new ObjectId(checkpointId) },
            { "c._id": new ObjectId(checkId) },
          ],
        }
      );

      return NextResponse.json(
        { message: "Check done status toggled successfully!" },
        { status: 200 }
      );
    }

    // If no matching type
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
    const teamsCollection = db.collection("teams");

    // If 'myCheckpoints=1', list all checkpoints for the user's team
    const myCheckpoints = searchParams.get("myCheckpoints");
    if (myCheckpoints === "1") {
      const team = await teamsCollection.findOne({
        $or: [{ leaderEmail: email }, { "members.email": email }],
      });
      if (!team) {
        return NextResponse.json(
          { message: "You are not in any team" },
          { status: 200 }
        );
      }

      // Return the entire 'checkpoints' array
      // each check item may have doneBy: []
      return NextResponse.json(
        { checkpoints: team.checkpoints || [] },
        {
          status: 200,
        }
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
