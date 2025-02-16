// server.js
const express = require("express");
const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");
const { connectToDB } = require("./src/app/api/middleware");
const { verify } = require("jsonwebtoken");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

let db; // store DB connection
let io; // store socket.io

app.prepare().then(async () => {
  // 1) Initialize Express
  const expressApp = express();
  expressApp.use(express.json());

  // 2) Connect to DB once
  db = await connectToDB();

  // 3) Define your /api/meeting routes in Express
  expressApp.get("/api/meeting", async (req, res) => {
    try {
      const meetingRooms = db.collection("meetingRooms");
      const rooms = await meetingRooms.find({}).toArray();
      res.status(200).json(rooms);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });

  expressApp.post("/api/meeting", async (req, res) => {
    try {
      // 1) Validate token
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
      }
      const token = authHeader.split(" ")[1];
      const decoded = verify(token, process.env.JWT_SECRET);

      // 2) Parse the body
      const {
        roomId,
        meetingTime,
        topic,
        department,
        duration,
        numEmployees,
        hostDesignation,
      } = req.body;

      // 3) Check if room is booked
      const meetingRooms = db.collection("meetingRooms");
      const existing = await meetingRooms.findOne({ roomId });
      if (existing && existing.booked) {
        return res.status(400).json({ message: "Room is already booked" });
      }

      // 4) Upsert the booking
      const bookingDetails = {
        hostName: decoded.name,
        hostEmail: decoded.email,
        hostDesignation,
        topic,
        department,
        meetingTime,
        duration,
        numEmployees,
      };

      await meetingRooms.updateOne(
        { roomId },
        {
          $set: {
            roomId,
            booked: true,
            bookingDetails,
          },
        },
        { upsert: true }
      );

      // 5) Emit socket event
      io.emit("roomBooked", {
        roomId,
        booked: true,
        bookingDetails,
      });

      return res.status(200).json({ message: "Room booked successfully" });
    } catch (error) {
      console.error("Booking error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // 4) Let Next handle everything else
  expressApp.all("*", (req, res) => handle(req, res));

  // 5) Create HTTP server from expressApp
  const server = createServer(expressApp);

  // 6) Initialize Socket.IO
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
    });
  });

  // 7) Start listening
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
