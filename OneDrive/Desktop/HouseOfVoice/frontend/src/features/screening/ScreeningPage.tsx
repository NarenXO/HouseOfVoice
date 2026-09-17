import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import { ScreeningResult } from '../../shared/types';
import { RecordingWizard } from './RecordingWizard';
import { ScreeningResults } from './ScreeningResults';

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
};

export const ScreeningPage: React.FC = () => {
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const caseId = 'demo-case-001';

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: '#F4F6F8' }}>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Page Header */}
        <motion.div {...fadeUp} className="pt-2 text-center sm:text-left">
          <p className="text-xs font-semibold tracking-wide uppercase mb-1" style={{ color: '#0D9488' }}>
            HouseOfVoice Clinical Suite
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Mic size={22} strokeWidth={1.75} style={{ color: '#1E3A5F' }} />
            <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>
              Speech Screening
            </h1>
          </div>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>
            AI-powered baseline speech and language assessment for clinical records.
          </p>
        </motion.div>

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
