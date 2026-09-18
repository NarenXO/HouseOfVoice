import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Smartboard from "./Smartboard";
import LiveDemoPlayer from "./LiveDemoPlayer";
import ModuleApprovalWorkflow from "./ModuleApprovalWorkflow";

// Type declaration for Jitsi Meet API
declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

// Import screening result mock
const screeningResultMock: {
  caseId: string;
  speechRate: number;
  pauseFrequency: number;
  pronunciationScore: number;
  fluencyScore: number;
  voiceStability: number;
  clarityScore: number;
  confidenceLevel: number;
  flaggedErrors: string[];
  plainLanguageSummary: string;
} = {
  caseId: "case_demo_001",
  speechRate: 3.2,
  pauseFrequency: 0.18,
  pronunciationScore: 0.71,
  fluencyScore: 0.68,
  voiceStability: 0.82,
  clarityScore: 0.74,
  confidenceLevel: 0.77,
  flaggedErrors: ["s - end of words", "th - start of words", "r - blends"],
  plainLanguageSummary: "Mild articulation difficulty on /s/ at word-final position and /th/ at word-initial position. Fluency and voice stability are within normal range."
};

interface ClinicalContext {
  case_id: string;
  patient_name: string;
  target_phonemes: string[];
  weekly_goals: string[];
  severity: string;
  articulation_score: number;
  milestones: Array<{
    id: string;
    title: string;
    goal: string;
    status: string;
  }>;
  screening_summary: string;
  session_mode: string;
  therapist_id: string;
}

interface WSMessage {
  type: string;
  text: string;
  sender: string;
  timestamp?: string;
}

interface DemoGenerateResponse {
  id: string;
  phoneme: string;
  word?: string;
  total_duration_ms: number;
  steps: Array<{
    step_number: number;
    duration_ms: number;
    asset_ids: string[];
    narration_text: string;
    articulatory_cue: string;
  }>;
  narration_audio_url?: string;
  linked_milestone_id?: string;
  created_at: string;
  tts_fallback_info?: {
    use_browser_tts: boolean;
    speech_synthesis_api: boolean;
    preferred_voice: string;
    fallback_reason: string;
  };
}

