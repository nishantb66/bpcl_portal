"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UserCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [customerDetails, setCustomerDetails] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
      fetchCustomerDetails();
      fetchComplaints();
    }
  }, [isAuthenticated]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to fetch users data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("adminToken", data.token);
        setIsAuthenticated(true);
        setError("");
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to authenticate");
    }
  };

  const handleDelete = async (email) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setUsers(users.filter((user) => user.email !== email));
        setUserToDelete(null);
      } else {
        const data = await response.json();
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to delete user");
    }
  };

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/customerDetails", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setCustomerDetails(data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to fetch customer details");
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/complaints", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setComplaints(data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to fetch complaints");
    } finally {
      setLoading(false);
    }
  };

  const updateComplaintStatus = async (complaintId, newStatus) => {
    try {
      const response = await fetch(`/api/complaints`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({
          id: complaintId,
          status: newStatus,
        }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      // Refresh complaints after update
      fetchComplaints();
    } catch (error) {
      setError(error.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-blue-900">
              Admin Login
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please enter your credentials
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Username
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-900"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-900 text-white font-medium rounded-md hover:bg-blue-800"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4">
            <h1 className="text-xl sm:text-2xl font-bold text-blue-900">
              Admin Dashboard
            </h1>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowEmployeeDetails(!showEmployeeDetails)}
                className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800"
              >
                {showEmployeeDetails ? "Hide Employees" : "Employee Details"}
              </button>

              <button
                onClick={() => {
                  localStorage.removeItem("adminToken");
                  setIsAuthenticated(false);
                }}
                className="px-4 py-2 bg-yellow-500 text-blue-900 rounded-md hover:bg-yellow-400"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-red-600">{error}</p>
          </div>
        ) : showEmployeeDetails ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* Mobile View */}
            <div className="sm:hidden space-y-4 p-4">
              {users.map((user) => (
                <div key={user.email} className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <p className="font-medium text-blue-900">
                      {user.profile?.name}
                    </p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">
                        {user.profile?.designation}
                      </span>
                      <span className="text-gray-500">
                        {user.profile?.city}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="text-sm px-3 py-1.5 bg-blue-900 text-white rounded-md hover:bg-blue-800"
                      >
                        View
                      </button>
                      <button
                        onClick={() => setUserToDelete(user)}
                        className="text-sm px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <table className="hidden sm:table w-full">
              <thead className="bg-blue-50">
                <tr>
                  {["Name", "Email", "Designation", "City", "Actions"].map(
                    (header) => (
                      <th
                        key={header}
                        className="p-4 text-left text-sm font-medium text-blue-900"
                      >
                        {header}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.email} className="hover:bg-gray-50">
                    <td className="p-4 text-gray-800">{user.profile?.name}</td>
                    <td className="p-4 text-gray-600 text-sm">{user.email}</td>
                    <td className="p-4 text-gray-600 text-sm">
                      {user.profile?.designation}
                    </td>
                    <td className="p-4 text-gray-600 text-sm">
                      {user.profile?.city}
                    </td>
                    <td className="p-4 space-x-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="px-3 py-1.5 bg-blue-900 text-white text-sm rounded-md hover:bg-blue-800"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => setUserToDelete(user)}
                        className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-500"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Customer Details Section */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <UserCircleIcon className="h-6 w-6 text-blue-600 mr-2" />
                  Customer Details
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-blue-50">
                    <tr>
                      {[
                        "Customer",
                        "Contact",
                        "Email",
                        "Vehicle",
                        "Fuel Type",
                        "Quantity",
                        "Total Amount",
                        "Payment Mode",
                        "Loyalty Points",
                        "Membership Status",
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
                    {customerDetails.map((customer) => (
                      <tr key={customer._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-800">
                          {customer.customerName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {customer.contactNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {customer.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {customer.vehicleNumber} ({customer.vehicleType})
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {customer.fuelType}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {customer.quantity}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          ₹{customer.totalAmount}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {customer.paymentMode}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {customer.loyaltyPoints}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              customer.membershipStatus === "Yes"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {customer.membershipStatus === "Yes"
                              ? "Member"
                              : "Non-Member"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Complaints Section */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
                  Complaints
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-blue-50">
                    <tr>
                      {[
                        "Customer Name",
                        "Petrol Pump Location", // New header
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
                          <select
                            value={complaint.status}
                            onChange={(e) =>
                              updateComplaintStatus(
                                complaint._id,
                                e.target.value
                              )
                            }
                            className={`px-2 py-1 text-xs font-medium rounded-full cursor-pointer ${
                              complaint.status === "Resolved"
                                ? "bg-green-100 text-green-800"
                                : complaint.status === "In Progress"
                                ? "bg-orange-100 text-orange-800"
                                : complaint.status === "Ignored"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Ignored">Ignored</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
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
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        const response = await fetch(`/api/complaints`, {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${localStorage.getItem(
                              "adminToken"
                            )}`,
                          },
                          body: JSON.stringify({
                            id: selectedComplaint._id,
                            status: selectedComplaint.status,
                            action: selectedComplaint.action,
                            message: selectedComplaint.message,
                          }),
                        });

                        if (response.ok) {
                          fetchComplaints();
                          setSelectedComplaint(null);
                        }
                      } catch (error) {
                        console.error("Update failed:", error);
                      }
                    }}
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Action Taken
                        </label>
                        <input
                          type="text"
                          value={selectedComplaint.action}
                          onChange={(e) =>
                            setSelectedComplaint((prev) => ({
                              ...prev,
                              action: e.target.value,
                            }))
                          }
                          className="w-full p-2 border rounded-md"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Resolution Message
                        </label>
                        <textarea
                          value={selectedComplaint.message}
                          onChange={(e) =>
                            setSelectedComplaint((prev) => ({
                              ...prev,
                              message: e.target.value,
                            }))
                          }
                          className="w-full p-2 border rounded-md h-32"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-blue-900 text-white py-2 rounded-md hover:bg-blue-800"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-blue-900">
                Employee Details
              </h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(selectedUser.profile || {}).map(
                ([key, value]) => (
                  <div key={key} className="space-y-1">
                    <p className="text-sm font-medium text-gray-500 capitalize">
                      {key.replace(/([A-Z])/g, " $1")}
                    </p>
                    <p className="text-gray-900">{value || "-"}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              Confirm Delete
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {userToDelete.email}? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(userToDelete.email)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
