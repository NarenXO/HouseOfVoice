import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { LanguageProvider } from './shared/LanguageContext'
import { AuthOnboarding } from './features/auth-onboarding/AuthOnboarding'
import DashboardDocs from './features/dashboard-docs/DashboardDocs'
import { ScreeningPage } from './features/screening/ScreeningPage'
import { Activity, UserCheck, LayoutDashboard, Users, BookOpen, Mic } from 'lucide-react'

/* Feature imports — uncomment during integration */
// import { MatchingFlow } from './features/matching/MatchingFlow'
// import { LearningPathPage } from './features/learning-path/LearningPathPage'
// import { SessionRoom } from './features/session/SessionRoom'

function Header() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Onboarding', icon: UserCheck },
    { path: '/docs', label: 'Progress Dashboard', icon: LayoutDashboard },
    { path: '/screening', label: 'Screening', icon: Mic },
    // { path: '/learning', label: 'Learning Path', icon: BookOpen },
    { path: '/matching', label: 'Therapist Matching', icon: Users },
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

function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-bold text-[#1E3A5F]">HouseOfVoice</h1>
    </div>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#F4F6F8]">
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<AuthOnboarding />} />
              <Route path="/auth/*" element={<AuthOnboarding />} />
              <Route path="/docs/*" element={<DashboardDocs />} />
              <Route path="/screening/*" element={<ScreeningPage />} />
              {/* <Route path="/learning/*" element={<LearningPathPage />} /> */}
              <Route path="/matching" element={
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                  <h2 className="text-3xl font-bold text-[#0F172A] mb-4">Therapist Matching</h2>
                  <p className="text-[#64748B] mb-4">Coming soon! This feature will help you find the perfect therapist.</p>
                  <p className="text-[#64748B] text-sm">Feature by Salman</p>
                </div>
              } />
              {/* <Route path="/session/*" element={<SessionRoom />} /> */}
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </LanguageProvider>
  )
}
