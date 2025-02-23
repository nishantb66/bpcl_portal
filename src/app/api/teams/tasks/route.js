import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { connectToDB } from "../../middleware";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

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

    // ---------------------------------------------------------------------------------
    // CREATE TASK
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

      // Create the new task document
      const newTask = {
        teamId: team._id,
        createdBy: email,
        taskName,
        description,
        deadline: new Date(deadline),
        urgency,
        assignedTo: assignedMembers,
        discussion: [],
        dependsOn: [], // no dependencies by default
        // NEW: optional array for reminders (added for completeness)
        reminders: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await tasksCollection.insertOne(newTask);

      return NextResponse.json(
        { message: "Task created successfully!" },
        { status: 201 }
      );
    }

    // ---------------------------------------------------------------------------------
    // UPDATE TASK STATUS
    if (type === "update-status") {
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

    // ---------------------------------------------------------------------------------
    // ADD IDEA / MESSAGE
    if (type === "add-idea") {
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

      // For simplicity, use the user's email as name. You could fetch from 'users' collection if desired
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

    // ---------------------------------------------------------------------------------
    // DELETE TASK
    if (type === "delete-task") {
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

    // ---------------------------------------------------------------------------------
    // ADD DEPENDENCY
    if (type === "add-dependency") {
      const { mainTaskId, dependsOnTaskId } = body;
      if (!mainTaskId || !dependsOnTaskId) {
        return NextResponse.json(
          { message: "Missing mainTaskId or dependsOnTaskId." },
          { status: 400 }
        );
      }

      // Check if user is the team leader
      const team = await teamsCollection.findOne({ leaderEmail: email });
      if (!team) {
        return NextResponse.json(
          { message: "Only the team leader can set dependencies." },
          { status: 403 }
        );
      }

      // Find the main task
      const mainTask = await tasksCollection.findOne({
        _id: new ObjectId(mainTaskId),
      });
      if (!mainTask) {
        return NextResponse.json(
          { message: "Main task not found." },
          { status: 404 }
        );
      }
      if (!mainTask.teamId.equals(team._id)) {
        return NextResponse.json(
          { message: "This task is not part of your team." },
          { status: 403 }
        );
      }

      // Find the dependsOn task
      const depTask = await tasksCollection.findOne({
        _id: new ObjectId(dependsOnTaskId),
      });
      if (!depTask) {
        return NextResponse.json(
          { message: "Dependency task not found." },
          { status: 404 }
        );
      }
      if (!depTask.teamId.equals(team._id)) {
        return NextResponse.json(
          { message: "Dependency task is not part of your team." },
          { status: 403 }
        );
      }

      // Update the main task doc
      await tasksCollection.updateOne(
        { _id: mainTask._id },
        {
          $addToSet: {
            dependsOn: depTask._id,
          },
          $set: { updatedAt: new Date() },
        }
      );

      return NextResponse.json(
        { message: "Dependency established successfully!" },
        { status: 200 }
      );
    }

    // ---------------------------------------------------------------------------------
    // SET REMINDER
    if (type === "set-reminder") {
      const { taskId, reminderDateTime } = body;
      if (!taskId || !reminderDateTime) {
        return NextResponse.json(
          { message: "Missing taskId or reminderDateTime." },
          { status: 400 }
        );
      }

      // Find the task
      const task = await tasksCollection.findOne({ _id: new ObjectId(taskId) });
      if (!task) {
        return NextResponse.json(
          { message: "Task not found." },
          { status: 404 }
        );
      }

      // Check if user is assigned or the leader
      const isAssigned = task.assignedTo.some((a) => a.email === email);
      const isLeader = task.createdBy === email;
      if (!isAssigned && !isLeader) {
        return NextResponse.json(
          { message: "You are not permitted to set reminders on this task." },
          { status: 403 }
        );
      }

      // Push reminder info into the DB (an optional array)
      const reminderObj = {
        email,
        dateTime: new Date(reminderDateTime),
        createdAt: new Date(),
      };

      await tasksCollection.updateOne(
        { _id: task._id },
        {
          $push: {
            reminders: reminderObj,
          },
        }
      );

      // Setup the in-memory timer to send email
      const timeUntilReminder =
        new Date(reminderDateTime).getTime() - Date.now();
      if (timeUntilReminder > 0) {
        // Create the nodemailer transporter
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL,
            pass: process.env.APP_PASS,
          },
        });

        setTimeout(async () => {
          try {
            await transporter.sendMail({
              from: process.env.EMAIL,
              to: email,
              subject: "Task Reminder",
              text: `This is a reminder for your task: ${task.taskName}. The scheduled reminder time is now.`,
            });
            console.log(
              `Reminder email sent to ${email} for task: ${task.taskName}`
            );
          } catch (err) {
            console.error("Failed to send reminder email:", err);
          }
        }, timeUntilReminder);
      }

      return NextResponse.json(
        { message: "Reminder set successfully!" },
        { status: 200 }
      );
    }

    // ---------------------------------------------------------------------------------
    // INVALID REQUEST
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

