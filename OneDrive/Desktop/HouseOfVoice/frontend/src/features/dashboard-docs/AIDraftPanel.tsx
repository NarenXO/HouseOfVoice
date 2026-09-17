import React, { useState } from 'react';
import { Sparkles, Stethoscope, FileText, Users, CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIDraftPanelProps {
  sessionNoteId: string | null;
}

interface AIDraft {
  id: string;
  session_note_id: string;
  soap_note: string;
  session_summary: string;
  parent_summary: string;
  approved: boolean;
  created_at: string;
}

export default function AIDraftPanel({ sessionNoteId }: AIDraftPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [draft, setDraft] = useState<AIDraft | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Editable draft states
  const [soapNote, setSoapNote] = useState('');
  const [sessionSummary, setSessionSummary] = useState('');
  const [parentSummary, setParentSummary] = useState('');

  const handleGenerateDraft = async () => {
    if (!sessionNoteId) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/docs/session-notes/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_note_id: sessionNoteId }),
      });

      if (response.ok) {
        const draftData: AIDraft = await response.json();
        setDraft(draftData);
        setSoapNote(draftData.soap_note);
        setSessionSummary(draftData.session_summary);
        setParentSummary(draftData.parent_summary);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate AI draft');
      }
    } catch (error) {
      console.error('Error generating AI draft:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate AI draft. Make sure GEMINI_API_KEY is configured.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveDraft = async () => {
    if (!draft) return;

    setIsApproving(true);
    try {
      const response = await fetch(`/api/docs/session-notes/draft/${draft.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const approvedDraft: AIDraft = await response.json();
        // Update the draft with the edited content on approval
        const finalDraft: AIDraft = {
          ...approvedDraft,
          soap_note: soapNote,
          session_summary: sessionSummary,
          parent_summary: parentSummary,
        };
        setDraft(finalDraft);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error approving draft:', error);
    } finally {
      setIsApproving(false);
    }
  };

  // Extract tone level from parent summary
  const getToneLevel = (): string => {
    if (!parentSummary) return 'Moderate';
    if (parentSummary.includes('Simple')) return 'Simple';
    if (parentSummary.includes('Advanced')) return 'Advanced';
    return 'Moderate';
  };

  if (!sessionNoteId) {
    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center text-gray-500">
        Save a session note first to generate AI drafts
      </div>
    );
  }

  return (
    <div className="mt-6">
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">Drafts approved and saved successfully!</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-800">AI Documentation Assistant</h2>
          </div>
          
          {!draft && !isLoading && (
            <button
              onClick={handleGenerateDraft}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Generate AI Draft
            </button>
          )}
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-4" />
            <p className="text-gray-600">Gemini AI is generating live clinical documentation...</p>
            <p className="text-sm text-gray-500 mt-2">Processing SOAP note, session summary, and parent explanation</p>
          </div>
        )}

        {draft && (
          <>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
            >
              <p className="text-yellow-800">
                ⚠ These are AI-generated drafts. Review and edit before approving. Drafts are never auto-finalized.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* SOAP Note Card */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-800">SOAP Note</h3>
                </div>
                <div
                  contentEditable
                  className="w-full min-h-[200px] p-3 bg-white border border-gray-300 rounded font-mono text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none whitespace-pre-wrap"
                  onInput={(e) => setSoapNote(e.currentTarget.textContent || '')}
                >
                  {soapNote}
                </div>
              </div>

              {/* Session Summary Card */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-800">Session Summary</h3>
                </div>
                <div
                  contentEditable
                  className="w-full min-h-[200px] p-3 bg-white border border-gray-300 rounded font-sans text-sm focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none whitespace-pre-wrap"
                  onInput={(e) => setSessionSummary(e.currentTarget.textContent || '')}
                >
                  {sessionSummary}
                </div>
              </div>

              {/* Parent Explanation Card */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-gray-800">Parent Explanation</h3>
                  <span className="ml-auto px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                    {getToneLevel()}
                  </span>
                </div>
                <div
                  contentEditable
                  className="w-full min-h-[200px] p-3 bg-white border border-gray-300 rounded font-sans text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none whitespace-pre-wrap"
                  onInput={(e) => setParentSummary(e.currentTarget.textContent || '')}
                >
                  {parentSummary}
                </div>
              </div>
            </div>

            <button
              onClick={handleApproveDraft}
              disabled={isApproving}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApproving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Approve & Save Drafts
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
