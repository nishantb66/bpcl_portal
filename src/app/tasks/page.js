"use client";

import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiEdit,
  FiTrash,
  FiCheckSquare,
  FiUser,
  FiCalendar,
  FiTag,
} from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import jwt from "jsonwebtoken";

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState("my"); // "my" or "assigned"
  const [myTasks, setMyTasks] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    deadline: "",
    status: "Pending",
    assignToUsername: "",
  });
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Get token & user info from localStorage
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const user = token ? jwt.decode(token) : null;

  //useEffect hook to scroll to the bottom of the page
  useEffect(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth", // Optional: Adds smooth scrolling
    });
  });

  useEffect(() => {
    if (!token) {
      router.push("/login");
    } else {
      fetchTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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

  const fetchTasks = async () => {
    setLoading(true);
    try {
      if (activeTab === "my") {
        const res = await fetch("/api/tasks?filter=created", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setMyTasks(data);
      } else {
        const res = await fetch("/api/tasks?filter=assigned", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setAssignedTasks(data);
      }
    } catch (error) {
      toast.error("Error fetching tasks.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title) {
      toast.error("Title is required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTask),
      });
      const data = await res.json();
      if (res.status === 201) {
        toast.success("Task created successfully.");
        setNewTask({
          title: "",
          description: "",
          deadline: "",
          status: "Pending",
          assignToUsername: "",
        });
        fetchTasks();
      } else {
        toast.error(data.message || "Failed to create task.");
      }
    } catch (error) {
      toast.error("Error creating task.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.status === 200) {
        toast.success("Task deleted.");
        fetchTasks();
      } else {
        toast.error(data.message || "Failed to delete task.");
      }
    } catch (error) {
      toast.error("Error deleting task.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editingTask) return;
    setLoading(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editingTask._id,
          title: editingTask.title,
          description: editingTask.description,
          deadline: editingTask.deadline,
          status: editingTask.status,
        }),
      });

      const data = await res.json();
      if (res.status === 200) {
        toast.success("Task updated.");
        setEditingTask(null);
        fetchTasks();
      } else {
        toast.error(data.message || "Failed to update task.");
      }
    } catch (error) {
      toast.error("Error updating task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-center" autoClose={3000} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>

          <div className="flex w-full sm:w-auto bg-white p-1 rounded-full shadow-sm border border-gray-200">
            <button
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 text-sm font-medium rounded-full transition-colors ${
                activeTab === "my"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("my")}
            >
              <span className="block sm:inline">My Tasks</span>
              <span className="hidden sm:inline"> ({myTasks.length})</span>
            </button>
            <button
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 text-sm font-medium rounded-full transition-colors ${
                activeTab === "assigned"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("assigned")}
            >
              <span className="block sm:inline">Assigned</span>
              <span className="hidden sm:inline">
                {" "}
                Tasks ({assignedTasks.length})
              </span>
            </button>
          </div>
        </div>

        {/* Create Task Card */}
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <FiPlus className="text-indigo-600" /> Create New Task
          </h2>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={newTask.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter task title"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Assignee
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="assignToUsername"
                    value={newTask.assignToUsername}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Assign to (username)"
                  />
                  <FiUser className="absolute right-3 top-3 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Description
              </label>
              <textarea
                name="description"
                value={newTask.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Task description..."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Deadline
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="deadline"
                    value={newTask.deadline}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <FiCalendar className="absolute right-3 top-3 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Status
                </label>
                <div className="relative">
                  <select
                    name="status"
                    value={newTask.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In progress">In Progress</option>
                    <option value="Done">Completed</option>
                  </select>
                  <FiTag className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              disabled={loading}
            >
              <FiPlus /> Create Task
            </button>
          </form>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <svg
              className="animate-spin h-8 w-8 text-indigo-600"
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
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
          </div>
        ) : (activeTab === "my" ? myTasks : assignedTasks).length > 0 ? (
          <div className="grid gap-6">
            {(activeTab === "my" ? myTasks : assignedTasks).map((task) => (
              <div
                key={task._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {editingTask?._id === task._id ? (
                  <form onSubmit={handleUpdateTask} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <input
                        type="text"
                        value={editingTask.title}
                        onChange={(e) =>
                          setEditingTask({
                            ...editingTask,
                            title: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                      <select
                        value={editingTask.status}
                        onChange={(e) =>
                          setEditingTask({
                            ...editingTask,
                            status: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In progress">In Progress</option>
                        <option value="Done">Completed</option>
                      </select>
                    </div>
                    <textarea
                      value={editingTask.description}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      rows="3"
                    />
                    <div className="flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={() => setEditingTask(null)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-sm ${
                            task.status === "Done"
                              ? "bg-green-100 text-green-800"
                              : task.status === "In progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {task.status}
                        </span>
                        {task.deadline && (
                          <div className="flex items-center gap-1 text-gray-500 text-sm">
                            <FiCalendar />{" "}
                            {new Date(task.deadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditTask(task)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                          title="Edit"
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-red-600"
                          title="Delete"
                        >
                          <FiTrash />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900">
                      {task.title}
                    </h3>
                    <p className="text-gray-600">{task.description}</p>

                    <div className="border-t pt-4 mt-4 flex items-center gap-4 text-sm text-gray-500">
                      {task.assignedTo && (
                        <div className="flex items-center gap-1">
                          <FiUser /> Assigned to {task.assignedTo.name}
                        </div>
                      )}
                      {task.createdBy && (
                        <div className="flex items-center gap-1">
                          <FiUser /> Created by {task.createdBy.name}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mb-4 text-gray-400 text-3xl">
              <FiCheckSquare />
            </div>
            <p className="text-gray-600">No tasks found</p>
            <p className="text-sm text-gray-500">
              Get started by creating a new task
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
