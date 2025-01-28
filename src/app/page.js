"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [userName, setUserName] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("name");
    if (token && name) setUserName(name);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    setUserName(null);
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-lg sm:text-2xl font-bold text-blue-900">
                Petrol Pump Portal
              </h1>
            </div>

            <nav>
              {userName ? (
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="hidden sm:block text-sm text-blue-900">
                    Welcome, {userName}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push("/profile")}
                      className="px-3 py-2 bg-blue-900 text-white text-sm rounded hover:bg-blue-800"
                    >
                      Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="px-3 py-2 bg-yellow-500 text-blue-900 text-sm rounded hover:bg-yellow-400"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/admin" className="hidden sm:block">
                    <button className="px-3 py-2 bg-blue-800 text-white text-sm rounded hover:bg-blue-700">
                      Admin
                    </button>
                  </Link>
                  <Link href="/login">
                    <button className="px-3 py-2 bg-blue-900 text-white text-sm rounded hover:bg-blue-800">
                      Login
                    </button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile Optimized */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full text-center space-y-4 sm:space-y-6">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-4xl sm:text-5xl font-bold text-blue-900 leading-tight mb-2">
              Petrol Pump
            </h1>
            <h2 className="text-2xl sm:text-3xl text-blue-900 font-semibold">
              Management Portal
            </h2>
          </div>

          <div className="space-y-4">
            {/* Add Customer Details Button */}
            {userName && (
              <div className="mt-6">
                <Link href="/customer-details">
                  <button className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-blue-900 text-blue-900 rounded-lg hover:bg-blue-50 text-lg font-semibold transition-colors">
                    Customer Details
                  </button>
                </Link>
              </div>
            )}

            {!userName && (
              <div className="mt-6">
                <Link href="/login">
                  <button className="w-full sm:w-auto px-8 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 text-base font-medium">
                    Get Started
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
