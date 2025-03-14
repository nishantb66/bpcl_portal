"use client";
import React from "react";
import { useRouter } from "next/navigation";
import {
  FiFileText,
  FiAlertCircle,
  FiClock,
  FiCheckCircle,
} from "react-icons/fi";

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            EP Teams Guide
          </h1>
          <p className="text-lg text-gray-600">
            Comprehensive documentation and resources for effective team
            collaboration
          </p>
        </div>

        {/* Status Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-10 rounded-md flex items-center">
          <FiAlertCircle className="text-blue-500 flex-shrink-0 mr-3 text-xl" />
          <p className="text-blue-700">
            Our documentation is currently under development. Check back soon
            for updates.
          </p>
        </div>

        {/* Content Sections */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* Getting Started */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <FiFileText className="text-indigo-500 text-xl mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">
                Getting Started
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Basic introduction to Teams features and interface navigation.
            </p>
            <div className="text-sm text-gray-500 flex items-center">
              <FiClock className="mr-1" /> Coming soon
            </div>
          </div>

          {/* Best Practices */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <FiCheckCircle className="text-green-500 text-xl mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">
                Best Practices
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Learn optimal ways to structure teams, channels, and
              communication.
            </p>
            <div className="text-sm text-gray-500 flex items-center">
              <FiClock className="mr-1" /> Coming soon
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Documentation Timeline
          </h2>
          <div className="space-y-6">
            <div className="flex">
              <div className="flex flex-col items-center mr-4">
                <div className="bg-green-500 rounded-full w-3 h-3"></div>
                <div className="bg-gray-200 flex-grow w-0.5 mt-1"></div>
              </div>
              <div>
                <p className="font-medium text-gray-800">Planning Phase</p>
                <p className="text-gray-600 text-sm">Completed</p>
              </div>
            </div>
            <div className="flex">
              <div className="flex flex-col items-center mr-4">
                <div className="bg-blue-500 rounded-full w-3 h-3"></div>
                <div className="bg-gray-200 flex-grow w-0.5 mt-1"></div>
              </div>
              <div>
                <p className="font-medium text-gray-800">Content Development</p>
                <p className="text-gray-600 text-sm">In Progress</p>
              </div>
            </div>
            <div className="flex">
              <div className="flex flex-col items-center mr-4">
                <div className="bg-gray-300 rounded-full w-3 h-3"></div>
              </div>
              <div>
                <p className="font-medium text-gray-800">Launch</p>
                <p className="text-gray-600 text-sm">April 2025</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white p-6 rounded-xl shadow-md text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            Questions?
          </h2>
          <p className="text-gray-600 mb-4">
            If you need immediate assistance, please contact our support team.
          </p>
          <button
            onClick={() => (window.location.href = "/contact")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
