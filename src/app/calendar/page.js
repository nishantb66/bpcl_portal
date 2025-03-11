"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import jwt from "jsonwebtoken";
import {
  FiLoader,
  FiPlus,
  FiCheck,
  FiTrash2,
  FiX,
  FiMessageSquare,
} from "react-icons/fi";

export default function CalendarPage() {
  const router = useRouter();

  // ========== State Variables ==========
  const [userReminders, setUserReminders] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loadingReminders, setLoadingReminders] = useState(false);

  // For form fields
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentId, setCurrentId] = useState(null);
  const [plans, setPlans] = useState("");
  const [time, setTime] = useState("");
  const [importance, setImportance] = useState("Low");
  const [associatedPeople, setAssociatedPeople] = useState("");

  // Show current month by default
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  // For scrolling to form
  const formRef = useRef(null);

  // ========== Effects ==========
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.info("Please log in to access your calendar.");
      router.push("/login");
    } else {
      if (checkTokenExpiration(token)) {
        toast.info("Session expired. Please log in again.");
        setTimeout(() => {
          localStorage.removeItem("token");
          router.push("/login");
        }, 2000);
      } else {
        fetchUserReminders(token);
      }
    }
  }, [router]);

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

  useEffect(() => {
    if (isFormOpen && formRef.current) {
      setTimeout(() => {
        formRef.current.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [isFormOpen]);

  // ========== Helpers ==========
  const checkTokenExpiration = (token) => {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        const currentTime = Date.now() / 1000;
        return decoded.exp < currentTime;
      }
      return false;
    } catch {
      return true;
    }
  };

  const fetchUserReminders = async (token) => {
    try {
      setLoadingReminders(true);
      const response = await fetch("/api/calendar", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setUserReminders(data.reminders || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingReminders(false);
    }
  };

  // ========== Month Switching ==========
  const handlePrevMonth = () => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const handleNextMonth = () => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // ========== Calendar Helpers ==========
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const buildCalendarDays = () => {
    const days = [];
    const totalDays = getDaysInMonth(currentYear, currentMonth);
    const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(currentYear, currentMonth, d));
    }
    return days;
  };

  const isToday = (date) => {
    if (!date) return false;
    const now = new Date();
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  };

  // ========== Click a Date (Open Form) ==========
  const handleDateClick = (date) => {
    if (!date) return;
    setSelectedDate(date);
    const existingReminder = userReminders.find(
      (r) => new Date(r.date).toDateString() === date.toDateString()
    );
    if (existingReminder) {
      setCurrentId(existingReminder._id);
      setPlans(existingReminder.plans);
      setTime(existingReminder.time);
      setImportance(existingReminder.importance);
      setAssociatedPeople(existingReminder.associatedPeople);
    } else {
      setCurrentId(null);
      setPlans("");
      setTime("");
      setImportance("Low");
      setAssociatedPeople("");
    }
    setIsFormOpen(true);
  };

  // ========== CRUD Operations ==========
  const handleCreateReminder = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const newReminder = {
      date: selectedDate,
      plans,
      time,
      importance,
      associatedPeople,
    };
    try {
      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newReminder),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      toast.success("Reminder created!");
      setIsFormOpen(false);
      fetchUserReminders(token);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEditReminder = async () => {
    const token = localStorage.getItem("token");
    if (!token || !currentId) return;
    const updatedReminder = {
      _id: currentId,
      date: selectedDate,
      plans,
      time,
      importance,
      associatedPeople,
    };
    try {
      const response = await fetch("/api/calendar", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedReminder),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      toast.success("Reminder updated!");
      setIsFormOpen(false);
      fetchUserReminders(token);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteReminder = async () => {
    const token = localStorage.getItem("token");
    if (!token || !currentId) return;
    try {
      const response = await fetch("/api/calendar", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ _id: currentId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      toast.success("Reminder deleted!");
      setIsFormOpen(false);
      fetchUserReminders(token);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // For color-coding based on importance
  const getDateColor = (date) => {
    if (!date) return "";
    const reminder = userReminders.find(
      (r) => new Date(r.date).toDateString() === date.toDateString()
    );
    if (!reminder) return "";
    if (reminder.importance === "Low") return "bg-green-200";
    if (reminder.importance === "Medium") return "bg-yellow-100";
    if (reminder.importance === "High") return "bg-red-200";
    return "";
  };

  const calendarDays = buildCalendarDays();

  // ========== AI Chat State & Logic ==========
  const [showAiChat, setShowAiChat] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hello! How can I help you with your calendar, friend?`,
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const messageListRef = useRef(null);

  // Scroll chat to bottom on each new message
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    const newMessages = [...messages, { role: "user", content: userInput }];
    setMessages(newMessages);
    setUserInput("");
    setIsLoadingAI(true);

    try {
      const response = await fetch("/api/calendar/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        setIsLoadingAI(false);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Oops, something went wrong with the AI service.",
          },
        ]);
        return;
      }

      // Stream the AI response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let aiResponse = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value || new Uint8Array(), {
          stream: !doneReading,
        });
        aiResponse += chunkValue;

        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.role === "assistant") {
            return [
              ...prev.slice(0, -1),
              { ...lastMsg, content: lastMsg.content + chunkValue },
            ];
          } else {
            return [...prev, { role: "assistant", content: chunkValue }];
          }
        });
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble responding right now.",
        },
      ]);
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Top Navbar */}
      <nav className="bg-gray-900 text-white py-3 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold">Portal</h1>
          <span className="text-xs text-gray-300">Crafted by Nishant</span>
        </div>
        <div className="flex items-center space-x-4">
          <a
            href="/"
            className="text-sm hover:underline transition-colors duration-200"
          >
            Home
          </a>
        </div>
      </nav>

      {/* Toast notifications */}
      <ToastContainer position="top-center" autoClose={3000} />

      {/* Loading Indicator Overlay */}
      {loadingReminders && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900/50 z-50">
          <FiLoader className="text-white w-10 h-10 animate-spin" />
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-6">
        {/* Page Header */}
        <header className="mb-6 text-center">
          <h2 className="text-3xl font-bold text-gray-800">
            Your Personal Calendar
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            Keep track of important dates and reminders
          </p>
        </header>

        {/* ---------- NEW: AI Chat Feature ---------- */}
        <div className="mt-8 text-right">
          <button
            onClick={() => setShowAiChat(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors"
          >
            <FiMessageSquare />
            <span>Chat with AI about your Calendar</span>
          </button>
        </div>

        {/* Calendar Card */}
        <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6">
          {/* Month Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevMonth}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Prev
              </button>
              <button
                onClick={handleNextMonth}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Next
              </button>
            </div>
            <div className="mt-3 sm:mt-0 text-xl font-semibold text-gray-800">
              {monthNames[currentMonth]} {currentYear}
            </div>
          </div>

          {/* Day-of-week header */}
          <div className="hidden sm:grid grid-cols-7 text-center font-semibold border-b pb-2 text-gray-600">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>
          <div className="sm:hidden grid grid-cols-7 text-xs text-center font-semibold border-b pb-2 text-gray-600">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mt-3">
            {buildCalendarDays().map((day, index) => {
              const dateColorClass = getDateColor(day);
              const cellBgClass = dateColorClass || "bg-white hover:bg-gray-50";
              const isTodayClass =
                day && isToday(day)
                  ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-white"
                  : "";
              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(day)}
                  className={`relative p-2 sm:p-3 min-h-[60px] sm:min-h-[80px] flex items-center justify-center border rounded cursor-pointer transition transform hover:scale-105 
                    ${day ? "" : "opacity-50 pointer-events-none"}
                    ${cellBgClass}
                    ${isTodayClass}`}
                >
                  {day && (
                    <span className="text-sm sm:text-base font-medium text-gray-800">
                      {day.getDate()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form (modal style) */}
        {isFormOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div
              ref={formRef}
              className="w-full max-w-xl bg-white p-6 rounded shadow-lg relative"
            >
              <h2 className="text-lg font-semibold mb-4 text-gray-800">
                {currentId ? "Edit Reminder" : "Create Reminder"} –{" "}
                {selectedDate.toDateString()}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plans
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-200 rounded focus:ring focus:ring-blue-100 focus:outline-none"
                    value={plans}
                    onChange={(e) => setPlans(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-200 rounded focus:ring focus:ring-blue-100 focus:outline-none"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="3:00 PM - 4:00 PM"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Importance
                  </label>
                  <select
                    className="w-full p-2 border border-gray-200 rounded focus:ring focus:ring-blue-100 focus:outline-none"
                    value={importance}
                    onChange={(e) => setImportance(e.target.value)}
                  >
                    <option value="Low">Low (Green)</option>
                    <option value="Medium">Medium (Yellow)</option>
                    <option value="High">High (Red)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Associated People
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-200 rounded focus:ring focus:ring-blue-100 focus:outline-none"
                    value={associatedPeople}
                    onChange={(e) => setAssociatedPeople(e.target.value)}
                    placeholder="John, Daisy..."
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4 mt-5">
                {!currentId ? (
                  <button
                    onClick={handleCreateReminder}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                    aria-label="Create"
                  >
                    <FiPlus className="w-5 h-5" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleEditReminder}
                      className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
                      aria-label="Update"
                    >
                      <FiCheck className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleDeleteReminder}
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                      aria-label="Delete"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                  aria-label="Cancel"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------- NEW: AI Chat Feature ---------- */}
        {/* <div className="mt-8 text-right">
          <button
            onClick={() => setShowAiChat(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors"
          >
            <FiMessageSquare />
            <span>Chat with AI about your Calendar</span>
          </button>
        </div> */}
      </main>

      {/* AI Chat Popup */}
      {showAiChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
          <div
            className="relative w-full max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-[slideUp_0.4s_ease-out]"
            style={{ maxHeight: "90vh" }}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowAiChat(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 z-10"
            >
              <FiX className="w-6 h-6" />
            </button>

            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-8 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">
                  AI Calendar Assistant
                </h3>
                <p className="text-base text-blue-100 opacity-90">
                  Many plans sceduled? don't have time to just look all the
                  scheduled plans? Its ok, I have got this, ask me anything you
                  want to know about all your scheduled tasks
                </p>
              </div>
            </div>

            {/* Messages Container */}
            <div
              ref={messageListRef}
              className="flex-1 overflow-y-auto px-8 py-6 space-y-6 scroll-smooth"
              style={{ maxHeight: "calc(90vh - 200px)" }}
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "assistant" ? "justify-start" : "justify-end"
                  } animate-[slideUp_0.3s_ease-out]`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-3">
                      <svg
                        className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  <div
                    className={`
                max-w-[85%] px-6 py-4 rounded-2xl shadow-sm
                ${
                  msg.role === "assistant"
                    ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                    : "bg-indigo-600 text-white ml-auto"
                }
              `}
                  >
                    <p className="text-base leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Box */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="Ask about your schedule..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 px-6 py-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
              focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              text-base placeholder-gray-400 dark:placeholder-gray-500 
              text-gray-900 dark:text-gray-100
              transition-all duration-200"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoadingAI}
                  className={`
              flex items-center justify-center p-4 rounded-xl transition-all duration-200
              ${
                isLoadingAI
                  ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white"
              }
            `}
                >
                  {isLoadingAI ? (
                    <div className="w-6 h-6 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin" />
                  ) : (
                    <svg
                      className="w-6 h-6 transform rotate-90"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-white w-full py-4 border-t flex items-center justify-center">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Portal. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
