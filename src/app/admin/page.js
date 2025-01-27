"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const router = useRouter();

  // Fetch users data after authentication
  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
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

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Protected administrative area
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto bg-white/20 backdrop-blur-xl rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            Admin Dashboard
          </h1>
          <button
            onClick={() => {
              localStorage.removeItem("adminToken");
              setIsAuthenticated(false);
            }}
            className="px-6 py-2.5 bg-yellow-500 text-blue-900 font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="text-center py-12">
            <div className="h-12 w-12 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white">Loading users data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 text-red-100 p-4 rounded-lg border border-red-500/20">
            {error}
          </div>
        ) : (
          <div className="bg-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-950/50">
                  <tr>
                    <th className="p-4 text-left text-white font-semibold">
                      Name
                    </th>
                    <th className="p-4 text-left text-white font-semibold">
                      Email
                    </th>
                    <th className="p-4 text-left text-white font-semibold">
                      Designation
                    </th>
                    <th className="p-4 text-left text-white font-semibold">
                      City
                    </th>
                    <th className="p-4 text-left text-white font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {users.map((user) => (
                    <tr key={user.email} className="hover:bg-white/5">
                      <td className="p-4 text-white">
                        {user.profile?.name} {user.profile?.surname}
                      </td>
                      <td className="p-4 text-white">{user.email}</td>
                      <td className="p-4 text-white">
                        {user.profile?.designation}
                      </td>
                      <td className="p-4 text-white">{user.profile?.city}</td>
                      <td className="p-4">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="px-4 py-2 bg-yellow-500 text-blue-900 font-medium rounded-lg hover:bg-yellow-400 transition-colors"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => setUserToDelete(user)}
                          className="px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                      {/* Delete Confirmation Modal */}
                      {userToDelete && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                          <div className="bg-blue-900 rounded-xl p-6 max-w-md w-full">
                            <h2 className="text-2xl font-bold text-white mb-4">
                              Confirm Delete
                            </h2>
                            <p className="text-white mb-6">
                              Are you sure you want to delete{" "}
                              {userToDelete.email}? This action cannot be
                              undone.
                            </p>
                            <div className="flex justify-end gap-4">
                              <button
                                onClick={() => setUserToDelete(null)}
                                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleDelete(userToDelete.email)}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-blue-900 rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">User Details</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-white hover:text-yellow-500 transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(selectedUser.profile || {}).map(
                  ([key, value]) => (
                    <div key={key} className="bg-white/10 rounded-lg p-4">
                      <p className="text-yellow-500/90 text-sm capitalize mb-1">
                        {key.replace(/([A-Z])/g, " $1")}
                      </p>
                      <p className="text-white font-medium">{value || "N/A"}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
