import { useState } from "react";

interface ModuleScene {
  scene_number: number;
  duration_ms: number;
  asset_ids: string[];
  narration_text: string;
  articulatory_cue: string;
  transition_type: string;
}

interface ModuleData {
  id: string;
  phoneme: string;
  age_band: string;
  language: string;
  title: string;
  total_duration_ms: number;
  scenes: ModuleScene[];
  narration_audio_url?: string;
  source: string;
  approved: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  tts_fallback_info?: {
    use_browser_tts: boolean;
    speech_synthesis_api: boolean;
    preferred_voice: string;
    fallback_reason: string;
  };
}

interface ModuleApprovalWorkflowProps {
  moduleData: ModuleData;
  milestones?: Array<{
    id: string;
    title: string;
    goal: string;
    status: string;
  }>;
  onAttach?: (moduleId: string, milestoneId: string) => Promise<any>;
  onApprove: (approved: boolean) => void;
  onClose: () => void;
}

export default function ModuleApprovalWorkflow({
  moduleData,
  milestones = [],
  onAttach,
  onApprove,
  onClose,
}: ModuleApprovalWorkflowProps) {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<string>("");
  const [isAttaching, setIsAttaching] = useState(false);
  const [attachmentSuccess, setAttachmentSuccess] = useState(false);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  };

  const totalDuration = Math.floor(moduleData.total_duration_ms / 1000);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await fetch(`/api/session/modules/${moduleData.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          approved: true,
          approved_by: "therapist_current",
        }),
      });
      onApprove(true);
    } catch (error) {
      console.error("Failed to approve module:", error);
      alert("Failed to approve module. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await fetch(`/api/session/modules/${moduleData.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          approved: false,
          approved_by: "therapist_current",
        }),
      });
      onApprove(false);
    } catch (error) {
      console.error("Failed to reject module:", error);
      alert("Failed to reject module. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const nextScene = () => {
    if (currentScene < moduleData.scenes.length - 1) {
      setCurrentScene(currentScene + 1);
    }
  };

  const prevScene = () => {
    if (currentScene > 0) {
      setCurrentScene(currentScene - 1);
    }
  };

  const currentSceneData = moduleData.scenes[currentScene];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-white">Module Review & Approval</h2>
            <p className="text-slate-400 text-sm">{moduleData.title}</p>
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
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Module Preview */}
            <div className="space-y-4">
              {/* Scene Preview */}
              <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Scene {currentScene + 1} of {moduleData.scenes.length}
                  </h3>
                  <span className="text-sm text-slate-400">
                    Duration: {formatTime(currentSceneData.duration_ms)}
                  </span>
                </div>

                {/* Visual Preview Placeholder */}
                <div className="bg-slate-800 rounded-lg p-8 mb-4 min-h-[250px] flex items-center justify-center border border-slate-600">
                  <div className="text-center">
                    <div className="inline-block bg-indigo-500/20 rounded-full p-6 mb-4">
                      <svg className="w-16 h-16 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.828-2.828" />
                      </svg>
                    </div>
                    <div className="text-white text-lg font-semibold mb-2">
                      {currentSceneData.articulatory_cue}
                    </div>
                    <div className="text-slate-400 text-sm mb-2">
                      Transition: {currentSceneData.transition_type}
                    </div>
                    <div className="text-xs text-slate-500">
                      Assets: {currentSceneData.asset_ids.join(", ")}
                    </div>
                  </div>
                </div>

                {/* Narration */}
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
                  <h4 className="text-sm font-semibold text-indigo-400 mb-2">Narration:</h4>
                  <p className="text-slate-300">{currentSceneData.narration_text}</p>
                </div>
              </div>

              {/* Scene Navigation */}
              <div className="flex items-center justify-between bg-slate-900 rounded-lg p-4 border border-slate-700">
                <button
                  onClick={prevScene}
                  disabled={currentScene === 0}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 rounded-lg text-white transition-colors"
                >
                  Previous
                </button>
                <div className="flex gap-2">
                  {moduleData.scenes.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentScene(index)}
                      className={`w-8 h-8 rounded-full transition-colors ${
                        index === currentScene
                          ? "bg-indigo-500 text-white"
                          : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={nextScene}
                  disabled={currentScene === moduleData.scenes.length - 1}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 rounded-lg text-white transition-colors"
                >
                  Next
                </button>
              </div>
            </div>

            {/* Right: Module Details & Approval */}
            <div className="space-y-4">
              {/* Module Details */}
              <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Module Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phoneme:</span>
                    <span className="text-white font-medium">{moduleData.phoneme}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Age Band:</span>
                    <span className="text-white font-medium">{moduleData.age_band}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Language:</span>
                    <span className="text-white font-medium">{moduleData.language}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Duration:</span>
                    <span className="text-white font-medium">{totalDuration}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Scenes:</span>
                    <span className="text-white font-medium">{moduleData.scenes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Source:</span>
                    <span className="text-white font-medium">{moduleData.source}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Created:</span>
                    <span className="text-white font-medium">
                      {new Date(moduleData.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Audio:</span>
                    <span className="text-emerald-400 font-medium">
                      {moduleData.narration_audio_url ? "Server TTS" : "Browser Fallback"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Milestone Attachment */}
              {milestones.length > 0 && onAttach && (
                <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Attach to Milestone</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Link this module to a learning path milestone for progress tracking.
                  </p>

                  <div className="space-y-3">
                    <select
                      value={selectedMilestone}
                      onChange={(e) => setSelectedMilestone(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={isAttaching || attachmentSuccess}
                    >
                      <option value="">Select Target Milestone</option>
                      {milestones.map((milestone) => (
                        <option key={milestone.id} value={milestone.id}>
                          {milestone.title} - {milestone.status}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={async () => {
                        if (!selectedMilestone) return;
                        setIsAttaching(true);
                        try {
                          const result = await onAttach(moduleData.id, selectedMilestone);
                          if (result) {
                            setAttachmentSuccess(true);
                            console.log("Module attached to milestone:", result);
                          }
                        } catch (error) {
                          console.error("Failed to attach module to milestone:", error);
                          alert("Failed to attach module to milestone. Please try again.");
                        } finally {
                          setIsAttaching(false);
                        }
                      }}
                      disabled={!selectedMilestone || isAttaching || attachmentSuccess}
                      className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 disabled:text-slate-500 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {isAttaching ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Attaching...
                        </>
                      ) : attachmentSuccess ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Attached to Milestone
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          Attach to Milestone
                        </>
                      )}
                    </button>

                    {attachmentSuccess && (
                      <div className="p-3 bg-emerald-500/20 border border-emerald-500 rounded-lg">
                        <p className="text-emerald-400 text-sm font-medium">
                          ✓ Module successfully linked to milestone
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Approval Actions */}
              <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Approval Decision</h3>
                <p className="text-slate-400 text-sm mb-6">
                  Review the module content above. Once approved, this module will be
                  available in the library for all therapists to use.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={handleApprove}
                    disabled={isProcessing || moduleData.approved}
                    className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Approve Module
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleReject}
                    disabled={isProcessing}
                    className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject Module
                      </>
                    )}
                  </button>
                </div>

                {moduleData.approved && (
                  <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500 rounded-lg">
                    <p className="text-emerald-400 text-sm font-medium">
                      ✓ This module has been approved
                    </p>
                    {moduleData.approved_by && (
                      <p className="text-emerald-300 text-xs mt-1">
                        Approved by: {moduleData.approved_by}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Scene List */}
              <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Scene Overview</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {moduleData.scenes.map((scene, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border transition-colors ${
                        index === currentScene
                          ? "bg-indigo-500/20 border-indigo-500"
                          : "bg-slate-800 border-slate-700 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">
                          Scene {scene.scene_number}: {scene.articulatory_cue}
                        </span>
                        <span className="text-slate-400 text-sm">
                          {formatTime(scene.duration_ms)}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mt-1 truncate">
                        {scene.narration_text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
