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
} from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import jwt from "jsonwebtoken";

export default function Home() {
  // All previous state and logic remains unchanged
  const [userName, setUserName] = useState(null);
  const [loadingCard, setLoadingCard] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
                  >
                    Admin
                  </Link>
                  <Link
                    href="/login"
                    className="block px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
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
              {/* Dashboard Cards */}
              {[
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
                  href: "https://accident-profiling-frontend.vercel.app",
                  icon: <FiAlertTriangle className="w-6 h-6" />,
                  title: "Accident Profiling",
                  description:
                    "AI-powered accident analysis system (Tank Lorry)",
                  external: true,
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="group relative bg-white rounded-xl border border-gray-200 hover:border-indigo-200 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="p-6">
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
              ))}

              {/* Coming Soon Card */}
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FiPlusCircle className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-500">
                      New Feature Coming Soon
                    </p>
                  </div>
                </div>
              </div>
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
                  Sign in to access your personalized dashboard and management
                  tools
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
