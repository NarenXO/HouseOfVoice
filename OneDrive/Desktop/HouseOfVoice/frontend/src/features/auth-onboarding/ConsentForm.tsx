import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useLanguage } from '../../shared/LanguageContext';
import { Mic, Users, BarChart3, CheckCircle, XCircle } from 'lucide-react';

interface ConsentFormData {
  recording_consent: boolean;
  supervisor_presence_consent: boolean;
  declined_reason: string;
}

interface ConsentFormProps {
  userId: string;
  onSuccess: () => void;
}

export function ConsentForm({ userId, onSuccess }: ConsentFormProps) {
  const { t } = useLanguage();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ConsentFormData>();
  const [recordingConsent, setRecordingConsent] = useState<boolean | null>(null);
  const [supervisorConsent, setSupervisorConsent] = useState<boolean | null>(null);

  const onSubmit = async (data: ConsentFormData) => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/baseline-consent', {
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

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(`Consent submission failed: ${error.detail}`);
      }
    } catch (error) {
      alert(`Consent submission failed: ${error}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl p-8"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Consent & Preferences</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Recording Consent */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-blue-100 rounded-lg p-3">
              <Mic className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-2">Audio Recording Consent</h3>
              <p className="text-sm text-gray-600">
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
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-green-500'
              } border`}
            >
              <CheckCircle className="w-5 h-5" />
              I Consent
            </button>
            <button
              type="button"
              onClick={() => setRecordingConsent(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all ${
                recordingConsent === false
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-red-500'
              } border`}
            >
              <XCircle className="w-5 h-5" />
              I Decline
            </button>
          </div>
          
          {recordingConsent === false && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4"
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Optional Reason for Declining
              </label>
              <textarea
                {...register('declined_reason')}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Please share your reason (e.g., 'Prefer manual notes')"
              />
              <p className="text-xs text-gray-500 mt-2">
                Note: Declining recording still allows all therapy activities with manual clinician notes.
              </p>
            </motion.div>
          )}
        </div>

        {/* Supervisor Presence Consent */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-purple-100 rounded-lg p-3">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-2">Supervisor Presence Consent</h3>
              <p className="text-sm text-gray-600">
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
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-green-500'
              } border`}
            >
              <CheckCircle className="w-5 h-5" />
              I Consent
            </button>
            <button
              type="button"
              onClick={() => setSupervisorConsent(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all ${
                supervisorConsent === false
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-red-500'
              } border`}
            >
              <XCircle className="w-5 h-5" />
              I Decline
            </button>
          </div>
        </div>

        {/* Progress Checkpoints Info */}
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="bg-teal-100 rounded-lg p-3">
              <BarChart3 className="w-6 h-6 text-teal-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-2">Progress Checkpoints</h3>
              <p className="text-sm text-gray-600">
                Practice activities include assessment items to measure phoneme improvements and track your progress over time. These checkpoints help tailor therapy to your specific needs.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> You can change these consent preferences at any time through your account settings.
          </p>
        </div>

        <button
          type="submit"
          disabled={recordingConsent === null || supervisorConsent === null || isSubmitting}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Complete Onboarding'}
        </button>
      </form>
    </motion.div>
  );
}
