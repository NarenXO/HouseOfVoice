import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useLanguage } from '../../shared/LanguageContext';
import { BookOpen, Keyboard, Mic, MessageSquare, Shield, Smile, Slash, CheckCircle2, Book, Zap, Image, Star } from 'lucide-react';

interface CommunicationProfileFormData {
  primary_language: string;
  secondary_language: string;
  preferred_therapy_language: string;
  reading_ability: string;
  typing_ability: string;
  preferred_communication_method: string;
  guardian_assistance_required: boolean;
  comfort_with_unfamiliar_people: string;
}

interface CommunicationProfileFormProps {
  userId: string;
  onSuccess: () => void;
  demoMode?: boolean;
}

const languages = [
  'English', 'Spanish', 'Hindi', 'French', 'Mandarin', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Marathi', 'Bengali', 'Other'
];

const readingOptions = [
  { value: 'pre_reader', label: 'Pre-reader', icon: BookOpen, description: 'Not yet reading independently' },
  { value: 'developing', label: 'Developing', icon: Book, description: 'Learning to read with assistance' },
  { value: 'fluent', label: 'Fluent', icon: CheckCircle2, description: 'Reads independently and confidently' }
];

const typingOptions = [
  { value: 'none', label: 'None', icon: Slash, description: 'No typing experience' },
  { value: 'developing', label: 'Developing', icon: Keyboard, description: 'Learning to type with assistance' },
  { value: 'fluent', label: 'Fluent', icon: Zap, description: 'Types independently and confidently' }
];

const communicationMethods = [
  { value: 'voice', label: 'Voice', icon: Mic, description: 'Prefer speaking and listening' },
  { value: 'text', label: 'Text', icon: MessageSquare, description: 'Prefer reading and writing' },
  { value: 'images', label: 'Images / AAC', icon: Image, description: 'Prefer visual communication aids' }
];

const comfortLevels = [
  { value: 'low', label: 'Low', icon: Shield, description: 'Needs familiar faces and gradual introduction' },
  { value: 'medium', label: 'Medium', icon: Smile, description: 'Comfortable with new people after introduction' },
  { value: 'high', label: 'High', icon: Star, description: 'Very comfortable meeting new people' }
];

