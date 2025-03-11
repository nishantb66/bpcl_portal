"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Complaints() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    customerName: "",
    contactNumber: "",
    petrolPumpLocation: "",
    complaintDetails: "",
    type: "General",
    urgency: "Medium",
  });
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Complaint registered successfully!");
        setTimeout(() => {
          router.push("/customer-details");
        }, 1500);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to register complaint");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit complaint");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 sm:p-6 lg:p-8">
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/customer-details"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-700 bg-white rounded-lg border border-indigo-700 hover:bg-indigo-50 transition-colors"
          >
            ← Back to Customer Management
          </Link>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold text-indigo-700 mb-6">
            Register New Complaint
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) =>
                  setFormData({ ...formData, customerName: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              <input
                type="tel"
                value={formData.contactNumber}
                onChange={(e) =>
                  setFormData({ ...formData, contactNumber: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                pattern="[0-9]{10}"
              />
            </div>

            {/* Petrol Pump Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Petrol Pump Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.petrolPumpLocation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    petrolPumpLocation: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter petrol pump location"
              />
            </div>

            {/* Complaint Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Complaint Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="General">General</option>
                <option value="Billing">Billing</option>
                <option value="Service">Service</option>
                <option value="Product">Product</option>
              </select>
            </div>

            {/* Urgency Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency Level
              </label>
              <div className="flex gap-4">
                {["Low", "Medium", "High"].map((level) => (
                  <label key={level} className="flex items-center">
                    <input
                      type="radio"
                      name="urgency"
                      value={level}
                      checked={formData.urgency === level}
                      onChange={() =>
                        setFormData({ ...formData, urgency: level })
                      }
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-gray-700">{level}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Complaint Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Complaint Details <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.complaintDetails}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    complaintDetails: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 h-32"
                placeholder="Describe the complaint in detail..."
              ></textarea>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-700 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-800 transition-colors disabled:bg-gray-400"
            >
              {submitting ? "Submitting..." : "Register Complaint"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
