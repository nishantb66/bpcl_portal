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

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-center text-red-500 p-4">{error}</div>;

  const formFields = [
    { key: "name", type: "text", required: true },
    { key: "surname", type: "text", required: true },
    { key: "email", type: "email", required: true },
    { key: "joiningDate", type: "date", required: true },
    { key: "city", type: "text", required: true },
    { key: "localArea", type: "text", required: true },
    { key: "previousCompany", type: "text" },
    { key: "addressLine1", type: "text", required: true },
    { key: "addressLine2", type: "text" },
    { key: "designation", type: "text", required: true },
    { key: "shiftTimings", type: "text", required: true },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white shadow-md rounded p-6">
        <h2 className="text-xl font-bold mb-4">Your Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          {formFields.map(({ key, type, required }) => (
            <div key={key} className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {key.replace(/([A-Z])/g, " $1")}
                {required && <span className="text-red-500">*</span>}
              </label>
              <input
                type={type}
                value={profile[key]}
                onChange={(e) =>
                  setProfile({ ...profile, [key]: e.target.value })
                }
                required={required}
                className="w-full px-4 py-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Enter your ${key
                  .replace(/([A-Z])/g, " $1")
                  .toLowerCase()}`}
              />
            </div>
          ))}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
}
