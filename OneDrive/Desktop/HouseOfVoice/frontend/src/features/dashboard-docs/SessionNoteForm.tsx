import React, { useState } from 'react';
import { ClipboardList, Plus, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SessionNoteFormProps {
  onSubmit?: (note: SavedNote) => void;
}

interface NoteData {
  case_id: string;
  session_id: string;
  activities: string[];
  patient_response: string;
  homework_assigned: string;
  clinical_observations: string;
}

export interface SavedNote {
  id: string;
  case_id: string;
  session_id: string;
  activities: string[];
  patient_response: string;
  homework_assigned: string;
  clinical_observations: string;
  created_at: string;
}

export default function SessionNoteForm({ onSubmit }: SessionNoteFormProps) {
  const [caseId, setCaseId] = useState('CASE-001');
  const [sessionId, setSessionId] = useState('sess_mock_001');
  const [activities, setActivities] = useState<string[]>([]);
  const [currentActivity, setCurrentActivity] = useState('');
  const [patientResponse, setPatientResponse] = useState('');
  const [homeworkAssigned, setHomeworkAssigned] = useState('');
  const [clinicalObservations, setClinicalObservations] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedNote, setSavedNote] = useState<SavedNote | null>(null);

  const handleAddActivity = (): void => {
    if (currentActivity.trim()) {
      setActivities([...activities, currentActivity.trim()]);
      setCurrentActivity('');
    }
  };

  const handleRemoveActivity = (index: number): void => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const handleActivityKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddActivity();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    const noteData: NoteData = {
      case_id: caseId,
      session_id: sessionId,
      activities,
      patient_response: patientResponse,
      homework_assigned: homeworkAssigned,
      clinical_observations: clinicalObservations,
    };

    try {
      // TODO: update to /api/docs/session-notes at integration
      const response = await fetch('http://localhost:8000/session-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });

      if (response.ok) {
        const savedData: SavedNote = await response.json();
        setSavedNote(savedData);
        setShowSuccess(true);
        
        // Clear form
        setActivities([]);
        setPatientResponse('');
        setHomeworkAssigned('');
        setClinicalObservations('');
        
        if (onSubmit) {
          onSubmit(savedData);
        }

        // Hide success banner after 3 seconds
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error saving session note:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <p className="text-green-800 font-medium">Session note saved successfully!</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <ClipboardList className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Session Documentation</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Case ID
              </label>
              <input
                type="text"
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session ID
              </label>
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activities
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={currentActivity}
                onChange={(e) => setCurrentActivity(e.target.value)}
                onKeyPress={handleActivityKeyPress}
                placeholder="Type activity and press Enter"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
              />
              <button
                type="button"
                onClick={handleAddActivity}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activities.map((activity, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full"
                >
                  <span className="text-sm">{activity}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveActivity(index)}
                    className="hover:text-blue-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient Response
            </label>
            <textarea
              value={patientResponse}
              onChange={(e) => setPatientResponse(e.target.value)}
              rows={4}
              placeholder="Describe the patient's response during the session..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Homework Assigned
            </label>
            <textarea
              value={homeworkAssigned}
              onChange={(e) => setHomeworkAssigned(e.target.value)}
              rows={3}
              placeholder="Assign homework for the patient..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clinical Observations
            </label>
            <textarea
              value={clinicalObservations}
              onChange={(e) => setClinicalObservations(e.target.value)}
              rows={4}
              placeholder="Record clinical observations and notes..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save Session Note
          </button>
        </form>
      </div>

      {savedNote && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-700 mb-2">Last Saved Note:</h3>
          <pre className="text-xs text-gray-600 overflow-auto">
            {JSON.stringify(savedNote, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
