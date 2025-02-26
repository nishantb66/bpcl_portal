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

// GET assignments
// If query ?filter=created, returns assignments created by the user
// If query ?filter=assigned, returns assignments assigned to the user
// Otherwise, returns both
export async function GET(req) {
  try {
    const user = getUserFromToken(req);
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter");

    const db = await connectToDB();
    const assignmentsCollection = db.collection("assignment");

    if (filter === "created") {
      const assignments = await assignmentsCollection
        .find({ "createdBy.email": user.email })
        .toArray();
      return new Response(JSON.stringify(assignments), { status: 200 });
    } else if (filter === "assigned") {
      const assignments = await assignmentsCollection
        .find({ "assignedTo.email": user.email })
        .toArray();
      return new Response(JSON.stringify(assignments), { status: 200 });
    } else {
      const createdAssignments = await assignmentsCollection
        .find({ "createdBy.email": user.email })
        .toArray();
      const assignedAssignments = await assignmentsCollection
        .find({ "assignedTo.email": user.email })
        .toArray();
      return new Response(
        JSON.stringify({
          created: createdAssignments,
          assigned: assignedAssignments,
        }),
        { status: 200 }
      );
    }
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 401,
    });
  }
}

// POST new assignment
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
      // Look up the assigned user from the "users" collection
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

    const assignment = {
      title,
      description: description || "",
      deadline: deadline ? new Date(deadline) : null,
      status: status || "Pending",
      createdBy: { name: user.name, email: user.email },
      assignedTo,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const assignmentsCollection = db.collection("assignment");
    const result = await assignmentsCollection.insertOne(assignment);
    assignment._id = result.insertedId;

    return new Response(JSON.stringify(assignment), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
    });
  }
}

// PUT update an assignment
// If the current user is the creator, they can update all fields.
// If they are only assigned (but not the creator), they may only update the status.
export async function PUT(req) {
  try {
    const user = getUserFromToken(req);
    const body = await req.json();
    const { id, title, description, deadline, status, assignToUsername } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ message: "Assignment ID is required" }),
        {
          status: 400,
        }
      );
    }

    const db = await connectToDB();
    const assignmentsCollection = db.collection("assignment");

    const assignment = await assignmentsCollection.findOne({
      _id: new ObjectId(id),
    });
    if (!assignment) {
      return new Response(JSON.stringify({ message: "Assignment not found" }), {
        status: 404,
      });
    }

    let updateData = {};

    // If the user is the creator
    if (assignment.createdBy.email === user.email) {
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (deadline !== undefined) {
        updateData.deadline = deadline ? new Date(deadline) : null;
      }
      if (status !== undefined) updateData.status = status;

      // Reassign to a new user or remove assignment
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
    }
    // If the user is only assigned (but not the creator), they can only update status
    else if (
      assignment.assignedTo &&
      assignment.assignedTo.email === user.email
    ) {
      if (status !== undefined) {
        updateData.status = status;
      } else {
        return new Response(
          JSON.stringify({
            message: "Not authorized to update this assignment",
          }),
          { status: 403 }
        );
      }
    } else {
      return new Response(JSON.stringify({ message: "Not authorized" }), {
        status: 403,
      });
    }

    updateData.updatedAt = new Date();

    const result = await assignmentsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return new Response(JSON.stringify({ message: "No changes made" }), {
        status: 200,
      });
    }

    return new Response(JSON.stringify({ message: "Assignment updated" }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
    });
  }
}

// DELETE an assignment (only the creator can delete)
export async function DELETE(req) {
  try {
    const user = getUserFromToken(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new Response(
        JSON.stringify({ message: "Assignment ID is required" }),
        {
          status: 400,
        }
      );
    }

    const db = await connectToDB();
    const assignmentsCollection = db.collection("assignment");

    const assignment = await assignmentsCollection.findOne({
      _id: new ObjectId(id),
    });
    if (!assignment) {
      return new Response(JSON.stringify({ message: "Assignment not found" }), {
        status: 404,
      });
    }

    if (assignment.createdBy.email !== user.email) {
      return new Response(JSON.stringify({ message: "Not authorized" }), {
        status: 403,
      });
    }

    await assignmentsCollection.deleteOne({ _id: new ObjectId(id) });
    return new Response(JSON.stringify({ message: "Assignment deleted" }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
    });
  }
}
