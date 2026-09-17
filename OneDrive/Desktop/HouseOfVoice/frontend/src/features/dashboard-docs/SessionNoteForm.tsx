import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Plus, X, Save } from "lucide-react";

interface SessionNoteFormProps {
  onSave?: (note: any) => void;
}

interface SessionNoteData {
  case_id: string;
  session_id: string;
  activities: string[];
  patient_response: string;
  homework_assigned: string;
  clinical_observations: string;
}

export default function SessionNoteForm({ onSave }: SessionNoteFormProps) {
  const [formData, setFormData] = useState<SessionNoteData>({
    case_id: "CASE-001",
    session_id: "sess_mock_001",
    activities: [],
    patient_response: "",
    homework_assigned: "",
    clinical_observations: "",
  });

  const [currentActivity, setCurrentActivity] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedNote, setSavedNote] = useState<any>(null);

  const handleAddActivity = () => {
    if (currentActivity.trim()) {
      setFormData({
        ...formData,
        activities: [...formData.activities, currentActivity.trim()],
      });
      setCurrentActivity("");
    }
  };

  const handleRemoveActivity = (index: number) => {
    setFormData({
      ...formData,
      activities: formData.activities.filter((_, i) => i !== index),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddActivity();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // TODO: update to /api/docs/session-notes at integration
      const response = await fetch("http://localhost:8000/session-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const savedData = await response.json();
        setSavedNote(savedData);
        setShowSuccess(true);
        
        // Clear form
        setFormData({
          case_id: "CASE-001",
          session_id: "sess_mock_001",
          activities: [],
          patient_response: "",
          homework_assigned: "",
          clinical_observations: "",
        });

        // Hide success message after 3 seconds
        setTimeout(() => setShowSuccess(false), 3000);

        if (onSave) {
          onSave(savedData);
        }
      } else {
        console.error("Failed to save session note");
      }
    } catch (error) {
      console.error("Error saving session note:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <ClipboardList className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Session Documentation</h2>
        </div>

        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg"
            >
              Session note saved successfully!
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Case ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Case ID
            </label>
            <input
              type="text"
              value={formData.case_id}
              onChange={(e) =>
                setFormData({ ...formData, case_id: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
            />
          </div>

          {/* Session ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session ID
            </label>
            <input
              type="text"
              value={formData.session_id}
              onChange={(e) =>
                setFormData({ ...formData, session_id: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
            />
          </div>

          {/* Activities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activities
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={currentActivity}
                onChange={(e) => setCurrentActivity(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type activity and press Enter"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
              />
              <button
                type="button"
                onClick={handleAddActivity}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {formData.activities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.activities.map((activity, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-2 bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {activity}
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
            )}
          </div>

          {/* Patient Response */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient Response
            </label>
            <textarea
              value={formData.patient_response}
              onChange={(e) =>
                setFormData({ ...formData, patient_response: e.target.value })
              }
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none resize-none"
              placeholder="Describe the patient's response during the session..."
            />
          </div>

          {/* Homework Assigned */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Homework Assigned
            </label>
            <textarea
              value={formData.homework_assigned}
              onChange={(e) =>
                setFormData({ ...formData, homework_assigned: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none resize-none"
              placeholder="Assign homework for the patient..."
            />
          </div>

          {/* Clinical Observations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clinical Observations
            </label>
            <textarea
              value={formData.clinical_observations}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  clinical_observations: e.target.value,
                })
              }
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none resize-none"
              placeholder="Record clinical observations and notes..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium"
          >
            <Save className="w-5 h-5" />
            Save Session Note
          </button>
        </form>

        {/* Display saved note for debugging */}
        {savedNote && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Last Saved Note:
            </h3>
            <pre className="text-xs text-gray-600 overflow-auto">
              {JSON.stringify(savedNote, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
