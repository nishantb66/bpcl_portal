"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LeaveApplication() {
  const router = useRouter();

  // ----------------- Non-UI State & Logic (kept intact) -----------------
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [pendingApplication, setPendingApplication] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setEmail(payload.email);
      setName(localStorage.getItem("name"));

      // Check for pending leave application
      fetch("/api/status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.pending) {
            setPendingApplication(data.application);
          }
        });
    } catch (error) {
      router.push("/login");
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setIsSubmitting(true);

    if (!fromDate || !toDate || !reason) {
      alert("All fields are required");
      setLoading(false);
      setIsSubmitting(false);
      return;
    }

    if (new Date(toDate) < new Date(fromDate)) {
      alert("To Date must be after From Date");
      setLoading(false);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/leave", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ fromDate, toDate, reason }),
      });

      const data = await response.json();
      if (response.ok) {
        // Show success animation, then redirect
        setTimeout(() => {
          setIsSubmitting(false);
          setIsSuccess(true);
          setTimeout(() => router.push("/"), 2000);
        }, 3000);
      } else {
        throw new Error(data.message || "Submission failed");
      }
    } catch (error) {
      setIsSubmitting(false);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };
  // ----------------------------------------------------------------------

  // If user already has a pending leave application, show the status screen
  if (pendingApplication) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Optional Top Navigation Bar */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-bold text-indigo-700">Portal</h1>
            <nav className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/")}
                className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => router.push("/profile")}
                className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Profile
              </button>
            </nav>
          </div>
        </header>

        {/* Pending Application Content */}
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold text-center text-indigo-700 mb-8">
              Leave Application Status
            </h2>
            <div className="space-y-6">
              {/* User Info Card */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {name}
                    </h3>
                    <p className="text-sm text-gray-600">{email}</p>
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Date
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(pendingApplication.fromDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Date
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(pendingApplication.toDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <p className="text-gray-900 whitespace-pre-line">
                  {pendingApplication.reason}
                </p>
              </div>

              {/* Status */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Application Status
                </label>
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      pendingApplication.status === "Pending"
                        ? "bg-yellow-100"
                        : pendingApplication.status === "Approved"
                        ? "bg-green-100"
                        : "bg-red-100"
                    }`}
                  >
                    {pendingApplication.status === "Pending" && (
                      <svg
                        className="w-6 h-6 text-yellow-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                    {pendingApplication.status === "Approved" && (
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                    {pendingApplication.status === "Rejected" && (
                      <svg
                        className="w-6 h-6 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {pendingApplication.status}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {pendingApplication.status === "Pending"
                        ? "Your application is under review."
                        : pendingApplication.status === "Approved"
                        ? "Your application has been approved."
                        : "Your application has been rejected."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Otherwise, show the form to apply for leave
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Optional Top Navigation Bar */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-indigo-700">Portal</h1>
          <nav className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/")}
              className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => router.push("/profile")}
              className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Profile
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-lg relative">
          {/* Overlay for Submitting or Success */}
          {(isSubmitting || isSuccess) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              {isSubmitting && (
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
              )}
              {isSuccess && (
                <div className="flex flex-col items-center animate-scaleIn">
                  <svg
                    className="checkmark"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 52 52"
                    width="64"
                    height="64"
                  >
                    <circle
                      className="checkmark__circle"
                      cx="26"
                      cy="26"
                      r="25"
                      fill="none"
                      stroke="#4BB543"
                      strokeWidth="4"
                    />
                    <path
                      className="checkmark__check"
                      fill="none"
                      stroke="#4BB543"
                      strokeWidth="4"
                      d="M14.1 27.2l7.1 7.2 16.7-16.8"
                    />
                  </svg>
                  <p className="text-white mt-4 text-lg font-medium">
                    Leave application submitted successfully!
                  </p>
                </div>
              )}
            </div>
          )}

          <h2 className="text-3xl font-bold text-center text-indigo-700 mb-8">
            Apply for Leave
          </h2>

          {/* The Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  disabled
                  className="w-full p-3 border rounded-lg bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full p-3 border rounded-lg bg-gray-100 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={fromDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setFromDate(e.target.value)}
                  required
                  className="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || new Date().toISOString().split("T")[0]}
                  onChange={(e) => setToDate(e.target.value)}
                  required
                  className="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                rows="4"
                placeholder="Provide a detailed reason for leave..."
              />
            </div>

            <div className="text-sm text-gray-600 italic mt-4">
              <p>
                Note: Applying for a leave within 30 days of a previously
                approved leave may result in rejection.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full p-3 text-white font-semibold rounded-lg transition-all ${
                loading
                  ? "bg-indigo-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              Submit Application
            </button>
          </form>
        </div>
      </main>

      {/* Animations & Styles */}
      <style jsx global>{`
        @keyframes scaleIn {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        .checkmark__circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        .checkmark__check {
          transform-origin: 50% 50%;
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards;
        }
        @keyframes stroke {
          100% {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
