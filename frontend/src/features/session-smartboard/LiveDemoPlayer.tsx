import { useEffect, useRef, useState } from "react";

interface DemoStep {
  step_number: number;
  duration_ms: number;
  asset_ids: string[];
  narration_text: string;
  articulatory_cue: string;
}

interface DemoGenerateResponse {
  id: string;
  phoneme: string;
  word?: string;
  total_duration_ms: number;
  steps: DemoStep[];
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

interface Milestone {
  id: string;
  title: string;
  goal: string;
  status: string;
}

interface LiveDemoPlayerProps {
  demoData: DemoGenerateResponse | null;
  onClose: () => void;
  ws?: WebSocket | null;
  roomId?: string;
  clientId?: string;
  milestones?: Milestone[];
  onAttach?: (moduleId: string, milestoneId: string) => Promise<any>;
}

export default function LiveDemoPlayer({
  demoData,
  onClose,
  ws,
  roomId,
  clientId,
  milestones = [],
  onAttach,
}: LiveDemoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [narrationText, setNarrationText] = useState("");
  const [articulatoryCue, setArticulatoryCue] = useState("");
  const [activeAssets, setActiveAssets] = useState<string[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<string>("");
  const [isAttaching, setIsAttaching] = useState(false);
  const [attachmentSuccess, setAttachmentSuccess] = useState(false);
  
  const animationRef = useRef<number>();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);

  // Initialize demo data
  useEffect(() => {
    if (demoData && demoData.steps.length > 0) {
      setCurrentStep(0);
      setCurrentTime(0);
      setNarrationText(demoData.steps[0].narration_text);
      setArticulatoryCue(demoData.steps[0].articulatory_cue);
      setActiveAssets(demoData.steps[0].asset_ids);
    }
  }, [demoData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  // Send WebSocket sync message
  const sendSyncMessage = (action: string, data: any) => {
    if (ws && ws.readyState === WebSocket.OPEN && roomId && clientId) {
      ws.send(
        JSON.stringify({
          type: "demo_sync",
          action,
          data,
          sender: clientId,
          roomId,
          timestamp: Date.now(),
        })
      );
    }
  };

  // Handle incoming WebSocket sync messages
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "demo_sync" && message.sender !== clientId) {
          handleSyncAction(message.action, message.data);
        }
      } catch (e) {
        console.error("Failed to parse sync message:", e);
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [ws, clientId]);

  const handleSyncAction = (action: string, data: any) => {
    switch (action) {
      case "play":
        if (!isPlaying) startPlayback();
        break;
      case "pause":
        if (isPlaying) pausePlayback();
        break;
      case "seek":
        seekTo(data.time);
        break;
      case "step":
        setCurrentStep(data.step);
        setCurrentTime(data.time);
        updateStepContent(data.step);
        break;
    }
  };

  const updateStepContent = (stepIndex: number) => {
    if (demoData && stepIndex < demoData.steps.length) {
      const step = demoData.steps[stepIndex];
      setNarrationText(step.narration_text);
      setArticulatoryCue(step.articulatory_cue);
      setActiveAssets(step.asset_ids);
    }
  };

  const startPlayback = () => {
    if (!demoData) return;

    setIsPlaying(true);
    startTimeRef.current = Date.now() - currentTime;

    // Start TTS narration
    startNarration();

    // Start animation loop
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      setCurrentTime(elapsed);

      // Determine current step based on elapsed time
      let accumulatedTime = 0;
      let newStep = 0;
      for (let i = 0; i < demoData.steps.length; i++) {
        accumulatedTime += demoData.steps[i].duration_ms;
        if (elapsed < accumulatedTime) {
          newStep = i;
          break;
        }
      }

      if (newStep !== currentStep) {
        setCurrentStep(newStep);
        updateStepContent(newStep);
        sendSyncMessage("step", { step: newStep, time: elapsed });
      }

      // Check if playback is complete
      if (elapsed >= demoData.total_duration_ms) {
        pausePlayback();
        setCurrentTime(demoData.total_duration_ms);
        return;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    sendSyncMessage("play", {});
  };

  const pausePlayback = () => {
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    window.speechSynthesis.cancel();
    sendSyncMessage("pause", {});
  };

  const seekTo = (time: number) => {
    if (!demoData) return;

    setCurrentTime(time);
    startTimeRef.current = Date.now() - time;

    // Determine current step
    let accumulatedTime = 0;
    let newStep = 0;
    for (let i = 0; i < demoData.steps.length; i++) {
      accumulatedTime += demoData.steps[i].duration_ms;
      if (time < accumulatedTime) {
        newStep = i;
        break;
      }
    }

    if (newStep !== currentStep) {
      setCurrentStep(newStep);
      updateStepContent(newStep);
    }

    // Restart narration if playing
    if (isPlaying) {
      startNarration();
    }

    sendSyncMessage("seek", { time });
  };

  const startNarration = () => {
    if (!demoData) return;

    // Stop any existing audio/speech
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis.cancel();

    // Try server-generated audio first
    if (demoData.narration_audio_url) {
      const audio = new Audio(demoData.narration_audio_url);
      audioRef.current = audio;
      audio.play().catch((e) => {
        console.error("Server TTS audio playback failed, falling back to browser TTS:", e);
        // Gracefully fall back to browser TTS without error popup
        useBrowserTTSFallback();
      });
    } 
    // Fallback to browser Web Speech API
    else if (demoData.tts_fallback_info?.use_browser_tts) {
      useBrowserTTSFallback();
    }
  };

  const useBrowserTTSFallback = () => {
    if (!demoData) return;
    
    try {
      const fullNarration = demoData.steps.map((s) => s.narration_text).join(" ");
      const utterance = new SpeechSynthesisUtterance(fullNarration);
      utterance.lang = demoData.tts_fallback_info?.preferred_voice || "en-US";
      utterance.rate = 0.9; // Slightly slower for clarity
      
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Browser TTS fallback failed:", e);
      // Continue without audio - no error popup to user
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pausePlayback();
    } else {
      startPlayback();
    }
  };

  const handleAttachToMilestone = async () => {
    if (!selectedMilestone || !demoData || !onAttach) return;

    setIsAttaching(true);
    try {
      const result = await onAttach(demoData.id, selectedMilestone);
      if (result) {
        setAttachmentSuccess(true);
        console.log("Demo attached to milestone:", result);
      }
    } catch (error) {
      console.error("Failed to attach demo to milestone:", error);
      alert("Failed to attach demo to milestone. Please try again.");
    } finally {
      setIsAttaching(false);
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!demoData) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * demoData.total_duration_ms;
    
    seekTo(newTime);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${seconds}.${milliseconds.toString().padStart(2, "0")}`;
  };

  if (!demoData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-white">
              Articulation Demo: {demoData.phoneme}
            </h2>
            {demoData.word && (
              <p className="text-slate-400 text-sm">Word: {demoData.word}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Articulatory Visualization Area */}
          <div className="bg-slate-900 rounded-lg p-8 mb-6 min-h-[300px] flex items-center justify-center border border-slate-700">
            <div className="text-center">
              {/* Placeholder for SVG-based articulatory visualization */}
              <div className="mb-4">
                <div className="inline-block bg-indigo-500/20 rounded-full p-6 mb-4">
                  <svg className="w-16 h-16 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.828-2.828" />
                  </svg>
                </div>
              </div>
              
              {/* Current Step Indicator */}
              <div className="text-white text-lg font-semibold mb-2">
                Step {currentStep + 1} of {demoData.steps.length}
              </div>
              
              {/* Articulatory Cue */}
              <div className="text-indigo-400 text-xl font-bold mb-4">
                {articulatoryCue}
              </div>
              
              {/* Active Assets Debug */}
              <div className="text-xs text-slate-500 mb-4">
                Active assets: {activeAssets.join(", ")}
              </div>
              
              {/* Narration Text */}
              <div className="text-slate-300 text-lg max-w-md mx-auto">
                {narrationText}
              </div>
            </div>
          </div>

          {/* Timeline Controls */}
          <div className="space-y-4">
            {/* Progress Bar */}
            <div
              className="relative h-2 bg-slate-700 rounded-full cursor-pointer"
              onClick={handleTimelineClick}
            >
              <div
                className="absolute h-full bg-indigo-500 rounded-full transition-all"
                style={{
                  width: `${(currentTime / demoData.total_duration_ms) * 100}%`,
                }}
              />
            </div>

            {/* Time Display */}
            <div className="flex justify-between text-sm text-slate-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(demoData.total_duration_ms)}</span>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => seekTo(0)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Restart"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              <button
                onClick={handlePlayPause}
                className="p-3 bg-indigo-600 hover:bg-indigo-700 rounded-full text-white transition-colors"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => seekTo(demoData.total_duration_ms)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="End"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Step Navigation */}
            <div className="flex justify-center gap-2">
              {demoData.steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const stepStartTime = demoData.steps
                      .slice(0, index)
                      .reduce((sum, step) => sum + step.duration_ms, 0);
                    seekTo(stepStartTime);
                  }}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentStep
                      ? "bg-indigo-500"
                      : "bg-slate-600 hover:bg-slate-500"
                  }`}
                  title={`Step ${index + 1}`}
                />
              ))}
            </div>

            {/* Milestone Attachment */}
            {milestones.length > 0 && onAttach && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="flex items-center gap-3">
                  <select
                    value={selectedMilestone}
                    onChange={(e) => setSelectedMilestone(e.target.value)}
                    className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isAttaching || attachmentSuccess}
                  >
                    <option value="">Attach to Target Milestone</option>
                    {milestones.map((milestone) => (
                      <option key={milestone.id} value={milestone.id}>
                        {milestone.title}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAttachToMilestone}
                    disabled={!selectedMilestone || isAttaching || attachmentSuccess}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:text-slate-500 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors text-sm"
                  >
                    {isAttaching ? "Attaching..." : attachmentSuccess ? "✓ Attached" : "Attach"}
                  </button>
                </div>
                {attachmentSuccess && (
                  <div className="mt-2 p-2 bg-emerald-500/20 border border-emerald-500 rounded-lg">
                    <p className="text-emerald-400 text-xs font-medium">
                      Demo successfully linked to milestone
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer with TTS Status */}
        <div className="bg-slate-900 px-6 py-3 border-t border-slate-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">
              {demoData.narration_audio_url ? (
                <span className="text-emerald-400">Server TTS Audio</span>
              ) : demoData.tts_fallback_info?.use_browser_tts ? (
                <span className="text-amber-400">Browser TTS Fallback</span>
              ) : (
                <span className="text-slate-500">No Audio</span>
              )}
            </span>
            <span className="text-slate-500">
              ID: {demoData.id.slice(0, 8)}...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
