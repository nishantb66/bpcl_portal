"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useAuth from "../../utils/token";
import {
  FiLoader,
  FiSearch,
  FiUserPlus,
  FiTrash2,
  FiPlusCircle,
  FiX,
  FiEdit3,
  FiCrown,
  FiShield,
  FiUser,
  FiUnlock,
  FiLock,
  FiEye,
  FiFlag,
  FiBell,
  FiClipboard,
  FiPlus,
} from "react-icons/fi";
import jwt from "jsonwebtoken";
import { Pie, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export default function TeamsPage() {
  useAuth(); // This checks the auth state and handles redirection if necessary
  console.log("useAuth hook called");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [inTeam, setInTeam] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  const [teamInfo, setTeamInfo] = useState(null);

  // For creating a new team
  const [teamName, setTeamName] = useState("");

  // For searching and adding members
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // *** TASKS state ***
  const [tasks, setTasks] = useState([]); // All tasks relevant to user
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);

  // New Task form fields
  const [taskNameField, setTaskNameField] = useState("");
  const [descriptionField, setDescriptionField] = useState("");
  const [deadlineField, setDeadlineField] = useState("");
  const [urgencyField, setUrgencyField] = useState("Low");
  const [assignToAll, setAssignToAll] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [checkedMembers, setCheckedMembers] = useState([]);

  // For Task details popup
  const [selectedTask, setSelectedTask] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  // For new idea messages
  const [newIdea, setNewIdea] = useState("");

  const [showOverviewModal, setShowOverviewModal] = useState(false);
  const [overviewData, setOverviewData] = useState(null);

  const [userHasCap, setUserHasCap] = useState(false);

  // State for controlling the modal
  const [showTeamInfoModal, setShowTeamInfoModal] = useState(false);
  const [tempTeamName, setTempTeamName] = useState("");
  const [tempDescription, setTempDescription] = useState("");

  // notice
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeTopic, setNoticeTopic] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [noticeImportance, setNoticeImportance] = useState("Low");

  // For CheckPoints feature
  const [showCheckpointsModal, setShowCheckpointsModal] = useState(false);
  const [checkpoints, setCheckpoints] = useState([]);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);
  const [showCheckpointDetailsModal, setShowCheckpointDetailsModal] =
    useState(false);

  // For creating/editing checkpoint
  const [checkpointName, setCheckpointName] = useState("");

  // Important Links state
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [importantLinks, setImportantLinks] = useState([]);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkTitle, setNewLinkTitle] = useState("");
  // Controls the second popup for adding a link
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);

  // For establishing task dependencies (leader-only)
  const [showDependencyModal, setShowDependencyModal] = useState(false);
  const [dependencyMainTask, setDependencyMainTask] = useState(null);
  const [dependencySearchTerm, setDependencySearchTerm] = useState("");
  const [filteredTasks, setFilteredTasks] = useState([]);

  const [currentUserEmail, setCurrentUserEmail] = useState(null);

  // --- AI Chat States ---
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // For "Add Reminder"
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderDateTime, setReminderDateTime] = useState("");
  const [reminderTask, setReminderTask] = useState(null);
  const [reminderSetForTasks, setReminderSetForTasks] = useState([]);

  // HACKATHON states
  const [showHackathonModal, setShowHackathonModal] = useState(false);
  const [hackathonData, setHackathonData] = useState(null); // store fetched hackathon
  const [hackTopic, setHackTopic] = useState("");
  const [hackDescription, setHackDescription] = useState("");
  const [hackStart, setHackStart] = useState("");
  const [hackEnd, setHackEnd] = useState("");
  const [hackathonId, setHackathonId] = useState(null);

  const [currentMessage, setCurrentMessage] = useState("");
  const [conversations, setConversations] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your AI assistant. How can I help you today?",
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const chatAreaRef = useRef(null);

  // 1) For booking a conference room
  const [showBookRoomModal, setShowBookRoomModal] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]); // list of vacant rooms
  const [bookingForm, setBookingForm] = useState({
    roomId: "",
    meetingStart: "",
    meetingEnd: "",
    topic: "",
    department: "",
    numEmployees: "",
    hostDesignation: "",
  });

  // After the line: const [bookingForm, setBookingForm] = useState({ ... });
  const [showBookingSuccessModal, setShowBookingSuccessModal] = useState(false);

  // For tasks loading indicator
  const [tasksLoading, setTasksLoading] = useState(false);

  // States for tracking feature
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackTask, setTrackTask] = useState(null);
  const [trackReports, setTrackReports] = useState([]); // Array of tracking records
  const [trackReportText, setTrackReportText] = useState(""); // For normal member's own report
  const [selectedMember, setSelectedMember] = useState(null); // For leader mode when a member is selected
  const [memberTrackReportText, setMemberTrackReportText] = useState(""); // For leader editing a member's comment

  // State for editing a task (leader only)
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [editTaskData, setEditTaskData] = useState({
    taskId: "",
    taskName: "",
    description: "",
    urgency: "Low",
    deadline: "",
    assignedMembers: [], // array of emails
  });
  const [newAssignedQuery, setNewAssignedQuery] = useState("");

  const [taskNotifications, setTaskNotifications] = useState({});

  // Announcement banner state for the Teams page.
  const [showAnnouncement, setShowAnnouncement] = useState(true);

  // For PDFs feature
  const [showPdfsModal, setShowPdfsModal] = useState(false);
  const [pdfList, setPdfList] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null); // The PDF file from input
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [trackLoading, setTrackLoading] = useState(false);

  const [checkLoading, setckeckLoading] = useState(false);

  const [pdfViewLoadingId, setPdfViewLoadingId] = useState(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations]);

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

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwt.decode(token);
      setCurrentUserEmail(decoded?.email ?? null);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    // Add user message to conversation
    const userMessage = { role: "user", content: currentMessage };
    setConversations([...conversations, userMessage]);
    setCurrentMessage("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No token found. Please log in again.");
        setIsLoading(false);
        return;
      }

      // Get conversation history for context (limit to last 10 messages)
      const recentMessages = conversations.slice(-10);
      const conversationHistory = recentMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call the AI route with conversation history
      const res = await fetch("/api/teams/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: currentMessage,
          history: conversationHistory,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "AI request failed");
        setIsLoading(false);
        return;
      }

      // Add AI response to conversation
      setConversations((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.aiAnswer,
        },
      ]);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong with the AI.");

      // Add error message to conversation
      setConversations((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to render message content with Markdown formatting
  const renderFormattedMessage = (content) => {
    // This is a simple regex-based Markdown formatter
    // For production, consider using a proper Markdown library
    let formattedContent = content
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Italic text
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // Headers
      .replace(/^### (.*?)$/gm, "<h3>$1</h3>")
      .replace(/^## (.*?)$/gm, "<h2>$1</h2>")
      .replace(/^# (.*?)$/gm, "<h1>$1</h1>")
      // Lists
      .replace(/^\- (.*?)$/gm, "<li>$1</li>")
      .replace(/^\d\. (.*?)$/gm, "<li>$1</li>")
      // Links
      .replace(
        /\[(.*?)\]\((.*?)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>'
      );

    // Convert consecutive list items to lists
    formattedContent = formattedContent
      .replace(/<li>(.*?)<\/li>\s*<li>/g, "<ul><li>$1</li><li>")
      .replace(/<li>(.*?)<\/li>\s*(?!<li>)/g, "<ul><li>$1</li></ul>");

    // Handle code blocks
    formattedContent = formattedContent.replace(
      /```(.*?)```/gs,
      '<pre class="bg-gray-100 p-2 rounded overflow-x-auto my-2"><code>$1</code></pre>'
    );

    // Handle paragraphs
    const paragraphs = formattedContent.split("\n\n");
    formattedContent = paragraphs
      .map((p) => {
        if (!p.trim()) return "";
        if (
          p.includes("<h1>") ||
          p.includes("<h2>") ||
          p.includes("<h3>") ||
          p.includes("<ul>") ||
          p.includes("<pre>")
        ) {
          return p;
        }
        return `<p>${p}</p>`;
      })
      .join("");

    return (
      <div
        className="text-gray-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
    );
  };

  const checkTokenExpiration = (token) => {
    try {
      const decodedToken = jwt.decode(token);
      if (decodedToken && decodedToken.exp) {
        const currentTime = Date.now() / 1000;
        return decodedToken.exp < currentTime;
      }
      return true;
    } catch (error) {
      return true;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    if (checkTokenExpiration(token)) {
      toast.info("Your session has expired. Please log in again.");
      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("name");
        router.push("/login");
      }, 1500);
      return;
    }

    // 1) Fetch the user's team info
    fetch("/api/teams?myTeam=1", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.inTeam) {
          setInTeam(true);
          setIsLeader(data.isLeader);
          setTeamInfo(data.team);

          // Determine if the current user has "cap" access
          const currentUserEmail = jwt.decode(token)?.email;
          const foundSelf = data.team.members.find(
            (m) => m.email === currentUserEmail
          );
          setUserHasCap(foundSelf?.canAddMembers || false);
        } else {
          setInTeam(false);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Something went wrong fetching your team info.");
      })
      .finally(() => setLoading(false));

    // 2) Also fetch tasks relevant to the user
    fetch("/api/teams/tasks", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.tasks) {
          setTasks(data.tasks);
        }
      })
      .catch((err) => console.error(err));

    // 3) Fetch hackathon info
    fetch("/api/hackathons", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.hackathon) {
          setHackathonData(data.hackathon);
          setHackathonId(data.hackathon._id);
        } else {
          setHackathonData(null);
          setHackathonId(null);
        }
      })
      .catch((err) => console.error(err));
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("token"); // or from a Redux store
    const eventSources = [];

    tasks.forEach((task) => {
      // If leader => watch all tasks
      // If normal user => watch only tasks where assignedTo includes currentUserEmail
      if (
        isLeader ||
        (task.assignedTo &&
          task.assignedTo.some((a) => a.email === currentUserEmail))
      ) {
        // Pass token in query param
        const es = new EventSource(
          `/api/teams/notifications?taskId=${task._id}&token=${token}`
        );
        es.onmessage = (event) => {
          const parsed = JSON.parse(event.data);
          setTaskNotifications((prev) => ({
            ...prev,
            [task._id]: parsed.notification,
          }));
        };
        es.onerror = (err) => {
          console.error("SSE error", err);
          es.close();
        };
        eventSources.push(es);
      }
    });

    return () => {
      eventSources.forEach((es) => es.close());
    };
  }, [tasks, isLeader, currentUserEmail]);

  //Function to fetch the overview stats
  const fetchOverviewData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/teams/tasks?overview=1", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
        return;
      }
      setOverviewData(data.overviewData); // Store the overview stats
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch overview data.");
    } finally {
    }
  };

  const openOverview = async () => {
    await fetchOverviewData();
    setShowOverviewModal(true);
  };

  // Create team
  const handleCreateTeam = async () => {
    try {
      const token = localStorage.getItem("token");
      setLoading(true);
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "create-team",
          teamName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
      } else {
        toast.success(data.message);
        // Refresh the page or fetch team info again
        fetch("/api/teams?myTeam=1", {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((info) => {
            setInTeam(info.inTeam);
            setIsLeader(info.isLeader);
            setTeamInfo(info.team);
          });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create team.");
    } finally {
      setLoading(false);
    }
  };

  // Search for users
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/teams?search=${query}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setSearchResults(data.users || []);
      } else {
        toast.error(data.message || "Error searching users");
      }
    } catch (err) {
      console.error(err);
      toast.error("Search request failed");
    } finally {
      setSearchLoading(false);
    }
  };

  // Add member
  const handleAddMember = async (memberEmail) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "add-member",
          memberEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
      } else {
        toast.success(data.message);
        // Refresh team info
        fetch("/api/teams?myTeam=1", {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((info) => {
            setTeamInfo(info.team);
          });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add member.");
    }
  };

  // Remove member
  const handleRemoveMember = async (memberEmail) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this member from the team?"
      )
    ) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "remove-member",
          memberEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
      } else {
        toast.success(data.message);
        // Refresh team info
        fetch("/api/teams?myTeam=1", {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((info) => {
            setTeamInfo(info.team);
            setInTeam(info.inTeam);
            setIsLeader(info.isLeader);
          });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove member.");
    }
  };

  // give add member access
  const confirmUpdateAccess = async (member) => {
    const action = member.canAddMembers
      ? "revoke this member's ability to add/remove members"
      : "grant this member the ability to add/remove members";
    if (!window.confirm(`Are you sure you want to ${action}?`)) {
      return;
    }
    await handleUpdateMemberAccess(member.email, !member.canAddMembers);
  };

  const handleUpdateMemberAccess = async (memberEmail, grantAccess) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "update-member-access",
          memberEmail,
          grantAccess,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
        return;
      }
      toast.success(data.message);
      // Refresh the team info
      fetch("/api/teams?myTeam=1", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((info) => {
          setTeamInfo(info.team);
          // update userHasCap for current user
          const currentUserEmail = jwt.decode(token)?.email;
          const foundSelf = info.team.members.find(
            (m) => m.email === currentUserEmail
          );
          setUserHasCap(foundSelf?.canAddMembers || false);
        });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update member access.");
    }
  };

  // *** TASKS Logic ***

  // 1) Leader: Open "Assign Tasks" modal
  const openAssignTaskModal = () => {
    // reset form
    setTaskNameField("");
    setDescriptionField("");
    setDeadlineField("");
    setUrgencyField("Low");
    setAssignToAll(false);
    setMemberSearchTerm("");
    setCheckedMembers([]);
    setShowAssignTaskModal(true);
  };

  // 2) Leader: Create new task
  const handleCreateTask = async () => {
    try {
      if (!taskNameField.trim() || !descriptionField.trim() || !deadlineField) {
        toast.error("Please fill all required fields.");
        return;
      }
      const token = localStorage.getItem("token");
      const res = await fetch("/api/teams/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "create-task",
          taskName: taskNameField,
          description: descriptionField,
          deadline: deadlineField,
          urgency: urgencyField,
          assignToAll,
          specificMembers: checkedMembers,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
      } else {
        toast.success(data.message);
        setShowAssignTaskModal(false);
        // Refresh tasks
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create task.");
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    // Show confirmation popup before deleting
    if (
      !window.confirm(
        "Are you sure you want to delete this task? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/teams/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "delete-task",
          taskId: selectedTask._id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
      } else {
        toast.success(data.message);
        setShowTaskDetailsModal(false);
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete task.");
    }
  };

  // 3) Fetch tasks
  const fetchTasks = () => {
    const token = localStorage.getItem("token");
    setTasksLoading(true); // Start loading spinner
    setTasksLoading(true); // Start loading
    fetch("/api/teams/tasks", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.tasks) {
          setTasks(data.tasks);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setTasksLoading(false); // Stop loading spinner
      });
  };

  // 4) Open Task details modal
  const openTaskDetails = (task) => {
    setSelectedTask(task);
    // figure out current user’s status, if assigned
    const token = localStorage.getItem("token");
    const userEmail = jwt.decode(token)?.email;
    const userAssignment = task.assignedTo.find((a) => a.email === userEmail);
    setNewStatus(userAssignment?.status || "Not Started");
    setShowTaskDetailsModal(true);
  };

  // 5) Update status
  const handleUpdateStatus = async () => {
    try {
      if (!selectedTask) return;
      const token = localStorage.getItem("token");
      const res = await fetch("/api/teams/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "update-status",
          taskId: selectedTask._id,
          newStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
      } else {
        toast.success(data.message);
        setShowTaskDetailsModal(false);
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update task status.");
    }
  };

  // 6) Post a new idea / message
  const handleAddIdea = async () => {
    try {
      if (!selectedTask || !newIdea.trim()) {
        toast.error("Please enter your idea/message first.");
        return;
      }
      const token = localStorage.getItem("token");
      const res = await fetch("/api/teams/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "add-idea",
          taskId: selectedTask._id,
          message: newIdea.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
      } else {
        toast.success(data.message);
        setNewIdea(""); // clear the text area
        // Re-fetch tasks so we see the updated discussion
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to post idea.");
    }
  };

  // Notice for members
  const saveNotice = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "update-notice",
          topic: noticeTopic,
          noticeMessage,
          importance: noticeImportance,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
        return;
      }
      toast.success(data.message);
      setShowNoticeModal(false);
      // Refresh
      fetch("/api/teams?myTeam=1", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((info) => {
          setTeamInfo(info.team);
        });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update notice.");
    }
  };

  //Open the Checkpoints (List) & Fetch
  const openCheckpoints = async () => {
    try {
      const token = localStorage.getItem("token");
      setckeckLoading(true);
      // fetch the checkpoints
      const res = await fetch("/api/teams/checkpoints?myCheckpoints=1", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setCheckpoints(data.checkpoints || []);
        setckeckLoading(false);
        setShowCheckpointsModal(true);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load checkpoints.");
    }
  };

  //Create / Edit / Delete Checkpoint Functions
  const createCheckpoint = async () => {
    const name = prompt("Enter checkpoint name:");
    if (!name || !name.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/teams/checkpoints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "create-checkpoint",
          name,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
        return;
      }
      toast.success(data.message);
      openCheckpoints(); // re-fetch
    } catch (err) {
      console.error(err);
      toast.error("Failed to create checkpoint.");
    }
  };

  const editCheckpointName = async (cp) => {
    const newName = prompt("New checkpoint name:", cp.name);
    if (!newName || !newName.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/teams/checkpoints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "update-checkpoint",
          checkpointId: cp._id,
          newName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
        return;
      }
      toast.success(data.message);
      openCheckpoints();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update checkpoint name.");
    }
  };

  const deleteCheckpoint = async (checkpointId) => {
    if (!window.confirm("Are you sure you want to delete this checkpoint?"))
      return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/teams/checkpoints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "delete-checkpoint",
          checkpointId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
        return;
      }
      toast.success(data.message);
      openCheckpoints();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete checkpoint.");
    }
  };

  const openCheckpointDetails = (cp) => {
    setSelectedCheckpoint(cp);
    setShowCheckpointDetailsModal(true);
  };

  //Add / Edit a Check:
  const addCheck = async (checkpointId) => {
    const description = prompt("Enter check description (up to 100 words):");
    if (!description) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/teams/checkpoints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "add-check",
          checkpointId,
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
        return;
      }
      toast.success(data.message);
      // re-fetch the checkpoint list or re-fetch the details
      openCheckpoints();
      setShowCheckpointDetailsModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to add check.");
    }
  };

  const editCheck = async (checkpointId, checkObj) => {
    const newDesc = prompt("Update check description:", checkObj.description);
    if (newDesc == null) return; // user cancelled
    // optionally ask if done or not
    const done = confirm("Mark this check as done?") ? true : false;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/teams/checkpoints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "update-check",
          checkpointId,
          checkId: checkObj._id,
          description: newDesc,
          done,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
        return;
      }
      toast.success(data.message);
      // re-fetch
      openCheckpoints();
      setShowCheckpointDetailsModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update check.");
    }
  };

  const toggleCheckDone = async (checkpointId, checkId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/teams/checkpoints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "toggle-check-done",
          checkpointId,
          checkId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
        return;
      }
      toast.success(data.message);
      // Re-fetch the checkpoints to see the updated doneBy
      openCheckpoints();
      setShowCheckpointDetailsModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to toggle done status.");
    }
  };

  // update team info
  const updateTeamInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "update-team-info",
          teamName: tempTeamName,
          teamDescription: tempDescription,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
        return;
      }
      toast.success(data.message);
      setShowTeamInfoModal(false);
      // refresh
      fetch("/api/teams?myTeam=1", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((info) => {
          setTeamInfo(info.team);
        });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update team info.");
    }
  };

  // Fetch existing links from the server
  const fetchImportantLinks = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/teams?links=1", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setImportantLinks(data.importantLinks || []);
      } else {
        toast.error(data.message || "Failed to fetch links");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while fetching links.");
    }
  };

  // Add a link (this will be called from the second popup)
  const handleAddLink = async () => {
    if (!newLinkUrl.trim() || !newLinkTitle.trim()) {
      toast.error("Please provide both URL and Title.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "add-link",
          linkUrl: newLinkUrl.trim(),
          linkTitle: newLinkTitle.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        // Clear fields
        setNewLinkUrl("");
        setNewLinkTitle("");
        setShowAddLinkModal(false); // close the "Add Link" popup
        // Refresh the links
        fetchImportantLinks();
      } else {
        toast.error(data.message || "Failed to add link.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add link.");
    }
  };

  // Remove a link
  const handleRemoveLink = async (url) => {
    if (!window.confirm("Are you sure you want to remove this link?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "remove-link",
          linkUrl: url,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchImportantLinks(); // refresh
      } else {
        toast.error(data.message || "Failed to remove link.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove link.");
    }
  };

  // This function calls the backend to link one task to another
  const handleAddDependency = async (mainTaskId, dependsOnTaskId) => {
    if (!mainTaskId || !dependsOnTaskId) {
      toast.error("Please select both tasks to establish a connection.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/teams/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "add-dependency",
          mainTaskId,
          dependsOnTaskId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setShowDependencyModal(false);
        // Refresh tasks so we see the new link
        fetchTasks();
      } else {
        toast.error(data.message || "Failed to establish dependency.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to establish dependency.");
    }
  };

  // Add a Task to the user's personal calendar
  const handleAddToCalendar = async (task) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No token found. Please log in again.");
        return;
      }

      // We'll map urgency => importance
      let importanceVal = "Low";
      if (task.urgency === "Medium") importanceVal = "Medium";
      if (task.urgency === "High") importanceVal = "High";

      const bodyData = {
        date: task.deadline, // "YYYY-MM-DD" or Date object?
        // If it's a Date object, convert to string: new Date(task.deadline).toISOString().split("T")[0]
        plans: task.taskName, // from the instructions
        importance: importanceVal,
      };

      const res = await fetch("/api/teams/calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to add to calendar");
        return;
      }
      toast.success(data.message || "Added to calendar!");
    } catch (err) {
      console.error(err);
      toast.error("Error adding task to calendar");
    }
  };

  // AI
  const handleAskAI = async () => {
    try {
      if (!aiQuestion.trim()) return;
      setAiLoading(true);
      setAiAnswer("");

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No token found. Please log in again.");
        setAiLoading(false);
        return;
      }

      // Call our AI route
      const res = await fetch("/api/teams/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: aiQuestion }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "AI request failed");
        setAiLoading(false);
        return;
      }

      // Show the AI’s response
      setAiAnswer(data.aiAnswer);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong with AI.");
    } finally {
      setAiLoading(false);
    }
  };

  // 3) The handleSetReminder function
  const handleSetReminder = async () => {
    try {
      if (!reminderTask || !reminderDateTime) {
        toast.error("Please select a valid date and time.");
        return;
      }

      const token = localStorage.getItem("token");
      const res = await fetch("/api/teams/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "set-reminder",
          taskId: reminderTask._id,
          reminderDateTime, // for example: "2025-03-29T09:30"
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
      } else {
        toast.success(data.message);
        setShowReminderModal(false);

        // 4) Mark this task as having a reminder set
        setReminderSetForTasks((prev) => [...prev, reminderTask._id]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to set reminder.");
    }
  };

  function isHackathonActive(hackathon) {
    if (!hackathon) return false;
    const now = new Date();
    const start = new Date(hackathon.startDateTime);
    const end = new Date(hackathon.endDateTime);
    // Button is shown only if 'now' is >= start AND <= end
    return now >= start && now <= end;
  }

  // CREATE or UPDATE
  const handleSaveHackathon = async () => {
    try {
      if (
        !hackTopic.trim() ||
        !hackDescription.trim() ||
        !hackStart ||
        !hackEnd
      ) {
        toast.error("Please fill all fields.");
        return;
      }
      const token = localStorage.getItem("token");
      const res = await fetch("/api/hackathons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: hackathonId ? "update-hackathon" : "create-hackathon",
          hackathonId,
          topic: hackTopic.trim(),
          description: hackDescription.trim(),
          startDateTime: hackStart,
          endDateTime: hackEnd,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
        return;
      }
      toast.success(data.message);

      // Re-fetch hackathon to update local state
      await fetchHackathonData();
      setShowHackathonModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong saving hackathon.");
    }
  };

  const handleDeleteHackathon = async () => {
    if (!window.confirm("Are you sure you want to delete the hackathon?"))
      return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/hackathons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "delete-hackathon",
          hackathonId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
        return;
      }
      toast.success(data.message);
      // Clear local hackathon state
      setHackathonData(null);
      setHackathonId(null);
      setShowHackathonModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete hackathon.");
    }
  };

  // Helper to fetch hackathon data
  const fetchHackathonData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/hackathons", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.hackathon) {
        setHackathonData(data.hackathon);
        setHackathonId(data.hackathon._id);
      } else {
        setHackathonData(null);
        setHackathonId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch only vacant (unbooked) rooms
  // Example: fetch rooms that are not in the DB at all
  const fetchVacantRooms = async () => {
    try {
      const res = await fetch("/api/checkroom");
      if (!res.ok) {
        toast.error("Failed to fetch rooms");
        return;
      }
      const data = await res.json(); // e.g. ["R2", "R3", ...]
      setAvailableRooms(data);
    } catch (error) {
      console.error(error);
      toast.error("Error fetching vacant rooms");
    }
  };

  // Book the selected vacant room
  const handleBookRoomFromTeams = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("No token found. Please log in again.");
      return;
    }

    // Basic validation
    if (Number(bookingForm.numEmployees) > 20) {
      toast.error("A single room can’t exceed 20 participants.");
      return;
    }

    const startLocal = new Date(bookingForm.meetingStart);
    const endLocal = new Date(bookingForm.meetingEnd);

    if (endLocal <= startLocal) {
      toast.error("Meeting End Time must be after the Start Time.");
      return;
    }

    // Convert to UTC for the DB
    const meetingStartUTC = startLocal.toISOString();
    const meetingEndUTC = endLocal.toISOString();

    try {
      const res = await fetch("/api/meeting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomId: bookingForm.roomId,
          meetingStart: meetingStartUTC,
          meetingEnd: meetingEndUTC,
          topic: bookingForm.topic,
          department: bookingForm.department,
          numEmployees: bookingForm.numEmployees,
          hostDesignation: bookingForm.hostDesignation,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to book room.");
        return;
      }

      toast.success("Room booked successfully!");
      setShowBookRoomModal(false);

      setShowBookingSuccessModal(true);

      // Reset the form
      setBookingForm({
        roomId: "",
        meetingStart: "",
        meetingEnd: "",
        topic: "",
        department: "",
        numEmployees: "",
        hostDesignation: "",
      });

      // Optionally: re-fetch tasks or do any refresh needed
      // fetchTasks(); // if you want to do something else
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while booking.");
    }
  };

  const openTrackModal = async (task) => {
    if (!isLeader) {
      if (
        !task.assignedTo ||
        !task.assignedTo.some(
          (assignment) => assignment.email === currentUserEmail
        )
      ) {
        toast.error("You are not assigned to this task.");
        return;
      }
    }

    setTrackLoading(true);
    setTrackTask(task);
    setSelectedMember(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/teams/track?taskId=${task._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTrackReports(data.tracking);
        const userReportObj = data.tracking.find(
          (r) => r.reporterEmail === currentUserEmail
        );
        setTrackReportText(userReportObj ? userReportObj.userReport : "");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load tracking information.");
    }
    // Clear notification for current user (or for a specific member if leader)
    if (!isLeader) {
      await fetch("/api/teams/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ type: "clear-notification", taskId: task._id }),
      });
      setTaskNotifications((prev) => ({ ...prev, [task._id]: false }));
    }
    setTrackLoading(false);
    setShowTrackModal(true);
  };

  const handleSaveUserReport = async () => {
    if (!trackTask) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/teams/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId: trackTask._id,
          report: trackReportText,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        // Optionally update the local tracking state here
        setShowTrackModal(false);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save report.");
    }
  };

  const openMemberReport = (memberEmail) => {
    const memberReport = trackReports.find(
      (r) => r.reporterEmail === memberEmail
    );
    setSelectedMember(memberEmail);
    setMemberTrackReportText(memberReport ? memberReport.leaderReport : "");
    // Clear notification for that member
    fetch("/api/teams/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        type: "clear-notification",
        taskId: trackTask._id,
        targetEmail: memberEmail,
      }),
    });
  };

  const handleSaveLeaderReport = async () => {
    if (!trackTask || !selectedMember) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/teams/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId: trackTask._id,
          report: memberTrackReportText,
          targetEmail: selectedMember,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        // Optionally update trackReports in state here
        setSelectedMember(null);
        setMemberTrackReportText("");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save leader report.");
    }
  };

  const openEditTaskModal = (task) => {
    // Pre-fill the editTaskData using the selected task's details
    setEditTaskData({
      taskId: task._id,
      taskName: task.taskName,
      description: task.description,
      urgency: task.urgency,
      // Format deadline for datetime-local input (YYYY-MM-DDTHH:MM)
      deadline: new Date(task.deadline).toISOString().slice(0, 16),
      assignedMembers: task.assignedTo.map((a) => a.email),
    });
    setNewAssignedQuery("");
    setShowEditTaskModal(true);
  };

  const handleSaveEditTask = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/teams/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "edit-task",
          taskId: editTaskData.taskId,
          taskName: editTaskData.taskName,
          description: editTaskData.description,
          urgency: editTaskData.urgency,
          deadline: editTaskData.deadline,
          assignedMembers: editTaskData.assignedMembers,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setShowEditTaskModal(false);
        fetchTasks();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update task.");
    }
  };

  const fetchPdfs = async () => {
    try {
      setPdfLoading(true); // Start loading indicator
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("/api/teams/documents", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to fetch PDFs");
        return;
      }
      setPdfList(data.pdfs || []);
    } catch (err) {
      console.error(err);
      toast.error("Error fetching PDFs");
    } finally {
      setPdfLoading(false); // Stop loading indicator
    }
  };

  const handleUploadPdf = async () => {
    if (!selectedFile) return;
    setUploadingPdf(true);
    try {
      // Convert PDF to base64
      const base64String = await fileToBase64(selectedFile);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/teams/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "upload-pdf",
          filename: selectedFile.name,
          contentType: selectedFile.type,
          base64: base64String,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to upload PDF");
        return;
      }
      toast.success(data.message || "PDF uploaded!");
      setSelectedFile(null);
      // Refresh the PDF list
      fetchPdfs();
    } catch (error) {
      console.error(error);
      toast.error("Error uploading PDF");
    } finally {
      setUploadingPdf(false);
    }
  };

  // Helper function to convert file to base64
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        // result is something like: "data:application/pdf;base64,JVBERi0xLjQK..."
        // We only want the base64 portion after the comma
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  // Viewing PDF in new tab
  const handleViewPdf = async (pdfId) => {
    setPdfViewLoadingId(pdfId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/teams/documents?pdfId=${pdfId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to fetch PDF");
        return;
      }
      // data.base64 is the PDF data, data.contentType is "application/pdf"
      // Create a Blob and open in new tab
      const pdfBlob = base64ToBlob(data.base64, data.contentType);
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, "_blank");
    } catch (err) {
      console.error(err);
      toast.error("Error viewing PDF");
    } finally {
      // Clear the loading state whether success or error
      setPdfViewLoadingId(null);
    }
  };

  function base64ToBlob(base64, contentType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  }

  // Delete PDF
  const handleDeletePdf = async (pdfId) => {
    if (!window.confirm("Are you sure you want to delete this PDF?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/teams/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "delete-pdf",
          pdfId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to delete PDF");
        return;
      }
      toast.success(data.message || "PDF deleted!");
      fetchPdfs(); // Refresh list
    } catch (err) {
      console.error(err);
      toast.error("Error deleting PDF");
    }
  };

  // If loading, show spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FiLoader className="animate-spin w-8 h-8 text-indigo-600" />
      </div>
    );
  }

  // If user is not in a team
  if (!inTeam) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <ToastContainer />
        <div className="bg-white shadow-2xl rounded-2xl p-8 max-w-md w-full transform transition-all hover:scale-[1.02] border border-gray-100">
          <div className="text-center mb-8">
            <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Create Your Team
            </h2>
            <p className="text-gray-600">
              Start collaborating with others by creating your own team
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="teamName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Team Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="teamName"
                  type="text"
                  placeholder="Enter your team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-200"
                />
                {teamName && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleCreateTeam}
              disabled={!teamName.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl transition-all duration-200 transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="font-medium">Create Team</span>
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 12h15"
                />
              </svg>
            </button>

            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-blue-700">
                  Once created, you can invite team members to join your
                  workspace
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is in a team
  return (
    <div className="relative">
      {/* Modern Professional Announcement Banner */}
      {showAnnouncement && (
        <div className="relative overflow-hidden border-b border-indigo-700/20">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 bg-[length:200%_100%] animate-[gradient-slow_15s_ease_infinite]"></div>

          {/* Pattern overlay with background image as data URI directly in className */}
          <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2760%27%20height%3D%2760%27%20viewBox%3D%270%200%2060%2060%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3E%3Cg%20fill%3D%27none%27%20fill-rule%3D%27evenodd%27%3E%3Cg%20fill%3D%27%23ffffff%27%20fill-opacity%3D%271%27%3E%3Cpath%20d%3D%27M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%27%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"></div>

          {/* Content container */}
          <div className="relative mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              {/* Left side - Icon and badge */}
              <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
                <div className="flex items-center bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
                  <svg
                    className="w-4 h-4 text-white mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-xs font-medium text-white/90 uppercase tracking-wider">
                    Announcement
                  </span>
                </div>
              </div>

              {/* Center - Main announcement text */}
              <div className="flex-1 flex justify-center items-center px-4 md:px-10">
                <p className="text-white/90 text-sm font-medium tracking-wide leading-relaxed max-w-3xl text-center">
                  Welcome to the{" "}
                  <span className="font-semibold text-white">
                    EP Teams Workspace
                  </span>
                  . Explore our comprehensive collaboration features and connect
                  with colleagues. Note that 'Track' and 'Checkpoint' features
                  may take 2-3 seconds to initialize as we are working on
                  optimizing performance.
                  <a
                    href="/teamsguide"
                    className="inline-flex items-center ml-2 border-b border-white/40 hover:border-white text-white hover:text-white transition-colors group"
                  >
                    <span>Read the Teams Guide</span>
                    <svg
                      className="w-3.5 h-3.5 ml-1 transform group-hover:translate-x-0.5 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </a>
                </p>
              </div>

              {/* Right side - Close button */}
              <div className="flex-shrink-0">
                <button
                  onClick={() => setShowAnnouncement(false)}
                  className="group p-1.5 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-white/40"
                  aria-label="Dismiss announcement"
                >
                  <svg
                    className="w-4 h-4 text-white/80 group-hover:text-white transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-white/0 via-white/10 to-white/0"></div>
          <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-white/0 via-white/10 to-white/0"></div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </div>
      )}

      <div className="min-h-screen flex bg-gray-100 relative">
        <ToastContainer />

        {trackLoading && (
          <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-white/80">
            <FiLoader className="animate-spin w-12 h-12 text-indigo-600" />
            <span className="mt-4 text-lg font-medium text-gray-600">
              Loading tracking data...
            </span>
          </div>
        )}

        {checkLoading && (
          <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-white/80">
            <FiLoader className="animate-spin w-12 h-12 text-indigo-600" />
            <span className="mt-4 text-lg font-medium text-gray-600">
              Loading Checkpoints..
            </span>
          </div>
        )}

        {/* Top-right corner buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-3">
          {hackathonData && isHackathonActive(hackathonData) && (
            <button
              onClick={() => router.push("/hack")}
              className="group relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
                  </div>
                  <svg
                    className="w-5 h-5"
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
                <span className="font-medium">Event Live</span>
              </div>
            </button>
          )}

          <button
            onClick={() => {
              setShowLinksModal(true);
              fetchImportantLinks();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg group"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <span className="font-medium">Important Links</span>
          </button>
        </div>

        {/* Sidebar */}
        <aside className="w-72 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 text-sm">
          {/* Fixed Header Section */}
          <div className="p-6 border-b border-gray-100 bg-white shrink-0">
            <div className="flex items-center justify-between mb-4">
              {isLeader ? (
                <h2
                  className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors duration-150"
                  onClick={() => {
                    setTempTeamName(teamInfo?.teamName || "");
                    setTempDescription(teamInfo?.teamDescription || "");
                    setShowTeamInfoModal(true);
                  }}
                  title="Click to edit team name & description"
                >
                  {teamInfo?.teamName || "Your Team"}
                </h2>
              ) : (
                <h2 className="text-lg font-semibold text-gray-900">
                  {teamInfo?.teamName || "Your Team"}
                </h2>
              )}
            </div>

            {teamInfo?.teamDescription && (
              <p className="text-sm text-gray-600 mb-3">
                {teamInfo.teamDescription}
              </p>
            )}

            {isLeader ? (
              <div className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm">
                Team Leader
              </div>
            ) : (
              <p className="text-sm text-gray-600">Member</p>
            )}
          </div>

          {/* Scrollable Content Section */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Members Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  Team Members
                </h3>
                <div className="space-y-3">
                  {/* Leader */}
                  <div className="flex items-center space-x-3 p-2 bg-indigo-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-700">
                        {teamInfo?.leaderName?.[0]}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {teamInfo?.leaderName}
                      <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        Owner
                      </span>
                    </p>
                  </div>

                  {/* Other Members */}
                  {teamInfo?.members
                    ?.filter((m) => m.email !== teamInfo.leaderEmail)
                    ?.map((member) => (
                      <div
                        key={member.email}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-150"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {member.name[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {member.name}
                            </p>
                            {member.canAddMembers && (
                              <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                Admin
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {isLeader && (
                            <button
                              onClick={() => confirmUpdateAccess(member)}
                              className="text-sm text-gray-600 hover:text-indigo-600"
                            >
                              {member.canAddMembers
                                ? "Revoke Access"
                                : "Grant Access"}
                            </button>
                          )}
                          {(isLeader || userHasCap) && (
                            <button
                              onClick={() => handleRemoveMember(member.email)}
                              className="p-1 text-gray-400 hover:text-red-500 rounded"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={openOverview}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <span className="text-sm font-medium">Overview</span>
                </button>

                {isLeader && (
                  <button
                    onClick={() => {
                      // If there's an existing hackathon, prefill the fields
                      if (hackathonData) {
                        setHackTopic(hackathonData.topic);
                        setHackDescription(hackathonData.description);
                        setHackStart(hackathonData.startDateTime.split(".")[0]);
                        setHackEnd(hackathonData.endDateTime.split(".")[0]);
                        setHackathonId(hackathonData._id);
                      } else {
                        setHackTopic("");
                        setHackDescription("");
                        setHackStart("");
                        setHackEnd("");
                        setHackathonId(null);
                      }
                      setShowHackathonModal(true);
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-sm font-medium">
                      Quick Brainstorming
                    </span>
                  </button>
                )}

                <button
                  onClick={openCheckpoints}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <span className="text-sm font-medium">Checkpoints</span>
                </button>

                <button
                  onClick={() => {
                    fetchVacantRooms();
                    setShowBookRoomModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-100 text-gray-800 rounded-lg hover:shadow-md hover:from-blue-100 hover:to-indigo-100 transition-all duration-300"
                >
                  <span className="font-medium tracking-wide text-sm">
                    Book Conference Room
                  </span>
                </button>

                <button
                  onClick={() => {
                    setShowPdfsModal(true);
                    fetchPdfs();
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <span className="text-sm font-medium">PDFs</span>
                </button>

                <button
                  onClick={() => setShowAIModal(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-gray-300 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <span className="text-sm font-medium">
                    AI Assistant (Beta)
                  </span>
                </button>
              </div>

              {/* Notice Section */}
              {teamInfo?.notice && (
                <div className="border-t border-gray-100 pt-6">
                  <div
                    className={`rounded-lg border ${
                      teamInfo.notice.importance === "High"
                        ? "border-red-200 bg-red-50"
                        : "border-green-200 bg-green-50"
                    } p-4`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          teamInfo.notice.importance === "High"
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {teamInfo.notice.importance} Priority
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(
                          teamInfo.notice.updatedAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                      {teamInfo.notice.topic}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {teamInfo.notice.message}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fixed Footer Section */}
          {isLeader && (
            <div className="p-6 border-t border-gray-100 bg-white shrink-0">
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setNoticeTopic(teamInfo.notice?.topic || "");
                    setNoticeMessage(teamInfo.notice?.message || "");
                    setNoticeImportance(teamInfo.notice?.importance || "Low");
                    setShowNoticeModal(true);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <FiPlusCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Create Notice</span>
                </button>

                <button
                  onClick={openAssignTaskModal}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <FiPlusCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Assign Tasks</span>
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <div className="flex-1 p-8 bg-white min-h-screen">
          {isLeader || userHasCap ? (
            <div className="max-w-5xl mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                  Team Management
                </h2>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-700 mb-4">
                    Add Members
                  </h3>
                  <div className="relative mb-4 max-w-md">
                    <input
                      type="text"
                      placeholder="Search by email or username..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        handleSearch(e.target.value);
                      }}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-200"
                    />
                    <FiSearch className="absolute left-4 top-3.5 text-gray-400" />
                    {searchLoading && (
                      <FiLoader className="absolute right-4 top-3.5 text-gray-400 animate-spin" />
                    )}

                    {/* Search Results Dropdown */}
                    {searchTerm && searchResults.length > 0 && (
                      <div className="absolute mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-auto">
                        {searchResults.map((user) => (
                          <div
                            key={user._id}
                            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600">
                                  {user.name[0].toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">
                                  {user.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                            <button
                              className="flex items-center space-x-2 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors duration-150"
                              onClick={() => handleAddMember(user.email)}
                            >
                              <FiUserPlus className="w-4 h-4" />
                              <span>Add</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Type to find users and add them to your team. A user can
                    only belong to one team.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto">
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">
                  Welcome to {teamInfo?.teamName}
                </h2>
                <p className="text-gray-600">
                  You are part of {teamInfo?.leaderName}&apos;s team.
                  Collaborations and assignments will appear here soon.
                </p>
              </div>
            </div>
          )}

          {/* Tasks Section */}
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Tasks Overview
                  </h3>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                    {tasks.length} {tasks.length === 1 ? "Task" : "Tasks"}
                  </span>
                </div>
              </div>

              <div className="p-6">
                {tasksLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-3">
                    <div className="flex items-center space-x-2">
                      <FiLoader className="animate-spin w-8 h-8 text-indigo-600" />
                      <span className="text-gray-600 font-medium">
                        Loading tasks...
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Please wait while we fetch the tasks assigned to your
                      team.
                    </p>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mb-3">
                      <svg
                        className="w-12 h-12 text-gray-300 mx-auto"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">
                      No tasks assigned or created yet.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {tasks.map((task) => {
                      const isAssignedToUser = task.assignedTo.some(
                        (assignee) => assignee.email === currentUserEmail
                      );

                      return (
                        <li
                          key={task._id}
                          onClick={() => openTaskDetails(task)}
                          className={`p-4 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors duration-150 ${
                            isAssignedToUser
                              ? "bg-blue-50 hover:bg-blue-50/80"
                              : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              {/* Urgency indicator */}
                              <div className="flex-shrink-0">
                                <div
                                  className={`w-3 h-3 rounded-full ${
                                    task.urgency === "High"
                                      ? "bg-red-400"
                                      : task.urgency === "Medium"
                                      ? "bg-yellow-400"
                                      : "bg-green-400"
                                  }`}
                                />
                              </div>
                              {/* Task Name & Priority */}
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">
                                  {task.taskName}
                                </h4>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {task.urgency} Priority
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4">
                              {/* Due Date */}
                              <div className="text-right">
                                <p className="text-xs text-gray-500">
                                  Due Date
                                </p>
                                <p className="text-sm font-medium text-gray-900">
                                  {new Date(task.deadline).toLocaleDateString()}
                                </p>
                              </div>

                              {/* Arrow icon */}
                              <svg
                                className="w-5 h-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>

                              {/* Track button (stopPropagation to avoid opening Task Details) */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openTrackModal(task);
                                }}
                                className="relative inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium text-gray-700 hover:bg-indigo-200"
                              >
                                Track
                                {taskNotifications[task._id] && (
                                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-green-500" />
                                )}
                              </button>

                              {/* Add Reminder Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReminderTask(task);
                                  setReminderDateTime("");
                                  setShowReminderModal(true);
                                }}
                                disabled={reminderSetForTasks.includes(
                                  task._id
                                )}
                                className={`
                    inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full 
                    transition-all duration-200 transform hover:scale-105
                    ${
                      reminderSetForTasks.includes(task._id)
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : "bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 hover:border-blue-200"
                    }
                  `}
                              >
                                {reminderSetForTasks.includes(task._id) ? (
                                  <>
                                    <svg
                                      className="w-3.5 h-3.5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                    <span>Reminder Set</span>
                                  </>
                                ) : (
                                  <>
                                    <svg
                                      className="w-3.5 h-3.5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    <span>Set Reminder</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* --- MODALS --- */}

        {/* Assign Task Modal */}
        {showAssignTaskModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowAssignTaskModal(false)}
          >
            <div
              className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      Assign New Task
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowAssignTaskModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition"
                  >
                    <FiX className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto p-6 space-y-4">
                {/* Two Column Layout for Basic Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Task Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={taskNameField}
                      onChange={(e) => setTaskNameField(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                      placeholder="Enter task name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deadline <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={deadlineField}
                      onChange={(e) => setDeadlineField(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={descriptionField}
                    onChange={(e) => setDescriptionField(e.target.value)}
                    rows="3"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none"
                    placeholder="Describe the task"
                  />
                </div>

                {/* Urgency & Assignment Type in one row */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Urgency
                    </label>
                    <select
                      value={urgencyField}
                      onChange={(e) => setUrgencyField(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assign To
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          checked={assignToAll}
                          onChange={() => setAssignToAll(true)}
                          className="text-indigo-600 focus:ring-indigo-400"
                        />
                        <span className="ml-2 text-sm">All Members</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          checked={!assignToAll}
                          onChange={() => setAssignToAll(false)}
                          className="text-indigo-600 focus:ring-indigo-400"
                        />
                        <span className="ml-2 text-sm">Specific Members</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Member Selection */}
                {!assignToAll && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="relative mb-2">
                      <input
                        type="text"
                        placeholder="Search members..."
                        value={memberSearchTerm}
                        onChange={(e) => setMemberSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                      />
                      <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <div className="max-h-32 overflow-y-auto">
                      {teamInfo?.members
                        ?.filter((member) =>
                          member.name
                            .toLowerCase()
                            .includes(memberSearchTerm.toLowerCase())
                        )
                        .map((member) => (
                          <label
                            key={member.email}
                            className="flex items-center p-2 hover:bg-gray-100 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={checkedMembers.includes(member.email)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCheckedMembers((prev) => [
                                    ...prev,
                                    member.email,
                                  ]);
                                } else {
                                  setCheckedMembers((prev) =>
                                    prev.filter((m) => m !== member.email)
                                  );
                                }
                              }}
                              className="text-indigo-600 rounded focus:ring-indigo-400"
                            />
                            <span className="ml-2 text-sm">{member.name}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-100">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAssignTaskModal(false)}
                    className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTask}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Create Task</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 5l7 7-7 7M5 12h15"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modern Task Details Modal */}
        {showTaskDetailsModal && selectedTask && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setShowTaskDetailsModal(false)}
          >
            <div
              className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Section */}
              <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-50 rounded-xl">
                    <svg
                      className="w-6 h-6 text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {selectedTask.taskName}
                  </h2>
                </div>
                <button
                  onClick={() => setShowTaskDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content Section */}
              <div className="p-6 space-y-6">
                {/* Task Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm font-medium text-gray-600">Urgency</p>
                    <p
                      className={`text-lg mt-1 ${
                        selectedTask.urgency === "High"
                          ? "text-red-600"
                          : selectedTask.urgency === "Medium"
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      {selectedTask.urgency}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm font-medium text-gray-600">
                      Deadline
                    </p>
                    <p className="text-lg mt-1 text-gray-800">
                      {new Date(selectedTask.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-medium text-gray-700 mb-2">
                    Description
                  </h3>
                  <p className="text-gray-600">{selectedTask.description}</p>
                </div>

                {/* Assignees Section */}
                {isLeader && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-medium text-gray-700 mb-3">
                      Assignees
                    </h3>
                    <div
                      className={`space-y-2 ${
                        selectedTask.assignedTo.length > 3
                          ? "max-h-40 overflow-y-auto pr-2"
                          : ""
                      }`}
                    >
                      {selectedTask.assignedTo.map((assignee) => (
                        <div
                          key={assignee.email}
                          className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm"
                        >
                          <span className="text-sm text-gray-700">
                            {assignee.email}
                          </span>
                          <span
                            className={`text-sm px-2 py-1 rounded-full ${
                              assignee.status === "Done"
                                ? "bg-green-100 text-green-700"
                                : assignee.status === "In Progress"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {assignee.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dependencies Section */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-700">
                      Dependencies & Successors
                    </h3>
                    {isLeader && (
                      <button
                        onClick={() => {
                          setDependencyMainTask(selectedTask);
                          setDependencySearchTerm("");
                          setFilteredTasks(
                            tasks.filter((t) => t._id !== selectedTask._id)
                          );
                          setShowDependencyModal(true);
                        }}
                        className="flex items-center space-x-1 text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        <FiPlus className="w-4 h-4" />
                        <span>Add Dependency</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* Dependencies */}
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Depends on:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedTask.dependsOn &&
                        selectedTask.dependsOn.length > 0 ? (
                          selectedTask.dependsOn.map((depId) => {
                            const depTask = tasks.find((t) => t._id === depId);
                            return depTask ? (
                              <span
                                key={depId}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-50 text-indigo-700"
                              >
                                {depTask.taskName}
                              </span>
                            ) : null;
                          })
                        ) : (
                          <span className="text-sm text-gray-500">
                            No dependencies
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Successors */}
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Successors:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedTask.successors &&
                        selectedTask.successors.length > 0 ? (
                          selectedTask.successors.map((succId) => {
                            const succTask = tasks.find(
                              (t) => t._id === succId
                            );
                            return succTask ? (
                              <span
                                key={succId}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-50 text-green-700"
                              >
                                {succTask.taskName}
                              </span>
                            ) : null;
                          })
                        ) : (
                          <span className="text-sm text-gray-500">
                            No successors
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Discussion Section */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-medium text-gray-700 mb-3">Discussion</h3>
                  <div
                    className={`space-y-3 ${
                      selectedTask.discussion?.length > 2
                        ? "max-h-60 overflow-y-auto pr-2"
                        : ""
                    }`}
                  >
                    {selectedTask.discussion &&
                    selectedTask.discussion.length > 0 ? (
                      selectedTask.discussion.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-white rounded-lg p-3 shadow-sm"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-indigo-700">
                                  {item.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">
                                  {item.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {item.email}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(item.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm">
                            {item.message}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No discussions yet
                      </p>
                    )}
                  </div>

                  {/* Add Message Form */}
                  {(selectedTask.assignedTo.some(
                    (a) =>
                      a.email ===
                      jwt.decode(localStorage.getItem("token"))?.email
                  ) ||
                    selectedTask.createdBy ===
                      jwt.decode(localStorage.getItem("token"))?.email) && (
                    <div className="mt-4">
                      <textarea
                        value={newIdea}
                        onChange={(e) => setNewIdea(e.target.value)}
                        placeholder="Share your thoughts..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                        rows={3}
                      />
                      <button
                        onClick={handleAddIdea}
                        className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                      >
                        Post Message
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6 space-y-3">
                {selectedTask.assignedTo.some(
                  (a) =>
                    a.email === jwt.decode(localStorage.getItem("token"))?.email
                ) && (
                  <div className="flex items-center space-x-3">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    >
                      <option>Not Started</option>
                      <option>In Progress</option>
                      <option>Done</option>
                    </select>
                    <button
                      onClick={handleUpdateStatus}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200"
                    >
                      Update Status
                    </button>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleAddToCalendar(selectedTask)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    Add to Calendar
                  </button>

                  {isLeader && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditTaskModal(selectedTask);
                      }}
                      className="px-3 py-1.5 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700"
                    >
                      Edit Task
                    </button>
                  )}

                  {selectedTask.createdBy ===
                    jwt.decode(localStorage.getItem("token"))?.email && (
                    <button
                      onClick={handleDeleteTask}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      Delete Task
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showOverviewModal && overviewData && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowOverviewModal(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Section */}
              <div className="px-8 py-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl">
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
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">
                        Team Overview
                      </h2>
                      <p className="text-gray-500">
                        Analytics and Insights Dashboard
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowOverviewModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  >
                    <FiX className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-8 max-h-[calc(90vh-120px)] overflow-y-auto">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500 rounded-xl">
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
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-600">
                          Team Members
                        </p>
                        <h3 className="text-3xl font-bold text-gray-800 mt-1">
                          {overviewData.totalMembers}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Excluding Team Leader
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-500 rounded-xl">
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
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-600">
                          Total Tasks
                        </p>
                        <h3 className="text-3xl font-bold text-gray-800 mt-1">
                          {overviewData.totalTasks}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Active Projects
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-2 gap-8">
                  {/* Priority Distribution */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-6">
                      Priority Distribution
                    </h4>
                    <div className="w-full" style={{ height: "300px" }}>
                      <Pie
                        data={{
                          labels: ["High", "Medium", "Low"],
                          datasets: [
                            {
                              label: "Priority",
                              data: [
                                overviewData.priorityStats.high,
                                overviewData.priorityStats.medium,
                                overviewData.priorityStats.low,
                              ],
                              backgroundColor: [
                                "rgba(239, 68, 68, 0.9)",
                                "rgba(245, 158, 11, 0.9)",
                                "rgba(16, 185, 129, 0.9)",
                              ],
                              borderWidth: 0,
                            },
                          ],
                        }}
                        options={{
                          maintainAspectRatio: false,
                          responsive: true,
                          plugins: {
                            legend: {
                              position: "bottom",
                              labels: {
                                padding: 20,
                                usePointStyle: true,
                              },
                            },
                          },
                          animation: {
                            duration: 2000,
                          },
                        }}
                      />
                    </div>
                  </div>

                  {/* Task Status */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-6">
                      Task Completion Status
                    </h4>
                    <div className="w-full" style={{ height: "300px" }}>
                      <Bar
                        data={{
                          labels: ["Not Started", "In Progress", "Done"],
                          datasets: [
                            {
                              label: "Tasks",
                              data: [
                                overviewData.statusStats.notStarted,
                                overviewData.statusStats.inProgress,
                                overviewData.statusStats.done,
                              ],
                              backgroundColor: [
                                "rgba(156, 163, 175, 0.9)",
                                "rgba(59, 130, 246, 0.9)",
                                "rgba(16, 185, 129, 0.9)",
                              ],
                              borderRadius: 8,
                            },
                          ],
                        }}
                        options={{
                          maintainAspectRatio: false,
                          responsive: true,
                          scales: {
                            y: {
                              beginAtZero: true,
                              grid: {
                                display: true,
                                color: "rgba(0,0,0,0.05)",
                              },
                            },
                            x: {
                              grid: {
                                display: false,
                              },
                            },
                          },
                          plugins: {
                            legend: {
                              display: false,
                            },
                          },
                          animation: {
                            duration: 2000,
                          },
                        }}
                      />
                    </div>
                  </div>

                  {/* Assignment Distribution */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 col-span-2">
                    <h4 className="text-lg font-semibold text-gray-800 mb-6">
                      Team Assignment Distribution
                    </h4>
                    <div className="w-full" style={{ height: "300px" }}>
                      <Doughnut
                        data={{
                          labels: ["Assigned Tasks", "Unassigned Tasks"],
                          datasets: [
                            {
                              data: [
                                overviewData.assignedCount,
                                overviewData.unassignedCount,
                              ],
                              backgroundColor: [
                                "rgba(59, 130, 246, 0.9)",
                                "rgba(229, 231, 235, 0.9)",
                              ],
                              borderWidth: 0,
                            },
                          ],
                        }}
                        options={{
                          maintainAspectRatio: false,
                          responsive: true,
                          cutout: "70%",
                          plugins: {
                            legend: {
                              position: "bottom",
                              labels: {
                                padding: 20,
                                usePointStyle: true,
                              },
                            },
                          },
                          animation: {
                            duration: 2000,
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notice Modal */}
        {showNoticeModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowNoticeModal(false)}
          >
            <div
              className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        Create Notice
                      </h2>
                      <p className="text-sm text-gray-500">
                        Share important updates with your team
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowNoticeModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  >
                    <FiX className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6 space-y-6">
                {/* Topic Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notice Topic <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={noticeTopic}
                    onChange={(e) => setNoticeTopic(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition duration-200"
                    placeholder="Enter notice topic..."
                  />
                </div>

                {/* Message Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={noticeMessage}
                    onChange={(e) => setNoticeMessage(e.target.value)}
                    rows="4"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition duration-200 resize-none"
                    placeholder="Type your notice message here..."
                  />
                </div>

                {/* Importance Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Importance Level
                  </label>
                  <div className="flex gap-4">
                    <label className="flex-1">
                      <input
                        type="radio"
                        name="importance"
                        checked={noticeImportance === "Low"}
                        onChange={() => setNoticeImportance("Low")}
                        className="hidden"
                      />
                      <div
                        className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                          noticeImportance === "Low"
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              noticeImportance === "Low"
                                ? "bg-green-500"
                                : "bg-gray-300"
                            }`}
                          />
                          <span
                            className={`font-medium ${
                              noticeImportance === "Low"
                                ? "text-green-700"
                                : "text-gray-600"
                            }`}
                          >
                            Low Priority
                          </span>
                        </div>
                      </div>
                    </label>

                    <label className="flex-1">
                      <input
                        type="radio"
                        name="importance"
                        checked={noticeImportance === "High"}
                        onChange={() => setNoticeImportance("High")}
                        className="hidden"
                      />
                      <div
                        className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                          noticeImportance === "High"
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              noticeImportance === "High"
                                ? "bg-red-500"
                                : "bg-gray-300"
                            }`}
                          />
                          <span
                            className={`font-medium ${
                              noticeImportance === "High"
                                ? "text-red-700"
                                : "text-gray-600"
                            }`}
                          >
                            High Priority
                          </span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-100">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowNoticeModal(false)}
                    className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveNotice}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <span>Post Notice</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Checkpoints Modal */}
        {showCheckpointsModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowCheckpointsModal(false)}
          >
            <div
              className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        Checkpoints
                      </h2>
                      <p className="text-sm text-gray-500">
                        Track project milestones
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCheckpointsModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  >
                    <FiX className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Checkpoints List */}
                <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto pr-2">
                  {checkpoints.map((cp) => (
                    <div
                      key={cp._id}
                      className="group bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors duration-200"
                    >
                      <div className="flex items-center justify-between p-4">
                        <div
                          onClick={() => openCheckpointDetails(cp)}
                          className="flex items-center gap-3 flex-1 cursor-pointer"
                        >
                          <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                          <div>
                            <h3 className="text-sm font-medium text-gray-800 group-hover:text-emerald-600 transition-colors duration-200">
                              {cp.name}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {cp.checks?.length || 0} items
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        {(isLeader || userHasCap) && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                editCheckpointName(cp);
                              }}
                              className="p-2 text-gray-400 hover:text-emerald-600 rounded-lg transition-colors duration-200"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCheckpoint(cp._id);
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors duration-200"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {checkpoints.length === 0 && (
                    <div className="text-center py-8">
                      <div className="mb-3">
                        <svg
                          className="w-12 h-12 text-gray-300 mx-auto"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm">
                        No checkpoints created yet
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              {(isLeader || userHasCap) && (
                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-100">
                  <button
                    onClick={() => createCheckpoint()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors duration-200"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    <span className="font-medium">Create New Checkpoint</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Checkpoint Details Modal */}
        {showCheckpointDetailsModal && selectedCheckpoint && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowCheckpointDetailsModal(false)}
          >
            <div
              className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        {selectedCheckpoint.name}
                      </h2>
                      <p className="text-sm text-gray-500">
                        Track your progress
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCheckpointDetailsModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  >
                    <FiX className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Checks List */}
                <div className="space-y-3">
                  {selectedCheckpoint.checks.map((ch) => {
                    const currentUserEmail = jwt.decode(
                      localStorage.getItem("token")
                    )?.email;
                    const isUserDone = ch.doneBy?.includes(currentUserEmail);
                    const totalMembers = ch.doneBy?.length || 0;

                    return (
                      <div
                        key={ch._id}
                        className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-colors duration-200"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  isUserDone ? "bg-green-500" : "bg-gray-300"
                                }`}
                              />
                              <p
                                className={`text-sm font-medium ${
                                  isUserDone
                                    ? "text-gray-500 line-through"
                                    : "text-gray-800"
                                }`}
                              >
                                {ch.description}
                              </p>
                            </div>
                            {ch.doneBy && ch.doneBy.length > 0 && (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="flex -space-x-2">
                                  {ch.doneBy.slice(0, 3).map((email, idx) => (
                                    <div
                                      key={idx}
                                      className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center"
                                    >
                                      <span className="text-xs font-medium text-blue-600">
                                        {email[0].toUpperCase()}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <span className="text-xs text-gray-500">
                                  {totalMembers}{" "}
                                  {totalMembers === 1 ? "member" : "members"}{" "}
                                  completed
                                </span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              toggleCheckDone(selectedCheckpoint._id, ch._id)
                            }
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                              isUserDone
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {isUserDone ? (
                              <span className="flex items-center gap-1">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                Done
                              </span>
                            ) : (
                              "Mark Done"
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              {(isLeader || userHasCap) && (
                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-100">
                  <button
                    onClick={() => addCheck(selectedCheckpoint._id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    <span className="font-medium">Add New Check</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {showLinksModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowLinksModal(false)}
          >
            <div
              className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        Important Links
                      </h2>
                      <p className="text-sm text-gray-500">
                        Manage your team's important resources
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowLinksModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  >
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Links List */}
                <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto pr-2">
                  {importantLinks.length > 0 ? (
                    importantLinks.map((link, idx) => (
                      <div
                        key={idx}
                        className="group bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 p-4 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 font-medium block truncate transition-colors duration-200"
                            >
                              {link.title}
                            </a>
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {link.url}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveLink(link.url)}
                            className="p-2 text-gray-400 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="mb-3">
                        <svg
                          className="w-12 h-12 text-gray-300 mx-auto"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm">
                        No important links added yet
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                <button
                  onClick={() => setShowAddLinkModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <span className="font-medium">Add New Link</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddLinkModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowAddLinkModal(false)}
          >
            <div
              className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        Add New Link
                      </h2>
                      <p className="text-sm text-gray-500">
                        Add an important resource
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddLinkModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  >
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link Title <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
                      placeholder="Enter link title..."
                    />
                    <svg
                      className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Give your link a descriptive title
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link URL <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
                      placeholder="https://..."
                    />
                    <svg
                      className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Include the complete URL starting with http:// or https://
                  </p>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-blue-700">
                      This link will be visible to all team members
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddLinkModal(false)}
                    className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddLink}
                    disabled={!newLinkTitle.trim() || !newLinkUrl.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <span>Add Link</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dependency Modal (Leader only) */}
        {showDependencyModal && dependencyMainTask && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4"
            onClick={() => setShowDependencyModal(false)}
          >
            <div
              className="relative bg-white w-full max-w-md rounded-lg shadow-xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowDependencyModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>

              <h2 className="text-xl font-bold mb-4">
                Set Dependency for: {dependencyMainTask.taskName}
              </h2>

              <p className="text-sm text-gray-600 mb-2">
                Select which existing task must be completed first.
              </p>

              {/* A quick input to filter tasks */}
              <input
                type="text"
                placeholder="Search tasks..."
                value={dependencySearchTerm}
                onChange={(e) => {
                  setDependencySearchTerm(e.target.value);
                  // Filter out the main task itself and show all others
                  const term = e.target.value.toLowerCase();
                  const results = tasks.filter(
                    (t) =>
                      t._id !== dependencyMainTask._id &&
                      t.taskName.toLowerCase().includes(term)
                  );
                  setFilteredTasks(results);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2"
              />

              {/* Show filtered tasks as a list to pick from */}
              <ul className="max-h-48 overflow-auto border border-gray-200 rounded-lg p-2 mb-4">
                {filteredTasks.map((t) => (
                  <li
                    key={t._id}
                    onClick={() =>
                      handleAddDependency(dependencyMainTask._id, t._id)
                    }
                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700 rounded"
                  >
                    {t.taskName}
                  </li>
                ))}
                {filteredTasks.length === 0 && (
                  <li className="text-sm text-gray-500">
                    No matching tasks found.
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Modern AI Chat Assistant Modal */}
        {showAIModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setShowAIModal(false)}
          >
            <div
              className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      AI Chat Assistant
                    </h2>
                    <p className="text-sm text-gray-500">
                      Powered by Advanced AI
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      setConversations([
                        {
                          role: "assistant",
                          content:
                            "Hello! I'm your AI assistant. How can I help you today?",
                        },
                      ])
                    }
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 text-gray-500 tooltip"
                    title="Clear chat history"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowAIModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  >
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Chat Area */}
              <div
                ref={chatAreaRef}
                className="flex-1 overflow-y-auto p-6 space-y-4"
              >
                {conversations.map((message, index) => (
                  <div
                    key={index}
                    className={`flex items-start ${
                      message.role === "user" ? "justify-end" : ""
                    } space-x-3`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-indigo-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                          />
                        </svg>
                      </div>
                    )}

                    <div
                      className={`${
                        message.role === "user"
                          ? "bg-indigo-600 text-white rounded-2xl rounded-tr-none"
                          : "bg-gray-50 text-gray-700 rounded-2xl rounded-tl-none"
                      } p-4 max-w-[80%]`}
                    >
                      {message.role === "user" ? (
                        <p>{message.content}</p>
                      ) : (
                        renderFormattedMessage(message.content)
                      )}
                    </div>

                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-white"
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
                    )}
                  </div>
                ))}

                {/* Loading Animation */}
                {isLoading && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-indigo-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                        />
                      </svg>
                    </div>
                    <div className="bg-gray-50 rounded-2xl rounded-tl-none p-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 border-t border-gray-100">
                <div className="relative">
                  <textarea
                    className="w-full pl-4 pr-20 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Type your message here..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim() || isLoading}
                    className="absolute right-2 bottom-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <span>Send</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </button>
                </div>
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    Press Enter to send, Shift + Enter for new line
                  </p>
                  <p className="text-xs text-gray-500">
                    {currentMessage.length} characters
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Email Reminder Modal */}
        {showReminderModal && reminderTask && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowReminderModal(false)}
          >
            <div
              className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      Email Reminder
                    </h2>
                    <p className="text-sm text-gray-500">
                      Schedule task notification
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReminderModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-full mt-1">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Task Details
                      </p>
                      <h3 className="text-base font-semibold text-gray-800 mt-1">
                        {reminderTask?.taskName}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        You'll receive an email notification at the specified
                        time.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reminder Date & Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={reminderDateTime}
                      onChange={(e) => setReminderDateTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
                    />
                    <svg
                      className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Select a date and time when you'd like to receive the
                    reminder email
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 text-sm text-gray-600">
                      <p>
                        The reminder will be sent to your registered email
                        address
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowReminderModal(false)}
                    className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSetReminder}
                    disabled={!reminderDateTime}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>Set Reminder</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Professional Hackathon Creation Modal */}
        {showHackathonModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowHackathonModal(false)}
          >
            <div
              className="bg-white w-full max-w-xl rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
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
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        {hackathonId ? "Update Event" : "Create Event"}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Set up an in-house brainstorming session
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowHackathonModal(false)}
                    className="p-2 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-500"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={hackTopic}
                    onChange={(e) => setHackTopic(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    placeholder="Enter hackathon topic..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={hackDescription}
                    onChange={(e) => setHackDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none"
                    placeholder="Describe the hackathon challenge and objectives..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date & Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={hackStart}
                      onChange={(e) => setHackStart(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date & Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={hackEnd}
                      onChange={(e) => setHackEnd(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-blue-700">
                      The event will be visible to all team members once created
                      according to the session duration.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center justify-end gap-4">
                  {hackathonId && (
                    <button
                      onClick={handleDeleteHackathon}
                      className="px-6 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                    >
                      Delete Event
                    </button>
                  )}
                  <button
                    onClick={handleSaveHackathon}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
                  >
                    {hackathonId ? "Update Event" : "Create Event"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Book Conference Room Modal */}
        {showBookRoomModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowBookRoomModal(false)}
          >
            <div
              className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  Book Conference Room
                </h2>
                <button
                  onClick={() => setShowBookRoomModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={handleBookRoomFromTeams}
                className="p-6 space-y-4"
              >
                {/* Room selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select a Room
                  </label>
                  <select
                    value={bookingForm.roomId}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, roomId: e.target.value })
                    }
                    required
                  >
                    <option value="">-- Choose a Room --</option>
                    {availableRooms.map((roomId) => (
                      <option key={roomId} value={roomId}>
                        {roomId}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={bookingForm.meetingStart}
                    onChange={(e) =>
                      setBookingForm({
                        ...bookingForm,
                        meetingStart: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                {/* End Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={bookingForm.meetingEnd}
                    onChange={(e) =>
                      setBookingForm({
                        ...bookingForm,
                        meetingEnd: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                {/* Topic */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Topic
                  </label>
                  <input
                    type="text"
                    placeholder="Project kickoff meeting"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={bookingForm.topic}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, topic: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="Engineering"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={bookingForm.department}
                    onChange={(e) =>
                      setBookingForm({
                        ...bookingForm,
                        department: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                {/* Participants */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Participants (max 20)
                  </label>
                  <input
                    type="number"
                    max="20"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0"
                    value={bookingForm.numEmployees}
                    onChange={(e) =>
                      setBookingForm({
                        ...bookingForm,
                        numEmployees: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                {/* Host Designation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Role
                  </label>
                  <input
                    type="text"
                    placeholder="Team Lead"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={bookingForm.hostDesignation}
                    onChange={(e) =>
                      setBookingForm({
                        ...bookingForm,
                        hostDesignation: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBookRoomModal(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Confirm Booking
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Booking Success Modal */}
        {showBookingSuccessModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowBookingSuccessModal(false)}
          >
            <div
              className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Booking Confirmed
                </h2>
                <button
                  onClick={() => setShowBookingSuccessModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <p className="text-sm text-gray-700">
                Your room has been booked successfully. You can view your
                booking status{" "}
                <a
                  href="https://bpcl-portal.vercel.app/meeting"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 underline"
                >
                  here
                </a>
                .
              </p>

              {/* Footer */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowBookingSuccessModal(false)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showTrackModal && trackTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn transition-opacity duration-300">
            <div
              className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 animate-scaleIn"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-5 border-b border-indigo-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/20 rounded-lg">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white tracking-wide">
                        Task Tracking
                      </h2>
                      <p className="text-indigo-200 text-sm mt-0.5">
                        {trackTask.taskName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTrackModal(false)}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors duration-200"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-6 max-h-[calc(80vh-120px)] overflow-y-auto">
                {isLeader ? (
                  <div>
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
                      <h3 className="text-lg font-medium text-gray-800">
                        Team Member Reports
                      </h3>
                    </div>

                    <ul className="space-y-5">
                      {trackTask.assignedTo?.map((member) => {
                        const reportObj =
                          trackReports.find(
                            (r) => r.reporterEmail === member.email
                          ) || {};

                        return (
                          <li
                            key={member.email}
                            className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                          >
                            <div className="flex justify-between items-center px-4 py-3 bg-gray-100">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm font-medium text-indigo-600">
                                    {member.email[0].toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-800">
                                    {member.email}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {reportObj.lastUpdated
                                      ? new Date(
                                          reportObj.lastUpdated
                                        ).toLocaleString()
                                      : "No report yet"}
                                  </p>
                                </div>
                              </div>

                              <button
                                onClick={() => openMemberReport(member.email)}
                                className="text-sm flex items-center gap-1.5 text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                                <span>Comment</span>
                              </button>
                            </div>

                            <div className="p-4">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Report Content
                                  </p>
                                </div>
                                <div className="p-3 bg-white border rounded-lg">
                                  {reportObj.userReport ? (
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                      {reportObj.userReport}
                                    </p>
                                  ) : (
                                    <p className="text-sm italic text-gray-400 text-center py-2">
                                      No report submitted yet
                                    </p>
                                  )}
                                </div>
                              </div>

                              {selectedMember === member.email && (
                                <div className="mt-4 bg-indigo-50 p-4 rounded-lg border border-indigo-100 animate-fadeIn">
                                  <div className="mb-2.5">
                                    <label className="block text-xs font-medium text-indigo-700 mb-1.5">
                                      Your Comment
                                    </label>
                                    <textarea
                                      className="w-full border border-indigo-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                                      rows={3}
                                      placeholder="Enter your feedback or guidance..."
                                      value={memberTrackReportText}
                                      onChange={(e) =>
                                        setMemberTrackReportText(e.target.value)
                                      }
                                    />
                                  </div>
                                  <div className="flex justify-end">
                                    <button
                                      onClick={handleSaveLeaderReport}
                                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 shadow-sm transition-all duration-200 flex items-center gap-1.5"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                      Save Comment
                                    </button>
                                  </div>
                                </div>
                              )}

                              {reportObj.leaderReport && (
                                <div className="mt-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-1 h-1 bg-indigo-500 rounded-full"></div>
                                    <p className="text-xs font-medium text-indigo-700 uppercase tracking-wider">
                                      Leader Feedback
                                    </p>
                                  </div>
                                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                      {reportObj.leaderReport}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                      {reportObj.leaderCommentDate
                                        ? new Date(
                                            reportObj.leaderCommentDate
                                          ).toLocaleString()
                                        : ""}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2.5 bg-indigo-100 rounded-lg">
                        <svg
                          className="w-5 h-5 text-indigo-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-800">
                        Your Progress Report
                      </h3>
                    </div>

                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Report Details
                        </label>
                        <span className="text-xs text-gray-500">
                          Last updated:{" "}
                          {trackReports.find(
                            (r) => r.reporterEmail === currentUserEmail
                          )?.lastUpdated
                            ? new Date(
                                trackReports.find(
                                  (r) => r.reporterEmail === currentUserEmail
                                )?.lastUpdated
                              ).toLocaleString()
                            : "Not submitted yet"}
                        </span>
                      </div>
                      <textarea
                        className="w-full border border-gray-300 rounded-lg p-3.5 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-200"
                        rows={6}
                        placeholder="Describe your progress, challenges faced, and current status of the task..."
                        value={trackReportText}
                        onChange={(e) => setTrackReportText(e.target.value)}
                      />

                      <div className="bg-amber-50 rounded-lg p-3 mt-3 border border-amber-100 flex items-start gap-3">
                        <svg
                          className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-xs text-amber-800">
                          Your report will be visible to your team leader. Be
                          specific about your progress and any issues you're
                          facing to get the most helpful feedback.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveUserReport}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-all duration-200 flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                          />
                        </svg>
                        Submit Report
                      </button>
                    </div>

                    {(() => {
                      const userRecord = trackReports.find(
                        (r) => r.reporterEmail === currentUserEmail
                      );
                      if (userRecord && userRecord.leaderReport) {
                        return (
                          <div className="mt-8 bg-indigo-50 rounded-lg p-5 border-l-4 border-indigo-600 animate-fadeIn">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-indigo-100 rounded-full">
                                <svg
                                  className="w-4 h-4 text-indigo-600"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                  />
                                </svg>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-indigo-800">
                                  Leader Feedback
                                </h4>
                                <p className="text-xs text-indigo-600 mt-0.5">
                                  {userRecord.leaderCommentDate
                                    ? new Date(
                                        userRecord.leaderCommentDate
                                      ).toLocaleString()
                                    : ""}
                                </p>
                              </div>
                            </div>
                            <div className="ml-9">
                              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                {userRecord.leaderReport}
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 sticky bottom-0">
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowTrackModal(false)}
                    className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm transition-all duration-200 font-medium flex items-center gap-2"
                  >
                    <span>Close</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showEditTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        Edit Task
                      </h2>
                      <p className="text-indigo-100 text-sm mt-0.5">
                        Update task details and assignments
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEditTaskModal(false)}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    aria-label="Close"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)] space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Task Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Task Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editTaskData.taskName}
                      onChange={(e) =>
                        setEditTaskData({
                          ...editTaskData,
                          taskName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                      placeholder="Enter task name"
                    />
                  </div>

                  {/* Urgency */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Urgency <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={editTaskData.urgency}
                        onChange={(e) =>
                          setEditTaskData({
                            ...editTaskData,
                            urgency: e.target.value,
                          })
                        }
                        className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Deadline */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Deadline <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        value={editTaskData.deadline}
                        onChange={(e) =>
                          setEditTaskData({
                            ...editTaskData,
                            deadline: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                      />
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows="4"
                      value={editTaskData.description}
                      onChange={(e) =>
                        setEditTaskData({
                          ...editTaskData,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none"
                      placeholder="Describe the task in detail..."
                    />
                  </div>
                </div>

                {/* Assigned Members */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      Assigned Team Members
                    </label>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {editTaskData.assignedMembers.length} members
                    </span>
                  </div>

                  {/* Search & Add New Member */}
                  <div className="relative mb-3">
                    <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                      <svg
                        className="w-4 h-4 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search team members to add"
                      value={newAssignedQuery}
                      onChange={(e) => setNewAssignedQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  {/* Search Results Dropdown */}
                  {newAssignedQuery && (
                    <div className="absolute z-20 bg-white border border-gray-200 rounded-lg mt-1 shadow-lg w-full max-w-[calc(100%-3rem)] max-h-48 overflow-auto">
                      {teamInfo?.members
                        ?.filter((m) => {
                          // Exclude already assigned
                          if (editTaskData.assignedMembers.includes(m.email))
                            return false;
                          // Match name or email
                          const query = newAssignedQuery.toLowerCase();
                          return (
                            m.name.toLowerCase().includes(query) ||
                            m.email.toLowerCase().includes(query)
                          );
                        })
                        .map((member) => (
                          <div
                            key={member.email}
                            className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0 cursor-pointer"
                            onClick={() => {
                              setEditTaskData({
                                ...editTaskData,
                                assignedMembers: [
                                  ...editTaskData.assignedMembers,
                                  member.email,
                                ],
                              });
                              setNewAssignedQuery("");
                            }}
                          >
                            <div className="flex items-center">
                              <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-sm font-medium text-indigo-700">
                                  {member.name[0].toUpperCase()}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-700">
                                  {member.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {member.email}
                                </span>
                              </div>
                            </div>
                            <button
                              className="text-xs flex items-center gap-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-1 rounded transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditTaskData({
                                  ...editTaskData,
                                  assignedMembers: [
                                    ...editTaskData.assignedMembers,
                                    member.email,
                                  ],
                                });
                                setNewAssignedQuery("");
                              }}
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                              </svg>
                              Add
                            </button>
                          </div>
                        ))}

                      {teamInfo?.members?.filter(
                        (m) =>
                          !editTaskData.assignedMembers.includes(m.email) &&
                          (m.name
                            .toLowerCase()
                            .includes(newAssignedQuery.toLowerCase()) ||
                            m.email
                              .toLowerCase()
                              .includes(newAssignedQuery.toLowerCase()))
                      ).length === 0 && (
                        <div className="px-4 py-3 text-sm text-center text-gray-500">
                          No matching members found
                        </div>
                      )}
                    </div>
                  )}

                  {/* Current Assigned Members */}
                  <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-2">
                    <div className="max-h-40 overflow-y-auto">
                      {editTaskData.assignedMembers.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                          {editTaskData.assignedMembers.map((member, index) => (
                            <li
                              key={index}
                              className="flex items-center justify-between py-2 px-2"
                            >
                              <span className="text-sm text-gray-700 truncate">
                                {member}
                              </span>
                              <button
                                onClick={() => {
                                  const updated =
                                    editTaskData.assignedMembers.filter(
                                      (m, i) => i !== index
                                    );
                                  setEditTaskData({
                                    ...editTaskData,
                                    assignedMembers: updated,
                                  });
                                }}
                                className="ml-3 text-gray-400 hover:text-red-500 transition-colors"
                                aria-label="Remove member"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-center py-3 text-sm text-gray-500">
                          No members assigned to this task
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setShowEditTaskModal(false)}
                    className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEditTask}
                    className="px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center gap-1.5"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showPdfsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <div
              className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm"
              onClick={() => setShowPdfsModal(false)}
            />
            <div
              className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-50 rounded-md">
                    <svg
                      className="w-5 h-5 text-indigo-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Team Documents
                  </h2>
                </div>
                <button
                  onClick={() => setShowPdfsModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close"
                >
                  <FiX className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Upload Section */}
              <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Upload Document (PDF)
                  </label>
                  <span className="text-xs text-gray-500">
                    {pdfList.length}/10 documents used
                  </span>
                </div>

                {pdfList.length < 10 ? (
                  <>
                    <div className="mt-1 flex items-center">
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setSelectedFile(e.target.files[0]);
                          }
                        }}
                        className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 focus:outline-none"
                      />
                      <button
                        onClick={handleUploadPdf}
                        disabled={
                          !selectedFile || uploadingPdf || pdfList.length >= 10
                        }
                        className="ml-3 inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploadingPdf ? (
                          <>
                            <FiLoader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                            Uploading...
                          </>
                        ) : (
                          "Upload"
                        )}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Max file size: 10MB. PDF format only.
                    </p>
                  </>
                ) : (
                  <div className="flex items-center justify-center py-2 text-sm text-gray-600 bg-yellow-50 border border-yellow-100 rounded-md">
                    <svg
                      className="w-4 h-4 mr-2 text-yellow-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    Document limit reached (10/10)
                  </div>
                )}
              </div>

              {/* List of PDFs */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">
                    Shared Documents
                  </h3>
                  <div className="text-xs text-gray-500">
                    Last updated:{" "}
                    {pdfList.length > 0
                      ? new Date(pdfList[0].createdAt).toLocaleDateString()
                      : "Never"}
                  </div>
                </div>

                {pdfLoading ? (
                  <div className="py-8 flex flex-col items-center justify-center">
                    <FiLoader className="animate-spin w-8 h-8 text-indigo-600 mb-2" />
                    <span className="text-sm text-gray-500">
                      Loading documents...
                    </span>
                  </div>
                ) : pdfList.length === 0 ? (
                  <div className="py-10 flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-gray-100">
                    <svg
                      className="w-12 h-12 text-gray-300 mb-3"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-sm text-gray-500 font-medium">
                      No documents available
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Upload a PDF to get started
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Document Name
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Date Added
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pdfList.map((pdf) => (
                          <tr key={pdf._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <svg
                                  className="flex-shrink-0 h-5 w-5 text-red-500 mr-3"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <div className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
                                  {pdf.filename}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {new Date(pdf.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              <div className="flex items-center justify-end space-x-3">
                                <button
                                  onClick={() => handleViewPdf(pdf._id)}
                                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                                >
                                  {pdfViewLoadingId === pdf._id ? (
                                    <FiLoader className="animate-spin w-4 h-4 inline-block" />
                                  ) : (
                                    "View"
                                  )}
                                </button>

                                <button
                                  onClick={() => handleDeletePdf(pdf._id)}
                                  className="text-gray-600 hover:text-red-600"
                                  title="Delete document"
                                >
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Hint message */}
              <div className="mt-6 flex items-center space-x-3 p-3 bg-blue-50 rounded-md border border-blue-100">
                <svg
                  className="h-5 w-5 text-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-blue-700">
                  All team members can upload and delete documents. Documents
                  are shared with everyone on the team.
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Team Info Modal */}
        {showTeamInfoModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowTeamInfoModal(false)}
          >
            <div
              className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        Team Details
                      </h2>
                      <p className="text-sm text-gray-500">
                        Update your team information
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTeamInfoModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  >
                    <FiX className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={tempTeamName}
                    onChange={(e) => setTempTeamName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition duration-200"
                    placeholder="Enter team name..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Description
                  </label>
                  <textarea
                    value={tempDescription}
                    onChange={(e) => setTempDescription(e.target.value)}
                    rows="4"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition duration-200 resize-none"
                    placeholder="Describe your team's purpose and goals..."
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    A clear description helps team members understand their
                    roles and objectives.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 rounded-full">
                      <svg
                        className="w-5 h-5 text-indigo-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Team Visibility
                      </p>
                      <p className="text-xs text-gray-500">
                        Team details are visible to all members
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-100">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowTeamInfoModal(false)}
                    className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateTeamInfo}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <span>Save Changes</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
