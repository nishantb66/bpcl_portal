"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import jwt from "jsonwebtoken";

export default function HackathonPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hackathon, setHackathon] = useState(null);
  const [isLeader, setIsLeader] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaDescription, setIdeaDescription] = useState("");

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

  const startStr = new Date(hackathon.startDateTime).toLocaleString();
  const endStr = new Date(hackathon.endDateTime).toLocaleString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Event Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-3 flex-1">
              <h1 className="text-3xl font-bold text-gray-900 bg-clip-text">
                {hackathon.topic}
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed">
                {hackathon.description}
              </p>
            </div>
            <div className="bg-gray-50 p-5 rounded-lg min-w-[280px] space-y-3 border border-gray-100">
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Timeline
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">
                    {startStr}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">
                    {endStr}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Idea Submission */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Submit Your Proposal
          </h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Title
              </label>
              <input
                type="text"
                value={ideaTitle}
                onChange={(e) => setIdeaTitle(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder="Enter your innovative project name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Technical Approach
              </label>
              <textarea
                value={ideaDescription}
                onChange={(e) => setIdeaDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder="Describe your technical implementation strategy..."
              />
            </div>
            <button
              onClick={handleAddIdea}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium text-sm transition-all transform hover:scale-[1.01]"
            >
              Submit Proposal
            </button>
          </div>
        </div>

        {/* Community Proposals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Community Proposals
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            {hackathon.ideas?.length > 0 ? (
              hackathon.ideas.map((idea) => {
                const hasLiked = idea.likes.includes(currentUserEmail);
                const isAuthor = idea.authorEmail === currentUserEmail;
                return (
                  <div
                    key={idea._id}
                    className="group border border-gray-150 rounded-lg p-5 hover:border-indigo-100 transition-all hover:shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-base font-semibold text-gray-900">
                        {idea.title}
                      </h3>
                      <span className="text-xs text-gray-400">
                        {new Date(idea.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                      {idea.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <button
                          disabled={isAuthor || hasLiked}
                          onClick={() => handleLikeIdea(idea._id)}
                          className={`p-1.5 rounded-md transition-all ${
                            isAuthor || hasLiked
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-gray-400 hover:bg-indigo-50 hover:text-indigo-600"
                          }`}
                        >
                          <svg
                            className={`w-5 h-5 transition-colors ${
                              hasLiked ? "text-indigo-600 fill-current" : ""
                            }`}
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                            />
                          </svg>
                        </button>
                        <span className="text-xs font-medium text-gray-600">
                          {idea.likes.length}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 font-medium">
                        {isAuthor ? "Your Proposal" : ""}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-8">
                <div className="text-4xl mb-3 text-gray-200">💡</div>
                <p className="text-gray-500 text-sm">
                  No proposals submitted yet. Be the pioneer!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Leadership Dashboard */}
        {isLeader && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Team Leader Dashboard
            </h2>
            <div className="overflow-x-auto rounded-lg border border-gray-150">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proposal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Votes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {hackathon.ideas?.map((idea) => (
                    <tr
                      key={idea._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {idea.title}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {idea.authorEmail}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-medium">
                        {idea.likes.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
