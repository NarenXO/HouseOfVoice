import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../shared/LanguageContext';

interface PatientFormProps {
  onSuccess: (userId: string, email: string, name: string) => void;
  demoMode?: boolean;
}

export function PatientForm({ onSuccess, demoMode = false }: PatientFormProps) {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Mock successful registration
      const mockUserId = `user_${Date.now()}`;
      const mockEmail = demoMode ? `alex.rivera.${Date.now()}@houseofvoice.io` : 'user@example.com';
      const mockName = demoMode ? 'Alex Rivera' : 'User Name';
      
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
      <h2 className="text-2xl font-bold text-[#0F172A] mb-6">Patient Registration</h2>
      
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-2">
            {t('name')} *
          </label>
          <input
            type="text"
            defaultValue={demoMode ? 'Alex Rivera' : ''}
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
            defaultValue={demoMode ? `alex.rivera.${Date.now()}@houseofvoice.io` : ''}
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
            defaultValue={demoMode ? 'demo123' : ''}
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