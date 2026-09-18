import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../shared/LanguageContext';

interface CommunicationProfileFormProps {
  userId: string;
  onSuccess: () => void;
  demoMode?: boolean;
}

const languages = [
  'English', 'Spanish', 'Hindi', 'French', 'Mandarin', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Marathi', 'Bengali', 'Other'
];

export function CommunicationProfileForm({ userId, onSuccess, demoMode = false }: CommunicationProfileFormProps) {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      setTimeout(() => {
        onSuccess();
        setIsSubmitting(false);
      }, 500);
    } catch (error) {
      alert(`Communication profile update failed: ${error}`);
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
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[#0D9488] mb-6">COMMUNICATION PROFILE</h2>
      
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-2">
              Primary Language *
            </label>
            <select
              defaultValue={demoMode ? 'English' : ''}
              className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
              required
            >
              <option value="">Select language</option>
              {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-2">
              Preferred Therapy Language *
            </label>
            <select
              defaultValue={demoMode ? 'English' : ''}
              className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
              required
            >
              <option value="">Select therapy language</option>
              {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#1E3A5F] text-white py-3 rounded-lg hover:bg-[#2E5A88] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ borderRadius: '8px' }}
        >
          {isSubmitting ? 'Saving...' : 'Continue to Intake'}
        </button>
      </form>
    </motion.div>
  );
}