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
    const tasksCollection = db.collection("tasks");
    const body = await req.json();
    const { type } = body;

    // Task Document structure now includes a discussion field:
    // {
    //   _id: ObjectId,
    //   teamId: ObjectId,
    //   createdBy: string,         // leader's email
    //   taskName: string,
    //   description: string,
    //   deadline: Date,
    //   urgency: 'Low' | 'Medium' | 'High',
    //   assignedTo: [
    //     {
    //       email: string,
    //       status: 'Not Started' | 'In Progress' | 'Done',
    //       updatedAt: Date
    //     }
    //   ],
    //   discussion: [              // For ideas/messages
    //     {
    //       email: string,
    //       name: string,
    //       message: string,
    //       createdAt: Date
    //     }
    //   ],
    //   createdAt: Date,
    //   updatedAt: Date
    // }

    if (type === "create-task") {
      const {
        taskName,
        description,
        deadline,
        urgency,
        assignToAll,
        specificMembers,
      } = body;
      // Verify that the user is a team leader
      const team = await teamsCollection.findOne({ leaderEmail: email });
      if (!team) {
        return NextResponse.json(
          { message: "Only a team leader can create tasks." },
          { status: 403 }
        );
      }
      // Determine which team members to assign the task to
      let assignedMembers = [];
      if (assignToAll) {
        assignedMembers = team.members.map((m) => ({
          email: m.email,
          status: "Not Started",
          updatedAt: new Date(),
        }));
      } else {
        assignedMembers = specificMembers.map((memberEmail) => ({
          email: memberEmail,
          status: "Not Started",
          updatedAt: new Date(),
        }));
      }
      // Create the new task document with an empty discussion array
      const newTask = {
        teamId: team._id,
        createdBy: email,
        taskName,
        description,
        deadline: new Date(deadline),
        urgency,
        assignedTo: assignedMembers,
        discussion: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await tasksCollection.insertOne(newTask);
      return NextResponse.json(
        { message: "Task created successfully!" },
        { status: 201 }
      );
    }

    if (type === "update-status") {
      // Update the status for a user assigned to a task
      const { taskId, newStatus } = body;
      if (!taskId || !newStatus) {
        return NextResponse.json(
          { message: "Missing taskId or newStatus." },
          { status: 400 }
        );
      }
      const task = await tasksCollection.findOne({ _id: new ObjectId(taskId) });
      if (!task) {
        return NextResponse.json(
          { message: "Task not found." },
          { status: 404 }
        );
      }
      const isAssigned = task.assignedTo.some((a) => a.email === email);
      if (!isAssigned) {
        return NextResponse.json(
          { message: "You are not assigned to this task." },
          { status: 403 }
        );
      }
      await tasksCollection.updateOne(
        { _id: task._id, "assignedTo.email": email },
        {
          $set: {
            "assignedTo.$.status": newStatus,
            "assignedTo.$.updatedAt": new Date(),
            updatedAt: new Date(),
          },
        }
      );
      return NextResponse.json(
        { message: "Task status updated successfully!" },
        { status: 200 }
      );
    }

    if (type === "add-idea") {
      // Allow a team member (or the leader) to post an idea/message
      const { taskId, message } = body;
      if (!taskId || !message) {
        return NextResponse.json(
          { message: "Missing taskId or message." },
          { status: 400 }
        );
      }
      const task = await tasksCollection.findOne({ _id: new ObjectId(taskId) });
      if (!task) {
        return NextResponse.json(
          { message: "Task not found." },
          { status: 404 }
        );
      }
      const isAssigned = task.assignedTo.some((a) => a.email === email);
      const isLeader = task.createdBy === email;
      if (!isAssigned && !isLeader) {
        return NextResponse.json(
          { message: "You are not permitted to post ideas on this task." },
          { status: 403 }
        );
      }
      // For simplicity, using email as the name (you could query a users collection for a proper name)
      const userName = email;
      await tasksCollection.updateOne(
        { _id: task._id },
        {
          $push: {
            discussion: {
              email,
              name: userName,
              message,
              createdAt: new Date(),
            },
          },
          $set: { updatedAt: new Date() },
        }
      );
      return NextResponse.json(
        { message: "Idea/Message added successfully!" },
        { status: 200 }
      );
    }

    if (type === "delete-task") {
      // NEW FEATURE: Only the team leader (creator) can delete a task
      const { taskId } = body;
      if (!taskId) {
        return NextResponse.json(
          { message: "Missing taskId." },
          { status: 400 }
        );
      }
      const task = await tasksCollection.findOne({ _id: new ObjectId(taskId) });
      if (!task) {
        return NextResponse.json(
          { message: "Task not found." },
          { status: 404 }
        );
      }
      if (task.createdBy !== email) {
        return NextResponse.json(
          { message: "Only the team leader can delete this task." },
          { status: 403 }
        );
      }
      await tasksCollection.deleteOne({ _id: task._id });
      return NextResponse.json(
        { message: "Task deleted successfully!" },
        { status: 200 }
      );
    }

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
    const overview = searchParams.get("overview"); // check if overview=1

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
    const tasksCollection = db.collection("tasks");

    // 1) Find the team in which this user belongs
    const team = await teamsCollection.findOne({
      $or: [{ leaderEmail: email }, { "members.email": email }],
    });
    if (!team) {
      // user not in any team
      return NextResponse.json(
        { message: "You are not in any team", inTeam: false },
        { status: 200 }
      );
    }

    // If overview=1, gather stats for the entire team
    if (overview === "1") {
      const allTasks = await tasksCollection
        .find({ teamId: team._id })
        .toArray();

      // The team doc has `leaderEmail` + `members` array
      // We'll exclude the leader from assigned/unassigned calculations.
      const membersOnly = team.members || [];
      const totalMembers = membersOnly.length; // Excluding the leader

      // Task Priority Stats
      let highCount = 0;
      let mediumCount = 0;
      let lowCount = 0;

      // Task Status Stats
      let notStartedCount = 0;
      let inProgressCount = 0;
      let doneCount = 0;

      // Track which members (excluding leader) are assigned
      const assignedEmails = new Set();

      for (const task of allTasks) {
        // Priority
        if (task.urgency === "High") highCount++;
        else if (task.urgency === "Medium") mediumCount++;
        else if (task.urgency === "Low") lowCount++;

        // Check each assignee's status
        for (const assignee of task.assignedTo) {
          // Only count if assignee is one of the members, not the leader
          if (membersOnly.some((m) => m.email === assignee.email)) {
            // Status tallies
            if (assignee.status === "Not Started") notStartedCount++;
            else if (assignee.status === "In Progress") inProgressCount++;
            else if (assignee.status === "Done") doneCount++;

            // Mark them as assigned
            assignedEmails.add(assignee.email);
          }
        }
      }

      // total tasks
      const totalTasks = allTasks.length;

      // assigned vs unassigned (excluding leader)
      const assignedCount = assignedEmails.size;
      const unassignedCount = totalMembers - assignedCount;

      return NextResponse.json(
        {
          inTeam: true,
          overviewData: {
            totalMembers, // excludes leader
            totalTasks,
            priorityStats: {
              high: highCount,
              medium: mediumCount,
              low: lowCount,
            },
            statusStats: {
              notStarted: notStartedCount,
              inProgress: inProgressCount,
              done: doneCount,
            },
            assignedCount,
            unassignedCount,
          },
        },
        { status: 200 }
      );
    }

    // Otherwise, fallback to your normal logic for tasks
    const isLeader = team.leaderEmail === email;
    if (isLeader) {
      const tasks = await tasksCollection
        .find({ teamId: team._id })
        .sort({ createdAt: -1 })
        .toArray();
      return NextResponse.json({ tasks }, { status: 200 });
    } else {
      const tasks = await tasksCollection
        .find({ "assignedTo.email": email })
        .sort({ createdAt: -1 })
        .toArray();
      return NextResponse.json({ tasks }, { status: 200 });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}