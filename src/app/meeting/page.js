"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Helper to format a JavaScript date into Google Calendar's required format (UTC-based)
function formatGoogleDateTime(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

// Helper to convert a UTC date string into local time for display
function formatLocalTime(utcDateStr) {
  if (!utcDateStr) return "";
  const date = new Date(utcDateStr);
  return date.toLocaleString();
}

export default function MeetingRooms() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [formData, setFormData] = useState({
    meetingStart: "",
    meetingEnd: "",
    topic: "",
    department: "",
    numEmployees: "",
    hostDesignation: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  // Get the current logged-in user's name from localStorage
  const currentUserName =
    typeof window !== "undefined" ? localStorage.getItem("name") : "";

  // Check for token & fetch rooms on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.info("Please log in to access the Meeting Rooms.");
      router.push("/login");
      return;
    }
    fetchRooms();
  }, [router]);

  // Fetch the meeting room data
  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/meeting");
      const data = await res.json();
      setRooms(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch rooms.");
    }
  };

  // Clicking on a room
  const handleRoomClick = (roomId) => {
    const room = rooms.find((r) => r.roomId === roomId);
    if (room?.booked) return;
    setSelectedRoom(roomId);
    setIsModalOpen(true);
  };

  // Close modal & reset form
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRoom(null);
    setFormData({
      meetingStart: "",
      meetingEnd: "",
      topic: "",
      department: "",
      numEmployees: "",
      hostDesignation: "",
    });
  };

  // Book a room (convert local datetime to UTC ISO strings before sending)
  const handleBookRoom = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("No token found. Please log in again.");
      return;
    }

    if (Number(formData.numEmployees) > 20) {
      toast.error("A single room can’t exceed 20 participants.");
      return;
    }

    // Convert the form's local datetime values to Date objects then to UTC ISO strings
    const startLocal = new Date(formData.meetingStart);
    const endLocal = new Date(formData.meetingEnd);

    if (endLocal <= startLocal) {
      toast.error("Meeting End Time must be after the Start Time.");
      return;
    }

    const meetingStartUTC = startLocal.toISOString();
    const meetingEndUTC = endLocal.toISOString();

    try {
      const res = await fetch("/api/meeting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomId: selectedRoom,
          meetingStart: meetingStartUTC,
          meetingEnd: meetingEndUTC,
          topic: formData.topic,
          department: formData.department,
          numEmployees: formData.numEmployees,
          hostDesignation: formData.hostDesignation,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to book room.");
        return;
      }

      toast.success("Room booked successfully!");
      handleCloseModal();
      fetchRooms();
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while booking.");
    }
  };

  // Create an array of 25 room items
  const gridItems = [];
  for (let i = 1; i <= 25; i++) {
    const roomId = `R${i}`;
    const found = rooms.find((r) => r.roomId === roomId);

    gridItems.push(
      <div
        key={roomId}
        onClick={() => handleRoomClick(roomId)}
        className={`
          group relative 
          flex items-center justify-center
          p-4 rounded-lg border
          transition-all ease-in-out duration-300
          ${
            found?.booked
              ? "bg-gray-100 border-gray-200 cursor-not-allowed"
              : "bg-white border-gray-200 cursor-pointer hover:shadow-md hover:border-indigo-300 hover:scale-105"
          }
        `}
      >
        <span className="font-semibold text-gray-800">{roomId}</span>
        {found?.booked && (
          <div
            className="
              absolute top-full left-1/2 mt-2 pointer-events-none
              w-60 p-3 bg-white border border-gray-200 text-gray-700 text-sm 
              rounded-md shadow-lg transform -translate-x-1/2 
              opacity-0 group-hover:opacity-100 transition-opacity 
              z-50
            "
          >
            <p className="font-bold text-gray-900 mb-1">
              Booked by: {found.bookingDetails?.hostName}
            </p>
            <p className="mb-0.5">
              <span className="font-medium">Topic:</span>{" "}
              {found.bookingDetails?.topic}
            </p>
            <p className="mb-0.5">
              <span className="font-medium">Dept:</span>{" "}
              {found.bookingDetails?.department}
            </p>
            <p className="mb-0.5">
              <span className="font-medium">From:</span>{" "}
              {formatLocalTime(found.bookingDetails?.meetingStart)}
            </p>
            <p className="mb-0">
              <span className="font-medium">To:</span>{" "}
              {formatLocalTime(found.bookingDetails?.meetingEnd)}
            </p>
            {currentUserName === found.bookingDetails?.hostName && (
              <AddToCalendarLink bookingDetails={found.bookingDetails} />
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <ToastContainer />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
          Meeting Room Booking
        </h1>
        <p className="text-gray-700 mb-8">
          Select an available meeting room to schedule your next discussion.
          Each room accommodates up to{" "}
          <span className="font-semibold">20 participants</span>.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {gridItems}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white w-full max-w-md mx-4 rounded-lg shadow-lg p-6 relative">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Book {selectedRoom} Meeting Room
            </h2>
            <form onSubmit={handleBookRoom} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Meeting Start Time */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Meeting Start Time
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 rounded-md border border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200 ease-in-out shadow-sm"
                    value={formData.meetingStart}
                    onChange={(e) =>
                      setFormData({ ...formData, meetingStart: e.target.value })
                    }
                    required
                  />
                </div>
                {/* Meeting End Time */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Meeting End Time
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 rounded-md border border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200 ease-in-out shadow-sm"
                    value={formData.meetingEnd}
                    onChange={(e) =>
                      setFormData({ ...formData, meetingEnd: e.target.value })
                    }
                    required
                  />
                </div>
                {/* Discussion Topic */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Discussion Topic
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-md border border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200 ease-in-out shadow-sm"
                    placeholder="Enter the topic"
                    value={formData.topic}
                    onChange={(e) =>
                      setFormData({ ...formData, topic: e.target.value })
                    }
                    required
                  />
                </div>
                {/* Department */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-md border border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200 ease-in-out shadow-sm"
                    placeholder="e.g., HR, Finance"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    required
                  />
                </div>
                {/* Number of Employees */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Number of Employees
                  </label>
                  <input
                    type="number"
                    max={20}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200 ease-in-out shadow-sm"
                    placeholder="Up to 20"
                    value={formData.numEmployees}
                    onChange={(e) =>
                      setFormData({ ...formData, numEmployees: e.target.value })
                    }
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    (Maximum 20 participants)
                  </p>
                </div>
                {/* Host's Designation */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Host&apos;s Designation
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-md border border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200 ease-in-out shadow-sm"
                    placeholder="e.g., Manager"
                    value={formData.hostDesignation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hostDesignation: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleCloseModal();
                    window.location.reload();
                  }}
                  className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100 transition-colors duration-200 ease-in-out"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors duration-200 ease-in-out"
                >
                  Book Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Google Calendar link component
function AddToCalendarLink({ bookingDetails }) {
  const startDate = new Date(bookingDetails.meetingStart);
  const endDate = new Date(bookingDetails.meetingEnd);
  const text = encodeURIComponent(bookingDetails.topic || "Meeting");
  const details = encodeURIComponent(
    `Department: ${bookingDetails.department}\nHost Designation: ${bookingDetails.hostDesignation}\nExpected Participants: ${bookingDetails.numEmployees}`
  );
  const location = encodeURIComponent("Company Office");
  const gcalLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${formatGoogleDateTime(
    startDate
  )}/${formatGoogleDateTime(endDate)}&location=${location}&details=${details}`;

  return (
    <a
      href={gcalLink}
      target="_blank"
      rel="noopener noreferrer"
      className="underline text-indigo-600 hover:text-indigo-800 block mt-2 text-center"
    >
      Add to Google Calendar
    </a>
  );
}
