import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './shared/LanguageContext'
import { AuthOnboarding } from './features/auth-onboarding/AuthOnboarding'

/* Feature imports — uncomment during integration */
// import { ScreeningFlow } from './features/screening/ScreeningFlow'
// import { MatchingFlow } from './features/matching/MatchingFlow'
// import { LearningDashboard } from './features/learning/LearningDashboard'
// import { SessionRoom } from './features/session/SessionRoom'
// import { DocsDashboard } from './features/docs/DocsDashboard'

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
        <Routes>
          <Route path="/" element={<AuthOnboarding />} />
          <Route path="/auth/*" element={<AuthOnboarding />} />
          {/* <Route path="/screening/*" element={<ScreeningFlow />} /> */}
          {/* <Route path="/matching/*" element={<MatchingFlow />} /> */}
          {/* <Route path="/learning/*" element={<LearningDashboard />} /> */}
          {/* <Route path="/session/*" element={<SessionRoom />} /> */}
          {/* <Route path="/docs/*" element={<DocsDashboard />} /> */}
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  )
}
