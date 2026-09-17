import { useState, useEffect } from 'react';
import { Star, Send } from 'lucide-react';

interface Feedback {
  id: string;
  case_id: string;
  session_id: string;
  rating: number;
  satisfaction_level: string;
  comments: string;
  submitted_at: string;
}

interface FeedbackFormProps {
  caseId: string;
}

export default function FeedbackForm({ caseId }: FeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [satisfactionLevel, setSatisfactionLevel] = useState('');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pastFeedback, setPastFeedback] = useState<Feedback[]>([]);

  useEffect(() => {
    fetchPastFeedback();
  }, [caseId]);

  const fetchPastFeedback = async () => {
    try {
      const response = await fetch(`http://localhost:8000/docs/feedback/${caseId}`);
      if (response.ok) {
        const data = await response.json();
        setPastFeedback(data);
      }
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0 || !satisfactionLevel || !comments.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:8000/docs/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: caseId,
          session_id: 'SESSION-001', // Mock session ID
          rating,
          satisfaction_level: satisfactionLevel,
          comments
        })
      });

      if (response.ok) {
        // Reset form
        setRating(0);
        setSatisfactionLevel('');
        setComments('');
        // Refresh past feedback
        await fetchPastFeedback();
        alert('Feedback submitted successfully!');
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={`star-${star}`}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="focus:outline-none"
          >
            <Star
              className={`w-8 h-8 ${
                star <= (hoverRating || rating)
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const getSatisfactionBadgeColor = (level: string) => {
    switch (level) {
      case 'very_satisfied':
        return 'bg-green-100 text-green-800';
      case 'satisfied':
        return 'bg-blue-100 text-blue-800';
      case 'neutral':
        return 'bg-gray-100 text-gray-800';
      case 'dissatisfied':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSatisfactionLabel = (level: string) => {
    switch (level) {
      case 'very_satisfied':
        return 'Very Satisfied';
      case 'satisfied':
        return 'Satisfied';
      case 'neutral':
        return 'Neutral';
      case 'dissatisfied':
        return 'Dissatisfied';
      default:
        return level;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Patient & Guardian Session Feedback</h1>
        <div className="mt-2 inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
          Submitted by: Parent/Guardian
        </div>
      </div>

      {/* Feedback Form */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Rating
          </label>
          {renderStars()}
          <p className="text-sm text-gray-500 mt-1">
            {rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : 'Select a rating'}
          </p>
        </div>

        {/* Satisfaction Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Satisfaction Level
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'very_satisfied', label: 'Very Satisfied' },
              { value: 'satisfied', label: 'Satisfied' },
              { value: 'neutral', label: 'Neutral' },
              { value: 'dissatisfied', label: 'Dissatisfied' }
            ].map((option) => (
              <button
                key={`satisfaction-${option.value}`}
                onClick={() => setSatisfactionLevel(option.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  satisfactionLevel === option.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Comments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comments
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="How was today's session? Any observations from home?"
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          <span>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
        </button>
      </div>

      {/* Past Feedback */}
      {pastFeedback.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Past Feedback</h2>
          {pastFeedback.map((feedback, index) => (
            <div key={`feedback-${feedback.id}-${index}`} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={`feedback-star-${feedback.id}-${star}`}
                        className={`w-4 h-4 ${
                          star <= feedback.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSatisfactionBadgeColor(feedback.satisfaction_level)}`}>
                    {getSatisfactionLabel(feedback.satisfaction_level)}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(feedback.submitted_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-700">{feedback.comments}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
