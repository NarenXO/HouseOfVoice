import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useLanguage } from '../../shared/LanguageContext';
import { Book, Keyboard, Mic, MessageSquare, Shield, Smile, X } from 'lucide-react';

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
}

const languages = [
  'English', 'Spanish', 'Hindi', 'French', 'Mandarin', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Marathi', 'Bengali', 'Other'
];

const readingOptions = [
  { value: 'pre_reader', label: 'Pre-reader', icon: Book, description: 'Not yet reading independently' },
  { value: 'developing', label: 'Developing', icon: MessageSquare, description: 'Learning to read with assistance' },
  { value: 'fluent', label: 'Fluent', icon: Book, description: 'Reads independently and confidently' }
];

const typingOptions = [
  { value: 'none', label: 'None', icon: X, description: 'No typing experience' },
  { value: 'developing', label: 'Developing', icon: Keyboard, description: 'Learning to type with assistance' },
  { value: 'fluent', label: 'Fluent', icon: Keyboard, description: 'Types independently and confidently' }
];

const communicationMethods = [
  { value: 'voice', label: 'Voice', icon: Mic, description: 'Prefer speaking and listening' },
  { value: 'text', label: 'Text', icon: MessageSquare, description: 'Prefer reading and writing' },
  { value: 'images', label: 'Images / AAC', icon: MessageSquare, description: 'Prefer visual communication aids' }
];

const comfortLevels = [
  { value: 'low', label: 'Low', icon: Shield, description: 'Needs familiar faces and gradual introduction' },
  { value: 'medium', label: 'Medium', icon: Smile, description: 'Comfortable with new people after introduction' },
  { value: 'high', label: 'High', icon: Smile, description: 'Very comfortable meeting new people' }
];

export function CommunicationProfileForm({ userId, onSuccess }: CommunicationProfileFormProps) {
  const { t, setLanguage } = useLanguage();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CommunicationProfileFormData>();
  const [selectedReading, setSelectedReading] = useState('developing');
  const [selectedTyping, setSelectedTyping] = useState('developing');
  const [selectedMethod, setSelectedMethod] = useState('voice');
  const [selectedComfort, setSelectedComfort] = useState('medium');

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

      if (response.ok) {
        // Update language context when therapy language changes
        if (data.preferred_therapy_language === 'Spanish') setLanguage('es');
        else if (data.preferred_therapy_language === 'Hindi') setLanguage('hi');
        else setLanguage('en');
        
        onSuccess();
      } else {
        const error = await response.json();
        alert(`Communication profile update failed: ${error.detail}`);
      }
    } catch (error) {
      alert(`Communication profile update failed: ${error}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl p-8"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Communication Profile</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Language *
            </label>
            <select
              {...register('primary_language', { required: 'Primary language is required' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select language</option>
              {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
            {errors.primary_language && <p className="text-red-500 text-sm mt-1">{errors.primary_language.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secondary Language
            </label>
            <select
              {...register('secondary_language')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">None</option>
              {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Therapy Language *
          </label>
          <select
            {...register('preferred_therapy_language', { required: 'Therapy language is required' })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Select therapy language</option>
            {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
          </select>
          {errors.preferred_therapy_language && <p className="text-red-500 text-sm mt-1">{errors.preferred_therapy_language.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
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
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${selectedReading === option.value ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <div>
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
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
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${selectedTyping === option.value ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <div>
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
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
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${selectedMethod === option.value ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <div>
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
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
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${selectedComfort === option.value ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <div>
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="font-medium text-gray-800">Guardian Assistance Required</div>
            <div className="text-sm text-gray-600">Will you need assistance during therapy sessions?</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              {...register('guardian_assistance_required')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Continue to Intake'}
        </button>
      </form>
    </motion.div>
  );
}
