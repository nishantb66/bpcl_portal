"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FiMenu, FiX } from "react-icons/fi";
import Link from "next/link";

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

export default function LeaveApplication() {
  const router = useRouter();

  // ----------------- Existing Non-UI State & Logic -----------------
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [pendingApplication, setPendingApplication] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setEmail(payload.email);
      setName(localStorage.getItem("name"));

      // Check for pending leave application
      fetch("/api/status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.pending) {
            setPendingApplication(data.application);
          }
        });
    } catch (error) {
      router.push("/login");
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setIsSubmitting(true);

    if (!fromDate || !toDate || !reason) {
      alert("All fields are required");
      setLoading(false);
      setIsSubmitting(false);
      return;
    }

    if (new Date(toDate) < new Date(fromDate)) {
      alert("To Date must be after From Date");
      setLoading(false);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/leave", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ fromDate, toDate, reason }),
      });

      const data = await response.json();
      if (response.ok) {
        // Show success animation, then redirect
        setTimeout(() => {
          setIsSubmitting(false);
          setIsSuccess(true);
          setTimeout(() => router.push("/"), 2000);
        }, 3000);
      } else {
        throw new Error(data.message || "Submission failed");
      }
    } catch (error) {
      setIsSubmitting(false);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };
  // ------------------------------------------------------------------

  // -------------------- AI Chat State & Logic --------------------
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! How can I assist you with your leave information today?",
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const messageListRef = useRef(null);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    const newMessages = [...messages, { role: "user", content: userInput }];
    setMessages(newMessages);
    setUserInput("");
    setIsLoadingAI(true);

    const response = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`, // Pass the JWT
      },
      body: JSON.stringify({ messages: newMessages }),
    });

    if (!response.ok) {
      setIsLoadingAI(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Oops, something went wrong with the AI service.",
        },
      ]);
      return;
    }

    // Stream the AI response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value || new Uint8Array(), {
        stream: !doneReading,
      });

      setMessages((prev) => {
        // If the last message is from the assistant, append chunk
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

    setIsLoadingAI(false);
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);
  // ------------------------------------------------------------------

  // If user already has a pending leave application, show the status screen
  if (pendingApplication) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
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
                Your leave AI Assistant
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
        {/* Pending Application Content */}
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold text-center text-indigo-700 mb-8">
              Leave Application Status
            </h2>
            <div className="space-y-6">
              {/* User Info Card */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {name}
                    </h3>
                    <p className="text-sm text-gray-600">{email}</p>
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Date
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(pendingApplication.fromDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Date
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(pendingApplication.toDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <p className="text-gray-900 whitespace-pre-line">
                  {pendingApplication.reason}
                </p>
              </div>

              {/* Status */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Application Status
                </label>
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      pendingApplication.status === "Pending"
                        ? "bg-yellow-100"
                        : pendingApplication.status === "Approved"
                        ? "bg-green-100"
                        : "bg-red-100"
                    }`}
                  >
                    {pendingApplication.status === "Pending" && (
                      <svg
                        className="w-6 h-6 text-yellow-600"
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
                    )}
                    {pendingApplication.status === "Approved" && (
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                    {pendingApplication.status === "Rejected" && (
                      <svg
                        className="w-6 h-6 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {pendingApplication.status}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {pendingApplication.status === "Pending"
                        ? "Your application is under review."
                        : pendingApplication.status === "Approved"
                        ? "Your application has been approved."
                        : "Your application has been rejected."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* AI Chat Popup */}
        {showChat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
            <div
              className="relative w-full max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-[slideUp_0.4s_ease-out]"
              style={{ maxHeight: "85vh" }}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowChat(false)}
                className="absolute top-3 right-3 p-2 rounded-full text-black hover:text-black hover:bg-black dark:hover:bg-black transition-all duration-200"
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
                    AI Leave Assistant
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
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                        <svg
                          className="w-5 h-5 text-indigo-600"
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
                      className={`
                max-w-[80%] px-4 py-3 rounded-2xl shadow-sm
                ${
                  msg.role === "assistant"
                    ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                    : "bg-indigo-600 text-white ml-auto"
                }
              `}
                    >
                      <p className="text-sm">{msg.content}</p>
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
                    className="flex-1 px-4 py-3 rounded-lg text-white bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
              focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              text-sm placeholder-gray-400 transition-all duration-200"
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
      </div>
    );
  }

  // -------------------------------------------------------------
  // If there's no pending leave, show the normal form + top nav
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
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

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-lg relative">
          {/* Overlay for Submitting or Success */}
          {(isSubmitting || isSuccess) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              {isSubmitting && (
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
              )}
              {isSuccess && (
                <div className="flex flex-col items-center animate-scaleIn">
                  <svg
                    className="checkmark"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 52 52"
                    width="64"
                    height="64"
                  >
                    <circle
                      className="checkmark__circle"
                      cx="26"
                      cy="26"
                      r="25"
                      fill="none"
                      stroke="#4BB543"
                      strokeWidth="4"
                    />
                    <path
                      className="checkmark__check"
                      fill="none"
                      stroke="#4BB543"
                      strokeWidth="4"
                      d="M14.1 27.2l7.1 7.2 16.7-16.8"
                    />
                  </svg>
                  <p className="text-white mt-4 text-lg font-medium">
                    Leave application submitted successfully!
                  </p>
                </div>
              )}
            </div>
          )}

          <h2 className="text-3xl font-bold text-center text-indigo-700 mb-8">
            Apply for Leave
          </h2>

          {/* The Leave Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  disabled
                  className="w-full p-3 border rounded-lg bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full p-3 border rounded-lg bg-gray-100 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={fromDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setFromDate(e.target.value)}
                  required
                  className="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || new Date().toISOString().split("T")[0]}
                  onChange={(e) => setToDate(e.target.value)}
                  required
                  className="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                rows="4"
                placeholder="Provide a detailed reason for leave..."
              />
            </div>

            <div className="text-sm text-gray-600 italic mt-4">
              <p>
                Note: Applying for a leave within 30 days of a previously
                approved leave may result in rejection.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full p-3 text-white font-semibold rounded-lg transition-all ${
                loading
                  ? "bg-indigo-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              Submit Application
            </button>
          </form>
        </div>
      </main>

      {/* AI Chat Popup */}
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
                  AI Leave Assistant
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
                    className={`
                max-w-[80%] px-4 py-3 rounded-2xl shadow-sm
                ${
                  msg.role === "assistant"
                    ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                    : "bg-indigo-600 text-white ml-auto"
                }
              `}
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
    </div>
  );
}
