import React, { useState } from "react";
import IntervieweeTab from "./components/IntervieweeTab";
import InterviewerTab from "./components/InterviewerTab";

const App = () => {
  const [tab, setTab] = useState("interviewee");

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="p-4 bg-blue-600 text-white flex justify-between">
        <h1 className="text-xl font-bold">Crisp Interview Assistant</h1>
        <div className="space-x-2">
          <button onClick={() => setTab("interviewee")} className="px-3 py-1 bg-white text-blue-600 rounded">
            Interviewee
          </button>
          <button onClick={() => setTab("interviewer")} className="px-3 py-1 bg-white text-blue-600 rounded">
            Interviewer
          </button>
        </div>
      </header>
      <main className="p-4">
        {tab === "interviewee" ? <IntervieweeTab /> : <InterviewerTab />}
      </main>
    </div>
  );
};

export default App;
