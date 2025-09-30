import React, { useState, useEffect, useRef } from 'react';
import { Upload, User, Mail, Clock, Trophy, Search, ChevronRight, X, Key, Copy, Check, Plus, LogOut } from 'lucide-react';
import './App.css';

// --- SERVICES ---

const AIService = {
  extractResumeData: async (file) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const random = Math.random();
    return {
      name: random > 0.3 ? 'John Doe' : '',
      phone: random > 0.4 ? '+1234567890' : ''
    };
  },
  generateQuestion: (difficulty, questionNumber) => {
    const questions = {
      easy: ['What is the difference between let, const, and var?', 'Explain what React hooks are.'],
      medium: ['How would you optimize a React application?', 'Explain the event loop in Node.js.'],
      hard: ['Design a rate limiting system for an API.', 'How would you implement server-side rendering (SSR)?']
    };
    const pool = questions[difficulty];
    return pool[questionNumber % pool.length];
  },
  evaluateAnswer: async (question, answer, difficulty) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    if (!answer || answer.trim().length < 10) return { score: 0, feedback: 'Answer too short.' };
    const baseScore = difficulty === 'easy' ? 15 : difficulty === 'medium' ? 25 : 35;
    const score = Math.round(Math.max(0, Math.min(100, baseScore + Math.random() * 10 - 5)));
    return { score, feedback: 'Good understanding of core concepts.' };
  },
  generateSummary: (candidateData) => {
    const { totalScore } = candidateData;
    let performance = 'Poor';
    if (totalScore >= 80) performance = 'Excellent';
    else if (totalScore >= 60) performance = 'Good';
    else if (totalScore >= 40) performance = 'Average';
    return `${performance} performance with ${totalScore}/100 points.`;
  }
};

const StateManager = {
  _state: { 
    interviews: {},
    auth: {},
    passkeys: {}
  },
  
  saveInterview: (interviewData) => {
    StateManager._state.interviews[interviewData.id] = interviewData;
  },
  
  getAllInterviews: () => StateManager._state.interviews,
  
  getInterviewsByPasskey: (passkey) => {
    return Object.values(StateManager._state.interviews).filter(
      interview => interview.passkey === passkey
    );
  },
  
  generatePasskey: () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let passkey = '';
    for (let i = 0; i < 8; i++) {
      passkey += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return passkey;
  },
  
  savePasskey: (passkey, description) => {
    StateManager._state.passkeys[passkey] = {
      key: passkey,
      description,
      createdAt: Date.now(),
      usedCount: 0
    };
  },
  
  getAllPasskeys: () => StateManager._state.passkeys,
  
  incrementPasskeyUsage: (passkey) => {
    if (StateManager._state.passkeys[passkey]) {
      StateManager._state.passkeys[passkey].usedCount++;
    }
  },
  
  getAuthState: () => StateManager._state.auth,
  
  setAuthState: (authData) => {
    StateManager._state.auth = authData;
  }
};

const SecurityManager = {
  hashPassword: async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },
  
  setInterviewerCredentials: async (email, password) => {
    const passwordHash = await SecurityManager.hashPassword(password);
    const authState = StateManager.getAuthState();
    authState.passwordUser = { email: email.toLowerCase(), passwordHash };
    StateManager.setAuthState(authState);
  },
  
  verifyInterviewer: async (email, password) => {
    const authState = StateManager.getAuthState();
    const user = authState.passwordUser;
    if (!user || user.email !== email.toLowerCase()) return false;
    const passwordHash = await SecurityManager.hashPassword(password);
    return user.passwordHash === passwordHash;
  },
  
  hasPasswordAccount: () => {
    const authState = StateManager.getAuthState();
    return authState && authState.passwordUser;
  }
};

// --- MAIN APP ---

