"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Complaints() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    customerName: "",
    contactNumber: "",
    complaintDetails: "",
    type: "General",
    urgency: "Medium",
  });
  const [submitting, setSubmitting] = useState(false);

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
        alert("Complaint registered successfully!");
        router.push("/customer-details");
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to register complaint");
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to submit complaint");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/customer-details"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-900 bg-white rounded-lg border border-blue-900 hover:bg-blue-50 transition-colors"
          >
            ← Back to Customer Management
          </Link>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md">
          <h1 className="text-2xl font-bold text-blue-900 mb-6">
            Register New Complaint
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                pattern="[0-9]{10}"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Complaint Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="General">General</option>
                <option value="Billing">Billing</option>
                <option value="Service">Service</option>
                <option value="Product">Product</option>
              </select>
            </div>

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
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700">{level}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Complaint Details <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.complaintDetails}
                onChange={(e) =>
                  setFormData({ ...formData, complaintDetails: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
                placeholder="Describe the complaint in detail..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-900 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-800 transition-colors disabled:bg-gray-400"
            >
              {submitting ? "Submitting..." : "Register Complaint"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
