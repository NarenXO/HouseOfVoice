import React from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useLanguage } from '../../shared/LanguageContext';
import { Zap } from 'lucide-react';

interface GuardianFormData {
  email: string;
  password: string;
  name: string;
  phone: string;
  child_name: string;
  child_dob: string;
  child_gender: string;
}

interface GuardianFormProps {
  onSuccess: (userId: string, email: string, name: string) => void;
}

export function GuardianForm({ onSuccess }: GuardianFormProps) {
  const { t } = useLanguage();
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<GuardianFormData>();

  const onSubmit = async (data: GuardianFormData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          role: 'guardian',
          name: data.name,
          contact_info: { phone: data.phone },
          child_name: data.child_name,
          child_dob: data.child_dob,
          child_gender: data.child_gender
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
      <h2 className="text-2xl font-bold text-[#0F172A] mb-6">Guardian Registration</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Guardian Information */}
        <div className="border-b border-[#E2E8F0] pb-6">
          <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Guardian Information</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-2">
                Guardian Name *
              </label>
              <input
                type="text"
                {...register('name', { required: 'Guardian name is required' })}
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
                Phone Number
              </label>
              <input
                type="tel"
                {...register('phone')}
                className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
                placeholder="Enter your phone number"
              />
            </div>
          </div>
        </div>

        {/* Child Information */}
        <div>
          <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Child Information</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-2">
                Child Name *
              </label>
              <input
                type="text"
                {...register('child_name', { required: 'Child name is required' })}
                className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
                placeholder="Enter child's full name"
              />
              {errors.child_name && <p className="text-red-500 text-sm mt-1">{errors.child_name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-2">
                Child Date of Birth *
              </label>
              <input
                type="date"
                {...register('child_dob', { required: 'Child date of birth is required' })}
                className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
              />
              {errors.child_dob && <p className="text-red-500 text-sm mt-1">{errors.child_dob.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-2">
                Child Gender *
              </label>
              <select
                {...register('child_gender', { required: 'Child gender is required' })}
                className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.child_gender && <p className="text-red-500 text-sm mt-1">{errors.child_gender.message}</p>}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setValue('email', `maria.garcia.${Date.now()}@houseofvoice.io`);
            setValue('password', 'demo123');
            setValue('name', 'Maria Garcia');
            setValue('phone', '+1234567890');
            setValue('child_name', 'Leo Garcia');
            setValue('child_dob', '2018-06-15');
            setValue('child_gender', 'male');
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