// --------------------------------------------------------------------------
// GET HANDLER
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const overview = searchParams.get("overview");

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

    // Find the team in which this user belongs
    const team = await teamsCollection.findOne({
      $or: [{ leaderEmail: email }, { "members.email": email }],
    });
    if (!team) {
      return NextResponse.json(
        { message: "You are not in any team", inTeam: false },
        { status: 200 }
      );
    }

    // If overview=1, gather stats
    if (overview === "1") {
      const allTasks = await tasksCollection
        .find({ teamId: team._id })
        .toArray();

      const membersOnly = team.members || [];
      const totalMembers = membersOnly.length; // Excluding the leader

      // Priority Stats
      let highCount = 0;
      let mediumCount = 0;
      let lowCount = 0;

      // Status Stats
      let notStartedCount = 0;
      let inProgressCount = 0;
      let doneCount = 0;

      // Track which members are assigned
      const assignedEmails = new Set();

      for (const task of allTasks) {
        // Priority
        if (task.urgency === "High") highCount++;
        else if (task.urgency === "Medium") mediumCount++;
        else if (task.urgency === "Low") lowCount++;

        // Assignees
        for (const assignee of task.assignedTo) {
          if (membersOnly.some((m) => m.email === assignee.email)) {
            if (assignee.status === "Not Started") notStartedCount++;
            else if (assignee.status === "In Progress") inProgressCount++;
            else if (assignee.status === "Done") doneCount++;
            assignedEmails.add(assignee.email);
          }
        }
      }

      const totalTasks = allTasks.length;
      const assignedCount = assignedEmails.size;
      const unassignedCount = totalMembers - assignedCount;

      return NextResponse.json(
        {
          inTeam: true,
          overviewData: {
            totalMembers,
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

    // If not overview, fetch tasks
    const isLeader = team.leaderEmail === email;

    if (isLeader) {
      // Leader sees all tasks
      const tasks = await tasksCollection
        .find({ teamId: team._id })
        .sort({ createdAt: -1 })
        .toArray();

      // Prepare dependsOn and successors
      tasks.forEach((t) => {
        if (!t.dependsOn) t.dependsOn = [];
        t.successors = [];
      });

      // Build the "successors" array
      tasks.forEach((t) => {
        t.dependsOn.forEach((depId) => {
          const depTask = tasks.find(
            (x) => x._id.toString() === depId.toString()
          );
          if (depTask) {
            depTask.successors.push(t._id);
          }
        });
      });

      return NextResponse.json({ tasks }, { status: 200 });
    } else {
      // Non-leader: show assigned tasks *and* any successors of those tasks
      // 1) Fetch *all* tasks for the team
      const allTeamTasks = await tasksCollection
        .find({ teamId: team._id })
        .sort({ createdAt: -1 })
        .toArray();

      // 2) Make sure each has dependsOn + successors
      allTeamTasks.forEach((t) => {
        if (!t.dependsOn) t.dependsOn = [];
        t.successors = [];
      });

      // 3) Build successors
      allTeamTasks.forEach((t) => {
        t.dependsOn.forEach((depId) => {
          const depTask = allTeamTasks.find(
            (x) => x._id.toString() === depId.toString()
          );
          if (depTask) {
            depTask.successors.push(t._id);
          }
        });
      });

      // 4) Figure out which tasks are assigned to this user
      const assignedToUser = new Set();
      allTeamTasks.forEach((t) => {
        if (t.assignedTo.some((a) => a.email === email)) {
          assignedToUser.add(t._id.toString());
        }
      });

      // 5) BFS (or DFS) from each assigned task to gather successors
      const visited = new Set();
      const stack = [...assignedToUser];

      // Mark all assigned tasks visited
      assignedToUser.forEach((id) => visited.add(id));

      while (stack.length) {
        const currentId = stack.pop();
        const currentTask = allTeamTasks.find(
          (x) => x._id.toString() === currentId
        );
        if (currentTask && currentTask.successors) {
          for (const succId of currentTask.successors) {
            const succStr = succId.toString();
            if (!visited.has(succStr)) {
              visited.add(succStr);
              stack.push(succStr);
            }
          }
        }
      }

      // 6) "visited" now has assigned tasks + their successors
      const finalTasks = allTeamTasks.filter((t) =>
        visited.has(t._id.toString())
      );

      return NextResponse.json({ tasks: finalTasks }, { status: 200 });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
