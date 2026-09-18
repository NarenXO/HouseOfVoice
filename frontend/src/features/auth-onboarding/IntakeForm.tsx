import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../shared/LanguageContext';

interface IntakeFormProps {
  userId: string;
  onSuccess: () => void;
  demoMode?: boolean;
}

export function IntakeForm({ userId, onSuccess, demoMode = false }: IntakeFormProps) {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      setTimeout(() => {
        onSuccess();
        setIsSubmitting(false);
      }, 500);
    } catch (error) {
      alert(`Intake form submission failed: ${error}`);
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8"
    >
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[#0D9488] mb-6">PATIENT CLINICAL INTAKE</h2>
      
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-2">
            Primary Communication Concern *
          </label>
          <textarea
            defaultValue={demoMode ? "Difficulty with 's' and 'th' phonemes, stuttering when excited" : ''}
            rows={4}
            className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
            placeholder="Describe the main communication challenge"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#1E3A5F] text-white py-3 rounded-lg hover:bg-[#2E5A88] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ borderRadius: '8px' }}
        >
          {isSubmitting ? 'Submitting...' : 'Continue to Consent'}
        </button>
      </form>
    </motion.div>
  );
}