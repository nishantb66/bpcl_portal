"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const SurveyChart = ({ surveys, questions }) => {
  return (
    <div className="space-y-8">
      {questions.map((question) => {
        // For each option in this question, count how many times it was chosen
        const answerCounts = question.options.map((option) => {
          return surveys.reduce((acc, survey) => {
            // Use optional chaining to avoid errors if survey.answers is missing
            return survey.answers?.[question.id] === option ? acc + 1 : acc;
          }, 0);
        });

        // Build Chart.js data object for this question
        const data = {
          labels: question.options,
          datasets: [
            {
              label: question.question, // or simply "Responses"
              data: answerCounts,
              backgroundColor: "rgba(53, 162, 235, 0.5)",
            },
          ],
        };

        // Chart.js options
        const options = {
          responsive: true,
          plugins: {
            legend: {
              position: "top",
            },
            title: {
              display: true,
              text: question.question,
            },
          },
        };

        return (
          <div key={question.id} className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">{question.question}</h2>
            <Bar data={data} options={options} />
          </div>
        );
      })}
    </div>
  );
};