export function CommunicationProfileForm({ userId, onSuccess, demoMode = false }: CommunicationProfileFormProps) {
  const { t, setLanguage } = useLanguage();
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<CommunicationProfileFormData>({
    defaultValues: demoMode ? {
      primary_language: 'English',
      secondary_language: 'Spanish',
      preferred_therapy_language: 'English',
      guardian_assistance_required: true
    } : undefined
  });
  const [selectedReading, setSelectedReading] = useState(demoMode ? 'developing' : 'developing');
  const [selectedTyping, setSelectedTyping] = useState(demoMode ? 'none' : 'developing');
  const [selectedMethod, setSelectedMethod] = useState(demoMode ? 'voice' : 'voice');
  const [selectedComfort, setSelectedComfort] = useState(demoMode ? 'medium' : 'medium');

  const onSubmit = async (data: CommunicationProfileFormData) => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/onboarding/communication-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          profile: {
            ...data,
            reading_ability: selectedReading,
            typing_ability: selectedTyping,
            preferred_communication_method: selectedMethod,
            comfort_with_unfamiliar_people: selectedComfort
          }
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
        alert(`Communication profile update failed: ${errorMessage}`);
        return;
      }

      // Update language context when therapy language changes
      if (data.preferred_therapy_language === 'Spanish') setLanguage('es');
      else if (data.preferred_therapy_language === 'Hindi') setLanguage('hi');
      else setLanguage('en');
      
      onSuccess();
    } catch (error) {
      alert(`Communication profile update failed: ${error}`);
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
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-2">
              Primary Language *
            </label>
            <select
              {...register('primary_language', { required: 'Primary language is required' })}
              className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
            >
              <option value="">Select language</option>
              {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
            {errors.primary_language && <p className="text-red-500 text-sm mt-1">{errors.primary_language.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-2">
              Secondary Language
            </label>
            <select
              {...register('secondary_language')}
              className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
            >
              <option value="">None</option>
              {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-2">
            Preferred Therapy Language *
          </label>
          <select
            {...register('preferred_therapy_language', { required: 'Therapy language is required' })}
            className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
          >
            <option value="">Select therapy language</option>
            {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
          </select>
          {errors.preferred_therapy_language && <p className="text-red-500 text-sm mt-1">{errors.preferred_therapy_language.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-3">
            Reading Ability
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {readingOptions.map(option => {
              const Icon = option.icon;
              return (
                <div
                  key={option.value}
                  onClick={() => setSelectedReading(option.value)}
                  className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                    selectedReading === option.value
                      ? 'border-[#0D9488] bg-[#CCFBF1]'
                      : 'bg-white border-[#E2E8F0] hover:border-[#0D9488]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${selectedReading === option.value ? 'text-[#0D9488]' : 'text-[#64748B]'} strokeWidth={1.75}`} />
                    <div>
                      <div className={`font-medium text-sm ${selectedReading === option.value ? 'text-[#0D9488]' : 'text-[#0F172A]'}`}>{option.label}</div>
                      <div className="text-xs text-[#64748B]">{option.description}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-3">
            Typing Ability
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {typingOptions.map(option => {
              const Icon = option.icon;
              return (
                <div
                  key={option.value}
                  onClick={() => setSelectedTyping(option.value)}
                  className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                    selectedTyping === option.value
                      ? 'border-[#0D9488] bg-[#CCFBF1]'
                      : 'bg-white border-[#E2E8F0] hover:border-[#0D9488]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${selectedTyping === option.value ? 'text-[#0D9488]' : 'text-[#64748B]'} strokeWidth={1.75}`} />
                    <div>
                      <div className={`font-medium text-sm ${selectedTyping === option.value ? 'text-[#0D9488]' : 'text-[#0F172A]'}`}>{option.label}</div>
                      <div className="text-xs text-[#64748B]">{option.description}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-3">
            Preferred Communication Method
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {communicationMethods.map(option => {
              const Icon = option.icon;
              return (
                <div
                  key={option.value}
                  onClick={() => setSelectedMethod(option.value)}
                  className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                    selectedMethod === option.value
                      ? 'border-[#0D9488] bg-[#CCFBF1]'
                      : 'bg-white border-[#E2E8F0] hover:border-[#0D9488]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${selectedMethod === option.value ? 'text-[#0D9488]' : 'text-[#64748B]'} strokeWidth={1.75}`} />
                    <div>
                      <div className={`font-medium text-sm ${selectedMethod === option.value ? 'text-[#0D9488]' : 'text-[#0F172A]'}`}>{option.label}</div>
                      <div className="text-xs text-[#64748B]">{option.description}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-3">
            Comfort with Unfamiliar People
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {comfortLevels.map(option => {
              const Icon = option.icon;
              return (
                <div
                  key={option.value}
                  onClick={() => setSelectedComfort(option.value)}
                  className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                    selectedComfort === option.value
                      ? 'border-[#0D9488] bg-[#CCFBF1]'
                      : 'bg-white border-[#E2E8F0] hover:border-[#0D9488]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${selectedComfort === option.value ? 'text-[#0D9488]' : 'text-[#64748B]'} strokeWidth={1.75}`} />
                    <div>
                      <div className={`font-medium text-sm ${selectedComfort === option.value ? 'text-[#0D9488]' : 'text-[#0F172A]'}`}>{option.label}</div>
                      <div className="text-xs text-[#64748B]">{option.description}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-[#F4F6F8] rounded-lg border border-[#E2E8F0]">
          <div>
            <div className="font-medium text-[#0F172A]">Guardian Assistance Required</div>
            <div className="text-sm text-[#64748B]">Will you need assistance during therapy sessions?</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              {...register('guardian_assistance_required')}
              defaultChecked={demoMode}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#E2E8F0] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0D9488]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0D9488]"></div>
          </label>
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
