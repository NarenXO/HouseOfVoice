import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useLanguage } from '../../shared/LanguageContext';

interface SupervisorFormData {
  email: string;
  password: string;
  name: string;
  specialization: string;
  languages: string[];
  years_experience: number;
  session_mode: string;
  weekly_availability: string;
}

interface SupervisorFormProps {
  onSuccess: (userId: string) => void;
}

const languageOptions = [
  'English', 'Spanish', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Marathi', 'Bengali', 'Other'
];

const specializationOptions = [
  'Clinical Supervision', 'Program Management', 'Quality Assurance', 
  'Training & Development', 'Research & Assessment', 'Multidisciplinary Coordination'
];

export function SupervisorForm({ onSuccess }: SupervisorFormProps) {
  const { t } = useLanguage();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SupervisorFormData>();
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => 
      prev.includes(lang) 
        ? prev.filter(l => l !== lang)
        : [...prev, lang]
    );
  };

  const onSubmit = async (data: SupervisorFormData) => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          role: 'supervisor',
          languages: selectedLanguages,
          verification_status: 'Self Declared'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onSuccess(result.user_id);
      } else {
        const error = await response.json();
        alert(`Registration failed: ${error.detail}`);
      }
    } catch (error) {
      alert(`Registration failed: ${error}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Supervisor Registration</h2>
        <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
          <CheckCircle className="w-4 h-4" />
          Self Declared
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('name')} *
          </label>
          <input
            type="text"
            {...register('name', { required: 'Name is required' })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Enter your full name"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Enter your email"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Create a password"
          />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Area of Supervision *
          </label>
          <select
            {...register('specialization', { required: 'Area of supervision is required' })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Select area of supervision</option>
            {specializationOptions.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
          {errors.specialization && <p className="text-red-500 text-sm mt-1">{errors.specialization.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Years of Experience *
          </label>
          <input
            type="number"
            {...register('years_experience', { 
              required: 'Years of experience is required',
              min: { value: 0, message: 'Must be 0 or greater' }
            })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Enter years of experience"
          />
          {errors.years_experience && <p className="text-red-500 text-sm mt-1">{errors.years_experience.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Mode *
          </label>
          <select
            {...register('session_mode', { required: 'Session mode is required' })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="online">Online</option>
            <option value="offline">In-Person</option>
            <option value="hybrid">Hybrid</option>
          </select>
          {errors.session_mode && <p className="text-red-500 text-sm mt-1">{errors.session_mode.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weekly Availability Notes
          </label>
          <textarea
            {...register('weekly_availability')}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Describe your weekly availability"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Registering...' : t('submit')}
        </button>
      </form>
    </motion.div>
  );
}
