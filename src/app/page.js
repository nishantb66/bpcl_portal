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
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="flex justify-between items-center p-4 bg-gray-100 shadow-md">
        <h1 className="text-lg font-bold text-black">Portal</h1>
        <div>
          {userName ? (
            <div className="flex items-center space-x-4 text-black">
              <span>Welcome, {userName}!</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link href="/login">
                <button className="px-4 py-2 mr-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Login
                </button>
              </Link>
              <Link href="/signup">
                <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                  Sign Up
                </button>
              </Link>
            </>
          )}
        </div>
      </header>
    </div>
  );
}
