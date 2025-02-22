"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiLoader,
  FiSearch,
  FiUserPlus,
  FiTrash2,
  FiPlusCircle,
  FiX,
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
  }, [router]);

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
      setOverviewData(data.overviewData); // store the stats
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch overview data.");
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
      // fetch the checkpoints
      const res = await fetch("/api/teams/checkpoints?myCheckpoints=1", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setCheckpoints(data.checkpoints || []);
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <ToastContainer />
        <div className="bg-white shadow-xl rounded-lg p-8 max-w-md w-full">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            You are not in any team
          </h2>
          <p className="text-gray-600 mb-6">
            Start your own team and invite others to join you!
          </p>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Team Name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded"
            />
            <button
              onClick={handleCreateTeam}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
              disabled={!teamName.trim()}
            >
              Create Team
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If user is in a team
  return (
    <div className="min-h-screen flex bg-gray-100 relative">
      <ToastContainer />

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 px-3 py-3 flex flex-col text-sm text-gray-800">
        {/* Team Info Header */}
        <div className="mb-3">
          {isLeader ? (
            <h2
              className="font-semibold text-gray-900 cursor-pointer"
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
            <h2 className="font-semibold text-gray-900">
              {teamInfo?.teamName || "Your Team"}
            </h2>
          )}

          {/* Team Description (if any) */}
          {teamInfo?.teamDescription && (
            <p className="mt-1 text-xs italic text-gray-600">
              {teamInfo.teamDescription}
            </p>
          )}

          {/* Leader or joined info */}
          {isLeader ? (
            <p className="mt-1 text-xs text-gray-700">You are the Leader</p>
          ) : (
            <p className="mt-1 text-xs text-gray-700">
              You joined {teamInfo?.leaderName}&apos;s Team
              {teamInfo?.members?.find((m) => m.email === teamInfo.leaderEmail)
                ?.invitedAt
                ? ` since ${new Date(
                    teamInfo.members.find(
                      (m) => m.email === teamInfo.leaderEmail
                    )?.invitedAt
                  ).toLocaleDateString()}`
                : ""}
            </p>
          )}
        </div>

        {/* Members List */}
        <div
          className={`flex-1 overflow-auto ${
            teamInfo?.members?.length > 4 ? "max-h-48" : ""
          }`}
        >
          <ul className="space-y-1">
            {/* Leader always on top */}
            <li className="font-semibold text-indigo-600 text-xs">
              Leader: {teamInfo?.leaderName}
            </li>
            {/* Then members */}
            {teamInfo?.members
              ?.filter((m) => m.email !== teamInfo.leaderEmail)
              ?.map((member) => (
                <li
                  key={member.email}
                  className="flex items-center justify-between text-xs space-x-2"
                >
                  {/* Show 'Cap' tag if canAddMembers is true */}
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-800">{member.name}</span>
                    {member.canAddMembers && (
                      <span className="bg-indigo-100 text-indigo-600 px-1 py-0.5 rounded font-medium">
                        Cap
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* If you're the leader, show a button to toggle that member's canAddMembers */}
                    {isLeader && (
                      <button
                        onClick={() => confirmUpdateAccess(member)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        {member.canAddMembers
                          ? "Revoke Access"
                          : "Grant Access"}
                      </button>
                    )}
                    {/* Remove Member button (leader or 'cap' user can remove) */}
                    {(isLeader || userHasCap) && (
                      <button
                        onClick={() => handleRemoveMember(member.email)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        </div>

        {/* Overview button (for all members) */}
        <button
          onClick={openOverview}
          className="mt-3 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <FiPlusCircle className="text-xs" />
          <span className="text-xs">Overview</span>
        </button>

        {/* CheckPoints button (for leader or cap) */}

        <button
          onClick={openCheckpoints}
          className="mt-3 flex items-center justify-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          <FiPlusCircle className="text-xs" />
          <span className="text-xs">CheckPoints</span>
        </button>

        {/* Notice Display */}
        {teamInfo?.notice && (
          <div
            className={`p-3 mt-3 rounded ${
              teamInfo.notice.importance === "High"
                ? "bg-red-50"
                : "bg-green-50"
            }`}
          >
            <h3 className="text-sm font-bold text-gray-800">
              Notice: {teamInfo.notice.topic}
            </h3>
            <p className="text-xs text-gray-700 mt-1">
              {teamInfo.notice.message}
            </p>
            <p className="text-[10px] text-gray-500 mt-1">
              Updated on {new Date(teamInfo.notice.updatedAt).toLocaleString()}
            </p>
          </div>
        )}

        {/* Notice for Members button (Leader only) */}
        {isLeader && (
          <button
            onClick={() => {
              setNoticeTopic(teamInfo.notice?.topic || "");
              setNoticeMessage(teamInfo.notice?.message || "");
              setNoticeImportance(teamInfo.notice?.importance || "Low");
              setShowNoticeModal(true);
            }}
            className="mt-3 flex items-center justify-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            <FiPlusCircle className="text-xs" />
            <span className="text-xs">Notice for Members</span>
          </button>
        )}

        {/* Button: Assign Tasks (leader only) */}
        {isLeader && (
          <button
            onClick={openAssignTaskModal}
            className="mt-3 flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <FiPlusCircle className="text-xs" />
            <span className="text-xs">Assign Tasks</span>
          </button>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6">
        {isLeader || userHasCap ? (
          <>
            <h2 className="text-xl font-semibold text-gray-800">Add Members</h2>
            <div className="relative mb-6 max-w-sm">
              <input
                type="text"
                placeholder="Search by email or username..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
              {searchLoading && (
                <FiLoader className="absolute right-3 top-2.5 text-gray-400 animate-spin" />
              )}
              {/* Search Results */}
              {searchTerm && searchResults.length > 0 && (
                <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded shadow z-10 max-h-56 overflow-auto">
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      <span className="text-sm text-gray-700">
                        {user.name} ({user.email})
                      </span>
                      <button
                        className="text-indigo-600 hover:text-indigo-800"
                        onClick={() => handleAddMember(user.email)}
                      >
                        <FiUserPlus />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Type to find users and add them to your team. A user can only
              belong to one team.
            </p>
          </>
        ) : (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Welcome to {teamInfo?.teamName}
            </h2>
            <p className="text-gray-600">
              You are part of {teamInfo?.leaderName}&apos;s team. Collaborations
              and assignments will appear here soon.
            </p>
          </div>
        )}

        {/* TASK LIST for both leader & member */}
        <div className="bg-white rounded-lg p-4 shadow">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Tasks</h3>
          {tasks.length === 0 ? (
            <p className="text-gray-600 text-sm">
              No tasks assigned or created yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {tasks.map((task) => {
                // For the label, if user is leader we see all tasks. If user is member, these are tasks assigned to them
                return (
                  <li
                    key={task._id}
                    onClick={() => openTaskDetails(task)}
                    className="p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">
                        {task.taskName} (
                        <span className="text-xs text-gray-500">
                          {task.urgency} Priority
                        </span>
                        )
                      </span>
                      <span className="text-sm text-gray-500">
                        Due: {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Assign Task Modal (Leader only) */}
      {showAssignTaskModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setShowAssignTaskModal(false)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowAssignTaskModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <FiX />
            </button>

            <h2 className="text-xl font-bold mb-4">Assign New Task</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Task Name
              </label>
              <input
                type="text"
                value={taskNameField}
                onChange={(e) => setTaskNameField(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={descriptionField}
                onChange={(e) => setDescriptionField(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Deadline
              </label>
              <input
                type="date"
                value={deadlineField}
                onChange={(e) => setDeadlineField(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Urgency
              </label>
              <select
                value={urgencyField}
                onChange={(e) => setUrgencyField(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>

            {/* Assign to all or specific */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Assign To
              </label>
              <div className="flex items-center space-x-4 mt-2">
                <div>
                  <input
                    type="radio"
                    id="assignAll"
                    name="assignType"
                    checked={assignToAll}
                    onChange={() => setAssignToAll(true)}
                  />
                  <label htmlFor="assignAll" className="ml-1 text-sm">
                    All Members
                  </label>
                </div>
                <div>
                  <input
                    type="radio"
                    id="assignSpecific"
                    name="assignType"
                    checked={!assignToAll}
                    onChange={() => setAssignToAll(false)}
                  />
                  <label htmlFor="assignSpecific" className="ml-1 text-sm">
                    Specific Members
                  </label>
                </div>
              </div>
            </div>

            {/* Search & Select specific members */}
            {!assignToAll && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search &amp; Select Members
                </label>
                <input
                  type="text"
                  placeholder="Start typing to see team members..."
                  value={memberSearchTerm}
                  onChange={(e) => setMemberSearchTerm(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />

                {/* Only show results if user typed something */}
                {memberSearchTerm.trim() !== "" && (
                  <div className="max-h-32 overflow-auto border border-gray-200 rounded p-2">
                    {teamInfo?.members
                      ?.filter((member) =>
                        member.name
                          .toLowerCase()
                          .includes(memberSearchTerm.toLowerCase())
                      )
                      .map((member) => (
                        <div
                          key={member.email}
                          className="flex items-center mb-1"
                        >
                          <input
                            type="checkbox"
                            id={member.email}
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
                          />
                          <label
                            htmlFor={member.email}
                            className="ml-2 text-sm"
                          >
                            {member.name}
                          </label>
                        </div>
                      ))}

                    {/* If typed but no matches */}
                    {teamInfo?.members &&
                      teamInfo.members.filter((member) =>
                        member.name
                          .toLowerCase()
                          .includes(memberSearchTerm.toLowerCase())
                      ).length === 0 && (
                        <p className="text-sm text-gray-500">
                          No matching members found.
                        </p>
                      )}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleCreateTask}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-semibold tracking-wide"
            >
              Assign Task
            </button>
          </div>
        </div>
      )}

      {/* Task Details Modal (for both leader & members) */}
      {showTaskDetailsModal && selectedTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowTaskDetailsModal(false)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowTaskDetailsModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <FiX />
            </button>
            <h2 className="text-xl font-bold mb-4">{selectedTask.taskName}</h2>
            <p className="text-sm text-gray-500 mb-2">
              Urgency: {selectedTask.urgency}
            </p>
            <p className="text-sm text-gray-500 mb-2">
              Deadline: {new Date(selectedTask.deadline).toLocaleDateString()}
            </p>
            <p className="text-gray-700 mb-4">{selectedTask.description}</p>

            {/* Show assignedTo list with statuses if user is the leader */}
            {isLeader && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Assignees:</h3>
                <ul className="space-y-1">
                  {selectedTask.assignedTo.map((assignee) => (
                    <li key={assignee.email} className="text-sm text-gray-700">
                      {assignee.email} -{" "}
                      <span className="italic">{assignee.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Discussion Section - visible to everyone assigned + leader */}
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Discussion / Ideas:</h3>
              {selectedTask.discussion && selectedTask.discussion.length > 0 ? (
                <ul className="space-y-1">
                  {selectedTask.discussion.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-gray-700 border-b border-gray-200 pb-1 mb-1"
                    >
                      <strong>{item.name}</strong> ({item.email})
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                      <div className="ml-4 text-gray-800">{item.message}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No ideas yet.</p>
              )}
            </div>

            {/* If user is assigned or is the leader, they can post an idea */}
            {(selectedTask.assignedTo.some(
              (a) =>
                a.email === jwt.decode(localStorage.getItem("token"))?.email
            ) ||
              selectedTask.createdBy ===
                jwt.decode(localStorage.getItem("token"))?.email) && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Propose an Idea or Message
                </label>
                <textarea
                  value={newIdea}
                  onChange={(e) => setNewIdea(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
                  rows={2}
                />
                <button
                  onClick={handleAddIdea}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
                >
                  Post Idea
                </button>
              </div>
            )}

            {selectedTask.createdBy ===
              jwt.decode(localStorage.getItem("token"))?.email && (
              <button
                onClick={handleDeleteTask}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded mb-4"
              >
                Delete Task
              </button>
            )}

            {/* If user is assigned, let them update status */}
            {selectedTask.assignedTo.some(
              (a) =>
                a.email === jwt.decode(localStorage.getItem("token"))?.email
            ) && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Update Your Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option>Not Started</option>
                  <option>In Progress</option>
                  <option>Done</option>
                </select>
              </div>
            )}

            {/* Update Status button if assigned */}
            {selectedTask.assignedTo.some(
              (a) =>
                a.email === jwt.decode(localStorage.getItem("token"))?.email
            ) && (
              <button
                onClick={handleUpdateStatus}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
              >
                Update Status
              </button>
            )}
          </div>
        </div>
      )}

      {showOverviewModal && overviewData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setShowOverviewModal(false)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl relative overflow-y-auto"
            style={{ maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowOverviewModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <FiX />
            </button>

            <h2 className="text-2xl font-bold mb-4">Team Overview</h2>

            {/* KPI row */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-100 rounded-lg text-center">
                <p className="text-sm text-gray-600">
                  Number of Members (Excl. Leader)
                </p>
                <h3 className="text-xl font-bold text-gray-800">
                  {overviewData.totalMembers}
                </h3>
              </div>
              <div className="p-4 bg-gray-100 rounded-lg text-center">
                <p className="text-sm text-gray-600">Total Tasks</p>
                <h3 className="text-xl font-bold text-gray-800">
                  {overviewData.totalTasks}
                </h3>
              </div>
            </div>

            {/* Priority Distribution (Pie Chart) */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2">
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
                        backgroundColor: ["#EF4444", "#F59E0B", "#10B981"], // red, amber, green
                      },
                    ],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    responsive: true,
                    plugins: {
                      legend: { position: "bottom" },
                    },
                  }}
                />
              </div>
            </div>

            {/* Task Status (Bar Chart) */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2">Task Status</h4>
              <div className="w-full" style={{ height: "300px" }}>
                <Bar
                  data={{
                    labels: ["Not Started", "In Progress", "Done"],
                    datasets: [
                      {
                        label: "Assignments",
                        data: [
                          overviewData.statusStats.notStarted,
                          overviewData.statusStats.inProgress,
                          overviewData.statusStats.done,
                        ],
                        backgroundColor: ["#9CA3AF", "#3B82F6", "#10B981"],
                      },
                    ],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    responsive: true,
                    scales: {
                      y: { beginAtZero: true },
                    },
                    plugins: {
                      legend: { display: false },
                    },
                  }}
                />
              </div>
            </div>

            {/* Assigned vs Unassigned (Doughnut Chart) */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2">Member Assignments</h4>
              <div className="w-full" style={{ height: "300px" }}>
                <Doughnut
                  data={{
                    labels: ["Assigned", "Unassigned"],
                    datasets: [
                      {
                        data: [
                          overviewData.assignedCount,
                          overviewData.unassignedCount,
                        ],
                        backgroundColor: ["#3B82F6", "#E5E7EB"], // blue & gray
                      },
                    ],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    responsive: true,
                    plugins: {
                      legend: { position: "bottom" },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notice Model */}
      {showNoticeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setShowNoticeModal(false)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowNoticeModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <FiX />
            </button>
            <h2 className="text-xl font-bold mb-4">Notice for Members</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Topic
              </label>
              <input
                type="text"
                value={noticeTopic}
                onChange={(e) => setNoticeTopic(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                value={noticeMessage}
                onChange={(e) => setNoticeMessage(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows={3}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Importance
              </label>
              <select
                value={noticeImportance}
                onChange={(e) => setNoticeImportance(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option>Low</option>
                <option>High</option>
              </select>
            </div>

            <button
              onClick={saveNotice}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
            >
              Save Notice
            </button>
          </div>
        </div>
      )}

      {showCheckpointsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setShowCheckpointsModal(false)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowCheckpointsModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <FiX />
            </button>
            <h2 className="text-xl font-bold mb-4">CheckPoints</h2>

            {/* List existing checkpoints */}
            <ul className="space-y-2 mb-4">
              {checkpoints.map((cp) => (
                <li
                  key={cp._id}
                  className="flex items-center justify-between bg-gray-50 rounded p-2 cursor-pointer hover:bg-gray-100"
                >
                  <span
                    onClick={() => openCheckpointDetails(cp)}
                    className="text-sm font-medium text-gray-800 flex-1"
                  >
                    {cp.name}
                  </span>
                  {/* If leader or cap, show edit/delete icons */}
                  {(isLeader || userHasCap) && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          editCheckpointName(cp);
                        }}
                        className="text-blue-500 hover:text-blue-700 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCheckpoint(cp._id);
                        }}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {/* Button to create a new checkpoint (leader/cap) */}
            {(isLeader || userHasCap) && (
              <button
                onClick={() => createCheckpoint()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
              >
                Create New Checkpoint
              </button>
            )}
          </div>
        </div>
      )}

      {/* checkpoint show Model */}
      {showCheckpointDetailsModal && selectedCheckpoint && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setShowCheckpointDetailsModal(false)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowCheckpointDetailsModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <FiX />
            </button>
            <h2 className="text-xl font-bold mb-4">
              {selectedCheckpoint.name}
            </h2>

            {/* List of checks */}
            <ul className="space-y-2 mb-4">
              {selectedCheckpoint.checks.map((ch) => {
                // Determine if current user is done
                const currentUserEmail = jwt.decode(
                  localStorage.getItem("token")
                )?.email;
                const isUserDone = ch.doneBy?.includes(currentUserEmail);

                return (
                  <li key={ch._id} className="bg-gray-50 p-2 rounded">
                    {/* Check description */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className={`text-sm ${
                            isUserDone
                              ? "line-through text-gray-500"
                              : "text-gray-800"
                          }`}
                        >
                          {ch.description}
                        </p>
                        {/* Show who is done */}
                        {ch.doneBy && ch.doneBy.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Done by: {ch.doneBy.join(", ")}
                          </p>
                        )}
                      </div>

                      {/* Button to toggle done for the current user */}
                      <button
                        onClick={() =>
                          toggleCheckDone(selectedCheckpoint._id, ch._id)
                        }
                        className={`text-xs px-2 py-1 rounded ${
                          isUserDone
                            ? "bg-green-200 text-green-700"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {isUserDone ? "Unmark" : "Mark Done"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Add new check if leader/cap */}
            {(isLeader || userHasCap) && (
              <button
                onClick={() => addCheck(selectedCheckpoint._id)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm"
              >
                Add New Check
              </button>
            )}
          </div>
        </div>
      )}

      {/* Team info Model */}
      {showTeamInfoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setShowTeamInfoModal(false)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowTeamInfoModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <FiX />
            </button>
            <h2 className="text-xl font-bold mb-4">Update Team Info</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Team Name
              </label>
              <input
                type="text"
                value={tempTeamName}
                onChange={(e) => setTempTeamName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows={3}
              />
            </div>

            <button
              onClick={updateTeamInfo}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
