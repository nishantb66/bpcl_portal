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
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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

  // For the Employee Directory
  const [showDirectoryPopup, setShowDirectoryPopup] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // for in-person message
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState([]);
  const [showMessagesPopup, setShowMessagesPopup] = useState(false);

  const [employeeMessage, setEmployeeMessage] = useState("");

  // Track whether to show the announcement
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  const [navLoading, setnavLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    // If the user is logged in (userName is set)
    // and we have NOT yet closed the banner for this session, show it
    if (userName && !localStorage.getItem("bannerClosedForThisSession")) {
      setShowAnnouncement(true);
    }
  }, [userName]);

  const handleCloseAnnouncement = () => {
    setShowAnnouncement(false);
    // Mark this banner as closed for the current login session
    localStorage.setItem("bannerClosedForThisSession", "true");
  };

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    // Remove the banner-closed flag so it shows again on next login
    localStorage.removeItem("bannerClosedForThisSession");
    localStorage.clear();
    setUserName(null);
    router.push("/login");
  };

  const handleNavigation = async (path, api = null) => {
    setnavLoading(true); // Show global loading spinner
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
          setnavLoading(false); // Hide spinner if navigation is not proceeding
          return;
        }
      }
      router.push(path);
      // No need to explicitly set navLoading false here, as a route change unmounts the component.
    } catch (error) {
      toast.error("An error occurred while navigating.");
      setnavLoading(false);
    }
  };

  function handleEmployeeDirectory() {
    // 1. Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You are not logged in. Please log in first.");
      return;
    }

    // 2. Check user role
    if (userRole !== "Executive") {
      alert(
        "According to your designation, you cannot view Employee Directory."
      );
      return;
    }

    // 3. If Executive, show the popup
    setShowDirectoryPopup(true);
  }

  async function handleSearchEmployees(query) {
    try {
      // only if user is Executive, but we already gate that
      const token = localStorage.getItem("token");
      if (!token) return;

      // fetch from /api/employees?q={query}
      const response = await fetch(
        `/api/employees?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }
      const data = await response.json();
      setSearchResults(data.employees || []);
    } catch (err) {
      console.error(err);
      setSearchResults([]);
    }
  }

  // Function to fetch unread messages count (and data)
  const fetchUnreadMessages = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch("/api/messages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadMessages(data.messages);
        setUnreadCount(data.messages.length);
      }
    } catch (error) {
      console.error("Error fetching unread messages:", error);
    }
  };

  // Call fetchUnreadMessages on component mount (and optionally at intervals)
  useEffect(() => {
    if (userName) {
      fetchUnreadMessages();
      // Optionally, you could poll every few minutes:
      // const interval = setInterval(fetchUnreadMessages, 60000);
      // return () => clearInterval(interval);
    }
  }, [userName]);

  // Function to open the Messages popup and mark them as read
  const handleOpenMessages = async () => {
    setShowMessagesPopup(true);
    // Call PATCH to mark messages as read
    const token = localStorage.getItem("token");
    try {
      await fetch("/api/messages", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking messages as read:", error);
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
      title: "Talk to PDF (Beta)",
      description: "Chat with your PDF documents",
    },
    {
      path: "/employee-directory",
      icon: <FiUsers className="w-6 h-6" />,
      title: "Employee Directory and Messaging",
      description: "Search and view employee details",
      requiresExecutive: true,
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
      {navLoading && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/80 z-50">
          <FiLoader className="animate-spin w-12 h-12 text-indigo-600" />
          <span className="mt-4 text-lg font-medium text-gray-600">
            Loading...
          </span>
        </div>
      )}

      {/* Announcement Banner */}
      {showAnnouncement && (
        <div className="relative overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 animate-gradient-x"></div>

          {/* Subtle pattern overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3Ccircle cx='13' cy='13' r='1'/%3E%3C/g%3E%3C/svg%3E\")",
            }}
          ></div>

          {/* Banner content with animation */}
          <div className="relative px-4 py-3 sm:px-6 animate-fade-in-down">
            <div className="flex items-center justify-center max-w-5xl mx-auto">
              {/* Left icon */}
              <div className="hidden md:flex flex-shrink-0 items-center mr-3">
                <div className="bg-white/20 p-1.5 rounded-full">
                  <svg
                    className="w-4 h-4 text-white"
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
              </div>

              {/* Announcement content */}
              <div className="flex-1 flex items-center justify-center text-center sm:text-left">
                <p className="text-sm font-medium text-white tracking-wide leading-snug max-w-3xl">
                  <span className="hidden sm:inline font-semibold mr-1.5">
                    Welcome to Enterprise Portal.
                  </span>
                  Explore our features and tools—we're constantly adding new
                  capabilities. Have a suggestion or request?
                  <a
                    href="https://bpcl-portal.vercel.app/contact"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center ml-1.5 text-indigo-100 hover:text-white font-semibold border-b border-indigo-300/40 hover:border-white transition-colors"
                  >
                    <span>Contact me</span>
                    <svg
                      className="w-3 h-3 ml-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </a>
                </p>
              </div>

              {/* Close button with enhanced styling */}
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={handleCloseAnnouncement}
                  className="group p-1 rounded-full bg-indigo-800/40 hover:bg-indigo-800/80 border border-white/10 hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all duration-200"
                  aria-label="Dismiss notification"
                >
                  <svg
                    className="w-4 h-4 text-white/70 group-hover:text-white"
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
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    href="https://portal-discussion-forum-keng.onrender.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-slate-300 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <FiMessageSquare className="text-indigo-300" />
                    <span>Forum</span>
                  </Link>

                  {/* New Messages Nav Item */}
                  <button
                    onClick={handleOpenMessages}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-slate-300 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <FiMessageSquare className="text-indigo-300" />
                    <span>Messages</span>
                    {unreadCount > 0 && (
                      <span className="ml-1 bg-red-500 text-white rounded-full px-2 text-xs">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* AI Assistant Button with Tooltip */}
                  <div className="relative group">
                    <button
                      onClick={() => setShowChat(true)}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white rounded-xl 
    shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 
    border border-blue-500/20 hover:border-blue-500/30"
                      aria-label="Open AI Assistant"
                    >
                      <span className="flex items-center gap-3">
                        <div className="relative">
                          <svg
                            className="w-5 h-5 animate-pulse"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3Z"
                              className="stroke-current"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                            <path
                              d="M9 12L11 14L15 10"
                              className="stroke-current"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          {/* <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-white" /> */}
                        </div>
                        <span className="font-medium tracking-wide">
                          AI Assistant
                        </span>
                      </span>
                    </button>

                    {/* Modern Hover Description Tooltip - Now appears below the button */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 opacity-0 group-hover:opacity-100 
    transition-opacity duration-200 pointer-events-none z-50"
                    >
                      <div className="bg-gray-900 text-white p-4 rounded-xl shadow-xl">
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 bg-blue-500/20 rounded-lg">
                            <svg
                              className="w-4 h-4 text-blue-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white/90">
                              Advanced AI Assistant
                            </p>
                            <p className="text-xs text-white/70 mt-1 leading-relaxed">
                              Powered by advanced AI, capable of handling
                              complex questions with detailed reasoning and
                              explanations.
                            </p>
                          </div>
                        </div>
                        {/* Tooltip Arrow - Now points upward */}
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-1/2">
                          <div className="w-3 h-3 bg-gray-900 transform rotate-45" />
                        </div>
                      </div>
                    </div>
                  </div>

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
                    href="https://portal-discussion-forum-keng.onrender.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-3 py-2.5 text-sm font-medium text-slate-300 rounded-lg bg-slate-700/40 hover:bg-slate-700/60 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FiMessageSquare className="text-indigo-300" />
                    <span>Forum</span>
                  </Link>

                  {/* Mobile Messages Nav Item */}
                  <button
                    onClick={() => {
                      handleOpenMessages();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 px-3 py-2.5 text-sm font-medium text-slate-300 rounded-lg bg-slate-700/40 hover:bg-slate-700/60 transition-colors"
                  >
                    <FiMessageSquare className="text-indigo-300" />
                    <span>Messages</span>
                    {unreadCount > 0 && (
                      <span className="ml-1 bg-red-500 text-white rounded-full px-2 text-xs">
                        {unreadCount}
                      </span>
                    )}
                  </button>

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

                // If the item.path === "/employee-directory", override the behavior:
                if (item.path === "/employee-directory") {
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
                      <button
                        onClick={() => handleEmployeeDirectory()}
                        className="absolute inset-0 w-full rounded-2xl z-10"
                      />
                    </div>
                  );
                }

                // TEAMS & ASSIGNMENTS CARD with a hover tooltip
                if (item.path === "/teams") {
                  return (
                    <div
                      key={index}
                      className="group relative bg-white rounded-2xl border border-gray-100 
        hover:border-indigo-100 shadow-xs hover:shadow-md transition-all p-5 sm:p-6"
                    >
                      {/* Card Content */}
                      <div className="flex items-start space-x-4">
                        <div
                          className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 
          bg-indigo-50 text-indigo-600 rounded-xl flex items-center 
          justify-center shadow-sm"
                        >
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

                      {/* Enhanced HOVER TOOLTIP with animation and better styling */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-64 
  opacity-0 pointer-events-none scale-95 
  group-hover:opacity-100 group-hover:pointer-events-auto group-hover:scale-100
  transition-all duration-300 ease-in-out z-20"
                      >
                        <div
                          className="bg-gradient-to-b from-gray-900 to-gray-800 p-4 rounded-xl 
  shadow-lg shadow-gray-900/20 border border-gray-700 backdrop-blur-sm"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="text-amber-400 flex-shrink-0 mt-0.5">
                              <svg
                                className="w-5 h-5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-medium text-white mb-1 text-sm">
                                Desktop Recommended
                              </h4>
                              <p className="text-gray-300 text-xs leading-relaxed">
                                This feature is optimized for PC, desktop or
                                laptop devices for the best experience.
                              </p>
                            </div>
                          </div>

                          {/* Improved tooltip arrow with subtle shadow */}
                          <div className="absolute left-1/2 bottom-0 w-4 h-4 -translate-x-1/2 translate-y-1/2">
                            <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rotate-45 rounded-sm border-r border-b border-gray-700 shadow-sm"></div>
                          </div>
                        </div>
                      </div>

                      {/* Invisible Button to make the card clickable */}
                      <button
                        onClick={() => handleNavigation(item.path, item.api)}
                        className="absolute inset-0 w-full rounded-2xl z-10"
                      />

                      {/* Loading Overlay if needed */}
                      {loadingCard === item.path && (
                        <div
                          className="absolute inset-0 bg-white/90 flex items-center justify-center 
          rounded-2xl backdrop-blur-sm"
                        >
                          <FiLoader className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-indigo-600" />
                        </div>
                      )}
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
                {/* Additional Options for Non-Authenticated Users */}
                <div className="mt-4 flex flex-col items-center space-y-2">
                  <Link
                    href="#"
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    View Documentation
                  </Link>
                  <Link
                    href="#"
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    Video Guide
                  </Link>
                </div>
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
          {/* Backdrop with glass morphism effect */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-gray-900/60 to-blue-900/30 backdrop-blur-[8px]"
            onClick={() => setShowChat(false)}
          />

          {/* Main Chat Container */}
          <div className="relative w-full max-w-4xl mx-auto bg-white/95 backdrop-blur-[12px] rounded-[1.75rem] shadow-2xl shadow-blue-900/20 flex flex-col overflow-hidden">
            <div className="flex flex-col h-[85vh] max-h-[800px]">
              {/* Header Section */}
              <div className="px-6 py-4 border-b border-gray-100/50 bg-gradient-to-r from-blue-600 to-indigo-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4-4-4z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-white">
                      Enterprise AI Assistant
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowChat(false)}
                    className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10"
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
                </div>
                <p className="mt-1 text-sm text-blue-100/90">
                  Advanced multi-model AI with enterprise-grade security
                </p>
              </div>

              {/* Messages Container */}
              <div
                ref={messageListRef}
                className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scroll-smooth"
              >
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.role === "assistant" ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-[1.25rem] p-4 ${
                        msg.role === "assistant"
                          ? "bg-white shadow-sm border border-gray-100/70 ml-2"
                          : "bg-blue-600 text-white shadow-md mr-2"
                      }`}
                    >
                      <div className="prose prose-sm break-words">
                        <ReactMarkdown
                          components={{
                            h1: ({ node, ...props }) => (
                              <h3
                                className="text-lg font-semibold mb-2"
                                {...props}
                              />
                            ),
                            h2: ({ node, ...props }) => (
                              <h4
                                className="text-base font-medium mb-2"
                                {...props}
                              />
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc pl-5 space-y-1.5 mb-2">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal pl-5 space-y-1.5 mb-2">
                                {children}
                              </ol>
                            ),
                            code: ({ inline, className, children, ...props }) =>
                              inline ? (
                                <code className="bg-gray-100/80 px-1.5 py-0.5 rounded text-sm font-mono">
                                  {children}
                                </code>
                              ) : (
                                <pre className="bg-gray-50 p-3 rounded-lg overflow-x-auto text-sm my-2">
                                  <code className="font-mono">{children}</code>
                                </pre>
                              ),
                            table: ({ children }) => (
                              <div className="overflow-x-auto">
                                <table className="min-w-full border-collapse border-spacing-0 my-2">
                                  {children}
                                </table>
                              </div>
                            ),
                            th: ({ children }) => (
                              <th className="px-3 py-2 bg-gray-100/50 text-left text-sm font-semibold border-b-2 border-gray-200">
                                {children}
                              </th>
                            ),
                            td: ({ children }) => (
                              <td className="px-3 py-2 text-sm border-b border-gray-100/50">
                                {children}
                              </td>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold">
                                {children}
                              </strong>
                            ),
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                className="text-blue-600 hover:text-blue-700 underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Section with Disclaimer */}
              <div className="border-t border-gray-100/50 bg-gray-50/30 px-4 py-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-1 relative">
                    <textarea
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Ask me anything about enterprise operations..."
                      className="w-full px-4 py-3 pr-12 text-sm rounded-[1rem] border border-gray-200/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 resize-none"
                      rows="1"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={isLoadingAI}
                      className={`absolute right-3 top-3 p-1.5 rounded-full ${
                        isLoadingAI
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-blue-600 hover:bg-blue-100/50"
                      }`}
                    >
                      {isLoadingAI ? (
                        <svg
                          className="w-5 h-5 animate-spin"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center space-x-2 px-2">
                  <svg
                    className="w-4 h-4 text-gray-400/80"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-xs text-gray-500/80">
                    AI-powered responses - May occasionally generate
                    inaccuracies. Verify critical information through official
                    channels.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Directory Popup */}
      {showDirectoryPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          {/* Backdrop with blur effect */}
          <div
            className="absolute inset-0 bg-gray-900/70 backdrop-blur-md transition-opacity duration-300"
            onClick={() => {
              setShowDirectoryPopup(false);
              setEmployeeSearch("");
              setSearchResults([]);
              setSelectedEmployee(null);
            }}
          />

          {/* Popup Container */}
          <div className="relative w-full max-w-xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden transition-all transform duration-300 ease-out">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-indigo-200"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Employee Directory
                </h2>
                <button
                  onClick={() => {
                    setShowDirectoryPopup(false);
                    setEmployeeSearch("");
                    setSearchResults([]);
                    setSelectedEmployee(null);
                  }}
                  className="p-1.5 rounded-full text-white hover:bg-white/20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/40"
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
              </div>
            </div>

            <div className="p-6">
              {/* Search Bar */}
              {!selectedEmployee && (
                <>
                  <div className="mb-6">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={employeeSearch}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          setEmployeeSearch(inputValue);

                          if (inputValue.trim().length > 0) {
                            handleSearchEmployees(inputValue);
                          } else {
                            // Clear results if the input is empty
                            setSearchResults([]);
                          }
                        }}
                        placeholder="Search by name or email..."
                        className="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                      />
                    </div>
                  </div>

                  {/* Search Results */}
                  <div className="flex-1 overflow-y-auto space-y-1.5 max-h-64 pb-2 -mx-2 px-2 custom-scrollbar">
                    {employeeSearch.length > 0 && searchResults.length === 0 ? (
                      <div className="text-center py-10">
                        <svg
                          className="mx-auto h-14 w-14 text-gray-300 dark:text-gray-600"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm font-medium">
                          No matching employees found
                        </p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="space-y-1.5">
                        {searchResults.map((emp, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedEmployee(emp)}
                            className="p-3.5 hover:bg-indigo-50 dark:hover:bg-gray-700/60 rounded-xl cursor-pointer group transition-colors duration-150 border border-transparent hover:border-indigo-100 dark:hover:border-gray-700"
                          >
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-11 w-11 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm shadow-sm">
                                {emp.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </div>
                              <div className="ml-4 flex-1">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-400">
                                  {emp.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {emp.email}
                                </p>
                              </div>
                              <div className="ml-2">
                                <svg
                                  className="h-5 w-5 text-gray-400 group-hover:text-indigo-500"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </>
              )}

              {/* Selected Employee Details */}
              {selectedEmployee && (
                <div className="flex-1 flex flex-col">
                  <div className="text-center mb-6">
                    <div className="inline-flex h-24 w-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 items-center justify-center text-indigo-600 dark:text-indigo-400 text-2xl font-bold mb-4 shadow-md">
                      {selectedEmployee.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                      {selectedEmployee.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedEmployee.email}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl p-5 mb-6 shadow-inner">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-white dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Role
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {selectedEmployee.role}
                        </p>
                      </div>
                      <div className="p-4 bg-white dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Employee ID
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {selectedEmployee.emp_id}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Send Message Section */}
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">
                      Send a Message:
                    </h4>
                    <textarea
                      value={employeeMessage}
                      onChange={(e) => setEmployeeMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="w-full border border-gray-200 dark:border-gray-600 rounded-lg p-3 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      rows="3"
                    />
                    <button
                      onClick={async () => {
                        if (!employeeMessage.trim()) return;
                        const token = localStorage.getItem("token");
                        try {
                          const res = await fetch("/api/messages", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                              recipient: selectedEmployee.email,
                              content: employeeMessage,
                            }),
                          });
                          if (res.ok) {
                            // Optionally, show a toast or alert message
                            toast.success("Message sent!");
                            setEmployeeMessage("");
                          } else {
                            const data = await res.json();
                            toast.error(
                              data.message || "Failed to send message"
                            );
                          }
                        } catch (error) {
                          console.error("Send message error:", error);
                          toast.error("Failed to send message");
                        }
                      }}
                      className="mt-3 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow flex items-center justify-center"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                      Send Message
                    </button>
                  </div>

                  <div className="mt-6 flex justify-between">
                    <button
                      onClick={() => setSelectedEmployee(null)}
                      className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center transition-colors duration-200"
                    >
                      <svg
                        className="h-4 w-4 mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Back to Search
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages Popup Modal */}
      {showMessagesPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          {/* Backdrop with blur effect */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-gray-900/60 to-indigo-900/50 backdrop-blur-[6px]"
            onClick={() => setShowMessagesPopup(false)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-lg mx-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-indigo-500/10 overflow-hidden transform transition-all">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    <svg
                      className="w-5 h-5 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Messages
                    </h2>
                    <p className="text-sm text-blue-100/80">
                      Your unread notifications
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMessagesPopup(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-white/80 hover:text-white"
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
              </div>
            </div>

            {/* Messages Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {unreadMessages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">Your inbox is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {unreadMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className="group bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-indigo-100 transition-all duration-200"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                          {msg.sender.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {msg.sender.name}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {msg.content}
                          </p>
                          <div className="flex items-center mt-2 space-x-2">
                            <svg
                              className="w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <p className="text-xs text-gray-400">
                              {new Date(msg.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <p className="text-xs text-gray-500">
                {unreadMessages.length} message
                {unreadMessages.length !== 1 ? "s" : ""}
              </p>
              <button
                onClick={() => setShowMessagesPopup(false)}
                className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex flex-wrap justify-center gap-4 sm:order-2">
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

              {/* New Links */}
              <Link
                href="/contact"
                className="text-gray-500 hover:text-gray-600"
              >
                Message me
              </Link>
              <Link href="/about" className="text-gray-500 hover:text-gray-600">
                About
              </Link>
              <Link href="#" className="text-gray-500 hover:text-gray-600">
                Privacy Policy
              </Link>
            </div>
            <div className="mt-4 sm:mt-0 sm:order-1">
              <p className="text-center text-sm text-gray-500">
                &copy; {new Date().getFullYear()} Portal. Crafted by Nishant
                Baruah.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
