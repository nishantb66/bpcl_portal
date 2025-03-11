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
  const [isLoading, setIsLoading] = useState(false);
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

  // Auto-logout in real time if token expires or is removed
  useEffect(() => {
    const checkExpirationAndLogout = () => {
      const token = localStorage.getItem("token");
      // If token is missing or expired, log the user out
      if (!token || checkTokenExpiration(token)) {
        toast.info("Your session has expired. Logging you out...");
        localStorage.removeItem("token");
        localStorage.removeItem("name");
        router.push("/login");
      }
    };

    // Check every minute (60000 milliseconds)
    const intervalId = setInterval(checkExpirationAndLogout, 60000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [router]);

  // Fetch the meeting room data
  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/meeting");
      const data = await res.json();
      setRooms(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch rooms.");
    } finally {
      setIsLoading(false);
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
        className={`group relative flex flex-col items-center justify-center p-6 rounded-xl transition-all duration-300 ${
          found?.booked
            ? "bg-gradient-to-br from-gray-50/50 to-gray-100/50 border-2 border-dashed cursor-not-allowed"
            : "bg-gradient-to-br from-white to-indigo-50/50 border-2 border-transparent hover:border-indigo-200 hover:shadow-xl cursor-pointer"
        }`}
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-6 h-6 ${
              found?.booked ? "text-gray-400" : "text-indigo-600"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span
            className={`text-xl font-bold ${
              found?.booked ? "text-gray-400" : "text-gray-800"
            }`}
          >
            {roomId}
          </span>
        </div>

        {found?.booked && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <span className="text-sm font-medium text-gray-500">Booked</span>
          </div>
        )}

        {/* Hover Card */}
        {found?.booked && (
          <div className="absolute top-full left-1/2 mt-4 -translate-x-1/2 w-72 bg-white border border-gray-100 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
            <div className="p-4 space-y-3">
              <div className="pb-2 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">
                  {found.bookingDetails?.topic}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Hosted by {found.bookingDetails?.hostName}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-xs font-medium text-gray-600">
                    {formatLocalTime(found.bookingDetails?.meetingStart)} -{" "}
                    {formatLocalTime(found.bookingDetails?.meetingEnd)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <span className="text-xs font-medium text-gray-600">
                    {found.bookingDetails?.department}
                  </span>
                </div>

                {currentUserName === found.bookingDetails?.hostName && (
                  <AddToCalendarLink bookingDetails={found.bookingDetails} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <ToastContainer position="bottom-right" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
            Conference Rooms
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Book modern meeting spaces equipped with the latest technology. Each
            room supports up to 20 participants with video conferencing
            capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-12">
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-indigo-100 h-12 w-12"></div>
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-indigo-100 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-indigo-100 rounded"></div>
                    <div className="h-4 bg-indigo-100 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            gridItems
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Book {selectedRoom}
              </h2>
              <p className="text-gray-600">Schedule your team meeting</p>
            </div>

            <form
              onSubmit={handleBookRoom}
              className="p-4 sm:p-6 space-y-4 sm:space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Start Time */}
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full text-sm sm:text-base rounded-lg border-gray-200 bg-gray-50 px-4 py-2.5 sm:py-3
                 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={formData.meetingStart}
                    onChange={(e) =>
                      setFormData({ ...formData, meetingStart: e.target.value })
                    }
                    required
                  />
                </div>

                {/* End Time */}
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full text-sm sm:text-base rounded-lg border-gray-200 bg-gray-50 px-4 py-2.5 sm:py-3
                 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={formData.meetingEnd}
                    onChange={(e) =>
                      setFormData({ ...formData, meetingEnd: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Meeting Topic */}
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Meeting Topic
                  </label>
                  <input
                    type="text"
                    className="w-full text-sm sm:text-base rounded-lg border-gray-200 bg-gray-50 px-4 py-2.5 sm:py-3
                 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Project kickoff meeting"
                    value={formData.topic}
                    onChange={(e) =>
                      setFormData({ ...formData, topic: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Department */}
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <input
                    type="text"
                    className="w-full text-sm sm:text-base rounded-lg border-gray-200 bg-gray-50 px-4 py-2.5 sm:py-3
                 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Engineering"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Participants */}
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Participants
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      max="20"
                      className="w-full text-sm sm:text-base rounded-lg border-gray-200 bg-gray-50 px-4 py-2.5 sm:py-3
                   focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="0"
                      value={formData.numEmployees}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          numEmployees: e.target.value,
                        })
                      }
                      required
                    />
                    <span className="absolute right-3 top-2.5 sm:top-3 text-xs sm:text-sm text-gray-400">
                      Max 20
                    </span>
                  </div>
                </div>

                {/* Your Role */}
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Your Role
                  </label>
                  <input
                    type="text"
                    className="w-full text-sm sm:text-base rounded-lg border-gray-200 bg-gray-50 px-4 py-2.5 sm:py-3
                 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Team Lead"
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

              {/* Form Actions - Stack vertically on mobile */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="order-2 sm:order-1 w-full sm:w-auto px-4 sm:px-6 py-2.5 
               rounded-lg border border-gray-200 text-gray-700 text-sm sm:text-base
               hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="order-1 sm:order-2 w-full sm:w-auto px-4 sm:px-6 py-2.5 
               bg-indigo-600 text-white text-sm sm:text-base rounded-lg 
               hover:bg-indigo-700 transition-colors focus:ring-2 focus:ring-indigo-500"
                >
                  Confirm Booking
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
      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 
               hover:bg-indigo-50 rounded-lg transition-colors"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      Add to Calendar
    </a>
  );
}
