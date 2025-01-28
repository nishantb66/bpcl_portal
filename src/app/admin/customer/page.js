"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Customer() {
  const [customerDetails, setCustomerDetails] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchCustomerDetails();
    fetchComplaints();
  }, []);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/customerDetails");
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
      const response = await fetch("/api/complaints");
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4">
            <h1 className="text-xl sm:text-2xl font-bold text-blue-900">
              Customer Management
            </h1>
            <button
              onClick={() => router.push("/admin")}
              className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors"
            >
              Back to Admin
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="h-12 w-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-lg border border-red-100">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Customer Details Section */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-6">
                Customer Details
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                        Fuel Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                        Payment Mode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                        Loyalty Points
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                        Membership Status
                      </th>
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
                          {customer.membershipStatus}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Complaints Section */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-6">
                Complaints
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                        Customer Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                        Complaint Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                        Urgency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                        Created At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {complaints.map((complaint) => (
                      <tr key={complaint._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-800">
                          {complaint.customerName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {complaint.complaintDetails}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {complaint.type}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {complaint.urgency}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {complaint.status}
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
          </div>
        )}
      </main>
    </div>
  );
}
