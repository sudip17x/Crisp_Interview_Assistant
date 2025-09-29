import React, { useState } from "react";
import { Upload, User, Mail, Phone, Clock, Trophy } from "lucide-react";
import AIService from "../services/AIService";
import StateManager from "../services/StateManager";

const IntervieweeTab = () => {
  const [resumeData, setResumeData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const data = await AIService.extractResumeData(file);
      setResumeData(data);
      setQuestions(AIService.generateQuestions());
    }
  };

  const handleAnswer = (id, value) => {
    setAnswers({ ...answers, [id]: value });
  };

  const handleSubmit = () => {
    const evaluated = questions.map((q) => ({
      ...q,
      answer: answers[q.id] || "",
      score: AIService.evaluateAnswer(answers[q.id], q.difficulty),
    }));

    const summary = AIService.generateSummary(evaluated);
    setResults({ evaluated, summary });
    StateManager.saveInterview({ candidate: resumeData, results: summary });
  };

  return (
    <div className="p-4 space-y-4">
      {!resumeData && (
        <label className="flex items-center gap-2 p-3 border rounded cursor-pointer bg-gray-50 hover:bg-gray-100">
          <Upload size={20} /> Upload Resume
          <input type="file" hidden onChange={handleResumeUpload} />
        </label>
      )}

      {resumeData && (
        <div className="p-4 border rounded bg-white shadow">
          <h2 className="text-lg font-bold mb-2">Candidate Details</h2>
          <p><User size={16} className="inline" /> {resumeData.name}</p>
          <p><Mail size={16} className="inline" /> {resumeData.email}</p>
          <p><Phone size={16} className="inline" /> {resumeData.phone}</p>
        </div>
      )}

      {questions.length > 0 && !results && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-red-500">
            <Clock size={16} /> Time left: {timeLeft}s
          </div>
          {questions.map((q) => (
            <div key={q.id} className="p-3 border rounded">
              <p className="font-semibold">{q.question}</p>
              <textarea
                className="w-full p-2 border mt-2 rounded"
                rows="2"
                onChange={(e) => handleAnswer(q.id, e.target.value)}
              />
            </div>
          ))}
          <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded">
            Submit Answers
          </button>
        </div>
      )}

      {results && (
        <div className="p-4 border rounded bg-green-50">
          <h2 className="text-lg font-bold mb-2">Results</h2>
          {results.evaluated.map((r) => (
            <p key={r.id}>
              <Trophy size={16} className="inline text-yellow-600" /> {r.question} → Score: {r.score}/10
            </p>
          ))}
          <p className="mt-2 font-semibold">Feedback: {results.summary.feedback}</p>
        </div>
      )}
    </div>
  );
};

export default IntervieweeTab;
