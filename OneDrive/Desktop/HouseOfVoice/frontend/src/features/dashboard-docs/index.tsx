import { useState } from 'react';
import SessionNoteForm, { SavedNote } from './SessionNoteForm';
import AIDraftPanel from './AIDraftPanel';
import Dashboard from './Dashboard';
import UrgentFlagButton from './UrgentFlagButton';
import ReassessmentView from './ReassessmentView';

type TabType = 'dashboard' | 'session-notes' | 'ai-drafts' | 'reassessment';

const CASE_ID = 'CASE-001';

export default function DashboardDocs() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);

  const handleNoteSaved = (note: SavedNote) => {
    setSavedNoteId(note.id);
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-6 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'dashboard'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('session-notes')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'session-notes'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Session Notes
        </button>
        <button
          onClick={() => setActiveTab('ai-drafts')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'ai-drafts'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          AI Drafts
        </button>
        <button
          onClick={() => setActiveTab('reassessment')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'reassessment'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Reassessment
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <div>
          <Dashboard />
          <div className="mt-6 flex justify-end">
            <UrgentFlagButton caseId={CASE_ID} />
          </div>
        </div>
      )}
      {activeTab === 'session-notes' && (
        <SessionNoteForm onSubmit={handleNoteSaved} />
      )}
      {activeTab === 'ai-drafts' && <AIDraftPanel sessionNoteId={savedNoteId} />}
      {activeTab === 'reassessment' && <ReassessmentView caseId={CASE_ID} />}
    </div>
  );
}
