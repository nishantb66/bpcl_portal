import { connectToDB } from "../middleware";
import { verify } from "jsonwebtoken";
import { ObjectId } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

// Helper: extract and verify token from request
const getUserFromToken = (req) => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) throw new Error("No token provided");
  const token = authHeader.split(" ")[1];
  if (!token) throw new Error("Invalid token");
  return verify(token, process.env.JWT_SECRET);
};

// GET tasks
// If query ?filter=created, returns tasks created by the user
// If query ?filter=assigned, returns tasks assigned to the user
// Else returns both
export async function GET(req) {
  try {
    const user = getUserFromToken(req);
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter");
    const db = await connectToDB();
    const tasksCollection = db.collection("tasks");

    if (filter === "created") {
      const tasks = await tasksCollection
        .find({ "createdBy.email": user.email })
        .toArray();
      return new Response(JSON.stringify(tasks), { status: 200 });
    } else if (filter === "assigned") {
      const tasks = await tasksCollection
        .find({ "assignedTo.email": user.email })
        .toArray();
      return new Response(JSON.stringify(tasks), { status: 200 });
    } else {
      const createdTasks = await tasksCollection
        .find({ "createdBy.email": user.email })
        .toArray();
      const assignedTasks = await tasksCollection
        .find({ "assignedTo.email": user.email })
        .toArray();
      return new Response(
        JSON.stringify({ created: createdTasks, assigned: assignedTasks }),
        { status: 200 }
      );
    }
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 401,
    });
  }
}

// POST new task
// Fields: title (required), description, deadline, status, and optional assignToUsername
export async function POST(req) {
  try {
    const user = getUserFromToken(req);
    const body = await req.json();
    const { title, description, deadline, status, assignToUsername } = body;

    if (!title) {
      return new Response(JSON.stringify({ message: "Title is required" }), {
        status: 400,
      });
    }

    const db = await connectToDB();
    let assignedTo = null;
    if (assignToUsername) {
      // Lookup the assigned user from the users collection
      const usersCollection = db.collection("users");
      const assignedUser = await usersCollection.findOne({
        name: assignToUsername,
      });
      if (!assignedUser) {
        return new Response(
          JSON.stringify({ message: "Assigned user not found" }),
          { status: 404 }
        );
      }
      assignedTo = { name: assignedUser.name, email: assignedUser.email };
    }

    const task = {
      title,
      description: description || "",
      deadline: deadline ? new Date(deadline) : null,
      status: status || "Pending",
      createdBy: { name: user.name, email: user.email },
      assignedTo,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const tasksCollection = db.collection("tasks");
    const result = await tasksCollection.insertOne(task);
    task._id = result.insertedId;
    return new Response(JSON.stringify(task), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
    });
  }
}

// PUT update a task
// If the current user is the creator, they can update all fields.
// If they are only assigned (but not the creator), they may only update the status.
export async function PUT(req) {
  try {
    const user = getUserFromToken(req);
    const body = await req.json();
    const { id, title, description, deadline, status, assignToUsername } = body;

    if (!id) {
      return new Response(JSON.stringify({ message: "Task ID is required" }), {
        status: 400,
      });
    }

    const db = await connectToDB();
    const tasksCollection = db.collection("tasks");
    const task = await tasksCollection.findOne({ _id: new ObjectId(id) });
    if (!task) {
      return new Response(JSON.stringify({ message: "Task not found" }), {
        status: 404,
      });
    }

    let updateData = {};

    if (task.createdBy.email === user.email) {
      // Creator can update everything
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (deadline !== undefined)
        updateData.deadline = deadline ? new Date(deadline) : null;
      if (status !== undefined) updateData.status = status;
      if (assignToUsername !== undefined) {
        if (assignToUsername) {
          const usersCollection = db.collection("users");
          const assignedUser = await usersCollection.findOne({
            name: assignToUsername,
          });
          if (!assignedUser) {
            return new Response(
              JSON.stringify({ message: "Assigned user not found" }),
              { status: 404 }
            );
          }
          updateData.assignedTo = {
            name: assignedUser.name,
            email: assignedUser.email,
          };
        } else {
          updateData.assignedTo = null;
        }
      }
    } else if (task.assignedTo && task.assignedTo.email === user.email) {
      // Assigned user (but not creator) can only update status
      if (status !== undefined) {
        updateData.status = status;
      } else {
        return new Response(
          JSON.stringify({ message: "Not authorized to update this task" }),
          { status: 403 }
        );
      }
    } else {
      return new Response(JSON.stringify({ message: "Not authorized" }), {
        status: 403,
      });
    }

    updateData.updatedAt = new Date();
    const result = await tasksCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    if (result.modifiedCount === 0) {
      return new Response(JSON.stringify({ message: "No changes made" }), {
        status: 200,
      });
    }
    return new Response(JSON.stringify({ message: "Task updated" }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
    });
  }
}

// DELETE a task (only the creator can delete)
export async function DELETE(req) {
  try {
    const user = getUserFromToken(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return new Response(JSON.stringify({ message: "Task ID is required" }), {
        status: 400,
      });
    }
    const db = await connectToDB();
    const tasksCollection = db.collection("tasks");
    const task = await tasksCollection.findOne({ _id: new ObjectId(id) });
    if (!task) {
      return new Response(JSON.stringify({ message: "Task not found" }), {
        status: 404,
      });
    }
    if (task.createdBy.email !== user.email) {
      return new Response(JSON.stringify({ message: "Not authorized" }), {
        status: 403,
      });
    }
    await tasksCollection.deleteOne({ _id: new ObjectId(id) });
    return new Response(JSON.stringify({ message: "Task deleted" }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
    });
  }
}
