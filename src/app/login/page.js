"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiLogIn } from "react-icons/fi";

export default function Login() {
  // ----------------- Non-UI State & Logic (kept intact) -----------------
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type: "login" }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Logged in successfully!");
        localStorage.setItem("token", data.token);
        localStorage.setItem("name", data.name);
        console.log("Saved Token:", localStorage.getItem("token"));
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Failed to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  // ----------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      {/* Top Navigation (similar to Signup) */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <h1 className="text-lg font-bold text-indigo-700">Portal</h1>
          <nav className="flex items-center space-x-3">
            <button
              onClick={() => router.push("/")}
              className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => router.push("/signup")}
              className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Signup
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <ToastContainer />
        <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 space-y-4">
          {/* Icon + Heading */}
          <div className="text-center space-y-1">
            <div className="flex flex-col items-center">
              <FiLogIn className="w-10 h-10 text-indigo-700" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              Sign in to Your Account
            </h2>
            <p className="text-sm text-gray-500">
              Please enter your credentials
            </p>
          </div>

          {/* Login Form */}
          <form className="space-y-3" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label
                htmlFor="email-address"
                className="block text-sm font-medium text-gray-700 mb-0.5"
              >
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                placeholder="Enter your email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-0.5"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Forgot your password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2.5 px-4 rounded-lg text-white text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Footer / Additional Links */}
          <div className="pt-3 border-t border-gray-200 text-center text-sm space-y-2">
            <p className="text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-medium text-indigo-600 hover:text-indigo-500 transition duration-150"
              >
                Register Now
              </Link>
            </p>
            <Link
              href="/admin"
              className="block text-indigo-600 font-medium hover:text-indigo-500 transition duration-150"
            >
              Login as Administrator
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
