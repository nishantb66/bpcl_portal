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
        alert("Profile updated successfully!");
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      alert(err.message || "Failed to save profile");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg max-w-md">
          {error}
        </div>
      </div>
    );

  const getIcon = (key) => {
    const icons = {
      name: <FiUser className="text-blue-600" />,
      surname: <FiUser className="text-blue-600" />,
      email: <FiMail className="text-blue-600" />,
      city: <FiMapPin className="text-blue-600" />,
      localArea: <FiMapPin className="text-blue-600" />,
      previousCompany: <FiBriefcase className="text-blue-600" />,
      addressLine1: <FiHome className="text-blue-600" />,
      addressLine2: <FiHome className="text-blue-600" />,
      designation: <FiBriefcase className="text-blue-600" />,
      shiftTimings: <FiClock className="text-blue-600" />,
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
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          {/* Header Section */}
          <div className="bg-gray-800 px-6 py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl font-semibold text-white">
                  {profile.name} {profile.surname}
                </h1>
                <p className="text-gray-300 mt-1 text-sm">
                  {profile.designation}
                </p>
              </div>
              <div className="bg-blue-100 px-3 py-2 rounded-md">
                <p className="text-gray-800 text-sm font-medium">
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
                      className={`w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        readOnly
                          ? "bg-gray-50 text-gray-500 cursor-not-allowed"
                          : "hover:border-gray-300"
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

            <div className="mt-8 border-t border-gray-100 pt-6">
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-2.5 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 transition-colors"
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
