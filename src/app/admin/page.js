"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UserCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
} from "@heroicons/react/24/solid";
import { SurveyChart } from "../components/SurveyChart";
import { MenuIcon, XIcon } from "lucide-react";

const questions = [
  {
    id: 1,
    question: "How satisfied are you with your current working conditions?",
    options: ["Very Satisfied", "Satisfied", "Neutral", "I don't know"],
  },
  {
    id: 2,
    question: "Do you feel that your work is recognized and appreciated?",
    options: ["Always", "Sometimes", "Rarely", "Prefer not to say"],
  },
  {
    id: 3,
    question: "How would you rate the work-life balance in your current role?",
    options: ["Excellent", "Good", "Fair", "I don't know"],
  },
  {
    id: 4,
    question:
      "Do you have access to the necessary tools and resources to perform your job effectively?",
    options: ["Always", "Most of the time", "Rarely", "Not applicable"],
  },
  {
    id: 5,
    question:
      "How comfortable are you with the level of communication within your team?",
    options: ["Very Comfortable", "Comfortable", "Neutral", "I don't know"],
  },
  {
    id: 6,
    question:
      "Do you feel that your opinions and suggestions are valued by your superiors?",
    options: ["Always", "Sometimes", "Rarely", "Prefer not to say"],
  },
  {
    id: 7,
    question:
      "How would you rate the cleanliness and maintenance of your workplace?",
    options: ["Excellent", "Good", "Fair", "I don't know"],
  },
  {
    id: 8,
    question:
      "Do you feel that your job provides opportunities for growth and development?",
    options: ["Yes, definitely", "Somewhat", "Not really", "Not applicable"],
  },
  {
    id: 9,
    question:
      "How satisfied are you with the health and safety measures at your workplace?",
    options: ["Very Satisfied", "Satisfied", "Neutral", "I don't know"],
  },
  {
    id: 10,
    question: "Do you feel that your workload is manageable?",
    options: ["Always", "Most of the time", "Rarely", "Prefer not to say"],
  },
  {
    id: 11,
    question:
      "How would you rate the quality of leadership in your organization?",
    options: ["Excellent", "Good", "Fair", "I don't know"],
  },
  {
    id: 12,
    question: "Do you feel that your compensation is fair for the work you do?",
    options: ["Yes, definitely", "Somewhat", "Not really", "Prefer not to say"],
  },
  {
    id: 13,
    question:
      "How satisfied are you with the training and development programs offered?",
    options: ["Very Satisfied", "Satisfied", "Neutral", "Not applicable"],
  },
  {
    id: 14,
    question:
      "Do you feel that your workplace promotes diversity and inclusion?",
    options: ["Yes, definitely", "Somewhat", "Not really", "I don't know"],
  },
  {
    id: 15,
    question:
      "How would you rate the level of teamwork and collaboration in your organization?",
    options: ["Excellent", "Good", "Fair", "I don't know"],
  },
  {
    id: 16,
    question:
      "Do you feel that your workplace is free from harassment and discrimination?",
    options: ["Yes, definitely", "Somewhat", "Not really", "Prefer not to say"],
  },
  {
    id: 17,
    question:
      "How satisfied are you with the benefits provided by your employer?",
    options: ["Very Satisfied", "Satisfied", "Neutral", "Not applicable"],
  },
  {
    id: 18,
    question:
      "Do you feel that your workplace fosters innovation and creativity?",
    options: ["Yes, definitely", "Somewhat", "Not really", "I don't know"],
  },
  {
    id: 19,
    question:
      "How would you rate the overall morale and motivation of your team?",
    options: ["Excellent", "Good", "Fair", "I don't know"],
  },
  {
    id: 20,
    question: "Do you feel that your workplace is environmentally conscious?",
    options: ["Yes, definitely", "Somewhat", "Not really", "Not applicable"],
  },
];


