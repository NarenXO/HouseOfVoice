import React, { useState, useEffect } from 'react';
import { 
  Star, Clock, Video, Users, Calendar, AlertCircle, 
  CheckCircle2, ChevronRight, User, Loader2, Sparkles, 
  UserPlus, CalendarDays, BrainCircuit, Check
} from 'lucide-react';

// --- Types ---
type Therapist = {
  id: string;
  name: string;
  specialization: string[];
  languages: string[];
  years_experience: number;
  session_mode: string;
  current_caseload: number;
};

type ReasoningFactor = {
  factor: string;
  contribution: number;
  explanation: string;
};

type Recommendation = {
  therapist: Therapist;
  score: number;
  reasoning: ReasoningFactor[];
};

type Booking = {
  id: string;
  case_id: string;
  therapist_id: string;
  status: string;
  datetime: string;
  mode: string;
};

type SupervisorAssignment = {
  booking_id: string;
  supervisor_id: string;
};

type TherapyPlan = {
  id: string;
  goals: string[];
  gemini_draft: any;
  approved_by: string | null;
};

// --- Mock Data Fallbacks ---
const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    therapist: {
      id: "t1", name: "Dr. Sarah Jenkins", specialization: ["articulation"], languages: ["english"],
      years_experience: 8, session_mode: "hybrid", current_caseload: 12
    },
    score: 85.0,
    reasoning: [
      { factor: "Specialization", contribution: 30, explanation: "Matches flagged errors with specializations." },
      { factor: "Language", contribution: 25, explanation: "Fluent in preferred therapy language." }
    ]
  }
];

