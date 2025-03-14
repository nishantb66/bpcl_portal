"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function About() {
  const [activeSection, setActiveSection] = useState(null);
  const sectionsRef = useRef([]);

  // Technology stack with icons
  const techStack = [
    { name: "Next.js", icon: "nextjs.svg" },
    { name: "Node.js", icon: "nodejs.svg" },
    { name: "Express", icon: "express.svg" },
    { name: "MongoDB", icon: "mongodb.svg" },
    { name: "AWS", icon: "aws.svg" },
    { name: "Kafka", icon: "kafka.svg" },
    { name: "Docker", icon: "docker.svg" },
  ];

  // Features with detailed descriptions and icons
  const features = [
    {
      title: "Customers & Complaints",
      icon: "user-group",
      description:
        "Comprehensive customer management system with AI-powered complaint resolution tracking and intelligent status updates.",
      color: "from-blue-600 to-cyan-500",
    },
    {
      title: "Smart Leave Management",
      icon: "calendar-days",
      description:
        "Streamlined leave application process with real-time status tracking and personalized AI recommendations for optimal planning.",
      color: "from-indigo-600 to-purple-500",
    },
    {
      title: "Meeting Orchestration",
      icon: "video-camera",
      description:
        "Seamless meeting scheduling with smart room allocation, digital invitations, and real-time occupancy monitoring.",
      color: "from-purple-600 to-pink-500",
    },
    {
      title: "Task & Expense Management",
      icon: "clipboard-check",
      description:
        "Integrated task assignment system with secure expense reimbursement workflow and multi-level approval chains.",
      color: "from-red-600 to-orange-500",
    },
    {
      title: "Intelligent Calendar",
      icon: "calendar",
      description:
        "Comprehensive event management with prioritization tools, Google Calendar integration, and smart scheduling recommendations.",
      color: "from-emerald-600 to-teal-500",
    },
    {
      title: "Document Intelligence",
      icon: "document-text",
      description:
        "AI-powered PDF interaction allowing natural language queries and insight extraction with conversation export capabilities.",
      color: "from-amber-600 to-yellow-500",
    },
    {
      title: "Communications Hub",
      icon: "chat-bubble-left-right",
      description:
        "Real-time employee directory with instant messaging, notification management, and secure channel creation.",
      color: "from-lime-600 to-green-500",
    },
    {
      title: "Collaborative Workspace",
      icon: "users",
      description:
        "Comprehensive team environment with cross-module integrations, document sharing, and progress tracking dashboards.",
      color: "from-cyan-600 to-blue-500",
    },
  ];

  // Intersection observer to track which section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.5 }
    );

    const sections = sectionsRef.current;
    sections.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => {
      sections.forEach((section) => {
        if (section) observer.unobserve(section);
      });
    };
  }, []);

  // Animation variants for scrolling elements
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-grid-indigo-600/[0.15] bg-[size:30px_30px]"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 tracking-tight mb-6">
              Enterprise Portal
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
              A sophisticated enterprise solution built for the modern workplace
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/"
                className="px-6 py-3 text-white bg-indigo-600 rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 font-medium"
              >
                Explore Platform
              </Link>
              <Link
                href="/contact"
                className="px-6 py-3 text-indigo-600 bg-indigo-50 rounded-full shadow-md hover:bg-indigo-100 transition-all duration-300 hover:shadow-lg font-medium"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Decorative Element */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Overview Section */}
        <motion.section
          ref={(el) => (sectionsRef.current[0] = el)}
          id="overview"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="mb-20"
        >
          <div className="max-w-4xl mx-auto">
            <div className="inline-block mb-6">
              <span className="px-4 py-1.5 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                Overview
              </span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Elevating Enterprise Collaboration
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              Enterprise Portal transforms workplace productivity with a
              comprehensive suite of integrated tools designed for today's
              dynamic business environment. Built on a foundation of
              cutting-edge technologies, our platform delivers secure
              authentication, real-time communication, and powerful automation
              capabilities.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              From customer relationship management to internal team
              collaboration, Enterprise Portal provides a seamless experience
              that adapts to your organization's unique workflows and
              requirements.
            </p>
          </div>
        </motion.section>

        {/* Technology Stack
        <motion.section
          ref={(el) => (sectionsRef.current[1] = el)}
          id="technology"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="mb-20"
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-block mb-4">
                <span className="px-4 py-1.5 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                  Technology Stack
                </span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Built on Modern Architecture
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Leveraging the latest technologies to deliver exceptional
                performance, scalability, and security.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-6 items-center justify-center">
              {techStack.map((tech, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-4 text-center border border-gray-100 flex flex-col items-center justify-center aspect-square"
                >
                  <div className="h-12 w-12 flex items-center justify-center mb-3">
                    <svg
                      className="w-10 h-10 text-gray-400"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    {tech.name}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </motion.section> */}

        {/* Features Section */}
        <motion.section
          ref={(el) => (sectionsRef.current[2] = el)}
          id="features"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="mb-20"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-block mb-4">
                <span className="px-4 py-1.5 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                  Enterprise Features
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
                Powerful Tools for Modern Workplaces
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Our integrated suite of business tools delivers comprehensive
                solutions for today's complex enterprise challenges.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group ${
                    feature.title === "Collaborative Workspace"
                      ? "ring-2 ring-indigo-500/50 ring-offset-2 scale-105 z-10 transform"
                      : ""
                  }`}
                >
                  <div
                    className={`h-2 bg-gradient-to-r ${feature.color}`}
                  ></div>
                  <div className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div
                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}
                      >
                        {feature.title === "Collaborative Workspace" ? (
                          <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                        )}
                      </div>
                      <h3
                        className={`text-lg font-semibold ${
                          feature.title === "Collaborative Workspace"
                            ? "text-indigo-800"
                            : "text-gray-900"
                        }`}
                      >
                        {feature.title}
                        {feature.title === "Collaborative Workspace" && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            Featured
                          </span>
                        )}
                      </h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.title === "Collaborative Workspace" ? (
                        <>
                          Comprehensive team environment with cross-module
                          integrations, document sharing, and progress tracking
                          dashboards. Our advanced workspace supports seamless
                          cross-team collaboration with integrated tools.
                          <span className="block mt-2">
                            To know more about it, visit EP Teams{" "}
                            <a
                              href="https://bpcl-portal.vercel.app/teamsguide"
                              className="text-indigo-600 hover:text-indigo-800 font-medium underline decoration-indigo-300 hover:decoration-indigo-600 transition-all"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              guide
                            </a>
                            .
                          </span>
                        </>
                      ) : (
                        feature.description
                      )}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-16 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 shadow-inner">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-8 h-8 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Cross-Module Integration
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Our platform uniquely offers seamless integration between
                    all modules, creating a cohesive experience. The
                    collaborative workspace connects with calendars, tasks,
                    documents, and messaging systems to create a robust
                    enterprise application that streamlines all aspects of your
                    business operations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Call to Action */}
        <motion.section
          ref={(el) => (sectionsRef.current[3] = el)}
          id="cta"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="mb-20"
        >
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 shadow-xl">
            {/* Abstract Pattern Background */}
            <div className="absolute inset-0 opacity-10">
              <svg
                className="h-full w-full"
                width="100%"
                height="100%"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <defs>
                  <pattern
                    id="dots"
                    width="20"
                    height="20"
                    patternUnits="userSpaceOnUse"
                  >
                    <circle cx="10" cy="10" r="1.5" fill="white" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#dots)" />
              </svg>
            </div>

            <div className="relative z-10 py-16 px-6 sm:px-12 lg:px-20 text-center md:text-left md:flex items-center justify-between">
              <div className="max-w-2xl md:max-w-none mb-8 md:mb-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                  Ready to transform your enterprise?
                </h2>
                <p className="text-indigo-100 leading-relaxed text-lg">
                  Explore how Enterprise Portal can streamline your operations
                  and boost collaboration.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <Link
                  href="/"
                  className="px-6 py-3.5 bg-white text-indigo-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                >
                  Get Started
                </Link>
                <Link
                  href="/contact"
                  className="px-6 py-3.5 bg-indigo-800 text-white rounded-full shadow-lg hover:bg-indigo-900 hover:shadow-xl transition-all duration-300 font-medium"
                >
                  Collaborate
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      </main>

      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <Link href="/" className="flex items-center">
                <span className="text-2xl font-bold text-gray-900">
                  Enterprise<span className="text-indigo-600">Portal</span>
                </span>
              </Link>
              <p className="mt-2 text-gray-600">
                Transforming enterprise collaboration
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-indigo-600 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/contact"
                className="text-gray-600 hover:text-indigo-600 transition-colors"
              >
                Contact
              </Link>
              <Link
                href="#"
                className="text-gray-600 hover:text-indigo-600 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                className="text-gray-600 hover:text-indigo-600 transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} Enterprise Portal. All rights
              reserved.
            </p>
            <div className="mt-4 sm:mt-0 flex space-x-6">
              <a
                href="https://www.linkedin.com/in/nishantbaru/"
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">LinkedIn</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a
                href="https://github.com/nishantb66"
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">GitHub</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="https://nishantb66.github.io/MyPortfolio/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Portfolio</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
