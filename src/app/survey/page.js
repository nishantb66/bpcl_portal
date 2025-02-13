// src/app/survey/page.js
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
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state
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
      toast.error("You must be logged in to submit the survey.");
      return;
    }

    setIsSubmitting(true); // Start loading

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
        // Simulate a delay for a smoother UX
        setTimeout(() => {
          setIsSubmitting(false);
          toast.success("Survey submitted successfully!");
          router.push("/");
        }, 1500); // 1.5 seconds delay
      } else {
        setIsSubmitting(false);
        toast.error("Failed to submit survey.");
      }
    } catch (error) {
      setIsSubmitting(false);
      toast.error("An error occurred while submitting the survey.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <ToastContainer />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            {isSubmitting ? (
              // Loading state UI
              <div className="flex flex-col items-center justify-center">
                <FiLoader className="w-12 h-12 animate-spin text-blue-900 mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  Submitting your survey...
                </h3>
                <p className="text-gray-600 text-center">
                  Please wait while we process your responses.
                </p>
              </div>
            ) : (
              // Survey questions UI
              <div className="flex flex-col items-center justify-center">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                  {questions[currentQuestion].question}
                </h3>
                <div className="w-full max-w-md">
                  {questions[currentQuestion].options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        setAnswers({
                          ...answers,
                          [questions[currentQuestion].id]: option,
                        })
                      }
                      className={`w-full p-4 mb-4 text-left rounded-lg ${
                        answers[questions[currentQuestion].id] === option
                          ? "bg-blue-900 text-white"
                          : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <div className="w-full max-w-md flex justify-between mt-6">
                  <button
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                    className="p-2 flex items-center gap-1 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    <FiArrowLeft />
                    Previous
                  </button>
                  {currentQuestion < questions.length - 1 ? (
                    <button
                      onClick={handleNext}
                      className="p-2 flex items-center gap-1 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
                    >
                      Next
                      <FiArrowRight />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      className="p-2 flex items-center gap-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Submit
                    </button>
                  )}
                </div>
                <div className="w-full max-w-md mt-6">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-900 rounded-full h-2"
                      style={{
                        width: `${
                          ((currentQuestion + 1) / questions.length) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
