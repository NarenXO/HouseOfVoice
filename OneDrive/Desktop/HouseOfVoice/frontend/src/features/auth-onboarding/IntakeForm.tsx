import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useLanguage } from '../../shared/LanguageContext';

interface IntakeFormData {
  primary_concern: string;
  medical_history: string;
  prior_therapy: string;
  medications: string;
  therapy_goals: string;
  daily_challenges: string[];
}

interface IntakeFormProps {
  userId: string;
  onSuccess: () => void;
  demoMode?: boolean;
}

const challengeOptions = [
  { id: 'school', label: 'School / Work' },
  { id: 'public_speaking', label: 'Public Speaking' },
  { id: 'home', label: 'Home Environment' },
  { id: 'phone_calls', label: 'Phone Calls' },
  { id: 'social_situations', label: 'Social Situations' },
  { id: 'reading_aloud', label: 'Reading Aloud' }
];

export function IntakeForm({ userId, onSuccess, demoMode = false }: IntakeFormProps) {
  const { t } = useLanguage();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<IntakeFormData>({
    defaultValues: demoMode ? {
      primary_concern: "Difficulty with 's' and 'th' phonemes, stuttering when excited",
      medical_history: "None",
      prior_therapy: "None",
      medications: "None",
      therapy_goals: "Clear articulation at school"
    } : undefined
  });
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>(demoMode ? ['school', 'public_speaking'] : []);

  const toggleChallenge = (challengeId: string) => {
    setSelectedChallenges(prev => 
      prev.includes(challengeId) 
        ? prev.filter(id => id !== challengeId)
        : [...prev, challengeId]
    );
  };

  const onSubmit = async (data: IntakeFormData) => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          ...data,
          daily_challenges: selectedChallenges.reduce((acc, id) => ({ ...acc, [id]: true }), {})
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(`Intake form submission failed: ${error.detail}`);
      }
    } catch (error) {
      alert(`Intake form submission failed: ${error}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl p-8"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Patient Intake</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Communication Concern *
          </label>
          <textarea
            {...register('primary_concern', { required: 'Primary concern is required' })}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Describe the main communication challenge (e.g., 'Stuttering on 's' sound, difficulty speaking at school')"
          />
          {errors.primary_concern && <p className="text-red-500 text-sm mt-1">{errors.primary_concern.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Medical History
          </label>
          <textarea
            {...register('medical_history')}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Any relevant medical conditions, surgeries, or developmental milestones"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prior Speech Therapy
          </label>
          <textarea
            {...register('prior_therapy')}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Previous therapy experiences, duration, and outcomes"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Medications
          </label>
          <textarea
            {...register('medications')}
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="List any current medications that might affect speech or communication"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Therapy Goals
          </label>
          <textarea
            {...register('therapy_goals')}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="What would you like to achieve through therapy? (e.g., 'Speak more clearly in class', 'Reduce stuttering frequency')"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Daily Communication Challenges
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {challengeOptions.map(challenge => (
              <button
                key={challenge.id}
                type="button"
                onClick={() => toggleChallenge(challenge.id)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedChallenges.includes(challenge.id)
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="text-sm font-medium">{challenge.label}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Continue to Consent'}
        </button>
      </form>
    </motion.div>
  );
}
