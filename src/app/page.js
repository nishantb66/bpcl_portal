"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  const router = useRouter();

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
      api: "/api/status",
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
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
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
              <span className="text-xl font-semibold text-gray-900">
                Portal
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              {userName ? (
                <>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <FiUser className="text-gray-500" />
                    <span className="font-medium text-gray-900">
                      {userName}
                    </span>
                  </div>

                  {/* Forum Link - always visible */}
                  <Link
                    href="https://portal-discussion-forum.onrender.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    <FiMessageSquare />
                    <span>Forum</span>
                  </Link>

                  <button
                    onClick={() => router.push("/profile")}
                    className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/admin"
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
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
              className="md:hidden p-2 text-gray-500 hover:text-gray-600"
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
          <div className="md:hidden absolute w-full bg-white border-b border-gray-200">
            <div className="px-4 py-5 space-y-4">
              {userName ? (
                <>
                  <div className="flex items-center space-x-2 pb-4 border-b border-gray-200">
                    <FiUser className="text-gray-500" />
                    <span className="font-medium text-gray-900">
                      {userName}
                    </span>
                  </div>

                  {/* Forum Link in Mobile Menu */}
                  <Link
                    href="https://portal-discussion-forum.onrender.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center space-x-2">
                      <FiMessageSquare />
                      <span>Forum</span>
                    </div>
                  </Link>

                  <button
                    onClick={() => {
                      router.push("/profile");
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <Link
                    href="/admin"
                    className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Admin
                  </Link>
                  <Link
                    href="/login"
                    className="block px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
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

      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex space-x-6 justify-center md:order-2">
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
