"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ScheduleMeetings() {
  const router = useRouter();
  const [meetings, setMeetings] = useState([]);
  const [form, setForm] = useState({
    startTime: "",
    endTime: "",
    department: "",
    hostName: "",
    hostDesignation: "",
    expectedMembers: "",
    meetingRoom: "",
  });
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [inviteEmpId, setInviteEmpId] = useState("");
  const [currentEmpId, setCurrentEmpId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showInvitedOnly, setShowInvitedOnly] = useState(false);

  // Fetch meetings scheduled by or where the user is invited
  const fetchMeetings = async () => {
    const token = localStorage.getItem("token");
    setIsLoading(true); // Start loading
    try {
      const response = await fetch("/api/meetings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setMeetings(data.meetings);
      } else {
        toast.error(data.message || "Failed to fetch meetings");
      }
    } catch (err) {
      toast.error("Failed to fetch meetings");
    } finally {
      setIsLoading(false); // Stop loading regardless of success/error
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    // Decode token to get role and emp_id
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "Executive") {
        toast.error("Access denied. Only Executives can access this page.");
        router.push("/");
      } else {
        setCurrentEmpId(payload.emp_id);
      }
    } catch (error) {
      toast.error("Invalid token.");
      router.push("/login");
    }
    fetchMeetings();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Meeting scheduled!");
        setForm({
          startTime: "",
          endTime: "",
          department: "",
          hostName: "",
          hostDesignation: "",
          expectedMembers: "",
          meetingRoom: "",
        });
        fetchMeetings();
      } else {
        toast.error(data.message || "Error scheduling meeting");
      }
    } catch (error) {
      toast.error("Error scheduling meeting");
    }
  };

  const handleDelete = async (meetingId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Meeting deleted");
        fetchMeetings();
      } else {
        toast.error(data.message || "Error deleting meeting");
      }
    } catch (error) {
      toast.error("Error deleting meeting");
    }
  };

  const handleEdit = (meeting) => {
    setEditingMeeting(meeting);
    setForm({
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      department: meeting.department,
      hostName: meeting.hostName,
      hostDesignation: meeting.hostDesignation,
      expectedMembers: meeting.expectedMembers,
      meetingRoom: meeting.meetingRoom,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/meetings/${editingMeeting._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Meeting updated!");
        setEditingMeeting(null);
        setForm({
          startTime: "",
          endTime: "",
          department: "",
          hostName: "",
          hostDesignation: "",
          expectedMembers: "",
          meetingRoom: "",
        });
        fetchMeetings();
      } else {
        toast.error(data.message || "Error updating meeting");
      }
    } catch (error) {
      toast.error("Error updating meeting");
    }
  };

  const handleInvite = async (meetingId) => {
    if (!inviteEmpId) {
      toast.error("Enter employee ID to invite");
      return;
    }
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteEmpId }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Invitation sent!");
        setInviteEmpId("");
        fetchMeetings();
      } else {
        toast.error(data.message || "Error inviting employee");
      }
    } catch (error) {
      toast.error("Error inviting employee");
    }
  };

  const filteredMeetings = meetings.filter((meeting) => {
    if (!showInvitedOnly) return true;
    return (
      meeting.invitedEmpIds && meeting.invitedEmpIds.includes(currentEmpId)
    );
  });

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col">
      <ToastContainer position="top-center" autoClose={3000} />

      {/* Page Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* If you have a logo, you can place it here */}
            <h1 className="text-xl font-bold text-indigo-700">Portal</h1>
          </div>
          <nav className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/profile"
              className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Profile
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        {/* Meeting Scheduling Form (for Executives) */}
        <section className="bg-white rounded-lg shadow-lg p-6 mb-12">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            {editingMeeting ? "Edit Meeting" : "Schedule a New Meeting"}
          </h2>
          {/* The original form logic remains unchanged */}
          <form
            onSubmit={editingMeeting ? handleUpdate : handleSubmit}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  placeholder="Select start time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm({ ...form, startTime: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 
                       focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  placeholder="Select end time"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm({ ...form, endTime: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 
                       focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sales"
                  value={form.department}
                  onChange={(e) =>
                    setForm({ ...form, department: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 
                       focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Host Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Host Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={form.hostName}
                  onChange={(e) =>
                    setForm({ ...form, hostName: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 
                       focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Host Designation */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Host Designation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Manager"
                  value={form.hostDesignation}
                  onChange={(e) =>
                    setForm({ ...form, hostDesignation: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 
                       focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Expected Members */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Expected Members
                </label>
                <input
                  type="number"
                  placeholder="e.g. 10"
                  value={form.expectedMembers}
                  onChange={(e) =>
                    setForm({ ...form, expectedMembers: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 
                       focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Meeting Room */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Meeting Room
                </label>
                <input
                  type="text"
                  placeholder="e.g. Conference Room A"
                  value={form.meetingRoom}
                  onChange={(e) =>
                    setForm({ ...form, meetingRoom: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 
                       focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center mt-4 space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md 
                     hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 
                     transition-colors"
              >
                {editingMeeting ? "Update Meeting" : "Schedule Meeting"}
              </button>
              {editingMeeting && (
                <button
                  onClick={() => {
                    setEditingMeeting(null);
                    setForm({
                      startTime: "",
                      endTime: "",
                      department: "",
                      hostName: "",
                      hostDesignation: "",
                      expectedMembers: "",
                      meetingRoom: "",
                    });
                  }}
                  type="button"
                  className="px-6 py-2 bg-gray-300 text-gray-700 font-medium rounded-md 
                       hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 
                       transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Meetings List */}
        <section className="mt-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Your Meetings
            </h2>
            <button
              onClick={() => setShowInvitedOnly(!showInvitedOnly)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 
                 transition-colors text-sm font-medium"
            >
              {showInvitedOnly
                ? "Show All Meetings"
                : "Show Invited Meetings Only"}
            </button>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div
                className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 
                      border-t-transparent"
              ></div>
            </div>
          ) : filteredMeetings.length === 0 ? (
            <p className="text-gray-600">No meetings found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMeetings.map((meeting) => {
                const isHost = meeting.hostEmpId === currentEmpId;
                return (
                  <div
                    key={meeting._id}
                    className="bg-white rounded-md shadow-sm p-4 flex flex-col justify-between"
                  >
                    {/* Start/End Time */}
                    <div className="mb-2 text-sm text-gray-500">
                      <p>
                        <span className="font-medium text-gray-600">
                          Start:
                        </span>{" "}
                        {new Date(meeting.startTime).toLocaleString()}
                      </p>
                      <p>
                        <span className="font-medium text-gray-600">End:</span>{" "}
                        {new Date(meeting.endTime).toLocaleString()}
                      </p>
                    </div>

                    {/* Meeting Details */}
                    <div className="mb-3 text-gray-700 space-y-1">
                      {isHost ? (
                        <>
                          <p>
                            <span className="font-medium">Department:</span>{" "}
                            {meeting.department}
                          </p>
                          <p>
                            <span className="font-medium">Host:</span>{" "}
                            {meeting.hostName}
                          </p>
                          <p>
                            <span className="font-medium">Designation:</span>{" "}
                            {meeting.hostDesignation}
                          </p>
                          <p>
                            <span className="font-medium">Members:</span>{" "}
                            {meeting.expectedMembers}
                          </p>
                          <p>
                            <span className="font-medium">Room:</span>{" "}
                            {meeting.meetingRoom}
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            <span className="font-medium text-gray-600">
                              Invited:
                            </span>{" "}
                            {meeting.invitedEmpIds &&
                            meeting.invitedEmpIds.length > 0
                              ? meeting.invitedEmpIds.join(", ")
                              : "None"}
                          </p>
                        </>
                      ) : (
                        <>
                          <p>
                            <span className="font-medium">Department:</span>{" "}
                            {meeting.department}
                          </p>
                          <p>
                            <span className="font-medium">Invited by:</span>{" "}
                            {meeting.hostName}
                          </p>
                          <p>
                            <span className="font-medium">Room:</span>{" "}
                            {meeting.meetingRoom}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Action Buttons (if host) */}
                    {isHost && (
                      <div className="space-y-3">
                        {/* Edit/Delete Row */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(meeting)}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white 
                               rounded-md text-sm font-medium 
                               hover:bg-indigo-700 focus:outline-none 
                               focus:ring-2 focus:ring-indigo-400 
                               transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(meeting._id)}
                            className="flex-1 px-4 py-2 bg-red-600 text-white 
                               rounded-md text-sm font-medium 
                               hover:bg-red-700 focus:outline-none 
                               focus:ring-2 focus:ring-red-400 
                               transition-colors"
                          >
                            Delete
                          </button>
                        </div>

                        {/* Invite Row */}
                        <div className="flex items-center">
                          <input
                            type="text"
                            placeholder="Emp ID to invite"
                            value={inviteEmpId}
                            onChange={(e) => setInviteEmpId(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 
                               rounded-l-md focus:ring-indigo-500 
                               focus:border-indigo-500 text-sm"
                          />
                          <button
                            onClick={() => handleInvite(meeting._id)}
                            className="px-4 py-2 bg-green-600 text-white text-sm 
                               font-medium rounded-r-md hover:bg-green-700 
                               focus:outline-none focus:ring-2 
                               focus:ring-green-400 transition-colors"
                          >
                            Invite
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
