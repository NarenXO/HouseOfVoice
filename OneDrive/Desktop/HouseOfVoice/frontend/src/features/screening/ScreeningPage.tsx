import React, { useState } from 'react';
import { ScreeningResult } from '../../shared/types';
import { RecordingWizard } from './RecordingWizard';
import { ScreeningResults } from './ScreeningResults';
import { getResult } from './api';

export const ScreeningPage: React.FC = () => {
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const caseId = 'demo-case-001';

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
