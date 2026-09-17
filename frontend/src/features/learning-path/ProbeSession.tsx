import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Target, CheckCircle2, ArrowRight, X, RotateCcw, Mic } from "lucide-react";
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
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white border border-[#A7E3D5] rounded-[14px] p-8 text-center shadow-md">
          <div className="text-[#334155] font-semibold">Loading checkpoint...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white border border-[#A7E3D5] rounded-[14px] shadow-md max-w-lg w-full p-6 relative"
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-[#334155] hover:text-[#0F172A] transition-colors"
        >
          <X className="w-6 h-6" strokeWidth={1.75} />
        </button>

        <AnimatePresence mode="wait">
          {step === "challenge" && probeItem && (
            <motion.div
              key="challenge"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="text-center"
            >
              {/* Section Label */}
              <div className="mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">GENERALIZATION PROBE</h3>
              </div>

              {/* Step Indicator */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-[#0D9488] text-white flex items-center justify-center text-sm font-bold">1</div>
                <div className="w-8 h-8 rounded-full bg-[#E2E8F0] text-[#0F172A] flex items-center justify-center text-sm font-bold">2</div>
              </div>

              <div className="mb-6">
                <div className="w-16 h-16 bg-[#CCFBF1] border border-[#0D9488] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-[#0D9488]" strokeWidth={1.75} />
                </div>
                <h3 className="text-2xl font-bold text-[#0F172A] mb-2">Generalization probe</h3>
                <p className="text-[#334155] font-medium">Say this word out loud:</p>
              </div>

              <div className="bg-[#F0FDFA] border border-[#A7E3D5] rounded-[12px] p-8 mb-6">
                <div className="text-3xl font-bold text-[#0F172A] mb-3">
                  {probeItem.display_text}
                </div>
                <p className="text-sm font-medium text-[#334155]">{probeItem.instructions}</p>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleSubmitAttempt}
                  disabled={loading}
                  className="bg-[#1E3A5F] hover:bg-[#2E5A88] disabled:bg-[#E2E8F0] disabled:text-[#64748B] text-white font-semibold rounded-lg px-4 py-2 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Mic className="w-5 h-5" strokeWidth={1.75} />
                  Submit
                </button>
                <button
                  onClick={onCancel}
                  className="bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#A7E3D5] font-semibold rounded-lg px-4 py-2 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {step === "passed" && (
            <motion.div
              key="passed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="text-center"
            >
              <div className="mb-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="w-20 h-20 bg-[#CCFBF1] border border-[#0D9488] rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Award className="w-10 h-10 text-[#0D9488]" strokeWidth={1.75} />
                </motion.div>
                <h3 className="text-2xl font-bold text-[#0F172A] mb-2">Probe complete</h3>
                <p className="text-[#334155] text-base font-medium">
                  Sound generalized. You have mastered this sound on a new word.
                </p>
              </div>

              {outcomeData?.badge_awarded && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="bg-[#ECFDF5] border border-[#16A34A] text-[#0F172A] rounded-[12px] p-6 mb-6"
                >
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-[#16A34A]" strokeWidth={1.75} />
                    <p className="text-[#0F172A] font-bold text-lg">
                      {outcomeData.badge?.title || "Sound Master Badge"}
                    </p>
                    <CheckCircle2 className="w-6 h-6 text-[#16A34A]" strokeWidth={1.75} />
                  </div>
                </motion.div>
              )}

              <button
                onClick={handleComplete}
                className="bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold rounded-lg px-4 py-2 transition-colors flex items-center gap-2 mx-auto shadow-sm"
              >
                Continue
                <ArrowRight className="w-5 h-5 text-white" strokeWidth={1.75} />
              </button>
            </motion.div>
          )}

          {step === "continue" && (
            <motion.div
              key="continue"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="text-center"
            >
              <div className="mb-6">
                <div className="w-20 h-20 bg-[#FEF3C7] border border-[#FDE68A] rounded-full flex items-center justify-center mx-auto mb-4">
                  <RotateCcw className="w-10 h-10 text-[#D97706]" strokeWidth={1.75} />
                </div>
                <h3 className="text-2xl font-bold text-[#0F172A] mb-2">Additional practice required</h3>
                <p className="text-[#334155] font-medium">
                  {outcomeData?.message || "Let's reinforce this sound with additional practice."}
                </p>
              </div>

              {outcomeData?.extra_practice_items && outcomeData.extra_practice_items.length > 0 && (
                <div className="bg-[#FFFBEB] border border-[#D97706] text-[#0F172A] rounded-[12px] p-6 mb-6">
                  <p className="text-[#0F172A] font-bold mb-4">Extra practice words:</p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {outcomeData.extra_practice_items.map((word: string, index: number) => (
                      <motion.span
                        key={index}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.05, duration: 0.15, ease: "easeOut" }}
                        className="bg-white border border-[#A7E3D5] text-[#0F172A] px-4 py-2 rounded-full text-sm font-semibold shadow-sm"
                      >
                        {word}
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleComplete}
                className="bg-[#1E3A5F] hover:bg-[#2E5A88] text-white font-semibold rounded-lg px-4 py-2 transition-colors shadow-sm"
              >
                Back to practice
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
