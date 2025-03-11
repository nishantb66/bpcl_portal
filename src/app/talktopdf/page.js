"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiLoader,
  FiSend,
  FiMail,
  FiUploadCloud,
  FiFileText,
} from "react-icons/fi";
import jwt from "jsonwebtoken";

/**
 * A simple function to interpret some basic Markdown-like formatting
 * (bold, italics, bullet points, line breaks) and return HTML.
 */
function formatAIContent(text) {
  let replaced = text
    // Replace double newlines with two <br/>
    .replace(/\n\n/g, "<br/><br/>")
    // Replace single newline with one <br/>
    .replace(/\n/g, "<br/>")
    // Bold: **text**
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic: *text*
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Bullet points: lines starting with "- "
    .replace(/^-\s(.*)/gm, "<li>$1</li>");

  // If there's at least one <li>, wrap them in <ul> to form a proper list
  if (replaced.includes("<li>")) {
    replaced = `<ul class="list-disc list-inside space-y-1">${replaced}</ul>`;
  }

  return replaced;
}

export default function TalkToPDFPage() {
  const router = useRouter();

  // Auth states
  const [userName, setUserName] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [token, setToken] = useState(null);

  // PDF upload states
  const [pdfFile, setPdfFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Chat states
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Email sending states
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [emailStep, setEmailStep] = useState(0);

  // Steps for the 3-step progress
  const steps = ["Preparing...", "Wrapping the chat history...", "Sending..."];

  // Ref for auto-scrolling the chat
  const messageListRef = useRef(null);

  // Auto-scroll on messages change
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  // Check auth on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedName = localStorage.getItem("name");
    if (!storedToken || !storedName) {
      toast.error("You need to be logged in to use Talk to PDF.");
      router.push("/login");
      return;
    }
    setToken(storedToken);
    setUserName(storedName);

    // Decode token to get email
    const decoded = jwt.decode(storedToken);
    if (decoded && decoded.email) {
      setUserEmail(decoded.email);
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

  /*************************
   *        HANDLERS
   *************************/

  // Upload PDF
  const handleFileUpload = async () => {
    if (!pdfFile) {
      toast.info("Please select a PDF file first.");
      return;
    }
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("pdfFile", pdfFile);

      const res = await fetch("/api/talktopdf", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload PDF");
      }

      const data = await res.json();
      toast.success(data.message || "PDF uploaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Error uploading PDF.");
    } finally {
      setIsUploading(false);
    }
  };

  // Send chat message
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const newMessages = [...messages, { role: "user", content: userInput }];
    setMessages(newMessages);
    setUserInput("");
    setIsLoadingAI(true);

    try {
      const res = await fetch("/api/talktopdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "chat",
          messages: newMessages,
          userName,
          userEmail,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to contact PDF AI service");
      }

      // Stream AI response
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assistantMessage = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value || new Uint8Array(), {
          stream: !doneReading,
        });
        assistantMessage += chunkValue;

        // Update the last assistant message in local state
        setMessages((prev) => {
          if (prev.length > 0 && prev[prev.length - 1].role === "assistant") {
            const updated = [...prev];
            updated[updated.length - 1].content = assistantMessage;
            return updated;
          } else {
            return [...prev, { role: "assistant", content: chunkValue }];
          }
        });
      }
    } catch (error) {
      console.error(error);
      // Non-UI logic remains intact (the fallback message)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Oops, the pdf is too long 😥. Currently I am under development to tackle large pdf, but now you can try uploading smaller pdfs, or you can provide me some part of the copied content of the pdf.",
        },
      ]);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Send email with 3-step progress
  const handleSendEmail = async () => {
    if (!messages.length) return;

    setIsEmailSending(true);
    setEmailStep(1);

    // Step 1
    await new Promise((r) => setTimeout(r, 2000));
    setEmailStep(2);

    // Step 2
    await new Promise((r) => setTimeout(r, 2000));
    setEmailStep(3);

    // Step 3: actual send
    try {
      const res = await fetch("/api/talktopdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "send-email",
          messages,
          userEmail,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to send email.");
      }
      toast.success("Chat history sent to your email!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to send email.");
    } finally {
      setIsEmailSending(false);
      setEmailStep(0);
    }
  };

  /*************************
   *        RENDER
   *************************/

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <ToastContainer position="top-center" autoClose={3000} />

      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-700 to-indigo-800 text-white py-5 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center px-4 sm:px-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <FiFileText className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">
              Talk to PDF (Beta)
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-4 sm:p-6 gap-6">
        {/* PDF Upload Card */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Upload Your PDF
          </h2>
          <p className="text-slate-600 text-sm mb-5">
            Select a PDF file to extract text and chat about its contents.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdfFile(e.target.files[0])}
              className="flex-1 cursor-pointer file:mr-4 file:py-2.5 file:px-4 
              file:rounded-lg file:border-0 file:text-sm file:font-medium
              file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100
              text-sm text-slate-600 focus:outline-none"
            />

            <button
              onClick={handleFileUpload}
              disabled={!pdfFile || isUploading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 
              rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 
              disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors
              font-medium text-sm min-w-[120px]"
            >
              {isUploading ? (
                <FiLoader className="animate-spin" />
              ) : (
                <FiUploadCloud className="w-4 h-4" />
              )}
              <span>Upload PDF</span>
            </button>

            <div className="flex justify-end">
              <button
                onClick={handleSendEmail}
                disabled={!messages.length || isEmailSending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white
            bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300
            disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                {isEmailSending ? (
                  <FiLoader className="animate-spin w-4 h-4" />
                ) : (
                  <FiMail className="w-4 h-4" />
                )}
                <span>Send Chat History to Email</span>
              </button>
            </div>
          </div>
        </section>

        {/* Chat Interface */}
        <section className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
          {/* Messages Area */}
          <div
            className="flex-1 p-6 overflow-y-auto space-y-4"
            style={{ maxHeight: "500px" }}
            ref={messageListRef}
          >
            {messages.map((msg, idx) => {
              const isAssistant = msg.role === "assistant";
              return (
                <div
                  key={idx}
                  className={`flex ${
                    isAssistant ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`rounded-2xl px-5 py-3 max-w-[85%] sm:max-w-[75%] text-sm
                    ${
                      isAssistant
                        ? "bg-slate-100 text-slate-800"
                        : "bg-indigo-600 text-white"
                    }`}
                  >
                    {isAssistant ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: formatAIContent(msg.content),
                        }}
                        className="prose prose-sm max-w-none"
                      />
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Ask something about the PDF..."
                className="flex-1 rounded-lg px-4 py-2.5 border border-slate-300
                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                focus:outline-none text-sm"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoadingAI}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white
                bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300
                disabled:cursor-not-allowed transition-colors font-medium text-sm
                min-w-[100px]"
              >
                {isLoadingAI ? (
                  <FiLoader className="animate-spin w-4 h-4" />
                ) : (
                  <FiSend className="w-4 h-4" />
                )}
                <span>Send</span>
              </button>
            </div>
          </div>
        </section>
        {/* Email Actions */}
      </main>

      {/* Email Sending Modal */}
      {isEmailSending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full mx-4 flex flex-col items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-full">
              <FiLoader className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
            <p className="text-lg font-medium text-slate-700">
              {steps[emailStep - 1] || "Please wait..."}
            </p>
          </div>
        </div>
      )}

      <div class="fixed bottom-0 left-0 right-0 bg-indigo-100 backdrop-blur-sm text-black text-xs sm:text-sm py-2 px-4">
        <div class="max-w-6xl mx-auto text-center">
          <p class="flex items-center justify-center space-x-2">
            <svg
              class="w-4 h-4 text-yellow-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>AI can make mistakes, always check facts</span>
          </p>
        </div>
      </div>
    </div>
  );
}
