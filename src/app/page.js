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
  FiArrowRight,
  FiFileText,
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
      title: "Schedule Meetings & Invite",
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
      path: "/teams",
      icon: <FiUsers className="w-6 h-6" />,
      title: "Teams & Assignments",
      description: "Create or join a team, manage your squad’s tasks",
    },
    {
      path: "/reimbursement",
      icon: <FiDollarSign className="w-6 h-6" />,
      title: "Reimbursement",
      description: "Submit your cost details for reimbursement",
      requiresExecutive: true,
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
    // Inside the dashboardCards array in src/app/page.js
    {
      path: "/talktopdf",
      icon: <FiFileText className="w-6 h-6" />, // import FiFileText from react-icons
      title: "Talk to PDF",
      description: "Chat with your PDF documents",
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
      <header className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700/50 shadow-lg transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Bar */}
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md transform group-hover:scale-105 transition-transform duration-300">
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
              <span className="text-xl font-semibold text-white tracking-wide">
                <span className="font-bold">Portal</span>
                <span className="hidden sm:inline-block ml-1 text-indigo-300 text-sm font-normal">
                  Enterprise
                </span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
              {userName ? (
                <>
                  <div className="flex items-center space-x-2 text-sm text-slate-300 border-r border-slate-600 pr-4">
                    <div className="p-1.5 bg-slate-700 rounded-full">
                      <FiUser className="text-indigo-300" />
                    </div>
                    <span className="font-medium text-slate-100">
                      {userName}
                    </span>
                  </div>

                  {/* Forum Link - always visible */}
                  <Link
                    href="https://portal-discussion-forum.onrender.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-slate-300 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <FiMessageSquare className="text-indigo-300" />
                    <span>Forum</span>
                  </Link>

                  {/* Button to open AI Assistant */}
                  <button
                    onClick={() => setShowChat(true)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M9 12L11 14L15 10M12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>AI Assistant</span>
                    </span>
                  </button>

                  <button
                    onClick={() => router.push("/profile")}
                    className="px-4 py-1.5 text-sm font-medium text-indigo-200 bg-indigo-900/30 hover:bg-indigo-800/40 rounded-lg transition-colors"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-1.5 text-sm font-medium text-red-300 bg-red-900/20 hover:bg-red-800/30 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/admin"
                    className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
                  >
                    Admin
                  </Link>
                  <Link
                    href="/login"
                    className="px-4 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg shadow-md transition-colors"
                  >
                    Login
                  </Link>
                </div>
              )}
            </nav>

            {/* Mobile Navigation Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white rounded-md bg-slate-700/50 hover:bg-slate-700 transition-colors"
              aria-label="Toggle menu"
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
          <div className="md:hidden absolute w-full bg-slate-800 border-b border-slate-700 shadow-lg transition-all">
            <div className="px-4 py-4 space-y-3">
              {userName ? (
                <>
                  <div className="flex items-center space-x-2 pb-3 mb-2 border-b border-slate-700">
                    <div className="p-1.5 bg-slate-700 rounded-full">
                      <FiUser className="text-indigo-300" />
                    </div>
                    <span className="font-medium text-slate-100">
                      {userName}
                    </span>
                  </div>

                  {/* Forum Link in Mobile Menu */}
                  <Link
                    href="https://portal-discussion-forum.onrender.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-3 py-2.5 text-sm font-medium text-slate-300 rounded-lg bg-slate-700/40 hover:bg-slate-700/60 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FiMessageSquare className="text-indigo-300" />
                    <span>Forum</span>
                  </Link>

                  {/* Button to open AI Assistant */}
                  <button
                    onClick={() => {
                      setShowChat(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center space-x-2"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9 12L11 14L15 10M12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Chat with AI Assistant</span>
                  </button>

                  <button
                    onClick={() => {
                      router.push("/profile");
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-3 py-2.5 text-center text-sm font-medium text-slate-100 bg-slate-700/50 hover:bg-slate-700/70 rounded-lg transition-colors"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-3 py-2.5 text-center text-sm font-medium text-red-300 bg-red-900/20 hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <Link
                    href="/admin"
                    className="block w-full px-3 py-2.5 text-center text-sm font-medium text-slate-300 bg-slate-700/40 hover:bg-slate-700/60 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Admin
                  </Link>
                  <Link
                    href="/login"
                    className="block w-full px-3 py-2.5 text-center text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg shadow-md transition-colors"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {dashboardCards.map((item, index) => {
                // Executive-only disabled cards
                if (item.requiresExecutive && userRole !== "Executive") {
                  return (
                    <div
                      key={index}
                      className="group relative bg-gradient-to-br from-gray-50/50 to-gray-100/30 rounded-2xl border-2 border-dashed border-gray-100 cursor-not-allowed p-5 sm:p-6"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-white text-gray-400 rounded-xl flex items-center justify-center shadow-sm">
                          {item.icon}
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-400">
                            {item.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-400/80">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,_transparent,_transparent_4px,_rgba(255,255,255,0.8)_4px,_rgba(255,255,255,0.8)_6px)] rounded-2xl z-10" />
                    </div>
                  );
                }

                // Calendar card special treatment
                if (item.path === "/calendar") {
                  return (
                    <div
                      key={index}
                      className="group relative bg-white rounded-2xl border border-gray-100 hover:border-indigo-100 shadow-xs hover:shadow-md transition-all p-5 sm:p-6"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                          {item.icon}
                          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs border-2 border-white">
                            <FiCalendar className="w-3 h-3" />
                          </div>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                            {item.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600">
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
                        className="absolute inset-0 w-full rounded-2xl z-10"
                      />
                      {loadingCard === item.path && (
                        <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-2xl backdrop-blur-sm">
                          <FiLoader className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-indigo-600" />
                        </div>
                      )}
                    </div>
                  );
                }

                // Regular cards
                return (
                  <div
                    key={index}
                    className="group relative bg-white rounded-2xl border border-gray-100 hover:border-indigo-100 shadow-xs hover:shadow-md transition-all p-5 sm:p-6"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                        {item.icon}
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                          {item.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    {item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 rounded-2xl z-10"
                      />
                    ) : (
                      <button
                        onClick={() => handleNavigation(item.path, item.api)}
                        className="absolute inset-0 w-full rounded-2xl z-10"
                      />
                    )}
                    {loadingCard === item.path && (
                      <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-2xl backdrop-blur-sm">
                        <FiLoader className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-indigo-600" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="max-w-md mx-auto py-12 sm:py-16 text-center">
              <div className="space-y-6">
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
                  <FiAlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-600/80" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Employee Portal Access
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base max-w-xs mx-auto">
                    Authenticate to access your management dashboard
                  </p>
                </div>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-6 py-3.5 sm:py-3 text-sm sm:text-base font-medium rounded-xl shadow-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Get Started
                  <FiArrowRight className="ml-2 w-4 h-4" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          {/* Backdrop with modern blur */}
          <div
            className="absolute inset-0 bg-gray-800/40 backdrop-blur-[6px]"
            onClick={() => setShowChat(false)}
          />

          {/* Main Chat Container */}
          <div
            className="relative w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden animate-[slideUp_0.3s_ease-out]"
            style={{ maxHeight: "85vh" }}
          >
            {/* Close Button - Redesigned */}
            <button
              onClick={() => setShowChat(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-all duration-200 z-10 group"
              aria-label="Close chat"
            >
              <svg
                className="w-5 h-5 transform group-hover:rotate-90 transition-transform duration-200"
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

            {/* Chat Header - Modern Design */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4-4-4z"
                      />
                    </svg>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    AI Assistant
                  </h3>
                  <p className="text-blue-100 text-[15px] mt-0.5">
                    Ready to help you with any questions
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Container - Enhanced */}
            <div
              ref={messageListRef}
              className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scroll-smooth"
              style={{ maxHeight: "calc(85vh - 230px)" }}
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "assistant" ? "justify-start" : "justify-end"
                  } animate-[fadeIn_0.3s_ease-out]`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mr-4 mt-2">
                      <svg
                        className="w-6 h-6 text-blue-600"
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
                    ? "bg-white border border-gray-100 text-gray-700"
                    : "bg-blue-600 text-white ml-auto"
                }
              `}
                  >
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Box - Modern Design */}
            <div className="p-6 bg-gray-50 border-t border-gray-100">
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
                  className="flex-1 px-6 py-4 rounded-xl bg-white border border-gray-200 
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
              text-[15px] placeholder-gray-400 text-gray-700
              transition-all duration-200 shadow-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoadingAI}
                  className={`
              flex items-center justify-center p-4 rounded-xl transition-all duration-200
              ${
                isLoadingAI
                  ? "bg-gray-100 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-sm hover:shadow"
              }
            `}
                >
                  {isLoadingAI ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  ) : (
                    <svg
                      className="w-5 h-5 text-white transform rotate-90"
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
