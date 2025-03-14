"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import jwt from "jsonwebtoken";

// 1) Define the missing function here (or anywhere above its usage)
function checkTokenExpiration(token) {
  try {
    const decoded = jwt.decode(token);
    // If we cannot decode the token or it has no expiration (`exp`), treat it as expired
    if (!decoded || !decoded.exp) return true;
    const currentTime = Date.now() / 1000; // in seconds
    // If the token’s `exp` is in the past, return true => expired
    return decoded.exp < currentTime;
  } catch (error) {
    return true; // if any error, assume expired
  }
}

export default function HackathonPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hackathon, setHackathon] = useState(null);
  const [isLeader, setIsLeader] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaDescription, setIdeaDescription] = useState("");
  // State for guidelines (read-only display from hackathon doc)
  const [isEditingGuidelines, setIsEditingGuidelines] = useState(false);
  const [guidelinesEditText, setGuidelinesEditText] = useState("");

  // Track if the current member has already liked the guidelines
  const [guidelinesLiked, setGuidelinesLiked] = useState(false);

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

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login first.");
        router.push("/login");
        return;
      }

      try {
        const decoded = jwt.decode(token);
        setCurrentUserEmail(decoded?.email || null);

        // Fetch team data
        const teamRes = await fetch("/api/teams?myTeam=1", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const teamData = await teamRes.json();
        if (teamData.inTeam) setIsLeader(teamData.isLeader);

        // Fetch hackathon data
        const hackRes = await fetch("/api/hackathons", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const hackData = await hackRes.json();
        setHackathon(hackData.hackathon || null);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  useEffect(() => {
    if (hackathon && hackathon.guidelines) {
      setGuidelinesEditText(hackathon.guidelines.text || "");
      if (hackathon.guidelines.likes && currentUserEmail) {
        setGuidelinesLiked(
          hackathon.guidelines.likes.includes(currentUserEmail)
        );
      }
    } else {
      setGuidelinesEditText("");
      setGuidelinesLiked(false);
    }
  }, [hackathon, currentUserEmail]);

  // Helper to refetch the hackathon doc
  const refreshHackathon = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/hackathons", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.hackathon) {
        setHackathon(data.hackathon);
      } else {
        setHackathon(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddIdea = async () => {
    if (!ideaTitle.trim() || !ideaDescription.trim()) {
      toast.error("Please fill out both fields.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login again.");
      return;
    }

    try {
      const res = await fetch("/api/hackathons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "add-idea",
          ideaTitle,
          ideaDescription,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to add idea.");
        return;
      }
      toast.success(data.message || "Idea added!");
      setIdeaTitle("");
      setIdeaDescription("");
      refreshHackathon();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong adding idea.");
    }
  };

  // Handle liking an idea
  const handleLikeIdea = async (ideaId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login again.");
      return;
    }
    try {
      const res = await fetch("/api/hackathons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "like-idea",
          ideaId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to like idea.");
        return;
      }
      toast.success(data.message || "Idea liked!");
      refreshHackathon();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong liking idea.");
    }
  };

  const handleUpdateGuidelines = async () => {
    if (!guidelinesEditText.trim()) {
      toast.error("Please enter the guidelines text.");
      return;
    }
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/hackathons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "update-guidelines",
          guidelines: guidelinesEditText,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to update guidelines.");
        return;
      }
      toast.success(data.message || "Guidelines updated!");
      setIsEditingGuidelines(false);
      // Refresh hackathon data (if you have a refresh function; otherwise, re-fetch hackathon info)
      refreshHackathon();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong updating guidelines.");
    }
  };

  const handleLikeGuidelines = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/hackathons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "like-guidelines",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to support guidelines.");
        return;
      }
      toast.success(data.message || "Guidelines supported!");
      setGuidelinesLiked(true);
      refreshHackathon();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong supporting guidelines.");
    }
  };

  // Rest of the non-UI functions remain the same as original (handleAddIdea, handleLikeIdea)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-gray-700 font-medium text-sm">
            Loading Hackathon Details...
          </p>
        </div>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center max-w-md mx-4">
          <div className="text-5xl mb-4 text-gray-300">🚀</div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">
            No Active Hackathon Found
          </h1>
          <p className="text-gray-500 text-sm">
            Please check back later or ensure your team is properly registered.
          </p>
        </div>
      </div>
    );
  }

  const options = {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  const startStr = new Date(hackathon.startDateTime).toLocaleString(
    "en-IN",
    options
  );
  const endStr = new Date(hackathon.endDateTime).toLocaleString(
    "en-IN",
    options
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Event Header */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          {/* Decorative top border with gradient */}
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-4">
                {/* Topic with subtle highlight */}
                <div className="relative">
                  <div className="absolute -left-3 top-0 bottom-0 w-1 bg-indigo-500 rounded-full"></div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {hackathon.topic}
                  </h1>
                </div>

                {/* Description with improved typography */}
                <p className="text-gray-600 text-lg leading-relaxed">
                  {hackathon.description}
                </p>

                {/* Status indicator - dynamic based on dates */}
                {(() => {
                  const now = new Date();
                  const start = new Date(hackathon.startDateTime);
                  const end = new Date(hackathon.endDateTime);
                  let statusColor, statusText;

                  if (now < start) {
                    statusColor =
                      "bg-amber-100 text-amber-800 border-amber-200";
                    statusText = "Upcoming";
                  } else if (now >= start && now <= end) {
                    statusColor =
                      "bg-green-100 text-green-800 border-green-200";
                    statusText = "Active";
                  } else {
                    statusColor = "bg-gray-100 text-gray-800 border-gray-200";
                    statusText = "Completed";
                  }

                  return (
                    <div className="flex items-center mt-3">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColor} border`}
                      >
                        <span className="mr-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-current"></span>
                        {statusText}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Enhanced timeline card */}
              <div className="md:w-80 bg-gradient-to-br from-indigo-50 to-white rounded-xl shadow-sm border border-indigo-100">
                <div className="p-5 space-y-4">
                  {/* Card header */}
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5 text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <h3 className="font-semibold text-gray-800">
                      Event Timeline
                    </h3>
                  </div>

                  {/* Vertical timeline with improved visuals */}
                  <div className="relative pl-6 border-l-2 border-indigo-200 space-y-6 py-1">
                    {/* Start date */}
                    <div className="relative">
                      <div className="absolute -left-[21px] w-4 h-4 bg-indigo-600 rounded-full border-4 border-white"></div>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-indigo-600 uppercase tracking-wider">
                          Start Date
                        </div>
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          {startStr}
                        </div>
                      </div>
                    </div>

                    {/* End date */}
                    <div className="relative">
                      <div className="absolute -left-[21px] w-4 h-4 bg-red-600 rounded-full border-4 border-white"></div>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-red-600 uppercase tracking-wider">
                          End Date
                        </div>
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          {endStr}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Duration indicator */}
                  <div className="pt-1 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Duration</span>
                      <span className="font-medium px-2 py-1 bg-gray-100 rounded-lg">
                        {(() => {
                          const start = new Date(hackathon.startDateTime);
                          const end = new Date(hackathon.endDateTime);
                          const diffTime = Math.abs(end - start);
                          const diffDays = Math.floor(
                            diffTime / (1000 * 60 * 60 * 24)
                          );
                          const diffHours = Math.floor(
                            (diffTime % (1000 * 60 * 60 * 24)) /
                              (1000 * 60 * 60)
                          );

                          return `${diffDays} days, ${diffHours} hours`;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Brainstorming Guidelines Section */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          {/* Header with subtle gradient background */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-5 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <svg
                  className="w-5 h-5 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Brainstorming Guidelines
                </h2>
                <p className="text-sm text-gray-500">
                  Framework for effective ideation
                </p>
              </div>
            </div>
            {isLeader && (
              <button
                onClick={() => setIsEditingGuidelines(true)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-full ${
                  hackathon.guidelines && hackathon.guidelines.text
                    ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                } transition-all duration-200 font-medium text-sm`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={
                      hackathon.guidelines && hackathon.guidelines.text
                        ? "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        : "M12 6v6m0 0v6m0-6h6m-6 0H6"
                    }
                  />
                </svg>
                <span>
                  {hackathon.guidelines && hackathon.guidelines.text
                    ? "Edit Guidelines"
                    : "Add Guidelines"}
                </span>
              </button>
            )}
          </div>

          {/* Content section */}
          <div className="px-6 py-5">
            {isEditingGuidelines ? (
              <div className="animate-fadeIn">
                <div className="relative">
                  <textarea
                    value={guidelinesEditText}
                    onChange={(e) => setGuidelinesEditText(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-700"
                    rows={6}
                    placeholder="Enter guidelines for brainstorming..."
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                    {guidelinesEditText.length} characters
                  </div>
                </div>

                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setIsEditingGuidelines(false);
                      setGuidelinesEditText(hackathon.guidelines?.text || "");
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium flex items-center space-x-1.5"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleUpdateGuidelines}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm hover:shadow transition-all font-medium flex items-center space-x-1.5"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Save Guidelines</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-fadeIn">
                {hackathon.guidelines && hackathon.guidelines.text ? (
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                    <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {hackathon.guidelines.text}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <svg
                      className="w-12 h-12 text-gray-300 mx-auto"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    <p className="mt-3 text-gray-500">
                      No guidelines have been set yet.
                    </p>
                    {isLeader && (
                      <p className="mt-1 text-sm text-gray-400">
                        As the team leader, you can add guidelines to help the
                        team brainstorm effectively.
                      </p>
                    )}
                  </div>
                )}

                {hackathon.guidelines && hackathon.guidelines.text && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleLikeGuidelines}
                        disabled={guidelinesLiked || isLeader}
                        className={`group flex items-center space-x-1.5 rounded-full px-3 py-1.5 transition-all ${
                          isLeader || guidelinesLiked
                            ? "bg-gray-100 cursor-not-allowed"
                            : "hover:bg-indigo-50 bg-gray-50"
                        }`}
                      >
                        <svg
                          className={`w-4 h-4 transition-colors ${
                            guidelinesLiked
                              ? "text-indigo-600 fill-indigo-600"
                              : isLeader
                              ? "text-gray-400"
                              : "text-gray-500 group-hover:text-indigo-600"
                          }`}
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          fill={guidelinesLiked ? "currentColor" : "none"}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904"
                          />
                        </svg>
                        <span
                          className={`text-sm font-medium ${
                            guidelinesLiked
                              ? "text-indigo-600"
                              : isLeader
                              ? "text-gray-400"
                              : "text-gray-500 group-hover:text-indigo-600"
                          }`}
                        >
                          Support
                        </span>
                      </button>

                      <div className="bg-gray-100 rounded-full px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        {hackathon.guidelines.likes
                          ? hackathon.guidelines.likes.length
                          : 0}{" "}
                        supports
                      </div>
                    </div>

                    <div className="text-xs text-gray-400">
                      Last updated: {new Date().toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Idea Submission */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-5 flex justify-between items-center border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <svg
                  className="w-5 h-5 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Submit Your Proposal
                </h2>
                <p className="text-sm text-gray-500">
                  Share your innovative solution with the team
                </p>
              </div>
            </div>
          </div>

          {/* Form content */}
          <div className="p-6">
            <div className="space-y-6">
              {/* Project Title Field with character count */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Project Title <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-gray-400">
                    {ideaTitle.length}/100
                  </span>
                </div>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={ideaTitle}
                    onChange={(e) => setIdeaTitle(e.target.value.slice(0, 100))}
                    className="pl-10 w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="Enter a catchy and descriptive project title"
                    maxLength={100}
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  A clear, concise title helps your proposal stand out
                </p>
              </div>

              {/* Technical Approach Field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Technical Approach <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-gray-400">
                    {ideaDescription.length}/2000
                  </span>
                </div>
                <div className="relative">
                  <textarea
                    value={ideaDescription}
                    onChange={(e) =>
                      setIdeaDescription(e.target.value.slice(0, 2000))
                    }
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="Describe your technical implementation strategy, including technologies, architecture, and innovative aspects..."
                    maxLength={2000}
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  Be specific about technologies, implementation details, and
                  how your solution addresses the challenge
                </p>
              </div>

              {/* Success tips */}
              <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Proposal Tips
                    </h3>
                    <div className="mt-2 text-xs text-green-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Focus on feasibility within the timeframe</li>
                        <li>
                          Highlight your solution's unique value proposition
                        </li>
                        <li>Consider potential technical challenges</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button with icon */}
              <button
                onClick={handleAddIdea}
                disabled={!ideaTitle.trim() || !ideaDescription.trim()}
                className={`w-full flex justify-center items-center space-x-2 px-6 py-3.5 rounded-lg font-medium text-sm transition-all transform hover:scale-[1.01] ${
                  !ideaTitle.trim() || !ideaDescription.trim()
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span>Submit Proposal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Community Proposals */}
        {/* Enhanced Community Proposals */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-5 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <svg
                  className="w-5 h-5 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Community Proposals
                </h2>
                <p className="text-sm text-gray-500">
                  Vote on innovative solutions from your team
                </p>
              </div>
            </div>

            {hackathon.ideas?.length > 0 && (
              <div className="bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 border border-gray-200 shadow-sm">
                {hackathon.ideas.length}{" "}
                {hackathon.ideas.length === 1 ? "proposal" : "proposals"}{" "}
                submitted
              </div>
            )}
          </div>

          {/* Proposals grid */}
          <div className="p-6">
            {hackathon.ideas?.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2">
                {hackathon.ideas.map((idea) => {
                  const hasLiked = idea.likes.includes(currentUserEmail);
                  const isAuthor = idea.authorEmail === currentUserEmail;
                  const likeCount = idea.likes.length;

                  return (
                    <div
                      key={idea._id}
                      className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md hover:border-indigo-200"
                    >
                      {/* Top gradient accent bar */}
                      <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-400 to-indigo-300"></div>

                      {/* Author badge - conditionally shown */}
                      {isAuthor && (
                        <div className="absolute top-3 right-3 bg-indigo-100 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full border border-indigo-200">
                          Your Proposal
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-5">
                        <div className="flex items-start space-x-3">
                          {/* Title and date */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-1.5 mb-0.5">
                              <svg
                                className="w-4 h-4 text-indigo-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                />
                              </svg>
                              <span className="text-xs text-gray-500">
                                {new Date(idea.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                              {idea.title}
                            </h3>
                          </div>
                        </div>

                        {/* Description with max height and fade out effect */}
                        <div className="mt-3 relative">
                          <div className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-4">
                            {idea.description}
                          </div>
                          {idea.description.length > 240 && (
                            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent"></div>
                          )}
                        </div>

                        {/* Footer with likes */}
                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              disabled={isAuthor || hasLiked}
                              onClick={() => handleLikeIdea(idea._id)}
                              className={`flex items-center space-x-1.5 p-1.5 rounded-full transition-all ${
                                isAuthor || hasLiked
                                  ? "cursor-not-allowed"
                                  : "hover:bg-indigo-50"
                              }`}
                              aria-label={
                                hasLiked
                                  ? "Already liked"
                                  : "Like this proposal"
                              }
                            >
                              <svg
                                className={`w-5 h-5 ${
                                  hasLiked
                                    ? "text-pink-500 fill-pink-500"
                                    : isAuthor
                                    ? "text-gray-300"
                                    : "text-gray-400 group-hover:text-pink-500"
                                } transition-colors`}
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                fill={hasLiked ? "currentColor" : "none"}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                                />
                              </svg>
                              <span
                                className={`text-xs font-medium ${
                                  hasLiked
                                    ? "text-pink-500"
                                    : isAuthor
                                    ? "text-gray-300"
                                    : "text-gray-500 group-hover:text-gray-700"
                                }`}
                              >
                                {likeCount} {likeCount === 1 ? "vote" : "votes"}
                              </span>
                            </button>
                          </div>

                          {/* Author info - compact version */}
                          <div className="text-xs font-medium text-gray-500 flex items-center">
                            <span className="inline-block h-5 w-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mr-1.5 uppercase">
                              {idea.authorEmail.charAt(0)}
                            </span>
                            <span className="truncate max-w-[100px]">
                              {idea.authorEmail.split("@")[0]}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-indigo-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">
                  No proposals yet
                </h3>
                <p className="text-gray-500 text-sm max-w-md text-center">
                  Be the first to share your innovative solution with the team!
                </p>
                <button
                  onClick={() =>
                    document
                      .querySelector('input[placeholder*="project title"]')
                      ?.focus()
                  }
                  className="mt-6 px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Submit Your Proposal
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Leadership Dashboard */}
        {isLeader && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-5 flex justify-between items-center border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <svg
                    className="w-5 h-5 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Team Leader Dashboard
                  </h2>
                  <p className="text-sm text-gray-500">
                    Monitor proposals and make informed decisions
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-gray-500">
                  Total Proposals:
                </span>
                <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {hackathon.ideas?.length || 0}
                </span>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-6">
              {hackathon.ideas && hackathon.ideas.length > 0 ? (
                <div>
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                      <div className="text-xs text-green-600 uppercase tracking-wider font-medium">
                        Most Voted
                      </div>
                      <div className="mt-1 text-lg font-semibold text-gray-800 truncate">
                        {(() => {
                          const topIdea = [...(hackathon.ideas || [])].sort(
                            (a, b) => b.likes.length - a.likes.length
                          )[0];
                          return topIdea?.title || "No proposals yet";
                        })()}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {(() => {
                          const topIdea = [...(hackathon.ideas || [])].sort(
                            (a, b) => b.likes.length - a.likes.length
                          )[0];
                          return topIdea ? `${topIdea.likes.length} votes` : "";
                        })()}
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                      <div className="text-xs text-blue-600 uppercase tracking-wider font-medium">
                        Latest Submission
                      </div>
                      <div className="mt-1 text-lg font-semibold text-gray-800 truncate">
                        {(() => {
                          const latestIdea = [...(hackathon.ideas || [])].sort(
                            (a, b) =>
                              new Date(b.createdAt) - new Date(a.createdAt)
                          )[0];
                          return latestIdea?.title || "No proposals yet";
                        })()}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {(() => {
                          const latestIdea = [...(hackathon.ideas || [])].sort(
                            (a, b) =>
                              new Date(b.createdAt) - new Date(a.createdAt)
                          )[0];
                          return latestIdea
                            ? new Date(latestIdea.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "numeric",
                                }
                              )
                            : "";
                        })()}
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 col-span-2 md:col-span-1">
                      <div className="text-xs text-amber-600 uppercase tracking-wider font-medium">
                        Team Participation
                      </div>
                      <div className="mt-1 text-lg font-semibold text-gray-800">
                        {(() => {
                          // Get unique authors count
                          const uniqueAuthors = new Set(
                            hackathon.ideas?.map((idea) => idea.authorEmail) ||
                              []
                          );
                          return `${uniqueAuthors.size} members`;
                        })()}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        have submitted proposals
                      </div>
                    </div>
                  </div>

                  {/* Enhanced table */}
                  <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Proposal
                          </th>
                          <th
                            scope="col"
                            className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Author
                          </th>
                          <th
                            scope="col"
                            className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Submitted
                          </th>
                          <th
                            scope="col"
                            className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Votes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {[...(hackathon.ideas || [])]
                          .sort((a, b) => b.likes.length - a.likes.length) // Sort by votes descending
                          .map((idea, index) => (
                            <tr
                              key={idea._id}
                              className={`hover:bg-gray-50 transition-colors ${
                                index === 0 ? "bg-indigo-50/30" : ""
                              }`}
                            >
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div
                                    className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${
                                      index === 0
                                        ? "bg-indigo-100 text-indigo-700"
                                        : "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {index + 1}
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900 line-clamp-1">
                                      {idea.title}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className="inline-block h-7 w-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mr-2 uppercase text-xs font-medium">
                                    {idea.authorEmail.charAt(0)}
                                  </span>
                                  <div className="text-sm text-gray-600">
                                    {idea.authorEmail.split("@")[0]}
                                    <div className="text-xs text-gray-400">
                                      {idea.authorEmail.split("@")[1]}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-600">
                                  {new Date(idea.createdAt).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                    }
                                  )}
                                  <div className="text-xs text-gray-400">
                                    {new Date(
                                      idea.createdAt
                                    ).toLocaleTimeString("en-US", {
                                      hour: "numeric",
                                      minute: "numeric",
                                    })}
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div
                                    className={`px-2 py-1 inline-flex text-sm rounded-md font-medium ${
                                      index === 0
                                        ? "bg-green-100 text-green-800"
                                        : index === 1
                                        ? "bg-blue-100 text-blue-800"
                                        : index === 2
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {idea.likes.length}
                                  </div>

                                  <div className="ml-3 w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${
                                        index === 0
                                          ? "bg-green-500"
                                          : index === 1
                                          ? "bg-blue-500"
                                          : index === 2
                                          ? "bg-amber-500"
                                          : "bg-gray-500"
                                      }`}
                                      style={{
                                        width: `${Math.max(
                                          5,
                                          Math.min(
                                            100,
                                            (idea.likes.length /
                                              (hackathon.ideas.length > 0
                                                ? Math.max(
                                                    ...hackathon.ideas.map(
                                                      (i) => i.likes.length
                                                    ),
                                                    1
                                                  )
                                                : 1)) *
                                              100
                                          )
                                        )}%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Tips for leaders */}
                  <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-indigo-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-indigo-800">
                          Tips for Team Leaders
                        </h3>
                        <div className="mt-2 text-xs text-indigo-700">
                          <ul className="list-disc pl-5 space-y-1">
                            <li>
                              Consider both popularity (votes) and technical
                              feasibility when evaluating proposals
                            </li>
                            <li>
                              Encourage team discussion around top-voted ideas
                            </li>
                            <li>
                              Look for opportunities to combine strengths from
                              different proposals
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-indigo-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-gray-700 mb-2">
                    No proposals submitted yet
                  </h3>
                  <p className="text-gray-500 text-sm max-w-md mx-auto">
                    Waiting for team members to submit their innovative
                    solutions.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
