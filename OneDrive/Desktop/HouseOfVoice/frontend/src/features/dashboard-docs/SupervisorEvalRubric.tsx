import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SupervisorEval {
  id: string;
  case_id: string;
  therapist_id: string;
  documentation_quality: number;
  therapy_planning: number;
  session_quality: number;
  clinical_reasoning: number;
  professional_communication: number;
  feedback_notes: string;
  average_score: number;
  evaluated_at: string;
}

interface SupervisorEvalRubricProps {
  caseId: string;
}

const DIMENSIONS = [
  {
    key: 'documentation_quality',
    label: 'Documentation Quality',
    description: 'Accuracy of SOAP notes, objective reporting'
  },
  {
    key: 'therapy_planning',
    label: 'Therapy Planning',
    description: 'Goal alignment, milestone progression'
  },
  {
    key: 'session_quality',
    label: 'Session Quality',
    description: 'Patient engagement, cueing hierarchy execution'
  },
  {
    key: 'clinical_reasoning',
    label: 'Clinical Reasoning',
    description: 'Adaptive intervention, data-driven decisions'
  },
  {
    key: 'professional_communication',
    label: 'Professional Communication',
    description: 'Parent summaries, interdisciplinary notes'
  }
];

export default function SupervisorEvalRubric({ caseId }: SupervisorEvalRubricProps) {
  const [ratings, setRatings] = useState({
    documentation_quality: 0,
    therapy_planning: 0,
    session_quality: 0,
    clinical_reasoning: 0,
    professional_communication: 0
  });
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pastEvaluations, setPastEvaluations] = useState<SupervisorEval[]>([]);

  useEffect(() => {
    fetchPastEvaluations();
  }, [caseId]);

  const fetchPastEvaluations = async () => {
    try {
      const response = await fetch(`/api/docs/supervisor-evaluations/${caseId}`);
      if (response.ok) {
        const data = await response.json();
        setPastEvaluations(data);
      }
    } catch (error) {
      console.error('Failed to fetch evaluations:', error);
    }
  };

  const calculateAverage = () => {
    const values = Object.values(ratings);
    const sum = values.reduce((acc, val) => acc + val, 0);
    return values.every(v => v > 0) ? (sum / values.length).toFixed(1) : '0.0';
  };

  const getPerformanceLabel = (score: number) => {
    if (score >= 4.5) return 'Exemplary';
    if (score >= 3.5) return 'Proficient';
    if (score >= 2.5) return 'Developing';
    if (score >= 1.5) return 'Needs Improvement';
    return 'Unsatisfactory';
  };

  const handleSubmit = async () => {
    if (Object.values(ratings).some(v => v === 0)) {
      alert('Please rate all dimensions');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/docs/supervisor-evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: caseId,
          therapist_id: 'therapist-001', // Mock therapist ID
          ...ratings,
          feedback_notes: feedbackNotes
        })
      });

      if (response.ok) {
        // Reset form
        setRatings({
          documentation_quality: 0,
          therapy_planning: 0,
          session_quality: 0,
          clinical_reasoning: 0,
          professional_communication: 0
        });
        setFeedbackNotes('');
        // Refresh past evaluations
        await fetchPastEvaluations();
        alert('Evaluation submitted successfully!');
      }
    } catch (error) {
      console.error('Failed to submit evaluation:', error);
      alert('Failed to submit evaluation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingChange = (dimension: string, value: number) => {
    setRatings(prev => ({ ...prev, [dimension]: value }));
  };

  const averageScore = parseFloat(calculateAverage());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Supervisor Clinical Evaluation Rubric</h1>
        <p className="text-sm text-gray-600 mt-1">
          Comprehensive clinical competency assessment across 5 core dimensions (1 = Unsatisfactory, 5 = Exemplary)
        </p>
      </div>

      {/* Live Average Score Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-lg p-4 ${
          averageScore >= 4.5
            ? 'bg-emerald-50 border border-emerald-200'
            : averageScore >= 3.5
            ? 'bg-blue-50 border border-blue-200'
            : averageScore >= 2.5
            ? 'bg-yellow-50 border border-yellow-200'
            : 'bg-red-50 border border-red-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-700">Overall Score: </span>
            <span className="text-2xl font-bold text-gray-900">
              {calculateAverage()} / 5.0
            </span>
            <span className="ml-2 text-sm font-medium text-gray-600">
              — {getPerformanceLabel(averageScore)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Evaluation Form */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        {DIMENSIONS.map((dimension, index) => (
          <motion.div
            key={`dimension-${dimension.key}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-3"
          >
            <div>
              <h3 className="font-semibold text-gray-900">{dimension.label}</h3>
              <p className="text-sm text-gray-600">{dimension.description}</p>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={`rating-${dimension.key}-${value}`}
                  onClick={() => handleRatingChange(dimension.key, value)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    ratings[dimension.key as keyof typeof ratings] === value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Feedback Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Clinical Guidance Notes
          </label>
          <textarea
            value={feedbackNotes}
            onChange={(e) => setFeedbackNotes(e.target.value)}
            placeholder="Provide specific feedback on strengths and areas for development..."
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
        </button>
      </div>

      {/* Past Evaluations */}
      {pastEvaluations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Past Evaluations</h2>
          {pastEvaluations.map((evaluation, index) => (
            <div key={`evaluation-${evaluation.id}-${index}`} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    Therapist: {evaluation.therapist_id}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    evaluation.average_score >= 4.5
                      ? 'bg-emerald-100 text-emerald-800'
                      : evaluation.average_score >= 3.5
                      ? 'bg-blue-100 text-blue-800'
                      : evaluation.average_score >= 2.5
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {evaluation.average_score.toFixed(1)} / 5.0
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(evaluation.evaluated_at).toLocaleString()}
                </span>
              </div>
              
              {/* Rubric Breakdown */}
              <div className="grid grid-cols-5 gap-2 mb-3">
                {DIMENSIONS.map((dim) => (
                  <div key={`eval-dim-${evaluation.id}-${dim.key}`} className="text-center">
                    <div className="text-xs text-gray-600 mb-1">{dim.label.split(' ')[0]}</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {evaluation[dim.key as keyof SupervisorEval] as number}
                    </div>
                  </div>
                ))}
              </div>

              {evaluation.feedback_notes && (
                <p className="text-sm text-gray-700">{evaluation.feedback_notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
