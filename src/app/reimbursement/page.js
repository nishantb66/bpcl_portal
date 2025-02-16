"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import jwt from "jsonwebtoken";
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function ReimbursementPage() {
  const [cost, setCost] = useState("");
  const [reason, setReason] = useState("");
  const [fileData, setFileData] = useState(null); // Will hold base64 string
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [reimbursements, setReimbursements] = useState([]);
  const [selectedReimbursement, setSelectedReimbursement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showInfoPopup, setShowInfoPopup] = useState(true);

  const router = useRouter();

  //useEffect hook to scroll to the bottom of the page
  useEffect(() => {
    
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth", // Optional: Adds smooth scrolling
    });
  });

  // Check if token is expired, if so, redirect to login
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
    if (!token || checkTokenExpiration(token)) {
      toast.info("Your session has expired. Please log in again.");
      setTimeout(() => {
        localStorage.clear();
        router.push("/login");
      }, 2000);
      return;
    }
    // If token is valid, fetch existing reimbursements
    fetchReimbursements();
  }, []);

  const fetchReimbursements = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/reimbursement", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch reimbursements");
      }
      const data = await response.json();
      setReimbursements(data.reimbursements || []);
    } catch (error) {
      toast.error("Error fetching reimbursements");
    } finally {
      setLoading(false);
    }
  };

  // Convert file to base64
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64String = ev.target.result.split(",")[1]; // Remove data:<type>;base64,
      setFileData(base64String);
      setFileName(file.name);
      setFileType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must be logged in to submit reimbursement.");
      return;
    }

    try {
      const response = await fetch("/api/reimbursement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cost,
          reason,
          fileData,
          fileName,
          fileType,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      toast.success("Reimbursement submitted!");
      // Reset the form
      setCost("");
      setReason("");
      setFileData(null);
      setFileName("");
      setFileType("");
      // Refresh the reimbursements list
      fetchReimbursements();
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Close modal for reimbursement details
  const closeModal = () => setSelectedReimbursement(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-center" />

      {/* Informational Popup on Page Load */}
      {showInfoPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Important Notice
            </h2>
            <p className="text-gray-700 mb-6">
              For optimal processing, please ensure that all information is
              accurate and that you attach valid supporting documents. PDF
              format is preferred for clarity and ease of review.
            </p>
            <button
              onClick={() => setShowInfoPopup(false)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <DocumentTextIcon className="h-6 w-6 text-indigo-600 mr-2" />
              Reimbursements
            </h1>
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-1" />
              Back to Home
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Form Design */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            New Reimbursement Request
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0.00"
                    required
                  />
                  <span className="absolute right-4 top-3 text-gray-500">
                    USD
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachment
                </label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                  />
                  <div className="w-full px-4 py-2.5 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                    <span className="text-gray-600">
                      {fileName || "Choose file..."}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows="3"
                placeholder="Enter reason for reimbursement..."
                required
              />
            </div>

            <button
              type="submit"
              className="w-50% bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors"
            >
              Submit Request
            </button>
          </form>
        </div>

        {/* Enhanced Reimbursements List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Previous Requests
            </h3>
          </div>

          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="flex items-center justify-center p-6">
                <svg
                  className="animate-spin h-8 w-8 text-indigo-600"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
              </div>
            ) : reimbursements.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No reimbursement requests found
              </div>
            ) : (
              reimbursements.map((item) => (
                <div
                  key={item._id}
                  onClick={() => setSelectedReimbursement(item)}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            item.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : item.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {item.status?.toUpperCase() || "PENDING"}
                        </span>
                        <span className="text-lg font-semibold text-gray-900">
                          ${item.cost}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {item.reason}
                      </p>
                    </div>
                    {item.fileData && (
                      <a
                        href={`data:${item.fileType};base64,${item.fileData}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center"
                      >
                        <DocumentTextIcon className="h-5 w-5 mr-1.5" />
                        <span className="text-sm">View File</span>
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Enhanced Modal for Reimbursement Details */}
      {selectedReimbursement && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">
                Request Details
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Amount
                </label>
                <p className="mt-1 text-gray-900">
                  ${selectedReimbursement.cost}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Description
                </label>
                <p className="mt-1 text-gray-900">
                  {selectedReimbursement.reason}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Status
                </label>
                <p className="mt-1 capitalize">
                  {selectedReimbursement.status || "pending"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Admin Feedback
                </label>
                <p className="mt-1 text-gray-900">
                  {selectedReimbursement.adminMessage || "No feedback provided"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
