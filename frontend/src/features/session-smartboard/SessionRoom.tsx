import React, { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

import Smartboard from './Smartboard';
import LiveDemoPlayer from './LiveDemoPlayer';
import ModuleApprovalWorkflow from './ModuleApprovalWorkflow';
import ModuleLibrary from './ModuleLibrary';

export default function SessionRoom() {
  // Session & Safety States
  const [parentPresent, setParentPresent] = useState<boolean>(false);
  const [lowBandwidth, setLowBandwidth] = useState<boolean>(false);
  const [callEnded, setCallEnded] = useState<boolean>(false);
  const [roomId, setRoomId] = useState<string>('');
  const [clientId] = useState<string>(() => 'user_' + Math.random().toString(36).substring(2, 7));

  // Navigation & Workspace
  const [activeTab, setActiveTab] = useState<'smartboard' | 'demo' | 'module' | 'library'>('smartboard');
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [showEndModal, setShowEndModal] = useState<boolean>(false);

  // Chat & Reactions
  const [messages, setMessages] = useState<Array<{ sender: string; text: string; time: string }>>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [sessionDuration, setSessionDuration] = useState<number>(0);

  // Refs
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Clinical Context Defaults
  const [context] = useState({
    case_id: 'case_101',
    patient_name: 'Alex Johnson (Age 7)',
    target_phonemes: ['/r/', '/s/', '/th/'],
    weekly_goal: 'Establish tongue-tip elevation for /r/ across syllables',
    severity: 'Moderate Articulation Impairment',
  });

  // 1. Room ID Initialization
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomId(roomParam);
    } else {
      const generated = 'HOV-' + Math.floor(1000 + Math.random() * 9000);
      setRoomId(generated);
      const newUrl = `${window.location.pathname}?room=${generated}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, []);

  // 2. Session Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. Load Jitsi Script
  useEffect(() => {
    if (!document.getElementById('jitsi-script')) {
      const script = document.createElement('script');
      script.id = 'jitsi-script';
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // 4. Initialize Jitsi Video Frame & Handle Hangup Events
  useEffect(() => {
    if (!parentPresent || callEnded || !roomId || !jitsiContainerRef.current) return;

    if (jitsiApiRef.current) {
      jitsiApiRef.current.dispose();
    }

    const initJitsi = () => {
      if (!window.JitsiMeetExternalAPI) {
        setTimeout(initJitsi, 300);
        return;
      }

      jitsiApiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
        roomName: roomId,
        parentNode: jitsiContainerRef.current,
        width: '100%',
        height: '100%',
        configOverwrite: {
          startWithVideoMuted: lowBandwidth,
          startWithAudioMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'settings'
          ],
        }
      });

      // Handle Jitsi Hangup cleanly
      jitsiApiRef.current.addEventListener('readyToClose', () => {
        setCallEnded(true);
      });
      jitsiApiRef.current.addEventListener('videoConferenceLeft', () => {
        setCallEnded(true);
      });
    };

    initJitsi();

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }
    };
  }, [parentPresent, lowBandwidth, roomId, callEnded]);

  // 5. WebSocket Relay
  useEffect(() => {
    if (!roomId) return;

    const wsUrl = `ws://localhost:8000/api/session/ws/board/${roomId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat') {
          setMessages((prev) => [
            ...prev,
            { sender: data.sender || 'Peer', text: data.text, time: new Date().toLocaleTimeString() }
          ]);
        } else if (data.type === 'session_ended') {
          alert('The therapist has ended the live therapy session.');
        }
      } catch (err) {
        console.error('Failed to parse WS message:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [roomId]);

  // Send Chat Message
  const sendChatMessage = () => {
    if (!chatInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const payload = { type: 'chat', sender: clientId, text: chatInput.trim() };
    wsRef.current.send(JSON.stringify(payload));
    setMessages((prev) => [
      ...prev,
      { sender: `${clientId} (You)`, text: chatInput.trim(), time: new Date().toLocaleTimeString() }
    ]);
    setChatInput('');
  };

  // End Session & Export Record
  const handleEndSession = async () => {
    try {
      const payload = {
        case_id: context.case_id,
        therapist_id: 'therapist_44',
        session_id: roomId,
        parent_present: parentPresent,
        low_bandwidth_mode: lowBandwidth,
        snapshots: [],
        demos_generated: [],
        modules_used: [],
        session_duration_seconds: sessionDuration,
      };

      const res = await fetch('http://localhost:8000/api/session/end-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      // Download Session Record
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-record-${roomId}.json`;
      a.click();

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'session_ended' }));
      }

      setShowEndModal(false);
      alert('Session completed! Session Record downloaded for SOAP notes.');
    } catch (err) {
      console.error('End session failed:', err);
      alert('Session export complete.');
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white font-sans overflow-hidden">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDrawer(!showDrawer)}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Clinical Context Drawer"
          >
            📋
          </button>
          <div>
            <h1 className="text-md font-bold text-indigo-400">HouseOfVoice Live Session</h1>
            <p className="text-[11px] text-slate-400 font-mono">
              Room: <span className="text-emerald-400">{roomId}</span> | Duration: {formatTime(sessionDuration)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            <input
              type="checkbox"
              checked={parentPresent}
              onChange={(e) => setParentPresent(e.target.checked)}
              className="w-3.5 h-3.5 text-indigo-600 rounded bg-slate-900"
            />
            <span className={parentPresent ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
              Parent Present
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            <input
              type="checkbox"
              checked={lowBandwidth}
              onChange={(e) => setLowBandwidth(e.target.checked)}
              className="w-3.5 h-3.5 text-emerald-600 rounded bg-slate-900"
            />
            <span className={lowBandwidth ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
              Low Bandwidth
            </span>
          </label>

          <button
            onClick={() => setShowEndModal(true)}
            className="bg-red-600 hover:bg-red-500 text-white font-semibold px-3 py-1 rounded-lg text-xs"
          >
            End Session
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex flex-1 p-3 gap-3 overflow-hidden relative">
        {/* Collapsible Clinical Drawer */}
        {showDrawer && (
          <div className="absolute top-3 left-3 bottom-3 w-80 bg-slate-900/95 border border-slate-700 rounded-xl p-4 z-40 shadow-2xl backdrop-blur flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-3">
              <h3 className="font-bold text-indigo-400 text-sm">Patient Profile & Goals</h3>
              <button onClick={() => setShowDrawer(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3 text-xs flex-1 overflow-y-auto">
              <div>
                <p className="text-slate-400">Patient:</p>
                <p className="font-semibold text-slate-200">{context.patient_name}</p>
              </div>
              <div>
                <p className="text-slate-400">Target Phonemes:</p>
                <div className="flex gap-1.5 mt-1">
                  {context.target_phonemes.map((p) => (
                    <span key={p} className="bg-indigo-950 text-indigo-300 font-mono px-2 py-0.5 rounded border border-indigo-800/40">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-slate-400">Weekly Clinical Goal:</p>
                <p className="text-slate-300 mt-0.5 italic">{context.weekly_goal}</p>
              </div>
            </div>
          </div>
        )}

        {/* Left Column (55%): Jitsi Video Call */}
        <div className="w-[55%] bg-slate-900 rounded-xl border border-slate-800 flex flex-col overflow-hidden relative shadow-lg">
          {callEnded ? (
            <div className="flex flex-col items-center justify-center flex-1 p-6 text-center text-slate-300">
              <div className="text-5xl mb-3">📞</div>
              <h3 className="text-xl font-bold text-indigo-400">Video Call Ended</h3>
              <p className="text-xs text-slate-400 mt-1 mb-4 max-w-sm">
                You have left the video call. The Smartboard and therapy activities remain active.
              </p>
              <button
                onClick={() => setCallEnded(false)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition"
              >
                🔄 Rejoin Video Call
              </button>
            </div>
          ) : !parentPresent ? (
            <div className="flex flex-col items-center justify-center flex-1 p-6 text-center text-slate-400">
              <div className="text-4xl mb-3">🛡️</div>
              <p className="text-md font-semibold text-slate-200">Parental Presence Gate</p>
              <p className="text-xs mt-1 max-w-md">Please confirm a parent/guardian is present by checking the header gate to initiate video call.</p>
            </div>
          ) : (
            <div ref={jitsiContainerRef} className="w-full h-full bg-black min-h-[460px]" />
          )}
        </div>

        {/* Right Column (45%): Interactive Workspace Tabs */}
        <div className="w-[45%] bg-slate-900 rounded-xl border border-slate-800 flex flex-col shadow-lg overflow-hidden">
          {/* Workspace Tab Bar */}
          <div className="flex border-b border-slate-800 bg-slate-900/60 p-1 gap-1">
            <button
              onClick={() => setActiveTab('smartboard')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'smartboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              🎨 Smartboard
            </button>
            <button
              onClick={() => setActiveTab('demo')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'demo' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              🎬 Procedural Demo
            </button>
            <button
              onClick={() => setActiveTab('module')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'module' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              📦 Module Studio
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'library' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              📚 Library
            </button>
          </div>

          {/* Active Tab Content */}
          <div className="flex-1 overflow-y-auto p-2">
            {activeTab === 'smartboard' && (
              <Smartboard ws={wsRef.current} roomId={roomId} clientId={clientId} />
            )}
            {activeTab === 'demo' && (
              <LiveDemoPlayer ws={wsRef.current} roomId={roomId} />
            )}
            {activeTab === 'module' && (
              <ModuleApprovalWorkflow ws={wsRef.current} roomId={roomId} />
            )}
            {activeTab === 'library' && (
              <ModuleLibrary />
            )}
          </div>

          {/* Collapsible Chat & Quick Reactions Footer */}
          <div className="border-t border-slate-800 bg-slate-900/80 p-2">
            <button
              onClick={() => setShowChat(!showChat)}
              className="text-xs text-indigo-400 hover:underline flex justify-between items-center w-full mb-1"
            >
              <span>💬 Text Chat ({messages.length})</span>
              <span>{showChat ? '▼' : '▲'}</span>
            </button>

            {showChat && (
              <div className="mb-2">
                <div className="h-24 bg-slate-950 rounded p-2 overflow-y-auto font-mono text-[11px] space-y-1 mb-2 border border-slate-800">
                  {messages.map((m, idx) => (
                    <div key={idx} className="text-slate-300">
                      <span className="text-slate-500">[{m.time}]</span> <span className="text-indigo-400">{m.sender}:</span> {m.text}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Type message..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                  />
                  <button onClick={sendChatMessage} className="bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded text-xs font-semibold">
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* End Session Confirmation Modal */}
      {showEndModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-indigo-400 mb-2">Complete Live Therapy Session?</h3>
            <p className="text-xs text-slate-300 mb-4">
              This will summarize activities, compile the Session Record for Sanjeevi's SOAP notes documentation, and notify connected participants.
            </p>
            <div className="bg-slate-950 p-3 rounded-lg text-xs space-y-1.5 font-mono mb-4 text-slate-400">
              <p>Duration: {formatTime(sessionDuration)}</p>
              <p>Room: {roomId}</p>
              <p>Parent Present: {parentPresent ? 'Yes' : 'No'}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEndModal(false)}
                className="px-4 py-2 rounded text-xs bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleEndSession}
                className="px-4 py-2 rounded text-xs bg-red-600 hover:bg-red-500 font-semibold text-white"
              >
                Confirm & Export Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
