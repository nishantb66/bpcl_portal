"use client";

import { useState, useEffect } from "react";

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

  const formFields = [
    {
      key: "name",
      type: "text",
      required: true,
      colSpan: "col-span-1 md:col-span-1",
    },
    {
      key: "surname",
      type: "text",
      required: true,
      colSpan: "col-span-1 md:col-span-1",
    },
    {
      key: "email",
      type: "email",
      required: true,
      colSpan: "col-span-2",
      readOnly: true, // Add this property
    },
    {
      key: "city",
      type: "text",
      required: true,
      colSpan: "col-span-1 md:col-span-1",
    },
    {
      key: "localArea",
      type: "text",
      required: true,
      colSpan: "col-span-1 md:col-span-1",
    },
    { key: "previousCompany", type: "text", colSpan: "col-span-2" },
    {
      key: "addressLine1",
      type: "text",
      required: true,
      colSpan: "col-span-2",
    },
    { key: "addressLine2", type: "text", colSpan: "col-span-2" },
    {
      key: "designation",
      type: "text",
      required: true,
      colSpan: "col-span-1 md:col-span-1",
    },
    {
      key: "shiftTimings",
      type: "text",
      required: true,
      colSpan: "col-span-1 md:col-span-1",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-blue-900 px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {profile.name} {profile.surname}
                </h1>
                <p className="text-blue-200 mt-1">{profile.designation}</p>
              </div>
              <div className="bg-yellow-400 px-4 py-2 rounded-lg">
                <p className="text-blue-900 font-semibold text-sm">
                  Joined: {profile.joiningDate}
                </p>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSave} className="px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formFields.map(({ key, type, required, colSpan, readOnly }) => (
                <div key={key} className={`${colSpan}`}>
                  <label className="block text-sm font-medium text-blue-900 mb-2 capitalize">
                    {key.replace(/([A-Z])/g, " $1")}
                    {required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type={type}
                    value={profile[key]}
                    onChange={(e) => {
                      if (!readOnly) {
                        // Only update if not read-only
                        setProfile({ ...profile, [key]: e.target.value });
                      }
                    }}
                    required={required}
                    readOnly={readOnly} // Add readOnly attribute
                    className={`w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all ${
                      readOnly
                        ? "bg-gray-100 cursor-not-allowed text-gray-500"
                        : ""
                    }`}
                    placeholder={`Enter ${key
                      .replace(/([A-Z])/g, " $1")
                      .toLowerCase()}`}
                  />
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-blue-100 pt-6">
              <button
                type="submit"
                className="w-full bg-yellow-400 text-blue-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
              >
                Update Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
