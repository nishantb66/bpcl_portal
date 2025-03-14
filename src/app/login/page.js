"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiLogIn, FiHelpCircle } from "react-icons/fi";

export default function Login() {
  // State & Logic
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

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <h1 className="text-2xl font-bold text-indigo-700">Portal</h1>
          <nav className="flex items-center space-x-6">
            <button
              onClick={() => router.push("/")}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => router.push("/signup")}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Signup
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-grow items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <ToastContainer />
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          {/* Icon + Heading */}
          <div className="mb-6 text-center">
            <FiLogIn className="mx-auto h-12 w-12 text-indigo-600" />
            <h2 className="mt-3 text-2xl font-bold text-gray-800">
              Sign in to Your Account
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Please enter your credentials
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email-address"
                className="mb-1 block text-sm font-semibold text-gray-700"
              >
                Email Address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Enter your email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-semibold text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            {/* Forgot Password */}
            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Forgot your password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                loading ? "cursor-not-allowed opacity-70" : ""
              }`}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Additional Links */}
          <div className="mt-6 border-t border-gray-200 pt-4 text-center text-sm text-gray-600">
            <p>
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Register Now
              </Link>
            </p>
            <div className="mt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/admin"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Login as Administrator
              </Link>

              <span className="hidden sm:inline text-gray-300">|</span>

              <Link
                href="/about"
                className="font-medium text-indigo-600 hover:text-indigo-500 flex items-center gap-1.5"
              >
                <FiHelpCircle className="w-4 h-4" />
                <span>What is this Platform?</span>
              </Link>
            </div>
          </div>

          {/* Information Banner
          <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-3.5">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FiHelpCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  New to Enterprise Portal?
                </h3>
                <div className="mt-1 text-sm text-blue-700">
                  <p>
                    Learn more about our powerful enterprise collaboration
                    platform and discover how it can transform your workplace
                    productivity.
                  </p>
                  <p className="mt-2">
                    <Link
                      href="/about"
                      className="font-medium text-blue-700 hover:text-blue-900 underline decoration-blue-400 hover:decoration-blue-700 transition-colors"
                    >
                      Explore features →
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div> */}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Portal. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
