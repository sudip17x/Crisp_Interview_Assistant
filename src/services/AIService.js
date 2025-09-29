// src/services/AIService.js
const AIService = {
  extractResumeData: async (file) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          name: "Candidate Name",
          email: "candidate@example.com",
          phone: "+1234567890",
        });
      }, 1000);
    });
  },

  generateQuestions: () => [
    { id: 1, question: "Explain event delegation in JavaScript.", difficulty: "Easy" },
    { id: 2, question: "What are React hooks and why are they used?", difficulty: "Medium" },
    { id: 3, question: "Explain closures and provide an example.", difficulty: "Medium" },
    { id: 4, question: "What is the difference between SQL and NoSQL databases?", difficulty: "Medium" },
    { id: 5, question: "Design a URL shortener system.", difficulty: "Hard" },
  ],

  evaluateAnswer: (answer, difficulty) => {
    if (!answer) return 0;
    let score = answer.length > 20 ? 5 : 3;
    if (difficulty === "Hard") score += 2;
    if (score > 10) score = 10;
    return score;
  },

  generateSummary: (results) => {
    const total = results.reduce((acc, r) => acc + r.score, 0);
    const avg = total / results.length;
    return {
      totalScore: total,
      averageScore: avg.toFixed(2),
      feedback: avg > 7 ? "Excellent performance!" : avg > 4 ? "Good effort, keep practicing." : "Needs improvement.",
    };
  },
};

export default AIService;
