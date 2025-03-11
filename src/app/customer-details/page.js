"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { FiMenu, FiX } from "react-icons/fi";

export default function CustomerDetails() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // -------------------- AI Chat State & Logic --------------------
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your AI Complaints Assistant. How can I help?",
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const messageListRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

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

  // Send user input to AI route
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    const newMessages = [...messages, { role: "user", content: userInput }];
    setMessages(newMessages);
    setUserInput("");
    setIsLoadingAI(true);

    try {
      const response = await fetch("/api/complaints-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // We pass the JWT token in Authorization for the server to decode
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error("Failed to contact AI service");
      }

      // Stream the response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value || new Uint8Array(), {
          stream: !doneReading,
        });

        // Append chunk to the last assistant message
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.role === "assistant") {
            return [
              ...prev.slice(0, -1),
              { ...lastMsg, content: lastMsg.content + chunkValue },
            ];
          } else {
            return [...prev, { role: "assistant", content: chunkValue }];
          }
        });
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Oops, something went wrong. Please try again later.",
        },
      ]);
    } finally {
      setIsLoadingAI(false);
    }
  };
  // --------------------------------------------------------------

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      fetchComplaints();
    }
  }, [router]);

  const fetchComplaints = async () => {
    try {
      const response = await fetch("/api/complaints");
      if (!response.ok) throw new Error("Failed to fetch complaints");
      const data = await response.json();
      setComplaints(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-gray-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left side: Title & Subtitle */}
          <div className="flex items-center space-x-2">
            <h1 className="text-white text-xl font-bold">Portal</h1>
            <span className="text-xs text-gray-300">Crafted by Nishant</span>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="text-white hover:text-gray-300 sm:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center space-x-4">
            <Link
              href="/"
              className="text-sm font-medium text-white hover:text-gray-300 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/profile"
              className="text-sm font-medium text-white hover:text-gray-300 transition-colors"
            >
              Profile
            </Link>
            {/* AI Complaints Analyzer Button */}
            <button
              type="button"
              onClick={() => setShowChat(true)}
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-md transition-colors"
            >
              AI Complaints Analyzer
            </button>
          </nav>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden bg-gray-800 px-4 py-2">
            <nav className="flex flex-col space-y-2">
              <Link
                href="/"
                className="text-sm font-medium text-white hover:text-gray-300 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/profile"
                className="text-sm font-medium text-white hover:text-gray-300 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Profile
              </Link>
              {/* AI Complaints Analyzer Button */}
              <button
                type="button"
                onClick={() => {
                  setShowChat(true);
                  setIsMobileMenuOpen(false);
                }}
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-md transition-colors"
              >
                AI Complaints Analyzer
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-700 bg-white rounded-lg border border-indigo-700 hover:bg-indigo-50 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Customer Management
        </h1>

        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Link href="/customer-details/fill-info">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 hover:border-indigo-300">
              <h2 className="text-xl font-semibold text-indigo-700 mb-2">
                Customer Details Form
              </h2>
              <p className="text-gray-600">
                Record customer information and transaction details
              </p>
            </div>
          </Link>

          <Link href="/customer-details/complaints">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 hover:border-indigo-300">
              <h2 className="text-xl font-semibold text-indigo-700 mb-2">
                Customer Complaints
              </h2>
              <p className="text-gray-600">
                Manage and track customer complaints and feedback
              </p>
            </div>
          </Link>
        </div>

        {/* Complaints Table */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
            Customer Complaints
          </h2>
          <p className="text-gray-500 mb-6">
            (Click the eye icon to view the message from administration)
          </p>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading complaints...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-red-600">{error}</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <p className="text-indigo-800">No complaints found</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-indigo-50">
                  <tr>
                    {[
                      "Customer Name",
                      "Petrol Pump Location",
                      "Complaint Details",
                      "Type",
                      "Urgency",
                      "Status",
                      "Created At",
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {complaints.map((complaint) => (
                    <tr key={complaint._id} className="hover:bg-gray-50">
                      <td
                        className="px-6 py-4 text-sm text-gray-800 cursor-pointer hover:bg-indigo-50 group"
                        onClick={() => setSelectedComplaint(complaint)}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="border-b border-dashed border-gray-400 group-hover:border-indigo-500">
                            {complaint.customerName}
                          </span>
                          <svg
                            className="w-4 h-4 text-gray-400 group-hover:text-indigo-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {complaint.petrolPumpLocation || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {complaint.complaintDetails}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {complaint.type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span
                          className={`inline-block h-3 w-3 rounded-full mr-2 ${
                            complaint.urgency === "High"
                              ? "bg-red-500"
                              : complaint.urgency === "Medium"
                              ? "bg-yellow-500"
                              : "bg-gray-400"
                          }`}
                        ></span>
                        {complaint.urgency}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            complaint.status === "Resolved"
                              ? "bg-green-100 text-green-800"
                              : complaint.status === "In Progress"
                              ? "bg-orange-100 text-orange-800"
                              : complaint.status === "Ignored"
                              ? "bg-red-100 text-red-800"
                              : "bg-indigo-100 text-indigo-800"
                          }`}
                        >
                          {complaint.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal for complaint details */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Complaint Resolution Details
              </h3>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action Taken
                </label>
                <p className="p-2 bg-gray-50 rounded-md text-gray-700">
                  {selectedComplaint.action || "No action provided"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resolution Message
                </label>
                <p className="p-2 bg-gray-50 rounded-md text-gray-700 h-32 overflow-y-auto">
                  {selectedComplaint.message || "No message provided"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- AI Complaints Analyzer Popup ---------------- */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
          <div
            className="relative w-full max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-[slideUp_0.4s_ease-out]"
            style={{ maxHeight: "85vh" }}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowChat(false)}
              className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 z-10"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Chat Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-6 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  AI Complaints Assistant
                </h3>
                <p className="text-sm text-blue-100 opacity-90">
                  Always here to help
                </p>
              </div>
            </div>

            {/* Messages Container */}
            <div
              ref={messageListRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth"
              style={{ maxHeight: "calc(85vh - 180px)" }}
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "assistant" ? "justify-start" : "justify-end"
                  } animate-[slideUp_0.3s_ease-out]`}
                >
                  {/* Assistant Avatar */}
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-2">
                      <svg
                        className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm ${
                      msg.role === "assistant"
                        ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                        : "bg-indigo-600 text-white ml-auto"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Box */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 px-4 py-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                    focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                    text-sm placeholder-gray-400 dark:placeholder-gray-500 
                    text-gray-900 dark:text-gray-100
                    transition-all duration-200"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoadingAI}
                  className={`
                    flex items-center justify-center p-3 rounded-lg transition-all duration-200
                    ${
                      isLoadingAI
                        ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white"
                    }
                  `}
                >
                  {isLoadingAI ? (
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin" />
                  ) : (
                    <svg
                      className="w-5 h-5 transform rotate-90"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ---------------- End AI Complaints Analyzer Popup ---------------- */}
    </div>
  );
}
