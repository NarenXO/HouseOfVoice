import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { LanguageProvider } from './shared/LanguageContext'
import { AuthOnboarding } from './features/auth-onboarding/AuthOnboarding'
import DashboardDocs from './features/dashboard-docs/DashboardDocs'

/* Feature imports — uncomment during integration */
// import { ScreeningFlow } from './features/screening/ScreeningFlow'
// import { MatchingFlow } from './features/matching/MatchingFlow'
// import { LearningDashboard } from './features/learning/LearningDashboard'
// import { SessionRoom } from './features/session/SessionRoom'

function Header() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: '👤 Onboarding', icon: '👤' },
    { path: '/docs', label: '📊 Progress Dashboard', icon: '📊' },
    { path: '/matching', label: '👨‍⚕️ Therapist Matching', icon: '👨‍⚕️' },
  ];

  return (
    <header className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-indigo-600 hover:text-indigo-700">
              🏠 HouseOfVoice
            </Link>
          </div>
          <nav className="flex space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path || 
                  (item.path !== '/' && location.pathname.startsWith(item.path))
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-bold text-indigo-600">🏠 HouseOfVoice</h1>
    </div>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<AuthOnboarding />} />
              <Route path="/auth/*" element={<AuthOnboarding />} />
              <Route path="/docs/*" element={<DashboardDocs />} />
              <Route path="/matching" element={
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">👨‍⚕️ Therapist Matching</h2>
                  <p className="text-gray-600 mb-4">Coming soon! This feature will help you find the perfect therapist.</p>
                  <p className="text-gray-500 text-sm">Feature by Salman</p>
                </div>
              } />
              {/* <Route path="/screening/*" element={<ScreeningFlow />} /> */}
              {/* <Route path="/learning/*" element={<LearningDashboard />} /> */}
              {/* <Route path="/session/*" element={<SessionRoom />} /> */}
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </LanguageProvider>
  )
}
