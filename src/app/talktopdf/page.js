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

export default function TalkToPDFPage() {
  const router = useRouter();
  const [userName, setUserName] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [token, setToken] = useState(null);

  const [pdfFile, setPdfFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // For controlling the 3-step email sending modal
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [emailStep, setEmailStep] = useState(0);

  const messageListRef = useRef(null);

  // Steps for the 3-step progress
  const steps = ["Preparing...", "Wrapping the chat history...", "Sending..."];

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  // Check authentication from localStorage
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

    const decoded = jwt.decode(storedToken);
    if (decoded && decoded.email) {
      setUserEmail(decoded.email);
    }
  }, [router]);

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

      // Stream the AI's response
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

        // Update the last assistant message
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
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Oops, the pdf is too long 😥. Currently I am under development to tackle lasrge pdf, but now you can tyr uploading small pdfs, or you can provide me some part of the copied content of the pdf.",
        },
      ]);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Send email with 3-step progress
  const handleSendEmail = async () => {
    if (!messages.length) return;

    // Show modal & step 1
    setIsEmailSending(true);
    setEmailStep(1);

    // Step 1: "Preparing..."
    await new Promise((r) => setTimeout(r, 2000));
    setEmailStep(2);

    // Step 2: "Wrapping..."
    await new Promise((r) => setTimeout(r, 2000));
    setEmailStep(3);

    // Step 3: "Sending..." + actual request
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
      // Close modal
      setIsEmailSending(false);
      setEmailStep(0);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <ToastContainer position="top-center" autoClose={3000} />

      {/* Header */}
      <header className="bg-indigo-700 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center space-x-2">
          <FiFileText className="w-6 h-6" />
          <h1 className="text-lg font-semibold">Talk to PDF</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-w-3xl w-full mx-auto p-4">
        {/* PDF Upload Section */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Upload Your PDF</h2>
          <p className="text-gray-600 text-sm mb-4">
            Select a PDF file to extract text and chat about its contents.
          </p>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdfFile(e.target.files[0])}
              className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full
                file:border-0 file:text-sm file:bg-indigo-100 file:text-indigo-700
                hover:file:bg-indigo-200 text-sm text-gray-700"
            />
            <button
              onClick={handleFileUpload}
              disabled={!pdfFile || isUploading}
              className="px-4 py-2 flex items-center space-x-2 rounded-md text-white
                bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400
                disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <FiLoader className="animate-spin" />
              ) : (
                <FiUploadCloud />
              )}
              <span>Upload PDF</span>
            </button>
          </div>
        </div>

        {/* Chat Section */}
        <div className="flex-1 flex flex-col border border-gray-200 rounded-lg p-4 mb-4 bg-white shadow-sm">
          <div
            className="flex-1 overflow-y-auto mb-4"
            style={{ maxHeight: "400px" }}
            ref={messageListRef}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`my-2 flex ${
                  msg.role === "assistant" ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`px-4 py-3 rounded-lg max-w-[75%] md:max-w-[60%] text-sm leading-relaxed
                    ${
                      msg.role === "assistant"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-indigo-600 text-white"
                    }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="mt-auto flex items-center space-x-3">
            <input
              type="text"
              placeholder="Ask something about the PDF..."
              className="flex-1 border border-gray-300 rounded-lg p-2 focus:ring-2
                focus:ring-indigo-500 focus:outline-none text-sm"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage();
                }
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoadingAI}
              className="px-4 py-2 flex items-center space-x-2 text-white
                bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400
                disabled:cursor-not-allowed rounded-md transition-colors"
            >
              {isLoadingAI ? <FiLoader className="animate-spin" /> : <FiSend />}
              <span>Send</span>
            </button>
          </div>
        </div>

        {/* Email Chat History */}
        <div className="mt-2 flex items-center justify-end">
          <button
            onClick={handleSendEmail}
            disabled={!messages.length || isEmailSending}
            className="px-4 py-2 flex items-center space-x-2 text-white
              bg-green-600 hover:bg-green-700 disabled:bg-gray-400
              disabled:cursor-not-allowed rounded-md transition-colors"
          >
            {isEmailSending ? (
              <FiLoader className="animate-spin" />
            ) : (
              <FiMail />
            )}
            <span>Send Chat History to Email</span>
          </button>
        </div>
      </main>

      {/* 3-Step Email Sending Modal */}
      {isEmailSending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center space-y-4">
            <FiLoader className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-lg font-medium text-gray-700">
              {steps[emailStep - 1] || "Please wait..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
