"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiArrowRight,
  FiLoader,
  FiCheckCircle,
} from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * Non-UI data & logic (kept intact)
 */
const questions = [
  {
    id: 1,
    question: "How satisfied are you with your current working conditions?",
    options: ["Very Satisfied", "Satisfied", "Neutral", "I don't know"],
  },
  {
    id: 2,
    question: "Do you feel that your work is recognized and appreciated?",
    options: ["Always", "Sometimes", "Rarely", "Prefer not to say"],
  },
  {
    id: 3,
    question: "How would you rate the work-life balance in your current role?",
    options: ["Excellent", "Good", "Fair", "I don't know"],
  },
  {
    id: 4,
    question:
      "Do you have access to the necessary tools and resources to perform your job effectively?",
    options: ["Always", "Most of the time", "Rarely", "Not applicable"],
  },
  {
    id: 5,
    question:
      "How comfortable are you with the level of communication within your team?",
    options: ["Very Comfortable", "Comfortable", "Neutral", "I don't know"],
  },
  {
    id: 6,
    question:
      "Do you feel that your opinions and suggestions are valued by your superiors?",
    options: ["Always", "Sometimes", "Rarely", "Prefer not to say"],
  },
  {
    id: 7,
    question:
      "How would you rate the cleanliness and maintenance of your workplace?",
    options: ["Excellent", "Good", "Fair", "I don't know"],
  },
  {
    id: 8,
    question:
      "Do you feel that your job provides opportunities for growth and development?",
    options: ["Yes, definitely", "Somewhat", "Not really", "Not applicable"],
  },
  {
    id: 9,
    question:
      "How satisfied are you with the health and safety measures at your workplace?",
    options: ["Very Satisfied", "Satisfied", "Neutral", "I don't know"],
  },
  {
    id: 10,
    question: "Do you feel that your workload is manageable?",
    options: ["Always", "Most of the time", "Rarely", "Prefer not to say"],
  },
  {
    id: 11,
    question:
      "How would you rate the quality of leadership in your organization?",
    options: ["Excellent", "Good", "Fair", "I don't know"],
  },
  {
    id: 12,
    question: "Do you feel that your compensation is fair for the work you do?",
    options: ["Yes, definitely", "Somewhat", "Not really", "Prefer not to say"],
  },
  {
    id: 13,
    question:
      "How satisfied are you with the training and development programs offered?",
    options: ["Very Satisfied", "Satisfied", "Neutral", "Not applicable"],
  },
  {
    id: 14,
    question:
      "Do you feel that your workplace promotes diversity and inclusion?",
    options: ["Yes, definitely", "Somewhat", "Not really", "I don't know"],
  },
  {
    id: 15,
    question:
      "How would you rate the level of teamwork and collaboration in your organization?",
    options: ["Excellent", "Good", "Fair", "I don't know"],
  },
  {
    id: 16,
    question:
      "Do you feel that your workplace is free from harassment and discrimination?",
    options: ["Yes, definitely", "Somewhat", "Not really", "Prefer not to say"],
  },
  {
    id: 17,
    question:
      "How satisfied are you with the benefits provided by your employer?",
    options: ["Very Satisfied", "Satisfied", "Neutral", "Not applicable"],
  },
  {
    id: 18,
    question:
      "Do you feel that your workplace fosters innovation and creativity?",
    options: ["Yes, definitely", "Somewhat", "Not really", "I don't know"],
  },
  {
    id: 19,
    question:
      "How would you rate the overall morale and motivation of your team?",
    options: ["Excellent", "Good", "Fair", "I don't know"],
  },
  {
    id: 20,
    question: "Do you feel that your workplace is environmentally conscious?",
    options: ["Yes, definitely", "Somewhat", "Not really", "Not applicable"],
  },
];

export default function Survey() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPopup, setShowPopup] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("name");
    if (token && name) {
      setUser({ token, name });
    }
  }, []);

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in to submit the survey.", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: user.name,
          answers,
        }),
      });

      if (response.ok) {
        setTimeout(() => {
          setIsSubmitting(false);
          toast.success(
            <div className="flex items-center gap-2">
              <FiCheckCircle className="w-6 h-6" />
              <span>
                Survey submitted successfully! Redirecting in 3 seconds...
              </span>
            </div>,
            {
              position: "top-center",
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "colored",
              className: "bg-green-500 text-white",
            }
          );

          // Redirect after 3 seconds
          setTimeout(() => {
            router.push("/");
          }, 3000);
        }, 1500); // Simulate a delay for a smoother UX
      } else {
        setIsSubmitting(false);
        toast.error("Failed to submit survey.", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      }
    } catch (error) {
      setIsSubmitting(false);
      toast.error("An error occurred while submitting the survey.", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    }
  };

  /**
   * UI layout & styling
   */
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-indigo-700">Portal</h1>
          <nav className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/")}
              className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => router.push("/profile")}
              className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Profile
            </button>
          </nav>
        </div>
      </header>

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      {/* Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Survey Information
            </h2>
            <p className="text-gray-700 mb-6">
              Please fill out the survey form freely and accurately. Your
              responses are completely anonymous, ensuring your identity remains
              protected.
            </p>
            <button
              onClick={() => setShowPopup(false)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
            {isSubmitting ? (
              <div className="flex flex-col items-center justify-center">
                <FiLoader className="w-12 h-12 animate-spin text-indigo-700 mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  Submitting your survey...
                </h3>
                <p className="text-gray-600 text-center">
                  Please wait while we process your responses.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                  {questions[currentQuestion].question}
                </h3>
                <div className="w-full max-w-xl">
                  {questions[currentQuestion].options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        setAnswers({
                          ...answers,
                          [questions[currentQuestion].id]: option,
                        })
                      }
                      className={`block w-full p-4 mb-4 text-left rounded-lg transition-colors ${
                        answers[questions[currentQuestion].id] === option
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                {/* Navigation Buttons */}
                <div className="w-full max-w-xl flex justify-between mt-6">
                  <button
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                    className="p-2 flex items-center gap-1 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    <FiArrowLeft />
                    Previous
                  </button>
                  {currentQuestion < questions.length - 1 ? (
                    <button
                      onClick={handleNext}
                      className="p-2 flex items-center gap-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Next
                      <FiArrowRight />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      className="p-2 flex items-center gap-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Submit
                    </button>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-xl mt-6">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 rounded-full h-2 transition-all"
                      style={{
                        width: `${
                          ((currentQuestion + 1) / questions.length) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Question {currentQuestion + 1} of {questions.length}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
