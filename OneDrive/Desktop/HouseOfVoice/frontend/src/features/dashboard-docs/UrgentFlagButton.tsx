import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, X } from 'lucide-react';

interface UrgentFlag {
  id: string;
  case_id: string;
  raised_by: string;
  raised_at: string;
  note: string;
}

interface UrgentFlagButtonProps {
  caseId: string;
}

export default function UrgentFlagButton({ caseId }: UrgentFlagButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [flags, setFlags] = useState<UrgentFlag[]>([]);

  useEffect(() => {
    fetchFlags();
  }, [caseId]);

  const fetchFlags = async () => {
    try {
      const response = await fetch(`/api/docs/urgent-flags/${caseId}`);
      if (response.ok) {
        const data = await response.json();
        setFlags(data);
      }
    } catch (error) {
      console.error('Failed to fetch flags:', error);
    }
  };

  const handleSubmit = async () => {
    if (!note.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/docs/urgent-flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: caseId,
          raised_by: 'therapist-001', // Mock therapist ID
          note: note
        })
      });

      if (response.ok) {
        // Trigger pulse animation
        setShowPulse(true);
        setTimeout(() => setShowPulse(false), 2000);

        // Show toast
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);

        // Reset and close modal
        setNote('');
        setIsModalOpen(false);

        // Refresh flags
        await fetchFlags();
      }
    } catch (error) {
      console.error('Failed to create flag:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      {/* Flag Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors ${
          showPulse ? 'animate-pulse' : ''
        }`}
      >
        <Flag className="w-4 h-4" />
        <span>🚩 Flag Urgent Concern</span>
      </motion.button>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute top-full mt-2 right-0 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg whitespace-nowrap"
          >
            Urgent flag raised for {caseId}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Flag Urgent Concern</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Describe the concern..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={isSubmitting}
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !note.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Flag'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing Flags List */}
      {flags.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">Previous Urgent Flags:</p>
          {flags.map((flag, index) => (
            <div
              key={`flag-${flag.id}-${index}`}
              className="bg-red-50 border border-red-200 rounded-lg p-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{flag.note}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(flag.raised_at).toLocaleString()} by {flag.raised_by}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
