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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <ToastContainer />
      <header className="sticky top-0 z-50 bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-2">
              <svg
                className="w-8 h-8 sm:w-10 sm:h-10"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="#1E3A8A"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M8 12H16M16 12L12 8M16 12L12 16"
                  stroke="#1E3A8A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-900">
                Enterprise Portal
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              {userName ? (
                <>
                  <div className="flex items-center gap-2 text-lg text-gray-700">
                    <FiUser className="hidden sm:block" />
                    <span className="text-black sm:ml-1">
                      Welcome, {userName}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push("/profile")}
                      className="p-2 sm:px-4 sm:py-2 flex items-center gap-1 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
                    >
                      <FiUser className="sm:hidden" />
                      <span className="hidden sm:block">Profile</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="p-2 sm:px-4 sm:py-2 flex items-center gap-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <FiLogOut className="sm:hidden" />
                      <span className="hidden sm:block">Logout</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/admin">
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                      Admin
                    </button>
                  </Link>
                  <Link href="/login">
                    <button className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors">
                      Login
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-700 hover:text-blue-900 focus:outline-none"
              >
                {isMobileMenuOpen ? (
                  <FiX className="w-6 h-6" />
                ) : (
                  <FiMenu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-white shadow-lg mt-2 py-4">
              {userName ? (
                <>
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 text-lg text-gray-700">
                      <FiUser />
                      <span className="text-black">Welcome, {userName}</span>
                    </div>
                    <button
                      onClick={() => {
                        router.push("/profile");
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Link href="/admin">
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Admin
                    </button>
                  </Link>
                  <Link href="/login">
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
                    >
                      Login
                    </button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {userName ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Customers & Complaints Card */}
              <button
                onClick={() => handleNavigation("/customer-details")}
                className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 hover:border-blue-300 relative"
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="mb-6 text-blue-900 group-hover:text-blue-700 transition-colors">
                    <FiUsers className="w-14 h-14" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    Customers & Complaints
                  </h3>
                  <p className="text-gray-600 text-center text-base">
                    Manage customer records and resolve complaints
                  </p>
                </div>
                {loadingCard === "/customer-details" && (
                  <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center">
                    <FiLoader className="w-10 h-10 animate-spin text-blue-900" />
                  </div>
                )}
              </button>

              {/* Apply for Leave Card */}
              <button
                onClick={() => handleNavigation("/leave")}
                className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 hover:border-blue-300 relative"
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="mb-6 text-blue-900 group-hover:text-blue-700 transition-colors">
                    <FiCalendar className="w-14 h-14" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    Apply for Leave
                  </h3>
                  <p className="text-gray-600 text-center text-base">
                    Submit and manage your leave applications
                  </p>
                </div>
                {loadingCard === "/leave" && (
                  <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center">
                    <FiLoader className="w-10 h-10 animate-spin text-blue-900" />
                  </div>
                )}
              </button>

              {/* Take a Quick Survey Card */}
              <button
                onClick={() => handleNavigation("/survey")}
                className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 hover:border-blue-300 relative"
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="mb-6 text-blue-900 group-hover:text-blue-700 transition-colors">
                    <FiClipboard className="w-14 h-14" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    Take a Quick Survey
                  </h3>
                  <p className="text-gray-600 text-center text-base">
                    Share your feedback on employee working conditions
                  </p>
                </div>
                {loadingCard === "/survey" && (
                  <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center">
                    <FiLoader className="w-10 h-10 animate-spin text-blue-900" />
                  </div>
                )}
              </button>

              {/* Accident Profiling System Card */}
              <a
                href="https://accident-profiling-frontend.vercel.app"
                className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 hover:border-blue-300 relative"
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="mb-6 text-blue-900 group-hover:text-blue-700 transition-colors">
                    <FiAlertTriangle className="w-14 h-14" />{" "}
                    {/* Symbol for Accident Profiling */}
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    Accident Profiling System 
                  </h3>
                  <p className="text-gray-600 text-center text-base">
                    AI-powered accident predictive analysis and report
                    generation (Tank Lorry)
                  </p>
                </div>
                {/* Modern, professional tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-2 bg-gray-800 text-white text-xs rounded opacity-0 pointer-events-none transition-opacity duration-300 group-hover:opacity-100">
                  This system is integrated with the BPCL portal. For optimal
                  AI-driven predictive analysis, please provide precise and
                  accurate data. Kindly verify all AI-generated insights for
                  accuracy.
                </div>
                {loadingCard === "/accident-profiling" && (
                  <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center">
                    <FiLoader className="w-10 h-10 animate-spin text-blue-900" />
                  </div>
                )}
              </a>

              {/* Placeholder for New Feature */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 opacity-50 cursor-not-allowed">
                <div className="flex flex-col items-center justify-center h-full">
                  <FiPlusCircle className="w-14 h-14 text-gray-400 mb-6" />
                  <h3 className="text-2xl font-semibold text-gray-400 mb-3">
                    New Feature
                  </h3>
                  <p className="text-gray-400 text-center text-base">
                    Coming soon
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <FiAlertTriangle className="w-20 h-20 text-blue-900 mx-auto mb-8" />
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Access Your Account
                </h2>
                <p className="text-gray-600 mb-10 text-lg">
                  Sign in to manage your petrol pump operations and customer
                  relations
                </p>
                <Link href="/login">
                  <button className="px-10 py-4 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors text-xl font-medium">
                    Get Started
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
        <footer className="bg-gray-900 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between md:flex-row">
              <div className="flex space-x-6">
                <a
                  href="https://nishantb66.github.io/MyPortfolio"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FiUser className="w-6 h-6" />
                </a>
                <a
                  href="https://www.linkedin.com/in/nishantbaru"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FiLinkedin className="w-6 h-6" />
                </a>
                <a
                  href="https://github.com/nishantb66"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FiGithub className="w-6 h-6" />
                </a>
              </div>
              <div className="mt-4 md:mt-0 text-center md:text-right">
                <p className="text-gray-400">
                  Made by Nishant © {new Date().getFullYear()}
                </p>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