export default function InterviewAssistant() {
  const [activeTab, setActiveTab] = useState('interviewee');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleInterviewerTabClick = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      setActiveTab('interviewer');
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowAuthModal(false);
    setActiveTab('interviewer');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveTab('interviewee');
  };

  const handleInterviewComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="app-container">
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} />}
      
      <div className="main-container">
        <header className="header">
          <div>
            <h1 className="title">Crisp Interview Assistant</h1>
            <p className="subtitle">AI-powered technical interview platform</p>
          </div>
          {isAuthenticated && activeTab === 'interviewer' && (
            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={18} />
              Logout
            </button>
          )}
        </header>

        <div className="content-card">
          <div className="tab-container">
            <button 
              onClick={() => setActiveTab('interviewee')} 
              className={`tab-btn ${activeTab === 'interviewee' ? 'tab-active' : 'tab-inactive'}`}
            >
              Take Interview
            </button>
            <button 
              onClick={handleInterviewerTabClick} 
              className={`tab-btn ${activeTab === 'interviewer' ? 'tab-active' : 'tab-inactive'}`}
            >
              Interviewer Dashboard
              {!isAuthenticated && (
                <span className="secure-badge">🔒 Secured</span>
              )}
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'interviewee' ? (
              <IntervieweeTab onComplete={handleInterviewComplete} />
            ) : (
              isAuthenticated && <InterviewerTab key={refreshKey} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- INTERVIEWEE TAB ---

function IntervieweeTab({ onComplete }) {
  const [step, setStep] = useState('start');
  const [email, setEmail] = useState('');
  const [passkey, setPasskey] = useState('');
  const [candidate, setCandidate] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [timer, setTimer] = useState(null);
  const messagesEndRef = useRef(null);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const addMessage = (sender, text) => setMessages(prev => [...prev, { sender, text }]);

  const startTimer = (duration) => {
    setTimer(duration);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeUp = () => {
    addMessage('system', '⏰ Time is up! Moving to the next question.');
    askNextQuestion();
  };

  const handleStartInterview = () => {
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    setStep('upload');
    addMessage('bot', `Welcome, ${email}! Please upload your resume to begin.`);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.match(/\.(pdf|docx)$/i)) {
      addMessage('bot', 'Please upload a PDF or DOCX file.');
      return;
    }
    
    setIsProcessing(true);
    addMessage('user', `Uploaded: ${file.name}`);
    addMessage('bot', 'Processing your resume...');

    const extracted = await AIService.extractResumeData(file);
    const newCandidate = {
      id: `interview-${Date.now()}`,
      email: email,
      passkey: passkey || 'NONE',
      ...extracted,
      status: 'collecting_info',
      answers: [],
      totalScore: 0,
      questionIndex: 0,
      startedAt: Date.now()
    };
    setCandidate(newCandidate);

    const missing = Object.entries(extracted).filter(([, value]) => !value).map(([key]) => key);
    if (missing.length > 0) {
      addMessage('bot', `I need your ${missing[0]} to continue.`);
      setCandidate(prev => ({ ...prev, missingFields: missing, currentFieldIndex: 0 }));
    } else {
      addMessage('bot', `Great! Let's start the interview, ${extracted.name}!`);
      startInterviewQuestions(newCandidate);
    }
    setIsProcessing(false);
    setStep('interview');
  };

  const handleInputSubmit = () => {
    if (!currentInput.trim() || isProcessing) return;
    const input = currentInput.trim();
    setCurrentInput('');
    addMessage('user', input);

    if (candidate && candidate.status === 'collecting_info') {
      handleMissingFieldInput(input);
    } else if (candidate && candidate.status === 'in_progress') {
      handleAnswerSubmit(input);
    }
  };

  const handleMissingFieldInput = (input) => {
    const { missingFields, currentFieldIndex } = candidate;
    const field = missingFields[currentFieldIndex];
    
    const updatedCandidate = { ...candidate, [field]: input };
    if (currentFieldIndex < missingFields.length - 1) {
      const nextField = missingFields[currentFieldIndex + 1];
      setCandidate({ ...updatedCandidate, currentFieldIndex: currentFieldIndex + 1 });
      addMessage('bot', `Thanks! Now, please provide your ${nextField}.`);
    } else {
      addMessage('bot', `Perfect! Let's begin, ${updatedCandidate.name}!`);
      startInterviewQuestions(updatedCandidate);
    }
  };

  const startInterviewQuestions = (cand) => {
    const updated = { ...cand, status: 'in_progress' };
    delete updated.missingFields;
    delete updated.currentFieldIndex;
    setCandidate(updated);
    askNextQuestion(updated);
  };

  const askNextQuestion = (cand) => {
    const candidateToUse = cand || candidate;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (candidateToUse.questionIndex >= 6) {
      finishInterview(candidateToUse);
      return;
    }
    const difficulties = ['easy', 'easy', 'medium', 'medium', 'hard', 'hard'];
    const timeLimits = [20, 20, 60, 60, 120, 120];
    const difficulty = difficulties[candidateToUse.questionIndex];
    const question = AIService.generateQuestion(difficulty, candidateToUse.questionIndex);
    addMessage('bot', `Question ${candidateToUse.questionIndex + 1}/6 (${difficulty.toUpperCase()}): ${question}`);
    startTimer(timeLimits[candidateToUse.questionIndex]);
  };

  const handleAnswerSubmit = async (answer) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimer(null);
    setIsProcessing(true);
    addMessage('bot', 'Evaluating your answer...');

    const { questionIndex } = candidate;
    const difficulty = ['easy', 'easy', 'medium', 'medium', 'hard', 'hard'][questionIndex];
    const lastBotMessage = messages.filter(m => m.sender === 'bot').pop();
    const questionText = lastBotMessage.text.split(': ')[1];
    
    const evaluation = await AIService.evaluateAnswer(questionText, answer, difficulty);
    
    const newAnswer = { question: questionText, answer, ...evaluation };
    const updatedAnswers = [...candidate.answers, newAnswer];
    const newTotal = updatedAnswers.reduce((sum, a) => sum + a.score, 0);
    
    const updatedCandidate = {
      ...candidate,
      answers: updatedAnswers,
      totalScore: newTotal,
      questionIndex: questionIndex + 1,
    };
    
    setCandidate(updatedCandidate);
    addMessage('bot', `Score: ${evaluation.score}/100. ${evaluation.feedback}`);
    setIsProcessing(false);
    askNextQuestion(updatedCandidate);
  };

  const finishInterview = (cand) => {
    const summary = AIService.generateSummary(cand);
    const finalCandidate = { 
      ...cand, 
      status: 'completed', 
      summary, 
      completedAt: Date.now() 
    };
    setCandidate(finalCandidate);
    StateManager.saveInterview(finalCandidate);
    
    if (finalCandidate.passkey !== 'NONE') {
      StateManager.incrementPasskeyUsage(finalCandidate.passkey);
    }
    
    addMessage('bot', '🎉 Interview completed!');
    addMessage('bot', `Final Score: ${finalCandidate.totalScore}/100. ${summary}`);
    setStep('completed');
    onComplete();
  };

  if (step === 'start') {
    return (
      <div className="start-container">
        <div className="start-card">
          <h2 className="start-title">Start Your Interview</h2>
          <div className="form-container">
            <div className="input-group">
              <label className="input-label">Email Address *</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="your.email@example.com"
                className="text-input"
              />
            </div>
            <div className="input-group">
              <label className="input-label">
                Passkey (Optional)
                <span className="input-hint">Provided by interviewer</span>
              </label>
              <input 
                type="text" 
                value={passkey} 
                onChange={(e) => setPasskey(e.target.value.toUpperCase())} 
                placeholder="Enter passkey if provided"
                className="text-input"
              />
            </div>
            <button 
              onClick={handleStartInterview}
              className="primary-btn"
            >
              Start Interview
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'upload') {
    return (
      <div className="upload-container">
        <div className="upload-section">
          <div className="upload-card">
            <Upload className="upload-icon" size={48} />
            <h3 className="upload-title">Upload Your Resume</h3>
            <p className="upload-subtitle">Accepted formats: PDF, DOCX</p>
            <label className="file-upload-btn">
              Choose File
              <input type="file" accept=".pdf,.docx" onChange={handleFileUpload} className="file-input" />
            </label>
          </div>
        </div>
        <div className="chat-container">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`}>
              <div className={`message-bubble ${msg.sender === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    );
  }

  if (step === 'interview' || step === 'completed') {
    return (
      <div className="interview-container">
        <div className="candidate-info">
          <div className="info-item">
            <User size={16} />
            <span>{candidate.name || 'Unknown'}</span>
          </div>
          <div className="info-item">
            <Mail size={16} />
            <span>{candidate.email}</span>
          </div>
          {passkey && (
            <div className="info-item">
              <Key size={16} />
              <span className="passkey-display">{passkey}</span>
            </div>
          )}
          {timer !== null && (
            <div className="timer">
              <Clock size={16} className={timer < 10 ? 'timer-warning' : ''} />
              <span className={`timer-text ${timer < 10 ? 'timer-warning' : ''}`}>
                {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        <div className="chat-container large">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`}>
              <div className={`message-bubble ${msg.sender === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {step !== 'completed' && (
          <div className="input-area">
            <input 
              type="text" 
              value={currentInput} 
              onChange={(e) => setCurrentInput(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && handleInputSubmit()} 
              placeholder="Type your answer..." 
              disabled={isProcessing}
              className="answer-input"
            />
            <button 
              onClick={handleInputSubmit} 
              disabled={isProcessing || !currentInput.trim()}
              className="send-btn"
            >
              Send
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// --- INTERVIEWER TAB ---

function InterviewerTab() {
  const [view, setView] = useState('dashboard');
  const [selectedPasskey, setSelectedPasskey] = useState(null);
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const allInterviews = Object.values(StateManager.getAllInterviews());
  const allPasskeys = Object.values(StateManager.getAllPasskeys());

  const filteredInterviews = allInterviews.filter(interview => {
    const searchLower = searchTerm.toLowerCase();
    return (
      interview.email.toLowerCase().includes(searchLower) ||
      (interview.name && interview.name.toLowerCase().includes(searchLower)) ||
      interview.passkey.toLowerCase().includes(searchLower)
    );
  }).sort((a, b) => b.completedAt - a.completedAt);

  return (
    <div className="interviewer-dashboard">
      {showPasskeyModal && (
        <PasskeyGeneratorModal onClose={() => setShowPasskeyModal(false)} />
      )}

      <div className="dashboard-header">
        <h2 className="dashboard-title">Interviewer Dashboard</h2>
        <button 
          onClick={() => setShowPasskeyModal(true)}
          className="generate-btn"
        >
          <Plus size={18} />
          Generate Passkey
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-number">{allInterviews.length}</div>
          <div className="stat-label">Total Interviews</div>
        </div>
        <div className="stat-card green">
          <div className="stat-number">{allPasskeys.length}</div>
          <div className="stat-label">Active Passkeys</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-number">
            {allInterviews.length > 0 
              ? Math.round(allInterviews.reduce((sum, i) => sum + i.totalScore, 0) / allInterviews.length)
              : 0}
          </div>
          <div className="stat-label">Avg Score</div>
        </div>
      </div>

      {allPasskeys.length > 0 && (
        <div className="passkeys-section">
          <h3 className="section-title">Your Passkeys</h3>
          <div className="passkeys-grid">
            {allPasskeys.map(pk => (
              <div key={pk.key} className="passkey-card">
                <div className="passkey-content">
                  <div>
                    <div className="passkey-value">{pk.key}</div>
                    <div className="passkey-description">{pk.description}</div>
                    <div className="passkey-meta">Used {pk.usedCount} times</div>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedPasskey(pk.key);
                      setView('passkey-detail');
                    }}
                    className="view-btn"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'dashboard' && (
        <div className="interviews-section">
          <div className="section-header">
            <h3 className="section-title">All Interviews</h3>
            <div className="search-container">
              <Search className="search-icon" size={18} />
              <input 
                type="text" 
                placeholder="Search by email, name, or passkey..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {filteredInterviews.length === 0 ? (
            <div className="empty-state">
              <Trophy size={48} className="empty-icon" />
              <p>No interviews found</p>
            </div>
          ) : (
            <div className="interviews-list">
              {filteredInterviews.map(interview => (
                <InterviewCard key={interview.id} interview={interview} />
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'passkey-detail' && selectedPasskey && (
        <PasskeyDetailView 
          passkey={selectedPasskey} 
          onBack={() => {
            setView('dashboard');
            setSelectedPasskey(null);
          }} 
        />
      )}
    </div>
  );
}

function InterviewCard({ interview }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="interview-card">
      <div className="card-header" onClick={() => setExpanded(!expanded)}>
        <div className="card-main">
          <div className="candidate-header">
            <h3 className="candidate-name">{interview.name || 'Unknown'}</h3>
            {interview.passkey !== 'NONE' && (
              <span className="passkey-badge">
                {interview.passkey}
              </span>
            )}
          </div>
          <p className="candidate-email">{interview.email}</p>
          <p className="interview-date">
            {new Date(interview.completedAt).toLocaleString()}
          </p>
        </div>
        <div className="card-score">
          <div className="score-number">{interview.totalScore}</div>
          <div className="score-label">/ 100</div>
          <ChevronRight className={`expand-icon ${expanded ? 'expanded' : ''}`} size={24} />
        </div>
      </div>

      {expanded && (
        <div className="card-details">
          <div className="summary-section">
            <h4 className="detail-title">Summary</h4>
            <p className="summary-text">{interview.summary}</p>
          </div>
          <div className="qa-section">
            <h4 className="detail-title">Q&A Details</h4>
            <div className="qa-list">
              {interview.answers && interview.answers.map((qa, idx) => (
                <div key={idx} className="qa-item">
                  <p className="question-text">Q{idx + 1}: {qa.question}</p>
                  <p className="answer-text">A: {qa.answer}</p>
                  <div className="qa-footer">
                    <span className="feedback">{qa.feedback}</span>
                    <span className="score">Score: {qa.score}/100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PasskeyDetailView({ passkey, onBack }) {
  const interviews = StateManager.getInterviewsByPasskey(passkey);
  const passkeyInfo = StateManager.getAllPasskeys()[passkey];

  return (
    <div className="passkey-detail">
      <button 
        onClick={onBack}
        className="back-btn"
      >
        ← Back to Dashboard
      </button>

      <div className="passkey-header">
        <div className="passkey-info">
          <h2 className="passkey-title">{passkey}</h2>
          <p className="passkey-desc">{passkeyInfo.description}</p>
          <p className="passkey-meta">
            Created: {new Date(passkeyInfo.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="passkey-stats">
          <div className="stat-number-large">{interviews.length}</div>
          <div className="stat-label">Interviews</div>
        </div>
      </div>

      {interviews.length === 0 ? (
        <div className="empty-state">
          <p>No interviews using this passkey yet</p>
        </div>
      ) : (
        <div className="interviews-section">
          <h3 className="section-title">Interviews using this passkey</h3>
          <div className="interviews-list">
            {interviews.map(interview => (
              <InterviewCard key={interview.id} interview={interview} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PasskeyGeneratorModal({ onClose }) {
  const [description, setDescription] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    if (!description.trim()) {
      alert('Please enter a description');
      return;
    }
    const newKey = StateManager.generatePasskey();
    StateManager.savePasskey(newKey, description);
    setGeneratedKey(newKey);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <button 
          onClick={onClose}
          className="modal-close"
        >
          <X size={24} />
        </button>

        <h2 className="modal-title">Generate Passkey</h2>

        {!generatedKey ? (
          <div className="modal-content">
            <div className="input-group">
              <label className="input-label">Description</label>
              <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Junior Developer Position - Q4 2024"
                className="text-input"
              />
            </div>
            <button 
              onClick={handleGenerate}
              className="primary-btn"
            >
              Generate Passkey
            </button>
          </div>
        ) : (
          <div className="modal-content">
            <div className="passkey-result">
              <p className="result-label">Your new passkey:</p>
              <div className="generated-passkey">
                {generatedKey}
              </div>
              <button 
                onClick={handleCopy}
                className="copy-btn"
              >
                {copied ? (
                  <>
                    <Check size={18} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    Copy to Clipboard
                  </>
                )}
              </button>
            </div>
            <p className="passkey-hint">
              Share this passkey with interviewees to track their submissions
            </p>
            <button 
              onClick={onClose}
              className="secondary-btn"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState('choice');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const hasAccount = SecurityManager.hasPasswordAccount();

  const handlePasswordSubmit = async () => {
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setIsLoading(true);

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) throw new Error('Passwords do not match');
        if (password.length < 6) throw new Error('Password must be at least 6 characters');
        await SecurityManager.setInterviewerCredentials(email, password);
      }
      
      const isValid = await SecurityManager.verifyInterviewer(email, password);
      if (isValid) {
        onSuccess();
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && mode !== 'choice') {
      handlePasswordSubmit();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <button 
          onClick={onClose}
          className="modal-close"
        >
          <X size={24} />
        </button>
        
        {mode === 'choice' ? (
          <div className="auth-choice">
            <div className="auth-header">
              <h2 className="modal-title">Interviewer Access</h2>
              <p className="auth-subtitle">Choose an option to continue</p>
            </div>

            <div className="auth-options">
              <button 
                onClick={() => setMode('login')}
                className="auth-option primary"
              >
                <User size={20} />
                Login to Existing Account
              </button>
              
              <button 
                onClick={() => setMode('register')}
                className="auth-option secondary"
              >
                <Plus size={20} />
                Create New Account
              </button>
            </div>

            {hasAccount && (
              <p className="auth-hint">
                You already have an account registered on this device
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="auth-back">
              <button 
                onClick={() => setMode('choice')}
                className="back-link"
              >
                ← Back
              </button>
            </div>

            <h2 className="modal-title">
              {mode === 'register' ? 'Create Interviewer Account' : 'Login to Dashboard'}
            </h2>
            <p className="auth-subtitle">
              {mode === 'register' 
                ? 'Create an account to manage interviews and passkeys' 
                : 'Sign in to access your dashboard'}
            </p>
            
            <div className="auth-form">
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                onKeyPress={handleKeyPress}
                placeholder="Email Address" 
                className="text-input"
              />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                onKeyPress={handleKeyPress}
                placeholder="Password" 
                className="text-input"
              />
              {mode === 'register' && (
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  onKeyPress={handleKeyPress}
                  placeholder="Confirm Password" 
                  className="text-input"
                />
              )}
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
              <button 
                onClick={handlePasswordSubmit} 
                disabled={isLoading}
                className="primary-btn"
              >
                {isLoading ? 'Processing...' : (mode === 'register' ? 'Create Account' : 'Login')}
              </button>
            </div>

            <div className="auth-switch">
              <button 
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="switch-link"
              >
                {mode === 'login' 
                  ? "Don't have an account? Sign up" 
                  : 'Already have an account? Login'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}