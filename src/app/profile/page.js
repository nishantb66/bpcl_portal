"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiUser,
  FiMail,
  FiMapPin,
  FiBriefcase,
  FiClock,
  FiHome,
  FiLock,
  FiCheck,
  FiSave,
  FiAlertCircle,
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
  const [activeSection, setActiveSection] = useState("personal");
  const router = useRouter();

  // Auto-dismiss notification after 2 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Auto-logout in real time if token expires or is removed
  useEffect(() => {
    const checkExpirationAndLogout = () => {
      const token = localStorage.getItem("token");
      // If token is missing or expired, log the user out
      if (!token || checkTokenExpiration(token)) {
        toast.info("Your session has expired. Logging you out...");
        localStorage.removeItem("token");
        localStorage.removeItem("name");
        router.push("/login");
      }
    };

    // Check every minute (60000 milliseconds)
    const intervalId = setInterval(checkExpirationAndLogout, 60000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [router]);

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
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4 font-medium">
            Loading your profile...
          </p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white border-l-4 border-red-500 shadow-lg rounded-lg p-6 max-w-md">
          <div className="flex items-center">
            <FiAlertCircle className="text-red-500 text-xl mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Authentication Error
              </h3>
              <p className="text-gray-600 mt-1">{error}</p>
              <button
                className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
                onClick={() => (window.location.href = "/login")}
              >
                Go to Login
              </button>
            </div>
          </div>
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

  const personalFields = [
    { key: "name", type: "text", required: true },
    { key: "surname", type: "text", required: true },
    { key: "email", type: "email", required: true, readOnly: true },
  ];

  const locationFields = [
    { key: "city", type: "text", required: true },
    { key: "localArea", type: "text", required: true },
    { key: "addressLine1", type: "text", required: true },
    { key: "addressLine2", type: "text" },
  ];

  const workFields = [
    { key: "designation", type: "text", required: true },
    { key: "previousCompany", type: "text" },
    { key: "shiftTimings", type: "text", required: true },
  ];

  const renderFields = (fields) => {
    return fields.map(({ key, type, required, readOnly }) => (
      <div key={key} className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
          {key.replace(/([A-Z])/g, " $1")}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {getIcon(key)}
          </div>
          <input
            type={type}
            value={profile[key]}
            onChange={(e) =>
              !readOnly && setProfile({ ...profile, [key]: e.target.value })
            }
            required={required}
            readOnly={readOnly}
            className={`w-full pl-10 pr-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all ${
              readOnly
                ? "bg-gray-50 text-gray-500 cursor-not-allowed"
                : "hover:border-blue-300"
            } group-hover:shadow-sm`}
            placeholder={`Enter ${key
              .replace(/([A-Z])/g, " $1")
              .toLowerCase()}`}
          />
          {key === "email" && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <FiLock className="text-gray-400" />
            </div>
          )}
        </div>
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto relative">
        {/* Popup Notification for Successful Update */}
        {notification && notification.type === "success" && (
          <div className="fixed top-5 right-5 bg-white border-l-4 border-green-500 rounded-lg shadow-lg p-4 flex items-center space-x-3 z-50 animate-fade-in">
            <div className="flex-shrink-0 bg-green-100 p-2 rounded-full">
              <FiCheck className="text-green-600 text-xl" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Success</h4>
              <p className="text-sm text-gray-600">{notification.message}</p>
            </div>
          </div>
        )}

        {/* Inline Notification for Errors */}
        {notification && notification.type === "error" && (
          <div className="mb-6 p-4 rounded-lg shadow-sm border-l-4 border-red-500 bg-white text-red-800 flex items-center">
            <FiAlertCircle className="text-red-500 text-xl mr-3" />
            <div>
              <p className="font-medium">Update Failed</p>
              <p className="text-sm text-gray-700 mt-1">
                {notification.message}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Header Section */}
          <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-12 sm:py-16 text-white">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-md">
                <span className="text-3xl sm:text-4xl font-bold text-blue-600">
                  {profile.name.charAt(0)}
                  {profile.surname.charAt(0)}
                </span>
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {profile.name} {profile.surname}
                </h1>
                <p className="text-blue-100 mt-1 text-lg">
                  {profile.designation || "No designation"}
                </p>
                <div className="mt-3 inline-flex items-center bg-blue-800 bg-opacity-30 px-3 py-1 rounded-full text-sm">
                  <FiClock className="mr-2" />
                  Member since: {profile.joiningDate || "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto py-4 px-6">
              <button
                onClick={() => setActiveSection("personal")}
                className={`whitespace-nowrap px-5 py-2 text-sm font-medium rounded-lg mr-4 ${
                  activeSection === "personal"
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                Personal Information
              </button>
              <button
                onClick={() => setActiveSection("location")}
                className={`whitespace-nowrap px-5 py-2 text-sm font-medium rounded-lg mr-4 ${
                  activeSection === "location"
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                Location Details
              </button>
              <button
                onClick={() => setActiveSection("work")}
                className={`whitespace-nowrap px-5 py-2 text-sm font-medium rounded-lg ${
                  activeSection === "work"
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                Work Information
              </button>
            </nav>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSave} className="p-6 sm:p-8">
            <div className="space-y-8">
              {/* Personal Information Section */}
              <div
                className={activeSection === "personal" ? "block" : "hidden"}
              >
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Personal Information
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Your basic account details
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {renderFields(personalFields)}
                </div>
              </div>

              {/* Location Section */}
              <div
                className={activeSection === "location" ? "block" : "hidden"}
              >
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Location Details
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Your address and location information
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {renderFields(locationFields)}
                </div>
              </div>

              {/* Work Information Section */}
              <div className={activeSection === "work" ? "block" : "hidden"}>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Work Information
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Your professional details and schedule
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {renderFields(workFields)}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between items-center">
                <p className="text-sm text-gray-500 mb-4 sm:mb-0">
                  All fields marked with * are required
                </p>
                <button
                  type="submit"
                  className="flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
                >
                  <FiSave className="mr-2" />
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
