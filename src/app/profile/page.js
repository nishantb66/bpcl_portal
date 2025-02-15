"use client";

import { useState, useEffect } from "react";
import {
  FiUser,
  FiMail,
  FiMapPin,
  FiBriefcase,
  FiClock,
  FiHome,
  FiLock,
  FiCheck,
} from "react-icons/fi";

export default function Profile() {
  const [profile, setProfile] = useState({
    name: "",
    surname: "",
    email: "",
    joiningDate: "",
    city: "",
    localArea: "",
    previousCompany: "",
    addressLine1: "",
    addressLine2: "",
    designation: "",
    shiftTimings: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Auto-dismiss notification after 2 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login first");
      setLoading(false);
      return;
    }

    async function fetchProfile() {
      try {
        const response = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setProfile(data.profile || profile);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError("Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
      });

      const data = await response.json();
      if (response.ok) {
        // Set notification to success type
        setNotification({
          type: "success",
          message: "Profile updated successfully!",
        });
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err.message || "Failed to save profile",
      });
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-50 border border-red-400 text-red-700 px-6 py-4 rounded-md max-w-md">
          {error}
        </div>
      </div>
    );

  const getIcon = (key) => {
    const icons = {
      name: <FiUser className="text-indigo-500" />,
      surname: <FiUser className="text-indigo-500" />,
      email: <FiMail className="text-indigo-500" />,
      city: <FiMapPin className="text-indigo-500" />,
      localArea: <FiMapPin className="text-indigo-500" />,
      previousCompany: <FiBriefcase className="text-indigo-500" />,
      addressLine1: <FiHome className="text-indigo-500" />,
      addressLine2: <FiHome className="text-indigo-500" />,
      designation: <FiBriefcase className="text-indigo-500" />,
      shiftTimings: <FiClock className="text-indigo-500" />,
    };
    return icons[key] || null;
  };

  const formFields = [
    { key: "name", type: "text", required: true },
    { key: "surname", type: "text", required: true },
    { key: "email", type: "email", required: true, readOnly: true },
    { key: "city", type: "text", required: true },
    { key: "localArea", type: "text", required: true },
    { key: "previousCompany", type: "text" },
    { key: "addressLine1", type: "text", required: true },
    { key: "addressLine2", type: "text" },
    { key: "designation", type: "text", required: true },
    { key: "shiftTimings", type: "text", required: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto relative">
        {/* Popup Notification for Successful Update */}
        {notification && notification.type === "success" && (
          <div className="fixed top-5 right-5 bg-white border border-green-500 rounded-md shadow-md p-4 flex items-center space-x-2 z-50">
            <FiCheck className="text-green-500 text-2xl" />
            <span className="text-green-700 font-medium">Updated</span>
          </div>
        )}

        {/* Inline Notification for Errors */}
        {notification && notification.type === "error" && (
          <div className="mb-4 p-4 rounded-md shadow-sm border-l-4 bg-red-50 border-red-500 text-red-800">
            {notification.message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl font-semibold text-white">
                  {profile.name} {profile.surname}
                </h1>
                <p className="text-indigo-200 mt-1 text-sm">
                  {profile.designation}
                </p>
              </div>
              <div className="bg-indigo-100 px-3 py-2 rounded-md">
                <p className="text-indigo-800 text-sm font-medium">
                  Member since: {profile.joiningDate}
                </p>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSave} className="px-6 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {formFields.map(({ key, type, required, readOnly }) => (
                <div key={key} className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {key.replace(/([A-Z])/g, " $1")}
                    {required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {getIcon(key)}
                    </div>
                    <input
                      type={type}
                      value={profile[key]}
                      onChange={(e) =>
                        !readOnly &&
                        setProfile({ ...profile, [key]: e.target.value })
                      }
                      required={required}
                      readOnly={readOnly}
                      className={`w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        readOnly
                          ? "bg-gray-50 text-gray-500 cursor-not-allowed"
                          : ""
                      }`}
                      placeholder={`Enter ${key
                        .replace(/([A-Z])/g, " $1")
                        .toLowerCase()}`}
                    />
                    {key === "email" && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <FiLock className="text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