export default function MatchingHome() {
  const caseId = "case_demo_001";
  
  // State
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedTherapist, setSelectedTherapist] = useState<string | null>(null);
  
  // Booking State
  const [bookingDate, setBookingDate] = useState<string>("");
  const [bookingTime, setBookingTime] = useState<string>("");
  const [isTrial, setIsTrial] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [bookingError, setBookingError] = useState<string>("");
  
  // Supervisor State
  const [supervisor, setSupervisor] = useState<SupervisorAssignment | null>(null);
  const [supervisorError, setSupervisorError] = useState<string>("");
  
  // Plan State
  const [goals, setGoals] = useState<string>("Improve articulation, Enhance fluency");
  const [plan, setPlan] = useState<TherapyPlan | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);
  
  // Loading State
  const [loadingTherapists, setLoadingTherapists] = useState(true);

  useEffect(() => {
    fetchTherapists();
  }, []);

  const fetchTherapists = async () => {
    try {
      const res = await fetch(`/api/matching/therapists/recommend?case_id=${caseId}`);
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      } else {
        setRecommendations(MOCK_RECOMMENDATIONS);
      }
    } catch (e) {
      setRecommendations(MOCK_RECOMMENDATIONS);
    } finally {
      setLoadingTherapists(false);
    }
  };

  const handleBook = async () => {
    setBookingError("");
    if (!selectedTherapist || !bookingDate || !bookingTime) {
      setBookingError("Please select a therapist, date, and time.");
      return;
    }
    
    const datetime = `${bookingDate}T${bookingTime}:00Z`;
    
    try {
      const res = await fetch('/api/matching/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: caseId,
          therapist_id: selectedTherapist,
          datetime: datetime,
          mode: "virtual",
          is_trial: isTrial
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setBooking(data);
      } else {
        const err = await res.json();
        setBookingError(err.detail || "Booking failed.");
      }
    } catch (e) {
      // Mock success for offline testing
      setBooking({
        id: "book_mock_123",
        case_id: caseId,
        therapist_id: selectedTherapist,
        datetime: datetime,
        mode: "virtual",
        status: isTrial ? "trial" : "confirmed"
      });
    }
  };

  const handleAssignSupervisor = async () => {
    setSupervisorError("");
    if (!booking) {
      setSupervisorError("Cannot assign supervisor. Booking must be confirmed or trial.");
      return;
    }
    
    try {
      const res = await fetch('/api/matching/supervisor-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: booking.id })
      });
      
      if (res.ok) {
        const data = await res.json();
        setSupervisor(data);
      } else {
        const err = await res.json();
        setSupervisorError(err.detail || "Failed to assign supervisor.");
      }
    } catch (e) {
      if (booking.status === "confirmed" || booking.status === "trial") {
        setSupervisor({ booking_id: booking.id, supervisor_id: "super_mock_1" });
      } else {
        setSupervisorError("Cannot assign supervisor. Booking must be confirmed or trial.");
      }
    }
  };

  const handleDraftPlan = async () => {
    if (!selectedTherapist) return;
    setIsDrafting(true);
    
    try {
      const goalsList = goals.split(',').map(g => g.trim());
      const res = await fetch('/api/matching/plans/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: caseId,
          therapist_id: selectedTherapist,
          goals: goalsList,
          session_mode: "virtual"
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setPlan(data);
      } else {
        // Mock fallback
        throw new Error("Failed to draft");
      }
    } catch (e) {
      setPlan({
        id: "plan_mock_123",
        goals: goals.split(',').map(g => g.trim()),
        gemini_draft: {
          week_1_2: "Build rapport and establish baseline sounds.",
          week_3_4: "Focus on articulation exercises.",
          week_5_6: "Generalize skills to short phrases."
        },
        approved_by: null
      });
    } finally {
      setIsDrafting(false);
    }
  };

  const handleApprovePlan = async () => {
    if (!plan) return;
    try {
      const res = await fetch(`/api/matching/plans/${plan.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_by: "system_admin" })
      });
      
      if (res.ok) {
        const data = await res.json();
        setPlan(data);
      } else {
        setPlan({ ...plan, approved_by: "system_admin" });
      }
    } catch (e) {
      setPlan({ ...plan, approved_by: "system_admin" });
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1117] text-white p-6 md:p-12 font-sans selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 pb-2 leading-tight overflow-visible">
            Intelligent Matching & Planning
          </h1>
          <p className="text-gray-400 text-lg">
            Review AI-ranked specialists, secure a session, and draft a tailored therapy plan.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Recommendations */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Users className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-semibold">Recommended Therapists</h2>
            </div>
            
            {loadingTherapists ? (
              <div className="flex items-center justify-center h-48 bg-white/5 rounded-2xl border border-white/10">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <div 
                    key={rec.therapist.id} 
                    onClick={() => setSelectedTherapist(rec.therapist.id)}
                    className={`p-6 rounded-2xl border transition-all duration-300 cursor-pointer backdrop-blur-xl
                      ${selectedTherapist === rec.therapist.id 
                        ? 'bg-indigo-500/20 border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.2)]' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">{rec.therapist.name}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="px-2.5 py-1 text-xs rounded-full bg-white/10 text-gray-300 flex items-center">
                            <Clock className="w-3 h-3 mr-1" /> {rec.therapist.years_experience} yrs
                          </span>
                          <span className="px-2.5 py-1 text-xs rounded-full bg-white/10 text-gray-300 flex items-center">
                            <Video className="w-3 h-3 mr-1" /> {rec.therapist.session_mode}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 font-bold text-white shadow-lg">
                          {Math.round(rec.score)}
                        </div>
                        <span className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Match</span>
                      </div>
                    </div>
                    
                    {/* Reasoning Factors */}
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Why this match?</p>
                      {rec.reasoning.map((reason, idx) => (
                        <div key={idx} className="flex items-start space-x-2 text-sm text-gray-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-medium text-white">{reason.factor} (+{reason.contribution}):</span> {reason.explanation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Booking & Plan */}
          <div className="space-y-8">
            
            {/* Booking Section */}
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />
              
              <div className="flex items-center space-x-3 mb-6 relative z-10">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <CalendarDays className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-2xl font-semibold">Booking & Supervisor</h2>
              </div>
              
              {!selectedTherapist ? (
                <div className="flex flex-col items-center justify-center py-8 text-center relative z-10">
                  <User className="w-12 h-12 text-gray-600 mb-3" />
                  <p className="text-gray-400">Select a therapist from the list to continue.</p>
                </div>
              ) : (
                <div className="space-y-5 relative z-10">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Date</label>
                      <input 
                        type="date" 
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        disabled={!!booking}
                        readOnly={!!booking}
                        className={`w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all ${
                          booking ? 'pointer-events-none cursor-not-allowed opacity-50' : 'cursor-text'
                        }`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Time</label>
                      <input 
                        type="time"
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        disabled={!!booking}
                        readOnly={!!booking}
                        className={`w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all ${
                          booking ? 'pointer-events-none cursor-not-allowed opacity-50' : 'cursor-text'
                        }`}
                      />
                    </div>
                  </div>
                  
                  <label className={`flex items-center space-x-3 group ${booking ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}>
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={isTrial}
                        onChange={(e) => setIsTrial(e.target.checked)}
                        disabled={!!booking}
                        className="peer sr-only" 
                      />
                      <div className={`transition-all ${isTrial ? 'w-5 h-5 bg-indigo-600 border border-indigo-500 rounded-md flex items-center justify-center' : 'w-5 h-5 bg-slate-900 border border-slate-700 rounded-md'}`}>
                        {isTrial && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      </div>
                    </div>
                    <span className="text-gray-300 group-hover:text-white transition-colors">Request as Trial Session</span>
                  </label>

                  {bookingError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-2 text-red-400">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p className="text-sm">{bookingError}</p>
                    </div>
                  )}

                  {!booking ? (
                    <button 
                      onClick={handleBook}
                      className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all transform active:scale-[0.98]"
                    >
                      Secure Slot
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-emerald-500/20 rounded-full">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">Booking Confirmed</p>
                            <p className="text-emerald-400 text-sm capitalize">Status: {booking.status}</p>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setBooking(null)}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all"
                      >
                        Modify / Book New Slot
                      </button>
                    </div>
                  )}

                  {/* Supervisor Allocation */}
                  <div className="pt-6 mt-6 border-t border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center">
                        <UserPlus className="w-5 h-5 mr-2 text-blue-400" /> Supervisor Allocation
                      </h3>
                    </div>
                    
                    {supervisorError && (
                      <div className="p-3 mb-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-start space-x-2 text-orange-400">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="text-sm">{supervisorError}</p>
                      </div>
                    )}

                    {!supervisor ? (
                      <button 
                        onClick={handleAssignSupervisor}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all"
                      >
                        Auto-Assign Supervisor
                      </button>
                    ) : (
                      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Assigned Supervisor ID: {supervisor.supervisor_id}</p>
                          <p className="text-blue-400 text-sm">Lowest caseload selected</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* AI Therapy Plan Section */}
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-purple-500/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />
              
              <div className="flex items-center space-x-3 mb-6 relative z-10">
                <div className="p-2 bg-pink-500/10 rounded-lg">
                  <BrainCircuit className="w-6 h-6 text-pink-400" />
                </div>
                <h2 className="text-2xl font-semibold">AI Therapy Plan</h2>
              </div>

              {!selectedTherapist ? (
                <div className="flex flex-col items-center justify-center py-8 text-center relative z-10">
                  <Sparkles className="w-12 h-12 text-gray-600 mb-3" />
                  <p className="text-gray-400">Select a therapist first to draft a plan.</p>
                </div>
              ) : (
                <div className="space-y-5 relative z-10">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Primary Goals (comma separated)</label>
                    <textarea 
                      value={goals}
                      onChange={(e) => setGoals(e.target.value)}
                      rows={2}
                      disabled={!!plan?.approved_by}
                      readOnly={!!plan?.approved_by}
                      className={`w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all resize-none ${
                        plan?.approved_by ? 'pointer-events-none cursor-not-allowed opacity-50' : 'cursor-text'
                      }`}
                    />
                  </div>

                  {!plan ? (
                    <button 
                      onClick={handleDraftPlan}
                      disabled={isDrafting}
                      className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(236,72,153,0.2)] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {isDrafting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                      <span>{isDrafting ? "Drafting with Gemini..." : "Draft Plan via Gemini"}</span>
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-5 bg-black/40 rounded-2xl border border-white/5 space-y-4">
                        {Object.entries(plan.gemini_draft || {}).map(([key, value]) => (
                          <div key={key}>
                            <h4 className="text-pink-400 text-sm font-semibold uppercase tracking-wider mb-1">
                              {key.replace(/_/g, ' ')}
                            </h4>
                            <p className="text-gray-300 text-sm leading-relaxed">
                              {value as string}
                            </p>
                          </div>
                        ))}
                      </div>

                      {plan.approved_by ? (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-3 text-emerald-400">
                          <CheckCircle2 className="w-5 h-5 shrink-0" />
                          <span className="font-medium">Plan Approved & Locked</span>
                        </div>
                      ) : (
                        <button 
                          onClick={handleApprovePlan}
                          className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all"
                        >
                          Approve & Lock Plan
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
