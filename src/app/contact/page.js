"use client";

import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiMail, FiPhone, FiSend, FiUser } from "react-icons/fi";
import { useRouter } from "next/navigation";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

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

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message || "Failed to send message");
      }

      toast.success("Message sent successfully!");
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      toast.error(error.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <ToastContainer position="top-center" autoClose={3000} />

      {/* Card Container with subtle animation */}
      <div className="w-full max-w-xl bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden animate-[fadeIn_0.6s_ease-out]">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 0H100V100H0V0Z" fill="url(#grid)" />
              <defs>
                <pattern
                  id="grid"
                  patternUnits="userSpaceOnUse"
                  width="8"
                  height="8"
                  patternTransform="scale(0.5)"
                >
                  <rect width="8" height="8" fill="none" />
                  <path d="M0 0L8 8M8 0L0 8" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
            </svg>
          </div>

          <div className="relative flex items-start">
            <div className="mr-6">
              <div className="h-16 w-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                <div className="text-2xl font-bold text-white">NB</div>
              </div>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Get in Touch
              </h1>
              <p className="text-blue-100 mt-2 max-w-md">
                Have questions about the platform or interested in
                collaboration? I'd love to hear from you.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 sm:p-8">
          {/* Contact Info - Enhanced */}
          <div className="mb-8 grid sm:grid-cols-2 gap-4 p-5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                <FiMail className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Email</div>
                <a
                  href="mailto:nishantbaruah3@gmail.com"
                  className="text-sm font-medium text-slate-800 hover:text-indigo-600 transition-colors"
                >
                  nishantbaruah3@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                <FiPhone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Phone</div>
                <a
                  href="tel:+918486910792"
                  className="text-sm font-medium text-slate-800 hover:text-indigo-600 transition-colors"
                >
                  +91 8486910792
                </a>
              </div>
            </div>
          </div>

          {/* Separator with text */}
          <div className="flex items-center my-8">
            <div className="flex-grow h-px bg-slate-200"></div>
            <span className="px-4 text-sm font-medium text-slate-500">
              Contact Form
            </span>
            <div className="flex-grow h-px bg-slate-200"></div>
          </div>

          {/* Contact Form - Enhanced */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <FiUser className="w-5 h-5" />
                </span>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-3 text-slate-800 bg-white border border-slate-200 rounded-xl 
                  focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                  placeholder="Enter your name"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <FiMail className="w-5 h-5" />
                </span>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-3 text-slate-800 bg-white border border-slate-200 rounded-xl 
                  focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Message Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Your Message
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="5"
                required
                className="w-full p-4 text-slate-800 bg-white border border-slate-200 rounded-xl 
                focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                placeholder="Type your message here..."
              />
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center w-full px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium rounded-xl
                hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200 
                transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <FiSend className="mr-2" />
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
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
                    Sending...
                  </span>
                ) : (
                  "Send Message"
                )}
              </button>
            </div>

            {/* Privacy note */}
            <p className="text-xs text-center text-slate-500 mt-4">
              Your information is secure and will not be shared with third
              parties.
            </p>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Nishant Baruah • Building
             Portal Platform
          </p>
        </div>
      </div>
    </div>
  );
}
