import React, { useState } from 'react';
import { ScreeningResult } from '../../shared/types';
import { RecordingWizard } from './RecordingWizard';
import { ScreeningResults } from './ScreeningResults';
import { getResult } from './api';

export const ScreeningPage: React.FC = () => {
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [loadingMock, setLoadingMock] = useState(false);
  const [mockError, setMockError] = useState<string | null>(null);
  const caseId = 'demo-case-001';

  const handleLoadMock = async () => {
    setLoadingMock(true);
    setMockError(null);
    try {
      const data = await getResult(caseId);
      setResult(data);
    } catch (err) {
      setMockError(err instanceof Error ? err.message : 'Failed to load mock data.');
    } finally {
      setLoadingMock(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/30 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Page Title */}
        <div className="text-center pb-2">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            🗣️ Speech Screening
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            AI-powered baseline speech and language assessment
          </p>
        </div>

        {/* Quick Demo Toolbar */}
        {!result && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-blue-50 border border-blue-200 p-4 rounded-2xl">
            <div>
              <p className="text-sm font-semibold text-blue-800">Demo Quick-Load</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Skip recording and instantly preview a sample screening report.
              </p>
            </div>
            <button
              onClick={handleLoadMock}
              disabled={loadingMock}
              className="flex-shrink-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm"
            >
              {loadingMock ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <span>⚡</span>
                  Load Mock Screening Report
                </>
              )}
            </button>
          </div>
        )}

        {mockError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {mockError}
          </div>
        )}

        {/* Main Content */}
        {result ? (
          <ScreeningResults result={result} onReset={() => setResult(null)} />
        ) : (
          <RecordingWizard caseId={caseId} onComplete={setResult} />
        )}

      </div>
    </div>
  );
};

export default ScreeningPage;
