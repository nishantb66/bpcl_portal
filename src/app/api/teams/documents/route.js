import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { connectToDB } from "../../middleware";
import { ObjectId } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

export async function GET(req) {
  try {
    // Check if user is authorized
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
    const pdfsCollection = db.collection("pdfs");

    // Identify the user’s team
    const userTeam = await teamsCollection.findOne({
      $or: [{ leaderEmail: email }, { "members.email": email }],
    });
    if (!userTeam) {
      return NextResponse.json(
        { message: "No team found for this user" },
        { status: 404 }
      );
    }

    // Check if query param pdfId is provided => return a single PDF file for viewing
    const { searchParams } = new URL(req.url);
    const pdfId = searchParams.get("pdfId");

    if (pdfId) {
      // Find that PDF
      const pdfDoc = await pdfsCollection.findOne({
        _id: new ObjectId(pdfId),
        teamId: userTeam._id,
      });
      if (!pdfDoc) {
        return NextResponse.json({ message: "PDF not found" }, { status: 404 });
      }

      // Return the PDF data as a file response
      // Because we stored it as base64, we must decode it on the client. Alternatively, you can respond with a data URL.
      // For a direct inline display in new tab, you can return a PDF file response. But Next.js 13 doesn't have a direct "file" return for server route.
      // Easiest approach: Return JSON with the base64. The client can open a new tab and parse the base64. For a "direct PDF", you'd need a streaming approach or NextResponse file approach.

      return NextResponse.json({
        pdfId,
        filename: pdfDoc.filename,
        contentType: pdfDoc.contentType,
        base64: pdfDoc.base64, // the PDF data
      });
    }

    // Otherwise, list all PDFs for this team
    const pdfList = await pdfsCollection
      .find({ teamId: userTeam._id }, { projection: { base64: 0 } }) // omit the base64 data for listing
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ pdfs: pdfList }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    // Check token
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
    const pdfsCollection = db.collection("pdfs");

    // Identify user’s team
    const userTeam = await teamsCollection.findOne({
      $or: [{ leaderEmail: email }, { "members.email": email }],
    });
    if (!userTeam) {
      return NextResponse.json(
        { message: "No team found for this user" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { type } = body;

    // 1) UPLOAD PDF
    if (type === "upload-pdf") {
      const { filename, contentType, base64 } = body;
      if (!filename || !contentType || !base64) {
        return NextResponse.json(
          { message: "Missing filename, contentType, or base64 data" },
          { status: 400 }
        );
      }

      // Insert doc into pdfs collection
      const pdfDoc = {
        teamId: userTeam._id,
        filename,
        contentType,
        base64, // the PDF data in base64
        createdAt: new Date(),
      };
      const result = await pdfsCollection.insertOne(pdfDoc);

      return NextResponse.json(
        { message: "PDF uploaded successfully!", pdfId: result.insertedId },
        { status: 201 }
      );
    }

    // 2) DELETE PDF (optional)
    if (type === "delete-pdf") {
      const { pdfId } = body;
      if (!pdfId) {
        return NextResponse.json(
          { message: "No pdfId provided" },
          { status: 400 }
        );
      }
      const delResult = await pdfsCollection.deleteOne({
        _id: new ObjectId(pdfId),
        teamId: userTeam._id,
      });
      if (delResult.deletedCount === 0) {
        return NextResponse.json(
          { message: "PDF not found or already deleted" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { message: "PDF deleted successfully!" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: "Invalid documents request type" },
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
