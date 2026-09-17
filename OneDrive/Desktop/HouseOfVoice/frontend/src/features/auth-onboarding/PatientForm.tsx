import React from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useLanguage } from '../../shared/LanguageContext';
import { Zap } from 'lucide-react';

interface PatientFormData {
  email: string;
  password: string;
  name: string;
  dob: string;
  gender: string;
  phone: string;
}

interface PatientFormProps {
  onSuccess: (userId: string, email: string, name: string) => void;
  demoMode?: boolean;
}

export function PatientForm({ onSuccess, demoMode = false }: PatientFormProps) {
  const { t } = useLanguage();
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<PatientFormData>({
    defaultValues: demoMode ? {
      email: `alex.rivera.${Date.now()}@houseofvoice.io`,
      password: 'demo123',
      name: 'Alex Rivera',
      dob: '2016-04-12',
      gender: 'male',
      phone: '+1234567890'
    } : undefined
  });

  const onSubmit = async (data: PatientFormData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          role: 'patient',
          contact_info: { phone: data.phone }
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
      <h2 className="text-2xl font-bold text-[#0F172A] mb-6">Patient Registration</h2>
      
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
            Date of Birth
          </label>
          <input
            type="date"
            {...register('dob')}
            className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-2">
            Gender
          </label>
          <select
            {...register('gender')}
            className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            {...register('phone')}
            className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
            placeholder="Enter your phone number"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setValue('email', `alex.rivera.${Date.now()}@houseofvoice.io`);
            setValue('password', 'demo123');
            setValue('name', 'Alex Rivera');
            setValue('dob', '2016-04-12');
            setValue('gender', 'male');
            setValue('phone', '+1234567890');
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
