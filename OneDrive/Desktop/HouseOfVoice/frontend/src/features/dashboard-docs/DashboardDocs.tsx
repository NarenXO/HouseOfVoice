import { useState } from 'react';
import SessionNoteForm, { SavedNote } from './SessionNoteForm';
import AIDraftPanel from './AIDraftPanel';
import Dashboard from './Dashboard';
import UrgentFlagButton from './UrgentFlagButton';
import ReassessmentView from './ReassessmentView';
import FeedbackForm from './FeedbackForm';
import SupervisorEvalRubric from './SupervisorEvalRubric';
import HomeworkViewer from './HomeworkViewer';
import CaseClosurePanel from './CaseClosurePanel';

type TabType = 'dashboard' | 'session-notes' | 'ai-drafts' | 'reassessment' | 'feedback' | 'supervisor-eval' | 'homework' | 'case-closure';

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
      <div className="flex gap-4 border-b border-gray-200 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`pb-3 px-1 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('session-notes')}
          className={`pb-3 px-1 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'session-notes'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Session Notes
        </button>
        <button
          onClick={() => setActiveTab('ai-drafts')}
          className={`pb-3 px-1 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'ai-drafts'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          AI Drafts
        </button>
        <button
          onClick={() => setActiveTab('reassessment')}
          className={`pb-3 px-1 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'reassessment'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Reassessment
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`pb-3 px-1 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'feedback'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Feedback
        </button>
        <button
          onClick={() => setActiveTab('supervisor-eval')}
          className={`pb-3 px-1 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'supervisor-eval'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Supervisor Eval
        </button>
        <button
          onClick={() => setActiveTab('homework')}
          className={`pb-3 px-1 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'homework'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Homework
        </button>
        <button
          onClick={() => setActiveTab('case-closure')}
          className={`pb-3 px-1 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'case-closure'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Case Closure
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <div>
          <Dashboard caseId={CASE_ID} />
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
      {activeTab === 'feedback' && <FeedbackForm caseId={CASE_ID} />}
      {activeTab === 'supervisor-eval' && <SupervisorEvalRubric caseId={CASE_ID} />}
      {activeTab === 'homework' && <HomeworkViewer caseId={CASE_ID} />}
      {activeTab === 'case-closure' && <CaseClosurePanel caseId={CASE_ID} />}
    </div>
  );
}
