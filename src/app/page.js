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
} from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Home() {
  const [userName, setUserName] = useState(null);
  const [loadingCard, setLoadingCard] = useState(null); // Track which card is loading
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("name");
    if (token && name) setUserName(name);
  }, []);

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
      <ToastContainer />
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-blue-800">
                Petrol Pump Portal
              </h1>
            </Link>
            {userName ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <FiUser className="hidden sm:block" />
                  <span className="sm:ml-1">Welcome, {userName}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push("/profile")}
                    className="p-2 sm:px-4 sm:py-2 flex items-center gap-1 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/admin">
                  <button className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors">
                    Admin
                  </button>
                </Link>
                <Link href="/login">
                  <button className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Login
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {userName ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Customers & Complaints Card */}
              <button
                onClick={() => handleNavigation("/customer-details")}
                className="group bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 hover:border-blue-200 relative"
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="mb-4 text-blue-800 group-hover:text-blue-600 transition-colors">
                    <FiUsers className="w-12 h-12" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Customers & Complaints
                  </h3>
                  <p className="text-gray-600 text-center text-sm">
                    Manage customer records and resolve complaints
                  </p>
                </div>
                {loadingCard === "/customer-details" && (
                  <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center">
                    <FiLoader className="w-8 h-8 animate-spin text-blue-800" />
                  </div>
                )}
              </button>

              {/* Apply for Leave Card */}
              <button
                onClick={() => handleNavigation("/leave", "/api/status")}
                className="group bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 hover:border-blue-200 relative"
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="mb-4 text-blue-800 group-hover:text-blue-600 transition-colors">
                    <FiCalendar className="w-12 h-12" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Apply for Leave
                  </h3>
                  <p className="text-gray-600 text-center text-sm">
                    Submit and manage your leave applications
                  </p>
                </div>
                {loadingCard === "/leave" && (
                  <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center">
                    <FiLoader className="w-8 h-8 animate-spin text-blue-800" />
                  </div>
                )}
              </button>

              {/* Placeholder for New Feature */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 opacity-50 cursor-not-allowed">
                <div className="flex flex-col items-center justify-center h-full">
                  <FiPlusCircle className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">
                    New Feature
                  </h3>
                  <p className="text-gray-400 text-center text-sm">
                    Coming soon
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <FiAlertTriangle className="w-16 h-16 text-blue-800 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Access Your Account
                </h2>
                <p className="text-gray-600 mb-8">
                  Sign in to manage your petrol pump operations and customer
                  relations
                </p>
                <Link href="/login">
                  <button className="px-8 py-3 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium">
                    Get Started
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
