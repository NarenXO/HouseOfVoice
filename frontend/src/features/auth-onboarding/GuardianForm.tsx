import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../shared/LanguageContext';

interface GuardianFormProps {
  onSuccess: (userId: string, email: string, name: string) => void;
}

export function GuardianForm({ onSuccess }: GuardianFormProps) {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const mockUserId = `user_${Date.now()}`;
      const mockEmail = `maria.garcia.${Date.now()}@houseofvoice.io`;
      const mockName = 'Maria Garcia';
      
      setTimeout(() => {
        onSuccess(mockUserId, mockEmail, mockName);
        setIsSubmitting(false);
      }, 500);
    } catch (error) {
      alert(`Registration failed: ${error}`);
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
      <h2 className="text-2xl font-bold text-[#0F172A] mb-6">Guardian Registration</h2>
      
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-2">
            Guardian Name *
          </label>
          <input
            type="text"
            defaultValue="Maria Garcia"
            className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
            placeholder="Enter your full name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-2">
            {t('email')} *
          </label>
          <input
            type="email"
            defaultValue={`maria.garcia.${Date.now()}@houseofvoice.io`}
            className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
            placeholder="Enter your email"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-2">
            {t('password')} *
          </label>
          <input
            type="password"
            defaultValue="demo123"
            className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
            placeholder="Create a password"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#1E3A5F] text-white py-3 rounded-lg hover:bg-[#2E5A88] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ borderRadius: '8px' }}
        >
          {isSubmitting ? 'Registering...' : t('submit')}
        </button>
      </form>
    </motion.div>
  );
}