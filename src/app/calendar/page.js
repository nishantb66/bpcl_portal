"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import jwt from "jsonwebtoken";
import { FiLoader, FiPlus, FiCheck, FiTrash2, FiX } from "react-icons/fi"; // for icon buttons

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

  // Ref to scroll the form into view when a date is clicked
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

  // After isFormOpen becomes true, scroll down to the form
  useEffect(() => {
    if (isFormOpen && formRef.current) {
      // Wait a tiny bit for form to appear, then scroll
      setTimeout(() => {
        formRef.current.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [isFormOpen]);

  // ========== Helpers ==========
  // Check if JWT is expired
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

  // Load user’s reminders (with loading spinner)
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
  // Days in a given month (year, monthIndex)
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Index (0-based) of day of the week for first day
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay(); // Sunday = 0
  };

  // Build array of days (and blanks) to display
  const buildCalendarDays = () => {
    const days = [];
    const totalDays = getDaysInMonth(currentYear, currentMonth);
    const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

    // Blank cells before 1st
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    // Actual date objects
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(currentYear, currentMonth, d));
    }
    return days;
  };

  // Helper to check if a date is "today"
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
    if (!date) return; // blank cell
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
  // CREATE
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

  // UPDATE
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

  // DELETE
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
  // Updated for more visible coloring
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-gray-50 flex flex-col items-center">
      {/* Toast notifications */}
      <ToastContainer position="top-center" autoClose={3000} />

      {/* Loading Indicator Overlay */}
      {loadingReminders && (
        <div className="fixed inset-0 flex items-center justify-center bg-white/70 z-50">
          <FiLoader className="text-gray-700 w-10 h-10 animate-spin" />
        </div>
      )}

      <header className="w-full max-w-5xl px-4 py-4 flex flex-col items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-4">
          Your Personal Calendar
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Keep track of important dates and reminders
        </p>
      </header>

      <main className="w-full max-w-5xl px-4 flex-grow pb-8">
        {/* Month Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevMonth}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded shadow-sm hover:bg-gray-200 transition-colors"
            >
              Prev
            </button>
            <button
              onClick={handleNextMonth}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded shadow-sm hover:bg-gray-200 transition-colors"
            >
              Next
            </button>
          </div>
          <div className="mt-3 sm:mt-0 text-xl font-semibold text-gray-800">
            {monthNames[currentMonth]} {currentYear}
          </div>
        </div>

        {/* Day-of-week header */}
        <div className="hidden sm:grid grid-cols-7 text-center font-medium border-b pb-2 text-gray-600">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>
        {/* Mobile-friendly row for day-of-week */}
        <div className="sm:hidden grid grid-cols-7 text-xs text-center font-medium border-b pb-2 text-gray-600">
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
          {calendarDays.map((day, index) => {
            // Add a highlight if it's today
            const isTodayClass =
              day && isToday(day)
                ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-50"
                : "";
            return (
              <div
                key={index}
                onClick={() => handleDateClick(day)}
                className={`relative p-2 sm:p-3 min-h-[60px] sm:min-h-[80px] flex items-center justify-center border rounded cursor-pointer 
                  bg-white hover:bg-gray-100 transition-colors 
                  ${day ? "" : "opacity-50 pointer-events-none"}
                  ${getDateColor(day)}
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

        {/* Form for creating/editing */}
        {isFormOpen && (
          <div
            ref={formRef}
            className="mt-6 p-4 sm:p-6 border rounded bg-white shadow transition-all"
          >
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              {currentId ? "Edit Reminder" : "Create Reminder"} –{" "}
              {selectedDate.toDateString()}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Plans */}
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

              {/* Time */}
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

              {/* Importance */}
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

              {/* Associated People */}
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
        )}
      </main>

      <footer className="mt-auto w-full py-4 border-t flex items-center justify-center bg-white">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Calendar Portal. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}
