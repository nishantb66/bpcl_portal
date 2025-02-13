"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

export default function CustomerDetails() {
  const [userName, setUserName] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      fetchComplaints();
    }
  }, [router]);

  const fetchComplaints = async () => {
    try {
      const response = await fetch("/api/complaints");
      if (!response.ok) throw new Error("Failed to fetch complaints");
      const data = await response.json();
      setComplaints(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-8">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Link href="/customer-details/fill-info">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
              <h2 className="text-xl font-semibold text-blue-900 mb-2">
                Customer Details Form
              </h2>
              <p className="text-gray-600">
                Record customer information and transaction details
              </p>
            </div>
          </Link>

          <Link href="/customer-details/complaints">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
              <h2 className="text-xl font-semibold text-blue-900 mb-2">
                Customer Complaints
              </h2>
              <p className="text-gray-600">
                Manage and track customer complaints and feedback
              </p>
            </div>
          </Link>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-4 flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
            Customer Complaints
          </h2>
          <p className="text-gray-600 mb-6">
            (Click the eye icon to view the message from administration)
          </p>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading complaints...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-red-600">{error}</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-blue-800">No complaints found</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-50">
                  <tr>
                    {[
                      "Customer Name",
                      "Petrol Pump Location",
                      "Complaint Details",
                      "Type",
                      "Urgency",
                      "Status",
                      "Created At",
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {complaints.map((complaint) => (
                    <tr key={complaint._id} className="hover:bg-gray-50">
                      <td
                        className="px-6 py-4 text-sm text-gray-800 cursor-pointer hover:bg-blue-50 group"
                        onClick={() => setSelectedComplaint(complaint)}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="border-b border-dashed border-gray-400 group-hover:border-blue-500">
                            {complaint.customerName}
                          </span>
                          <svg
                            className="w-4 h-4 text-gray-400 group-hover:text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {complaint.petrolPumpLocation || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {complaint.complaintDetails}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {complaint.type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span
                          className={`inline-block h-3 w-3 rounded-full mr-2 ${
                            complaint.urgency === "High"
                              ? "bg-red-500"
                              : complaint.urgency === "Medium"
                              ? "bg-yellow-500"
                              : "bg-gray-400"
                          }`}
                        ></span>
                        {complaint.urgency}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            complaint.status === "Resolved"
                              ? "bg-green-100 text-green-800"
                              : complaint.status === "In Progress"
                              ? "bg-orange-100 text-orange-800"
                              : complaint.status === "Ignored"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {complaint.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Complaint Resolution Details
              </h3>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Action Taken
                </label>
                <p className="p-2 bg-gray-100 rounded-md">
                  {selectedComplaint.action}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Resolution Message
                </label>
                <p className="p-2 bg-gray-100 rounded-md h-32 overflow-y-auto">
                  {selectedComplaint.message}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
