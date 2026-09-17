import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, GraduationCap, Calendar, CheckCircle } from 'lucide-react';

interface CaseClosure {
  id: string;
  case_id: string;
  discharge_reason: string;
  discharge_notes: string;
  final_summary: {
    initial_speech_clarity: number;
    final_speech_clarity: number;
    improvement_percentage: number;
    milestones_completed: number;
    total_milestones: number;
    milestone_completion_rate: number;
    generalization_mastery: string;
    total_sessions: number;
    discharge_date: string;
  };
  closed_at: string;
  status: string;
}

interface FollowUpCheckin {
  id: string;
  case_id: string;
  prompted_at: string;
  response_text: string;
  progress_status: string;
  wants_followup_booking: boolean;
  created_at: string;
}

interface CaseClosurePanelProps {
  caseId: string;
}

export default function CaseClosurePanel({ caseId }: CaseClosurePanelProps) {
  const [caseClosure, setCaseClosure] = useState<CaseClosure | null>(null);
  const [dischargeReason, setDischargeReason] = useState('');
  const [dischargeNotes, setDischargeNotes] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  
  const [followUpResponse, setFollowUpResponse] = useState('');
  const [progressStatus, setProgressStatus] = useState('');
  const [wantsFollowupBooking, setWantsFollowupBooking] = useState(false);
  const [isSubmittingFollowup, setIsSubmittingFollowup] = useState(false);
  const [followups, setFollowups] = useState<FollowUpCheckin[]>([]);
  const [bookingIntentLogged, setBookingIntentLogged] = useState(false);

  useEffect(() => {
    fetchCaseStatus();
    fetchFollowups();
  }, [caseId]);

  const fetchCaseStatus = async () => {
    try {
      const response = await fetch(`http://localhost:8000/docs/case/${caseId}/closure`);
      if (response.ok) {
        const data = await response.json();
        setCaseClosure(data);
      }
    } catch (error) {
      console.error('Failed to fetch case status:', error);
    }
  };

  const fetchFollowups = async () => {
    try {
      const response = await fetch(`http://localhost:8000/docs/case/${caseId}/follow-ups`);
      if (response.ok) {
        const data = await response.json();
        setFollowups(data);
      }
    } catch (error) {
      console.error('Failed to fetch follow-ups:', error);
    }
  };

  const handleCloseCase = async () => {
    if (!dischargeReason || !dischargeNotes.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setIsClosing(true);
    try {
      const response = await fetch(`http://localhost:8000/docs/case/${caseId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: caseId,
          discharge_reason: dischargeReason,
          discharge_notes: dischargeNotes,
          therapist_id: 'therapist-001'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCaseClosure(data);
        setDischargeReason('');
        setDischargeNotes('');
      }
    } catch (error) {
      console.error('Failed to close case:', error);
      alert('Failed to close case');
    } finally {
      setIsClosing(false);
    }
  };

  const handleSubmitFollowup = async () => {
    if (!followUpResponse.trim() || !progressStatus) {
      alert('Please fill in all fields');
      return;
    }

    setIsSubmittingFollowup(true);
    try {
      const response = await fetch(`http://localhost:8000/docs/case/${caseId}/follow-up-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: caseId,
          response_text: followUpResponse,
          progress_status: progressStatus,
          wants_followup_booking: wantsFollowupBooking
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFollowups([...followups, data]);
        setFollowUpResponse('');
        setProgressStatus('');
        setWantsFollowupBooking(false);
        
        // Check if booking intent was logged
        if (data.wants_followup_booking || 
            data.progress_status === 'some_regression' || 
            data.progress_status === 'significant_difficulty') {
          setBookingIntentLogged(true);
        }
        
        alert('Follow-up response submitted successfully!');
      }
    } catch (error) {
      console.error('Failed to submit follow-up:', error);
      alert('Failed to submit follow-up');
    } finally {
      setIsSubmittingFollowup(false);
    }
  };

  const handleProgressStatusChange = (status: string) => {
    setProgressStatus(status);
    // Auto-check booking request for regression responses
    if (status === 'some_regression' || status === 'significant_difficulty') {
      setWantsFollowupBooking(true);
    }
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Case Discharge & Graduation Card */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Case Lifecycle & Discharge Summary</h2>
        
        {!caseClosure ? (
          /* Case Open - Closure Form */
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discharge Reason
              </label>
              <select
                value={dischargeReason}
                onChange={(e) => setDischargeReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select reason...</option>
                <option value="goals_achieved">Goals Achieved</option>
                <option value="transferred">Transferred</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discharge Summary Notes
              </label>
              <textarea
                value={dischargeNotes}
                onChange={(e) => setDischargeNotes(e.target.value)}
                placeholder="Summarize the case outcome and key achievements..."
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              onClick={handleCloseCase}
              disabled={isClosing}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <GraduationCap className="w-5 h-5" />
              <span>{isClosing ? 'Processing...' : 'Finalize Case Closure & Graduate Patient'}</span>
            </button>
          </div>
        ) : (
          /* Case Closed - Celebratory Banner */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Celebratory Banner */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg p-6 text-white">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-8 h-8" />
                <div>
                  <h3 className="text-xl font-bold">🎓 Case Successfully Completed & Closed</h3>
                  <p className="text-emerald-100 mt-1">Patient has graduated from therapy program</p>
                </div>
              </div>
            </div>

            {/* Discharge Summary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                <div className="text-sm text-emerald-600 font-medium">Speech Clarity Improvement</div>
                <div className="text-2xl font-bold text-emerald-900 mt-1">
                  +{caseClosure.final_summary.improvement_percentage}%
                </div>
                <div className="text-xs text-emerald-600 mt-1">
                  {caseClosure.final_summary.initial_speech_clarity}% → {caseClosure.final_summary.final_speech_clarity}%
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-blue-600 font-medium">Milestones Achieved</div>
                <div className="text-2xl font-bold text-blue-900 mt-1">
                  {caseClosure.final_summary.milestone_completion_rate}%
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {caseClosure.final_summary.milestones_completed}/{caseClosure.final_summary.total_milestones} completed
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="text-sm text-purple-600 font-medium">Generalization Mastery</div>
                <div className="text-2xl font-bold text-purple-900 mt-1">
                  {caseClosure.final_summary.generalization_mastery}
                </div>
                <div className="text-xs text-purple-600 mt-1">Skills transfer quality</div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="text-sm text-orange-600 font-medium">Total Sessions</div>
                <div className="text-2xl font-bold text-orange-900 mt-1">
                  {caseClosure.final_summary.total_sessions}
                </div>
                <div className="text-xs text-orange-600 mt-1">Therapy sessions completed</div>
              </div>
            </div>

            {/* Discharge Notes */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Discharge Clinical Notes</h4>
              <p className="text-sm text-gray-700">{caseClosure.discharge_notes}</p>
              <div className="text-xs text-gray-500 mt-2">
                Closed on {new Date(caseClosure.closed_at).toLocaleDateString()}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Section 2: Post-Discharge Follow-up Check-in Simulator */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Post-Discharge Follow-up Check-in</h2>
        <p className="text-sm text-gray-600 mb-6">
          Simulated 4 weeks later — Automated check-in asking: "How is speech progress maintaining in natural daily conversations at home/school?"
        </p>

        <div className="space-y-4">
          {/* Progress Status Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Progress Status
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'maintaining', label: 'Maintaining Well (No issues)' },
                { value: 'improving', label: 'Continuing to Improve' },
                { value: 'some_regression', label: 'Noticed Mild Regression' },
                { value: 'significant_difficulty', label: 'Need More Therapy Sessions' }
              ].map((option) => (
                <button
                  key={`progress-${option.value}`}
                  onClick={() => handleProgressStatusChange(option.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    progressStatus === option.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback Notes
            </label>
            <textarea
              value={followUpResponse}
              onChange={(e) => setFollowUpResponse(e.target.value)}
              placeholder="Describe how conversational speech sounds at home..."
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Follow-up Booking Request */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="followup-booking"
              checked={wantsFollowupBooking}
              onChange={(e) => setWantsFollowupBooking(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="followup-booking" className="text-sm text-gray-700">
              Request follow-up clinical re-evaluation consultation
            </label>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitFollowup}
            disabled={isSubmittingFollowup}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmittingFollowup ? 'Submitting...' : 'Submit Check-in Response'}
          </button>

          {/* Booking Intent Alert */}
          {bookingIntentLogged && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 border border-amber-200 rounded-lg p-4"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600" />
                <p className="text-sm text-amber-800">
                  📌 Re-booking Consultation Intent Logged — Ready for matching engine dispatch.
                </p>
              </div>
            </motion.div>
          )}

          {/* Past Follow-ups */}
          {followups.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-medium text-gray-900">Past Follow-up Responses</h3>
              {followups.map((followup, index) => (
                <div key={`followup-${followup.id}-${index}`} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      followup.progress_status === 'maintaining' || followup.progress_status === 'improving'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {followup.progress_status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(followup.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{followup.response_text}</p>
                  {followup.wants_followup_booking && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                      <Calendar className="w-3 h-3" />
                      <span>Follow-up booking requested</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
