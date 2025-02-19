"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FiUser,
  FiLogOut,
  FiPlusCircle,
  FiUsers,
  FiAlertTriangle,
  FiCalendar,
  FiLoader,
  FiClipboard,
  FiLinkedin,
  FiGithub,
  FiMenu,
  FiX,
  FiCheckSquare,
  FiDollarSign,
  FiMessageSquare, // <-- Import the chat icon
} from "react-icons/fi";
import { FaGoogle } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import jwt from "jsonwebtoken";

export default function Home() {
  const [userName, setUserName] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loadingCard, setLoadingCard] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your personal assistant. How can I help?",
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const messageListRef = useRef(null);
  const router = useRouter();

  // Auto-scroll
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    const newMessages = [...messages, { role: "user", content: userInput }];
    setMessages(newMessages);
    setUserInput("");
    setIsLoadingAI(true);

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error("Failed to contact AI service");
      }

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
    } catch (error) {
      console.error(error);
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

  const checkTokenExpiration = (token) => {
    try {
      const decodedToken = jwt.decode(token);
      if (decodedToken && decodedToken.exp) {
        const currentTime = Date.now() / 1000;
        return decodedToken.exp < currentTime;
      }
      return true;
    } catch (error) {
      return true;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("name");

    if (token && name) {
      if (checkTokenExpiration(token)) {
        toast.info("Your session has expired. Please log in again.");
        setTimeout(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("name");
          router.push("/login");
        }, 2000);
      } else {
        setUserName(name);
        // Decode the token to get the role
        const decoded = jwt.decode(token);
        if (decoded && decoded.role) {
          setUserRole(decoded.role);
        }
      }
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    localStorage.clear();
    setUserName(null);
    router.push("/login");
  };

  const handleNavigation = async (path, api = null) => {
    setLoadingCard(path);
    try {
      if (api) {
        const token = localStorage.getItem("token");
        const response = await fetch(api, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.pending) {
          toast.info(
            "You have already applied for leave and it is under review."
          );
          return;
        }
      }
      router.push(path);
    } catch (error) {
      toast.error("An error occurred while navigating.");
    } finally {
      setLoadingCard(null);
    }
  };

  // Dashboard cards array
  const dashboardCards = [
    {
      path: "/customer-details",
      icon: <FiUsers className="w-6 h-6" />,
      title: "Customers & Complaints",
      description: "Manage customer records and resolve complaints",
    },
    {
      path: "/leave",
      icon: <FiCalendar className="w-6 h-6" />,
      title: "Apply for Leave",
      description: "Submit and manage your leave applications",
    },
    {
      path: "/survey",
      icon: <FiClipboard className="w-6 h-6" />,
      title: "Quick Survey",
      description: "Share feedback on working conditions",
    },
    {
      path: "/schedule-meetings",
      icon: <FiCalendar className="w-6 h-6" />,
      title: "Schedule Meetings & Manage Your Calendar",
      description:
        "Plan your meetings, invite colleagues, and keep track of schedules",
      requiresExecutive: true,
    },
    {
      path: "/tasks",
      icon: <FiCheckSquare className="w-6 h-6" />,
      title: "Task Manager",
      description: "Create, track, edit your tasks and assign tasks to others",
    },
    {
      path: "/reimbursement",
      icon: <FiDollarSign className="w-6 h-6" />,
      title: "Reimbursement",
      description: "Submit your cost details for reimbursement",
      requiresExecutive: true,
    },
    {
      href: "https://accident-profiling-frontend.vercel.app",
      icon: <FiAlertTriangle className="w-6 h-6" />,
      title: "Accident Profiling",
      description: "AI-powered accident analysis system (Tank Lorry)",
      external: true,
    },
    {
      path: "/meeting",
      icon: <FiCalendar className="w-6 h-6" />,
      title: "Book Meeting Room",
      description: "Check availability and reserve meeting rooms",
      requiresExecutive: true,
    },
    {
      path: "/calendar",
      icon: <FiCalendar className="w-6 h-6" />,
      title: "Mark your dates",
      description: "Organize personal reminders and upcoming plans",
    },
  ];

  const handleCalendarClick = () => {
    setShowCalendarPopup(true);
  };

  const handlePortalCalendar = () => {
    setShowCalendarPopup(false);
    handleNavigation("/calendar");
  };

  const handleGoogleCalendar = () => {
    setShowCalendarPopup(false);
    window.open("https://calendar.google.com", "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <ToastContainer position="top-center" autoClose={3000} />
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Bar */}
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform">
                <svg
                  className="w-5 h-5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8 12H16M16 12L12 8M16 12L12 16"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-wide">
                Portal
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {userName ? (
                <>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                    <FiUser className="text-gray-500 dark:text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {userName}
                    </span>
                  </div>

                  {/* Forum Link - always visible */}
                  <Link
                    href="https://portal-discussion-forum.onrender.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <FiMessageSquare />
                    <span>Forum</span>
                  </Link>

                  {/* Button to open AI Assistant */}
                  <button
                    onClick={() => setShowChat(true)}
                    className="px-4 py-2 bg-blue-900 text-white rounded-lg shadow"
                  >
                    Open AI Assistant
                  </button>

                  <button
                    onClick={() => router.push("/profile")}
                    className="px-4 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10 hover:bg-indigo-100 dark:hover:bg-indigo-800/20 rounded-lg transition-colors"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-800/20 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/admin"
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Admin
                  </Link>
                  <Link
                    href="/login"
                    className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                  >
                    Login
                  </Link>
                </div>
              )}
            </nav>

            {/* Mobile Navigation Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              {isMobileMenuOpen ? (
                <FiX className="w-5 h-5" />
              ) : (
                <FiMenu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-all">
            <div className="px-4 py-5 space-y-4">
              {userName ? (
                <>
                  <div className="flex items-center space-x-2 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <FiUser className="text-gray-500 dark:text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {userName}
                    </span>
                  </div>

                  {/* Forum Link in Mobile Menu */}
                  <Link
                    href="https://portal-discussion-forum.onrender.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center space-x-2">
                      <FiMessageSquare />
                      <span>Forum</span>
                    </div>
                  </Link>

                  {/* Button to open AI Assistant */}
                  <button
                    onClick={() => setShowChat(true)}
                    className="px-4 py-2 bg-blue-900 text-white rounded-lg shadow"
                  >
                    Open AI Assistant
                  </button>

                  <button
                    onClick={() => {
                      router.push("/profile");
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-800/20 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <Link
                    href="/admin"
                    className="block px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Admin
                  </Link>
                  <Link
                    href="/login"
                    className="block px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {userName ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardCards.map((item, index) => {
                // If this card is for Executives only and the user isn’t one, render it as disabled.
                if (item.requiresExecutive && userRole !== "Executive") {
                  return (
                    <div
                      key={index}
                      className="group relative bg-gray-200 rounded-xl border border-gray-200 shadow-sm transition-all opacity-50 cursor-not-allowed p-6"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <div className="absolute inset-0 rounded-xl z-10" />
                    </div>
                  );
                }

                // Special handling for the "Mark your dates" card
                if (item.path === "/calendar") {
                  return (
                    <div
                      key={index}
                      className="group relative bg-white rounded-xl border border-gray-200 hover:border-indigo-200 shadow-sm hover:shadow-md transition-all p-6"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setLoadingCard(item.path);
                          handleCalendarClick();
                          setTimeout(() => setLoadingCard(null), 500);
                        }}
                        className="absolute inset-0 w-full rounded-xl z-10"
                      />
                      {loadingCard === item.path && (
                        <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-xl">
                          <FiLoader className="w-8 h-8 animate-spin text-indigo-600" />
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={index}
                    className="group relative bg-white rounded-xl border border-gray-200 hover:border-indigo-200 shadow-sm hover:shadow-md transition-all p-6"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    {item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 rounded-xl z-10"
                      />
                    ) : (
                      <button
                        onClick={() => handleNavigation(item.path, item.api)}
                        className="absolute inset-0 w-full rounded-xl z-10"
                      />
                    )}
                    {loadingCard === item.path && (
                      <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-xl">
                        <FiLoader className="w-8 h-8 animate-spin text-indigo-600" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="max-w-md mx-auto py-12 text-center">
              <div className="mb-8">
                <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FiAlertTriangle className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Employee Portal Access
                </h2>
                <p className="text-gray-600 mb-8">
                  Sign in to access your personalized management tools
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Popup Modal for Calendar Selection */}
      {showCalendarPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75 p-4"
          onClick={() => setShowCalendarPopup(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">
                Choose Calendar
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Select where you would like to schedule your plans
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handlePortalCalendar}
                  className="flex items-center justify-center space-x-3 px-4 py-3 bg-indigo-50 
                  text-indigo-700 rounded-lg hover:bg-indigo-100 transition-all duration-200"
                >
                  <FiCalendar className="w-5 h-5" />
                  <span className="font-medium">Portal Calendar</span>
                </button>

                <button
                  onClick={handleGoogleCalendar}
                  className="flex items-center justify-center space-x-3 px-4 py-3 bg-blue-50 
                  text-blue-700 rounded-lg hover:bg-blue-100 transition-all duration-200"
                >
                  <FaGoogle className="w-5 h-5" />
                  <span className="font-medium">Calendar</span>
                </button>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowCalendarPopup(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Popup */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
          <div
            className="relative w-full max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-[slideUp_0.4s_ease-out]"
            style={{ maxHeight: "90vh" }}
          >
            {/* Close Button - unchanged */}
            <button
              onClick={() => setShowChat(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 z-10"
            >
              <svg
                className="w-6 h-6"
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

            {/* Chat Header - made slightly bigger */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-8 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-white"
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
                <h3 className="text-2xl font-bold text-white">AI Assistant</h3>
                <p className="text-base text-blue-100 opacity-90">
                  How can I help you today?
                </p>
              </div>
            </div>

            {/* Messages Container - increased padding and text size */}
            <div
              ref={messageListRef}
              className="flex-1 overflow-y-auto px-8 py-6 space-y-6 scroll-smooth"
              style={{ maxHeight: "calc(90vh - 200px)" }}
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "assistant" ? "justify-start" : "justify-end"
                  } animate-[slideUp_0.3s_ease-out]`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-3">
                      <svg
                        className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
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
                max-w-[85%] px-6 py-4 rounded-2xl shadow-sm
                ${
                  msg.role === "assistant"
                    ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                    : "bg-indigo-600 text-white ml-auto"
                }
              `}
                  >
                    <p className="text-base leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Box - increased size and padding */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4">
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
                  className="flex-1 px-6 py-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
              focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              text-base placeholder-gray-400 dark:placeholder-gray-500 
              text-gray-900 dark:text-gray-100
              transition-all duration-200"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoadingAI}
                  className={`
              flex items-center justify-center p-4 rounded-xl transition-all duration-200
              ${
                isLoadingAI
                  ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white"
              }
            `}
                >
                  {isLoadingAI ? (
                    <div className="w-6 h-6 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin" />
                  ) : (
                    <svg
                      className="w-6 h-6 transform rotate-90"
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

      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex space-x-6 justify-center md:order-2">
              {/* Existing Links */}
              <a
                href="https://nishantb66.github.io/MyPortfolio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-500"
              >
                <FiUser className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/nishantbaru"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-500"
              >
                <FiLinkedin className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/nishantb66"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-500"
              >
                <FiGithub className="w-5 h-5" />
              </a>

              {/* New 'Message me' Link */}
              <Link
                href="/contact"
                className="text-gray-400 hover:text-gray-500"
              >
                Message me
              </Link>
            </div>
            <div className="mt-4 md:mt-0 md:order-1">
              <p className="text-center text-sm text-gray-500">
                &copy; {new Date().getFullYear()} Portal. Crafted by Nishant.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
