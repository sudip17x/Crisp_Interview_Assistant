// src/services/StateManager.js
let interviews = [];
let passkeys = [];
let interviewers = [{ email: "admin@example.com", password: "admin123" }];

const StateManager = {
  saveInterview: (interview) => interviews.push(interview),
  getInterviews: () => interviews,

  savePasskey: (passkey) => passkeys.push(passkey),
  getPasskeys: () => passkeys,

  validateInterviewer: (email, password) =>
    interviewers.some((user) => user.email === email && user.password === password),
};

export default StateManager;