export default function SessionRoom() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [roomId, setRoomId] = useState<string>("");
  const [clientId] = useState(() => `User-${Math.floor(Math.random() * 10000)}`);
  const [parentPresent, setParentPresent] = useState(false);
  const [lowBandwidth, setLowBandwidth] = useState(false);
  const [wsMessages, setWsMessages] = useState<WSMessage[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [inputText, setInputText] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [demoData, setDemoData] = useState<DemoGenerateResponse | null>(null);
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
  const [moduleData, setModuleData] = useState<any>(null);
  const [showModuleApproval, setShowModuleApproval] = useState(false);
  const [isGeneratingModule, setIsGeneratingModule] = useState(false);
  const [clinicalContext, setClinicalContext] = useState<ClinicalContext | null>(null);
  const [showClinicalDrawer, setShowClinicalDrawer] = useState(false);
  const [activeTab, setActiveTab] = useState<"smartboard" | "demo" | "module" | "library">("smartboard");
  const [sessionStartTime] = useState(() => Date.now());
  const [sessionDuration, setSessionDuration] = useState(0);
  const [snapshots, setSnapshots] = useState<string[]>([]);
  const [demosGenerated, setDemosGenerated] = useState<string[]>([]);
  const [modulesUsed, setModulesUsed] = useState<string[]>([]);
  const [showEndSessionDialog, setShowEndSessionDialog] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate random room ID if not provided
  useEffect(() => {
    const roomParam = searchParams.get("room");
    if (!roomParam) {
      const newRoomId = `HOV-${Math.floor(Math.random() * 10000)}`;
      setRoomId(newRoomId);
      setSearchParams({ room: newRoomId });
    } else {
      setRoomId(roomParam);
    }
  }, [searchParams, setSearchParams]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [wsMessages]);

  // Session duration timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionDuration(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Load clinical context on mount
  useEffect(() => {
    const loadClinicalContext = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/session/context/case_demo_001");
        if (response.ok) {
          const context: ClinicalContext = await response.json();
          setClinicalContext(context);
        }
      } catch (error) {
        console.error("Failed to load clinical context:", error);
      }
    };

    loadClinicalContext();
  }, []);

  // WebSocket connection
  useEffect(() => {
    if (!roomId) return;

    const wsUrl = `ws://localhost:8000/api/session/ws/board/${roomId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data);
        // Only add chat messages to the message feed, not drawing/cursor messages
        if (data.type === "test") {
          setWsMessages((prev) => [...prev, { ...data, timestamp: new Date().toISOString() }]);
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
      console.log("WebSocket disconnected");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [roomId]);

  // Jitsi initialization
  useEffect(() => {
    if (!parentPresent || !roomId || !jitsiContainerRef.current) return;

    // Load Jitsi Meet External API
    const script = document.createElement("script");
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;
    script.onload = () => {
      if (window.JitsiMeetExternalAPI && jitsiContainerRef.current) {
        const domain = "meet.jit.si";
        const options = {
          roomName: roomId,
          width: "100%",
          height: "100%",
          parentNode: jitsiContainerRef.current,
          configOverwrite: lowBandwidth
            ? {
                startWithVideoMuted: true,
                startWithAudioMuted: false,
              }
            : {
                startWithVideoMuted: false,
                startWithAudioMuted: false,
              },
          interfaceConfigOverwrite: {
            DEFAULT_BACKGROUND: "#1e293b",
          },
        };

        jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options);
      }
    };
    document.head.appendChild(script);

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
      document.head.removeChild(script);
    };
  }, [parentPresent, roomId, lowBandwidth]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const message: WSMessage = {
      type: "test",
      text: inputText,
      sender: "You",
    };

    wsRef.current.send(JSON.stringify(message));
    setWsMessages((prev) => [...prev, { ...message, timestamp: new Date().toISOString() }]);
    setInputText("");
  };

  const generateDemoForPhoneme = async (phoneme: string) => {
    setIsGeneratingDemo(true);
    try {
      const response = await fetch("http://localhost:8000/api/session/demo/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneme,
          age_band: "child-6-8",
          reading_ability: "early-reader",
          language: "en-US",
          session_id: roomId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate demo");
      }

      const data: DemoGenerateResponse = await response.json();
      setDemoData(data);
      setDemosGenerated([...demosGenerated, data.id]);
    } catch (error) {
      console.error("Error generating demo:", error);
      alert("Failed to generate demo. Please try again.");
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  const extractPhonemesFromScreening = () => {
    // Extract phonemes from screening result flagged errors
    const flaggedErrors = screeningResultMock.flaggedErrors || [];
    const phonemes: string[] = [];
    
    flaggedErrors.forEach((error: string) => {
      // Extract phoneme from error messages like "s - end of words", "th - start of words", "r - blends"
      const match = error.match(/^([a-z]+)\s*-/);
      if (match) {
        let phoneme = match[1];
        // Map common phoneme notations to IPA format
        const phonemeMap: { [key: string]: string } = {
          's': '/s/',
          'th': '/th/',
          'r': '/r/',
          'b': '/b/',
          'p': '/p/',
          't': '/t/',
          'd': '/d/',
          'k': '/k/',
          'g': '/g/',
          'f': '/f/',
          'v': '/v/',
          'z': '/z/',
          'sh': '/ʃ/',
          'ch': '/tʃ/',
          'j': '/dʒ/',
          'l': '/l/',
          'm': '/m/',
          'n': '/n/',
          'ng': '/ŋ/',
        };
        
        const ipaPhoneme = phonemeMap[phoneme] || `/${phoneme}/`;
        if (!phonemes.includes(ipaPhoneme)) {
          phonemes.push(ipaPhoneme);
        }
      }
    });

    return phonemes;
  };

  const handleGenerateDemo = () => {
    const phonemes = extractPhonemesFromScreening();
    if (phonemes.length > 0) {
      // Generate demo for the first problematic phoneme
      generateDemoForPhoneme(phonemes[0]);
    } else {
      // Fallback to /r/ if no phonemes found
      generateDemoForPhoneme("/r/");
    }
  };

  const attachToMilestone = async (moduleId: string, milestoneId: string) => {
    try {
      const response = await fetch("http://localhost:8000/api/session/modules/attach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          module_id: moduleId,
          milestone_id: milestoneId,
          session_id: roomId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Module attached to milestone:", result);
        return result;
      }
    } catch (error) {
      console.error("Failed to attach module to milestone:", error);
    }
  };

  const handleEndSession = async () => {
    setEndingSession(true);
    try {
      const response = await fetch("http://localhost:8000/api/session/end-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          case_id: clinicalContext?.case_id || "case_demo_001",
          therapist_id: clinicalContext?.therapist_id || "thr_demo_001",
          session_id: roomId,
          parent_present: parentPresent,
          low_bandwidth_mode: lowBandwidth,
          snapshots: snapshots,
          demos_generated: demosGenerated,
          modules_used: modulesUsed,
          session_duration_seconds: sessionDuration,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Session ended successfully:", result);
        
        // Trigger snapshot download if there are any snapshots
        if (snapshots.length > 0) {
          const snapshotData = JSON.stringify(snapshots, null, 2);
          const blob = new Blob([snapshotData], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `session_snapshots_${roomId}_${Date.now()}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        
        // Download session record for SOAP notes (convert snake_case to camelCase for frontend compatibility)
        const sessionRecordForDownload = {
          sessionId: result.session_record.session_id,
          caseId: result.session_record.case_id,
          therapistId: result.session_record.therapist_id,
          activitiesCompleted: result.session_record.activities_completed,
          homeworkAssigned: result.session_record.homework_assigned,
          clinicalObservations: result.session_record.clinical_observations
        };
        const sessionRecordData = JSON.stringify(sessionRecordForDownload, null, 2);
        const recordBlob = new Blob([sessionRecordData], { type: 'application/json' });
        const recordUrl = URL.createObjectURL(recordBlob);
        const recordA = document.createElement('a');
        recordA.href = recordUrl;
        recordA.download = `session_record_${roomId}_${Date.now()}.json`;
        document.body.appendChild(recordA);
        recordA.click();
        document.body.removeChild(recordA);
        URL.revokeObjectURL(recordUrl);
        
        // Broadcast session ended over WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "session_ended",
            session_id: roomId,
            timestamp: new Date().toISOString(),
          }));
        }
        
        setShowEndSessionDialog(false);
        alert(`Session ended successfully!\n\nSession Record exported for SOAP notes.\n${snapshots.length > 0 ? `${snapshots.length} snapshots downloaded.` : ''}`);
      }
    } catch (error) {
      console.error("Failed to end session:", error);
      alert("Failed to end session. Please try again.");
    } finally {
      setEndingSession(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generateModuleForPhoneme = async (phoneme: string) => {
    setIsGeneratingModule(true);
    try {
      const response = await fetch("/api/session/modules/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneme,
          age_band: "child-6-8",
          language: "en-US",
          source: "mid-session",
          session_id: roomId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate module");
      }

      const data = await response.json();
      setModuleData(data);
      setShowModuleApproval(true);
    } catch (error) {
      console.error("Error generating module:", error);
      alert("Failed to generate module. Please try again.");
    } finally {
      setIsGeneratingModule(false);
    }
  };

  const handleGenerateModule = () => {
    const phonemes = extractPhonemesFromScreening();
    if (phonemes.length > 0) {
      // Generate module for the first problematic phoneme
      generateModuleForPhoneme(phonemes[0]);
    } else {
      // Fallback to /r/ if no phonemes found
      generateModuleForPhoneme("/r/");
    }
  };

  const handleCaptureSnapshot = (snapshotData: string) => {
    setSnapshots([...snapshots, snapshotData]);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowClinicalDrawer(!showClinicalDrawer)}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              title="Clinical Context"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-indigo-400">HouseOfVoice Live Session</h1>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <span>Room: <span className="text-emerald-400 font-mono">{roomId}</span></span>
                <span>Duration: <span className="text-white font-mono">{formatDuration(sessionDuration)}</span></span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${wsConnected ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                  {wsConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {lowBandwidth && (
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm">
                Low-Bandwidth Mode
              </span>
            )}
            {parentPresent && (
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">
                Parent Present
              </span>
            )}
            <button
              onClick={() => setShowEndSessionDialog(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors"
            >
              End Session
            </button>
          </div>
        </div>
      </div>

      {/* Parent Present Gate */}
      {!parentPresent && (
        <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 m-4 rounded-r-lg">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              id="parentPresent"
              checked={parentPresent}
              onChange={(e) => setParentPresent(e.target.checked)}
              className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500"
            />
            <label htmlFor="parentPresent" className="font-semibold text-amber-400">
              Parent Present
            </label>
          </div>
          <p className="mt-2 text-amber-300">
            Parent/Guardian presence is mandatory for pediatric therapy sessions
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex h-[calc(100vh-100px)]">
        {/* Clinical Drawer (Collapsible) */}
        {showClinicalDrawer && (
          <div className="w-80 bg-slate-800 border-r border-slate-700 p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Clinical Context</h3>
            
            {clinicalContext ? (
              <div className="space-y-4">
                {/* Patient Overview */}
                <div className="bg-slate-700 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-indigo-400 mb-2">Patient Overview</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Name:</span>
                      <span className="text-white">{clinicalContext.patient_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Severity:</span>
                      <span className={`font-medium ${
                        clinicalContext.severity === "mild" ? "text-emerald-400" :
                        clinicalContext.severity === "moderate" ? "text-amber-400" :
                        "text-red-400"
                      }`}>
                        {clinicalContext.severity}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Score:</span>
                      <span className="text-white">{(clinicalContext.articulation_score * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                {/* Target Phonemes */}
                <div className="bg-slate-700 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-indigo-400 mb-2">Target Phonemes</h4>
                  <div className="flex flex-wrap gap-2">
                    {clinicalContext.target_phonemes.map((phoneme, idx) => (
                      <span key={idx} className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded text-sm">
                        {phoneme}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Weekly Goals */}
                <div className="bg-slate-700 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-indigo-400 mb-2">Weekly Goals</h4>
                  <ul className="space-y-1 text-sm text-slate-300">
                    {clinicalContext.weekly_goals.map((goal, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400">•</span>
                        <span>{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Milestones */}
                <div className="bg-slate-700 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-indigo-400 mb-2">Active Milestones</h4>
                  <div className="space-y-2">
                    {clinicalContext.milestones.slice(0, 3).map((milestone) => (
                      <div key={milestone.id} className="text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">{milestone.title}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            milestone.status === "generalized" ? "bg-emerald-500/20 text-emerald-400" :
                            milestone.status === "trained" ? "bg-amber-500/20 text-amber-400" :
                            "bg-slate-600 text-slate-400"
                          }`}>
                            {milestone.status}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs mt-1">{milestone.goal}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Screening Summary */}
                <div className="bg-slate-700 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-indigo-400 mb-2">Screening Summary</h4>
                  <p className="text-sm text-slate-300">{clinicalContext.screening_summary}</p>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm">Loading clinical context...</div>
            )}
          </div>
        )}

        {/* Left: Jitsi Video (55-60%) */}
        <div className="flex-1 p-4">
          {parentPresent ? (
            <div className="h-full bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
              <div ref={jitsiContainerRef} className="w-full h-full" />
            </div>
          ) : (
            <div className="h-full bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center">
              <p className="text-slate-500 text-lg">Video call will load after Parent Present confirmation</p>
            </div>
          )}
        </div>

        {/* Right: Interactive Workspace (40-45%) */}
        <div className="w-[45%] p-4 flex flex-col">
          {/* Tab Navigation */}
          <div className="bg-slate-800 rounded-lg p-2 mb-4 border border-slate-700">
            <div className="flex gap-2">
              {[
                { id: "smartboard", label: "🎨 Smartboard" },
                { id: "demo", label: "🎬 Procedural Demo" },
                { id: "module", label: "📦 Module Studio" },
                { id: "library", label: "📚 Library" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            {activeTab === "smartboard" && (
              <div className="h-full p-4">
                <Smartboard 
                  ws={wsRef.current} 
                  roomId={roomId} 
                  clientId={clientId} 
                  onSnapshotCapture={handleCaptureSnapshot}
                />
              </div>
            )}
            
            {activeTab === "demo" && (
              <div className="h-full p-4">
                <div className="bg-slate-700 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Procedural Speech Articulation Demo</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Generate 5-15 second procedural animation demos with AI-directed anatomical motion
                  </p>
                  <button
                    onClick={handleGenerateDemo}
                    disabled={isGeneratingDemo}
                    className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2"
                  >
                    {isGeneratingDemo ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating Demo...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Generate Articulation Demo
                      </>
                    )}
                  </button>
                </div>
                
                {clinicalContext && (
                  <div className="bg-slate-700 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-indigo-400 mb-2">Target Phonemes</h4>
                    <div className="flex flex-wrap gap-2">
                      {clinicalContext.target_phonemes.map((phoneme, idx) => (
                        <button
                          key={idx}
                          onClick={() => generateDemoForPhoneme(phoneme)}
                          className="px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded text-sm transition-colors"
                        >
                          {phoneme}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === "module" && (
              <div className="h-full p-4">
                <div className="bg-slate-700 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Module Studio</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Generate 30-second training modules for the library
                  </p>
                  <button
                    onClick={handleGenerateModule}
                    disabled={isGeneratingModule}
                    className="w-full px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2"
                  >
                    {isGeneratingModule ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating Module...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Generate Training Module
                      </>
                    )}
                  </button>
                </div>
                
                {clinicalContext && (
                  <div className="bg-slate-700 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-indigo-400 mb-2">Target Phonemes</h4>
                    <div className="flex flex-wrap gap-2">
                      {clinicalContext.target_phonemes.map((phoneme, idx) => (
                        <button
                          key={idx}
                          onClick={() => generateModuleForPhoneme(phoneme)}
                          className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded text-sm transition-colors"
                        >
                          {phoneme}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === "library" && (
              <div className="h-full p-4">
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Module Library</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Browse approved training modules
                  </p>
                  <button
                    onClick={() => window.location.href = "/module-library"}
                    className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition-colors"
                  >
                    Open Full Library
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Chat */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 mt-4">
            <button
              onClick={() => setShowChat(!showChat)}
              className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-slate-700 transition-colors"
            >
              <span className="text-sm font-semibold text-indigo-400">💬 Chat</span>
              <span className="text-slate-400">{showChat ? "▼" : "▶"}</span>
            </button>
            
            {showChat && (
              <div className="p-4 border-t border-slate-700">
                {/* Message Feed */}
                <div className="h-32 overflow-y-auto space-y-2 mb-3">
                  {wsMessages.length === 0 ? (
                    <p className="text-slate-500 text-sm">No messages yet. Start typing below!</p>
                  ) : (
                    wsMessages.map((msg, idx) => (
                      <div key={idx} className="bg-slate-700/50 rounded p-2 border border-slate-600">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-emerald-400">{msg.sender}</span>
                          <span className="text-xs text-slate-500">
                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ""}
                          </span>
                        </div>
                        <p className="text-sm text-slate-200">{msg.text}</p>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={!wsConnected}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!wsConnected || !inputText.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Emoji Reaction Bar */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 mt-4 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-indigo-400">Quick Reactions</span>
              <div className="flex gap-2">
                {["👍", "❤️", "😊", "🎉", "⭐"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                        wsRef.current.send(JSON.stringify({
                          type: "reaction",
                          emoji,
                          sender: clientId,
                          timestamp: new Date().toISOString(),
                        }));
                      }
                    }}
                    className="text-2xl hover:scale-125 transition-transform"
                    title={`Send ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Demo Player Overlay */}
      {demoData && (
        <LiveDemoPlayer
          demoData={demoData}
          onClose={() => setDemoData(null)}
          ws={wsRef.current}
          roomId={roomId}
          clientId={clientId}
          milestones={clinicalContext?.milestones || []}
          onAttach={attachToMilestone}
        />
      )}

      {/* Module Approval Workflow Overlay */}
      {showModuleApproval && moduleData && (
        <ModuleApprovalWorkflow
          moduleData={moduleData}
          milestones={clinicalContext?.milestones || []}
          onAttach={attachToMilestone}
          onApprove={(approved) => {
            setShowModuleApproval(false);
            setModuleData(null);
            if (approved) {
              setModulesUsed([...modulesUsed, moduleData.id]);
              alert("Module approved successfully!");
            }
          }}
          onClose={() => {
            setShowModuleApproval(false);
            setModuleData(null);
          }}
        />
      )}

      {/* End Session Dialog */}
      {showEndSessionDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-bold text-white mb-4">End Session</h2>
            
            <div className="space-y-4 mb-6">
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-indigo-400 mb-2">Session Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Duration:</span>
                    <span className="text-white">{formatDuration(sessionDuration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Demos Generated:</span>
                    <span className="text-white">{demosGenerated.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Modules Used:</span>
                    <span className="text-white">{modulesUsed.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Snapshots:</span>
                    <span className="text-white">{snapshots.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Parent Present:</span>
                    <span className={parentPresent ? "text-emerald-400" : "text-red-400"}>
                      {parentPresent ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/20 border border-amber-500 rounded-lg p-4">
                <p className="text-amber-400 text-sm">
                  This will compile a session record for SOAP notes documentation
                  and notify all connected participants.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEndSessionDialog(false)}
                disabled={endingSession}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 disabled:text-slate-500 rounded-lg text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEndSession}
                disabled={endingSession}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:text-slate-500 rounded-lg text-white font-medium transition-colors"
              >
                {endingSession ? "Ending..." : "End Session"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
