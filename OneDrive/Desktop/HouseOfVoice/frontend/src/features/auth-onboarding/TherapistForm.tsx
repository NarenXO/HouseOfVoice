import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { CheckCircle, Zap } from 'lucide-react';
import { useLanguage } from '../../shared/LanguageContext';

interface TherapistFormData {
  email: string;
  password: string;
  name: string;
  specialization: string;
  languages: string[];
  years_experience: number;
  session_mode: string;
  weekly_availability: string;
}

interface TherapistFormProps {
  onSuccess: (userId: string, email: string, name: string) => void;
}

const languageOptions = [
  'English', 'Spanish', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Marathi', 'Bengali', 'Other'
];

const specializationOptions = [
  'Speech Articulation', 'Language Disorders', 'Fluency/Stuttering', 'Voice Therapy', 
  'AAC (Augmentative Communication)', 'Child Language Development', 'Adult Rehabilitation'
];

export function TherapistForm({ onSuccess }: TherapistFormProps) {
  const { t } = useLanguage();
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<TherapistFormData>();
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => 
      prev.includes(lang) 
        ? prev.filter(l => l !== lang)
        : [...prev, lang]
    );
  };

  const onSubmit = async (data: TherapistFormData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          role: 'therapist',
          languages: selectedLanguages,
          verification_status: 'Self Declared'
        }),
      });

      const text = await response.text();
      let result: any = {};
      try {
        result = text ? JSON.parse(text) : {};
      } catch (err) {
        console.error("Non-JSON response:", text);
      }

      if (!response.ok) {
        const errorMessage = result.detail || result.message || `Server error (${response.status})`;
        alert(`Registration failed: ${errorMessage}`);
        return;
      }

      onSuccess(result.user_id, data.email, data.name);
    } catch (error) {
      alert(`Registration failed: ${error}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#0F172A]">Therapist Registration</h2>
        <div className="flex items-center gap-2 bg-[#CCFBF1] text-[#0D9488] px-3 py-1 rounded-full text-xs font-medium">
          <CheckCircle className="w-4 h-4" strokeWidth={1.75} />
          Self Declared
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-2">
            {t('name')} *
          </label>
          <input
            type="text"
            {...register('name', { required: 'Name is required' })}
            className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
            placeholder="Enter your full name"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-2">
            {t('email')} *
          </label>
          <input
            type="email"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
            placeholder="Enter your email"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-2">
            {t('password')} *
          </label>
          <input
            type="password"
            {...register('password', { 
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters'
              }
            })}
            className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
            placeholder="Create a password"
          />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-2">
            Specialization *
          </label>
          <select
            {...register('specialization', { required: 'Specialization is required' })}
            className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
          >
            <option value="">Select specialization</option>
            {specializationOptions.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
          {errors.specialization && <p className="text-red-500 text-sm mt-1">{errors.specialization.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-2">
            Languages (select all that apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {languageOptions.map(lang => (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedLanguages.includes(lang)
                    ? 'bg-[#0D9488] text-white'
                    : 'bg-[#F4F6F8] text-[#64748B] hover:bg-[#E2E8F0]'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-2">
            Years of Experience *
          </label>
          <input
            type="number"
            {...register('years_experience', { 
              required: 'Years of experience is required',
              min: { value: 0, message: 'Must be 0 or greater' }
            })}
            className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
            placeholder="Enter years of experience"
          />
          {errors.years_experience && <p className="text-red-500 text-sm mt-1">{errors.years_experience.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-2">
            Session Mode *
          </label>
          <select
            {...register('session_mode', { required: 'Session mode is required' })}
            className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
          >
            <option value="online">Online</option>
            <option value="offline">In-Person</option>
            <option value="hybrid">Hybrid</option>
          </select>
          {errors.session_mode && <p className="text-red-500 text-sm mt-1">{errors.session_mode.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-2">
            Weekly Availability Notes
          </label>
          <textarea
            {...register('weekly_availability')}
            rows={3}
            className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
            placeholder="Describe your weekly availability (e.g., 'Mon-Fri 9AM-5PM, Weekends flexible')"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setValue('email', `sarah.chen.${Date.now()}@houseofvoice.io`);
            setValue('password', 'demo123');
            setValue('name', 'Dr. Sarah Chen');
            setValue('specialization', 'Speech Articulation');
            setValue('years_experience', 8);
            setValue('session_mode', 'hybrid');
            setSelectedLanguages(['English', 'Spanish']);
          }}
          className="w-full flex items-center justify-center gap-2 text-xs text-[#64748B] hover:text-[#0D9488] transition-colors py-2 rounded-lg"
        >
          <Zap className="w-4 h-4" strokeWidth={1.75} />
          Autofill Demo Data
        </button>

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
