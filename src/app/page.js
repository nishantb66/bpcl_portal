"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [userName, setUserName] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Check for token and user name in localStorage
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("name");
    if (token && name) {
      setUserName(name);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    setUserName(null);
    router.push("/login"); // Redirect to login page
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-blue-900">
                Portal
              </h1>
            </div>
            <nav>
              {userName ? (
                <div className="flex items-center gap-2 sm:gap-4">
                  <span className="text-sm sm:text-base text-blue-900">
                    {/* Remove hidden class */}
                    Welcome, {userName}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push("/profile")}
                      className="px-3 sm:px-4 py-2 bg-blue-900 text-white text-sm sm:text-base rounded hover:bg-blue-800"
                    >
                      Your Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="px-3 sm:px-4 py-2 bg-yellow-500 text-blue-900 text-sm sm:text-base rounded hover:bg-yellow-400"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link href="/login">
                    <button className="px-3 sm:px-4 py-2 bg-blue-900 text-white text-sm sm:text-base rounded hover:bg-blue-800">
                      Login
                    </button>
                  </Link>
                  <Link href="/signup">
                    <button className="px-3 sm:px-4 py-2 bg-yellow-500 text-blue-900 text-sm sm:text-base rounded hover:bg-yellow-400">
                      Sign Up
                    </button>
                  </Link>
                  <Link href="/admin">
                    <button className="px-3 sm:px-4 py-2 bg-blue-800 text-white text-sm sm:text-base rounded hover:bg-blue-700">
                      Admin
                    </button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="max-w-4xl w-full text-center space-y-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-900">
            Welcome to Portal
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Your professional gateway to managing profiles and accessing
            administrative features.
          </p>
          {!userName && (
            <div className="mt-6">
              <Link href="/login">
                <button className="px-6 py-2 bg-blue-900 text-white rounded hover:bg-blue-800">
                  Get Started
                </button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
