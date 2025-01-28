"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CustomerDetails() {
  const [userName, setUserName] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-6">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-900 bg-white rounded-lg border border-blue-900 hover:bg-blue-50 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-blue-900 mb-8">
          Customer Management
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/customer-details/fill-info">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-semibold text-blue-900 mb-2">
                Customer Details Form
              </h2>
              <p className="text-gray-600">
                Record customer information and transaction details
              </p>
            </div>
          </Link>

          <Link href="/customer-details/complaints">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-semibold text-blue-900 mb-2">
                Customer Complaints
              </h2>
              <p className="text-gray-600">
                Manage and track customer complaints and feedback
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
