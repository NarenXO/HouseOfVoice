import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Activity, UserCheck, Mic, Users, BookOpen, Monitor, LayoutDashboard } from 'lucide-react';

import { AuthOnboarding } from './features/auth-onboarding/AuthOnboarding';
import LearningPathPage from './features/learning-path/LearningPathPage';
import MatchingHome from './features/matching-booking-plan/MatchingHome';
import ScreeningHome from './features/screening/ScreeningPage';

function Header() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Onboarding', icon: UserCheck },
    { path: '/screening', label: 'Speech Screening', icon: Mic },
    { path: '/matching', label: 'Therapist Matching', icon: Users },
    { path: '/learning', label: 'Learning Path', icon: BookOpen },
  ];

  return (
    <header className="bg-white border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-[#1E3A5F] hover:text-[#2E5A88] transition-colors">
              <Activity className="w-6 h-6" strokeWidth={1.75} />
              <span>HouseOfVoice</span>
            </Link>
          </div>
          <nav className="flex space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors relative ${
                    isActive 
                      ? 'text-[#0D9488]' 
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.75} />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0D9488]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#F4F6F8] font-sans">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<AuthOnboarding />} />
            <Route path="/auth/*" element={<AuthOnboarding />} />
            <Route path="/screening/*" element={<ScreeningHome />} />
            <Route path="/matching/*" element={<MatchingHome />} />
            <Route path="/learning/*" element={<LearningPathPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
