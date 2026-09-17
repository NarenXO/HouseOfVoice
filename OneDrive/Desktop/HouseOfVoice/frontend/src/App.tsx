import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import { AuthOnboarding } from './features/auth-onboarding/AuthOnboarding';
import DashboardDocs from './features/dashboard-docs/DashboardDocs';
import LearningPathPage from './features/learning-path/LearningPathPage';
import MatchingHome from './features/matching-booking-plan/MatchingHome';
import ScreeningHome from './features/screening/ScreeningPage';
import SessionHome from './features/session-smartboard/SessionHome';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans">
        {/* Top Navigation Header */}
        <header className="bg-[#1E3A5F] text-white p-4 shadow-md flex justify-between items-center">
          <h1 className="text-xl font-bold">HouseOfVoice</h1>
          <nav className="flex space-x-6 text-sm">
            <Link to="/" className="hover:text-[#0D9488]">👤 Onboarding</Link>
            <Link to="/screening" className="hover:text-[#0D9488]">🎙️ Speech Screening</Link>
            <Link to="/matching" className="hover:text-[#0D9488]">👨‍⚕️ Therapist Matching</Link>
            <Link to="/learning" className="hover:text-[#0D9488]">🗺️ Learning Path</Link>
            <Link to="/session" className="hover:text-[#0D9488]">💻 Live Session</Link>
            <Link to="/docs" className="hover:text-[#0D9488]">📊 Progress Dashboard</Link>
          </nav>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<AuthOnboarding />} />
            <Route path="/auth/*" element={<AuthOnboarding />} />
            <Route path="/docs/*" element={<DashboardDocs />} />
            <Route path="/learning/*" element={<LearningPathPage />} />
            <Route path="/matching/*" element={<MatchingHome />} />
            <Route path="/screening/*" element={<ScreeningHome />} />
            <Route path="/session/*" element={<SessionHome />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
