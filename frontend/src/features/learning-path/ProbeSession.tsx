import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Target, CheckCircle2, ArrowRight, X } from "lucide-react";
import axios from "axios";

const API_BASE = "http://localhost:8000/api";

interface ProbeSessionProps {
  milestoneId: string;
  caseId: string;
  phoneme: string;
  onComplete: (status: "generalized" | "trained", extraItems?: string[]) => void;
  onCancel: () => void;
}

interface ProbeItem {
  display_text: string;
  instructions: string;
}

export default function ProbeSession({
  milestoneId,
  caseId,
  phoneme,
  onComplete,
  onCancel,
}: ProbeSessionProps) {
  const [step, setStep] = useState<"loading" | "challenge" | "passed" | "continue">("loading");
  const [probeItem, setProbeItem] = useState<ProbeItem | null>(null);
  const [outcomeData, setOutcomeData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch probe item on mount
    fetchProbeItem();
  }, [milestoneId, phoneme]);

  const fetchProbeItem = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_BASE}/learning/milestones/${milestoneId}/checkpoint`,
        {
          case_id: caseId,
          phoneme: phoneme,
          audio_or_text: "",
        }
      );

      if (response.data.phase === "probe_served") {
        setProbeItem(response.data.item);
        setStep("challenge");
      } else {
        // Not ready for checkpoint
        setOutcomeData(response.data);
        setStep("continue");
      }
    } catch (err) {
      console.error("Failed to fetch probe item:", err);
      setOutcomeData({ message: "Unable to load checkpoint. Please try again." });
      setStep("continue");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAttempt = async () => {
    if (!probeItem) return;

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_BASE}/learning/milestones/${milestoneId}/checkpoint`,
        {
          case_id: caseId,
          phoneme: phoneme,
          audio_or_text: probeItem.display_text,
        }
      );

      if (response.data.phase === "probe_scored") {
        setOutcomeData(response.data);
        if (response.data.result === "pass") {
          setStep("passed");
        } else {
          setStep("continue");
        }
      }
    } catch (err) {
      console.error("Failed to submit probe attempt:", err);
      setOutcomeData({ message: "Unable to submit attempt. Please try again." });
      setStep("continue");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    if (outcomeData) {
      const status = outcomeData.milestone_status as "generalized" | "trained";
      const extraItems = outcomeData.extra_practice_items as string[] | undefined;
      onComplete(status, extraItems);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="text-gray-500">Loading checkpoint...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative"
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <AnimatePresence mode="wait">
          {step === "challenge" && probeItem && (
            <motion.div
              key="challenge"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="mb-6">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Target className="w-8 h-8 text-purple-600" />
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Checkpoint Challenge</h3>
                <p className="text-gray-600">Say this word out loud:</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8 mb-6 border-2 border-purple-200">
                <div className="text-6xl font-bold text-gray-900 mb-4">
                  {probeItem.display_text}
                </div>
                <p className="text-gray-600 text-sm">{probeItem.instructions}</p>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleSubmitAttempt}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg"
                >
                  🎤 I Said It!
                </button>
                <button
                  onClick={onCancel}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-4 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {step === "passed" && (
            <motion.div
              key="passed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <div className="mb-6">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                >
                  <Star className="w-14 h-14 text-white fill-white" />
                </motion.div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">🎉 New Badge Unlocked!</h3>
                <p className="text-gray-600 text-lg">
                  Generalization Star - You mastered this sound on a brand new word!
                </p>
              </div>

              {outcomeData?.badge_awarded && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl p-6 mb-6"
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl">🏆</span>
                    <p className="text-yellow-800 font-bold text-lg">
                      {outcomeData.badge?.title || "Sound Master Badge"}
                    </p>
                    <span className="text-3xl">🏆</span>
                  </div>
                </motion.div>
              )}

              <button
                onClick={handleComplete}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-bold transition-colors flex items-center gap-2 mx-auto shadow-lg"
              >
                Continue Journey
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {step === "continue" && (
            <motion.div
              key="continue"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">💪 Great Effort!</h3>
                <p className="text-gray-600">
                  {outcomeData?.message || "Let's reinforce this sound with a few extra words."}
                </p>
              </div>

              {outcomeData?.extra_practice_items && outcomeData.extra_practice_items.length > 0 && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                  <p className="text-blue-800 font-bold mb-4">Extra Practice Words:</p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {outcomeData.extra_practice_items.map((word: string, index: number) => (
                      <motion.span
                        key={index}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white border-2 border-blue-300 text-blue-700 px-4 py-2 rounded-full text-sm font-bold shadow-sm"
                      >
                        {word}
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleComplete}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-colors shadow-lg"
              >
                Back to Practice
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
