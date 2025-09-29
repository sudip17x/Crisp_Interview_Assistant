import React, { useState } from "react";
import StateManager from "../services/StateManager";

const InterviewerTab = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (StateManager.validateInterviewer(email, password)) {
      setLoggedIn(true);
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="p-4">
      {!loggedIn ? (
        <div className="space-y-2">
          <input
            type="email"
            placeholder="Email"
            className="border p-2 w-full rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="border p-2 w-full rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin} className="px-4 py-2 bg-blue-600 text-white rounded w-full">
            Login
          </button>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-bold mb-2">Interviewer Dashboard</h2>
          <p>Total Interviews: {StateManager.getInterviews().length}</p>
          <ul className="mt-2 list-disc pl-5">
            {StateManager.getInterviews().map((i, idx) => (
              <li key={idx}>
                {i.candidate.name} → {i.results.averageScore} / 10 ({i.results.feedback})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default InterviewerTab;