//function to fetch survey data
const fetchSurveys = async () => {
  try {
    const response = await fetch("/api/survey", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    });
    const data = await response.json();
    if (response.ok) {
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    throw new Error("Failed to fetch survey data");
  }
};

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
  const [showLeaveDetails, setShowLeaveDetails] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [leaveToDelete, setLeaveToDelete] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [showSurveyDetails, setShowSurveyDetails] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(false);
  const router = useRouter();

  // === REIMBURSEMENT CHANGES START ===
  const [showReimbursementDetails, setShowReimbursementDetails] =
    useState(false);
  const [reimbursements, setReimbursements] = useState([]);
  const [selectedReimbursement, setSelectedReimbursement] = useState(null);
  const [reimbursementToDelete, setReimbursementToDelete] = useState(null);
  // === REIMBURSEMENT CHANGES END ===

  useEffect(() => {
    let inactivityTimer;

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        localStorage.removeItem("adminToken");
        setIsAuthenticated(false);
        router.push("/admin");
      }, 300000); // 5 minutes
    };

    // Initial setup
    resetInactivityTimer();

    // Event listeners for user activity
    window.addEventListener("mousemove", resetInactivityTimer);
    window.addEventListener("keypress", resetInactivityTimer);

    // Cleanup
    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener("mousemove", resetInactivityTimer);
      window.removeEventListener("keypress", resetInactivityTimer);
    };
  }, [isAuthenticated, router]);

  const LoadingIndicator = () => (
    <div className="flex justify-center items-center space-x-2">
      <div className="w-4 h-4 bg-blue-900 rounded-full animate-bounce"></div>
      <div className="w-4 h-4 bg-blue-900 rounded-full animate-bounce delay-100"></div>
      <div className="w-4 h-4 bg-blue-900 rounded-full animate-bounce delay-200"></div>
    </div>
  );

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
      fetchCustomerDetails();
      fetchComplaints();
      fetchLeaves();
      // === REIMBURSEMENT CHANGES START ===
      fetchAllReimbursements();
      // === REIMBURSEMENT CHANGES END ===
    }
  }, [isAuthenticated]);

  // useEffect to fetch survey data
  useEffect(() => {
    if (isAuthenticated) {
      fetchSurveys()
        .then((data) => setSurveys(data))
        .catch((err) => setError(err.message));
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

  // function to fetch leave data
  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/leaves", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setLeaves(data.leaves);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to fetch leaves");
    } finally {
      setLoading(false);
    }
  };

  const updateLeaveStatus = async (leaveId, newStatus) => {
    try {
      const response = await fetch(`/api/admin/leaves`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({
          id: leaveId,
          status: newStatus,
        }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      // Refresh leaves after update
      fetchLeaves();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cooldown) {
      setError("Please wait 5 minutes before trying again.");
      return;
    }

    setLoading(true);
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
        setLoginAttempts(0); // Reset login attempts on successful login
      } else {
        setError(data.message);
        setLoginAttempts((prev) => prev + 1);

        if (loginAttempts + 1 >= 3) {
          setCooldown(true);
          setTimeout(() => setCooldown(false), 300000); // 5 minutes cooldown
        }
      }
    } catch (err) {
      setError("Failed to authenticate");
    } finally {
      setLoading(false);
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
      setLoadingCustomers(true);
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
      setLoadingCustomers(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      setLoadingComplaints(true);
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
      setLoadingComplaints(false);
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

  // === REIMBURSEMENT CHANGES START ===
  // 1. Fetch all reimbursements
  const fetchAllReimbursements = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/reimbursements", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setReimbursements(data.reimbursements || []);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to fetch reimbursements");
    } finally {
      setLoading(false);
    }
  };

  // 2. Update reimbursement (status + adminMessage)
  const updateReimbursement = async (id, status, adminMessage) => {
    try {
      const response = await fetch("/api/admin/reimbursements", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({
          id,
          status,
          adminMessage,
        }),
      });
      if (!response.ok) throw new Error("Failed to update reimbursement");

      // Refresh reimbursements after update
      fetchAllReimbursements();
    } catch (error) {
      setError(error.message);
    }
  };
  // === REIMBURSEMENT CHANGES END ===

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
            {/* Error Alert */}
            {error && (
              <div className="animate-fade-in bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-red-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* Username Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={form.username}
                      onChange={(e) =>
                        setForm({ ...form, username: e.target.value })
                      }
                      className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150 text-gray-900 placeholder-gray-400"
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150 text-gray-900 placeholder-gray-400"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || cooldown}
                className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-white font-semibold bg-indigo-700 hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 bg-white shadow-md z-50 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-4">
          <h1 className="text-xl sm:text-2xl font-bold text-blue-900">
            Admin Dashboard
          </h1>

          <div className="hidden sm:flex items-center gap-4">
            <button
              onClick={() => setShowEmployeeDetails(!showEmployeeDetails)}
              className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition"
            >
              {showEmployeeDetails ? "Hide Employees" : "Employee Details"}
            </button>

            <button
              onClick={() => {
                setShowLeaveDetails(!showLeaveDetails);
                setShowEmployeeDetails(false);
                setShowReimbursementDetails(false);
              }}
              className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition"
            >
              {showLeaveDetails ? "Hide Leaves" : "View Leave Applications"}
            </button>

            <button
              onClick={() => setShowSurveyDetails(!showSurveyDetails)}
              className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition"
            >
              {showSurveyDetails ? "Hide Surveys" : "View Survey Responses"}
            </button>

            {/* === REIMBURSEMENT CHANGES START === */}
            <button
              onClick={() => {
                setShowReimbursementDetails(!showReimbursementDetails);
                setShowLeaveDetails(false);
                setShowEmployeeDetails(false);
                setShowSurveyDetails(false);
              }}
              className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition"
            >
              {showReimbursementDetails
                ? "Hide Reimbursements"
                : "View Reimbursements"}
            </button>
            {/* === REIMBURSEMENT CHANGES END === */}

            <button
              onClick={() => {
                localStorage.removeItem("adminToken");
                setIsAuthenticated(false);
              }}
              className="px-4 py-2 bg-yellow-500 text-blue-900 rounded-lg hover:bg-yellow-400 transition"
            >
              Logout
            </button>
          </div>

          <div className="sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-blue-900 focus:outline-none"
            >
              {mobileMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="sm:hidden bg-white border-t border-gray-200 flex flex-col items-start p-4 space-y-2 shadow-md">
            <button
              onClick={() => setShowEmployeeDetails(!showEmployeeDetails)}
              className="w-full text-left text-blue-900 font-medium hover:text-blue-700 transition"
            >
              {showEmployeeDetails ? "Hide Employees" : "Employee Details"}
            </button>
            <button
              onClick={() => {
                setShowLeaveDetails(!showLeaveDetails);
                setShowEmployeeDetails(false);
                setShowReimbursementDetails(false);
              }}
              className="w-full text-left text-blue-900 font-medium hover:text-blue-700 transition"
            >
              {showLeaveDetails ? "Hide Leaves" : "View Leave Applications"}
            </button>
            <button
              onClick={() => setShowSurveyDetails(!showSurveyDetails)}
              className="w-full text-left text-blue-900 font-medium hover:text-blue-700 transition"
            >
              {showSurveyDetails ? "Hide Surveys" : "View Survey Responses"}
            </button>

            {/* === REIMBURSEMENT CHANGES START === */}
            <button
              onClick={() => {
                setShowReimbursementDetails(!showReimbursementDetails);
                setShowLeaveDetails(false);
                setShowEmployeeDetails(false);
                setShowSurveyDetails(false);
              }}
              className="w-full text-left text-blue-900 font-medium hover:text-blue-700 transition"
            >
              {showReimbursementDetails
                ? "Hide Reimbursements"
                : "View Reimbursements"}
            </button>
            {/* === REIMBURSEMENT CHANGES END === */}

            <button
              onClick={() => {
                localStorage.removeItem("adminToken");
                setIsAuthenticated(false);
              }}
              className="w-full text-left text-red-600 font-medium hover:text-red-400 transition"
            >
              Logout
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showSurveyDetails && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <ChartBarIcon className="h-6 w-6 text-blue-600 mr-2" />
                Survey Responses
              </h2>
            </div>
            <div className="p-6">
              <SurveyChart surveys={surveys} questions={questions} />
            </div>
            <div className="overflow-x-auto">
              {/* Desktop View */}
              <table className="hidden sm:table min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                      User
                    </th>
                    {questions.map((question) => (
                      <th
                        key={question.id}
                        className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider"
                      >
                        {question.question}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {surveys.map((survey) => (
                    <tr key={survey._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {survey.user}
                      </td>
                      {questions.map((question) => (
                        <td
                          key={question.id}
                          className="px-6 py-4 text-sm text-gray-600"
                        >
                          {survey.answers?.[question.id] ?? "N/A"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile View */}
              <div className="sm:hidden space-y-4 p-4">
                {surveys.map((survey) => (
                  <div key={survey._id} className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2">
                      <p className="font-medium text-blue-900">{survey.user}</p>
                      {questions.map((question) => (
                        <div
                          key={question.id}
                          className="text-sm text-gray-600"
                        >
                          <p className="font-medium text-gray-500">
                            {question.question}
                          </p>
                          <p>{survey.answers?.[question.id] ?? "N/A"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
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
        ) : showLeaveDetails ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* Mobile View */}
            <div className="sm:hidden space-y-4 p-4">
              {leaves.map((leave) => (
                <div key={leave._id} className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <p className="font-medium text-blue-900">{leave.name}</p>
                    <p className="text-sm text-gray-600">{leave.userEmail}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">
                        {new Date(leave.fromDate).toLocaleDateString()}
                      </span>
                      <span className="text-gray-500">
                        {new Date(leave.toDate).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{leave.reason}</p>
                    <div className="flex gap-2 mt-2">
                      <select
                        value={leave.status}
                        onChange={(e) =>
                          updateLeaveStatus(leave._id, e.target.value)
                        }
                        className={`px-2 py-1 text-xs rounded-full ${
                          leave.status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : leave.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                      <button
                        onClick={() => setLeaveToDelete(leave)}
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
                  {[
                    "Name",
                    "Email",
                    "From Date",
                    "To Date",
                    "Reason",
                    "Status",
                    "Actions",
                  ].map((header) => (
                    <th
                      key={header}
                      className="p-4 text-left text-sm font-medium text-blue-900"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-gray-50">
                    <td className="p-4 text-gray-800">{leave.name}</td>
                    <td className="p-4 text-gray-600 text-sm">
                      {leave.userEmail}
                    </td>
                    <td className="p-4 text-gray-600 text-sm">
                      {new Date(leave.fromDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-gray-600 text-sm">
                      {new Date(leave.toDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-gray-600 text-sm">
                      {leave.reason}
                    </td>
                    <td className="p-4 text-gray-600 text-sm">
                      <select
                        value={leave.status}
                        onChange={(e) =>
                          updateLeaveStatus(leave._id, e.target.value)
                        }
                        className={`px-2 py-1 text-xs rounded-full ${
                          leave.status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : leave.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setLeaveToDelete(leave)}
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
        ) : showReimbursementDetails ? (
          // === REIMBURSEMENT CHANGES START ===
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                All Reimbursements
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-50">
                  <tr>
                    {[
                      "User Email",
                      "Cost",
                      "Reason",
                      "File",
                      "Status",
                      "Admin Message",
                      "Created At",
                      "Actions",
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
                  {reimbursements.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {item.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.cost}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.reason}
                      </td>
                      <td className="px-6 py-4 text-sm text-blue-600 underline">
                        {item.fileData ? (
                          <a
                            href={`data:${item.fileType};base64,${item.fileData}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View File
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <select
                          value={item.status || "pending"}
                          onChange={(e) =>
                            updateReimbursement(
                              item._id,
                              e.target.value,
                              item.adminMessage || ""
                            )
                          }
                          className={`px-2 py-1 text-xs rounded-full ${
                            item.status === "Approved"
                              ? "bg-green-100 text-green-800"
                              : item.status === "Rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.adminMessage || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            setSelectedReimbursement({
                              ...item,
                              // fallback if not defined
                              adminMessage: item.adminMessage || "",
                            })
                          }
                          className="px-3 py-1.5 bg-blue-900 text-white text-sm rounded-md hover:bg-blue-800"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // === REIMBURSEMENT CHANGES END ===
          <div className="space-y-8">
            {/* Customer Details Section */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <UserCircleIcon className="h-6 w-6 text-blue-600 mr-2" />
                  Customer Details
                </h2>
              </div>
              {loadingCustomers ? (
                <div className="flex justify-center items-center h-32">
                  <LoadingIndicator />
                </div>
              ) : (
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
              )}
            </section>

            {/* Complaints Section */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
                  Complaints
                </h2>
              </div>
              {loadingComplaints ? (
                <div className="flex justify-center items-center h-32">
                  <LoadingIndicator />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-50">
                      <tr>
                        {[
                          "Customer Name",
                          "Petrol Pump Location",
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
              )}
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
      {leaveToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              Confirm Delete
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {leaveToDelete.name}'s leave
              application?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setLeaveToDelete(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(
                      `/api/admin/leaves?id=${leaveToDelete._id}`,
                      {
                        method: "DELETE",
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem(
                            "adminToken"
                          )}`,
                        },
                      }
                    );

                    if (response.ok) {
                      setLeaves(
                        leaves.filter((l) => l._id !== leaveToDelete._id)
                      );
                      setLeaveToDelete(null);
                    }
                  } catch (error) {
                    setError("Failed to delete leave");
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === REIMBURSEMENT CHANGES START === */}
      {selectedReimbursement && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Edit Reimbursement (User: {selectedReimbursement.email})
              </h3>
              <button
                onClick={() => setSelectedReimbursement(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await updateReimbursement(
                    selectedReimbursement._id,
                    selectedReimbursement.status,
                    selectedReimbursement.adminMessage
                  );
                  setSelectedReimbursement(null);
                } catch (error) {
                  console.error("Update failed:", error);
                }
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Reimbursement Status
                  </label>
                  <select
                    value={selectedReimbursement.status || "pending"}
                    onChange={(e) =>
                      setSelectedReimbursement((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="block w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Admin Message / Instructions
                  </label>
                  <textarea
                    value={selectedReimbursement.adminMessage}
                    onChange={(e) =>
                      setSelectedReimbursement((prev) => ({
                        ...prev,
                        adminMessage: e.target.value,
                      }))
                    }
                    className="w-full p-2 border rounded-md h-24"
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
      {/* === REIMBURSEMENT CHANGES END === */}
    </div>
  );
}
