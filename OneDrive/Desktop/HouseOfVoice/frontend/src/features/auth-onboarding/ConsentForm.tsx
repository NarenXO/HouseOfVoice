import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useLanguage } from '../../shared/LanguageContext';
import { Mic, Users, TrendingUp, CheckCircle, XCircle } from 'lucide-react';

interface ConsentFormData {
  recording_consent: boolean;
  supervisor_presence_consent: boolean;
  declined_reason: string;
}

interface ConsentFormProps {
  userId: string;
  onSuccess: () => void;
  demoMode?: boolean;
}

export function ConsentForm({ userId, onSuccess, demoMode = false }: ConsentFormProps) {
  const { t } = useLanguage();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ConsentFormData>();
  const [recordingConsent, setRecordingConsent] = useState<boolean | null>(demoMode ? true : null);
  const [supervisorConsent, setSupervisorConsent] = useState<boolean | null>(demoMode ? true : null);

  const onSubmit = async (data: ConsentFormData) => {
    try {
      const response = await fetch('/api/auth/baseline-consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          recording_consent: recordingConsent || false,
          supervisor_presence_consent: supervisorConsent || false,
          declined_reason: data.declined_reason
        }),
      });

      const text = await response.text();
      let result: any = {};
      try {
        result = text ? JSON.parse(text) : {};
      } catch (err) {
        console.error("Non-JSON response:", text);
      }

      if (!response.ok) {
        const errorMessage = result.detail || result.message || `Server error (${response.status})`;
        alert(`Consent submission failed: ${errorMessage}`);
        return;
      }

      onSuccess();
    } catch (error) {
      alert(`Consent submission failed: ${error}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8"
    >
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[#0D9488] mb-6">RECORDING & PRIVACY CONSENT</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Recording Consent */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-[#F4F6F8] rounded-lg p-3">
              <Mic className="w-6 h-6 text-[#0D9488]" strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#0F172A] mb-2">Audio Recording Consent</h3>
              <p className="text-sm text-[#64748B]">
                Used for AI speech analysis and tracking articulation progress. Your voice recordings help personalize therapy exercises and measure improvement over time.
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRecordingConsent(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all ${
                recordingConsent === true
                  ? 'bg-[#0D9488] text-white border-[#0D9488]'
                  : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#0D9488]'
              } border`}
            >
              <CheckCircle className="w-5 h-5" strokeWidth={1.75} />
              I Consent
            </button>
            <button
              type="button"
              onClick={() => setRecordingConsent(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all ${
                recordingConsent === false
                  ? 'bg-[#64748B] text-white border-[#64748B]'
                  : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#64748B]'
              } border`}
            >
              <XCircle className="w-5 h-5" strokeWidth={1.75} />
              I Decline
            </button>
          </div>
          
          {recordingConsent === false && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4"
            >
              <label className="block text-sm font-medium text-[#0F172A] mb-2">
                Optional Reason for Declining
              </label>
              <textarea
                {...register('declined_reason')}
                rows={2}
                className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
                placeholder="Please share your reason (e.g., 'Prefer manual notes')"
              />
              <p className="text-xs text-[#64748B] mt-2">
                Note: Declining recording still allows all therapy activities with manual clinician notes.
              </p>
            </motion.div>
          )}
        </div>

        {/* Supervisor Presence Consent */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-[#F4F6F8] rounded-lg p-3">
              <Users className="w-6 h-6 text-[#0D9488]" strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#0F172A] mb-2">Supervisor Presence Consent</h3>
              <p className="text-sm text-[#64748B]">
                Licensed supervisors may review sessions for quality assurance and provide guidance to therapists. This helps maintain high standards of care.
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setSupervisorConsent(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all ${
                supervisorConsent === true
                  ? 'bg-[#0D9488] text-white border-[#0D9488]'
                  : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#0D9488]'
              } border`}
            >
              <CheckCircle className="w-5 h-5" strokeWidth={1.75} />
              I Consent
            </button>
            <button
              type="button"
              onClick={() => setSupervisorConsent(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all ${
                supervisorConsent === false
                  ? 'bg-[#64748B] text-white border-[#64748B]'
                  : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#64748B]'
              } border`}
            >
              <XCircle className="w-5 h-5" strokeWidth={1.75} />
              I Decline
            </button>
          </div>
        </div>

        {/* Progress Checkpoints Info */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="bg-[#F4F6F8] rounded-lg p-3">
              <TrendingUp className="w-6 h-6 text-[#0D9488]" strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#0F172A] mb-2">Progress Checkpoints</h3>
              <p className="text-sm text-[#64748B]">
                Practice activities include assessment items to measure phoneme improvements and track your progress over time. These checkpoints help tailor therapy to your specific needs.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#F4F6F8] border border-[#E2E8F0] rounded-lg p-4">
          <p className="text-sm text-[#64748B]">
            <strong>Important:</strong> You can change these consent preferences at any time through your account settings.
          </p>
        </div>

        <button
          type="submit"
          disabled={recordingConsent === null || supervisorConsent === null || isSubmitting}
          className="w-full bg-[#0D9488] text-white py-3 rounded-lg hover:bg-[#0D9488]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ borderRadius: '8px' }}
        >
          {isSubmitting ? 'Submitting...' : 'Complete Onboarding'}
        </button>
      </form>
    </motion.div>
  );
}
