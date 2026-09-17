import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useLanguage } from '../../shared/LanguageContext';
import { GraduationCap, Briefcase, Home, Users, Phone, Zap } from 'lucide-react';

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
  { id: 'school', label: 'School / Work', icon: GraduationCap },
  { id: 'public_speaking', label: 'Public Speaking', icon: Users },
  { id: 'home', label: 'Home Environment', icon: Home },
  { id: 'phone_calls', label: 'Phone Calls', icon: Phone },
  { id: 'social_situations', label: 'Social Situations', icon: Users },
  { id: 'reading_aloud', label: 'Reading Aloud', icon: Briefcase }
];

export function IntakeForm({ userId, onSuccess, demoMode = false }: IntakeFormProps) {
  const { t } = useLanguage();
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<IntakeFormData>({
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
      const response = await fetch('/api/auth/intake', {
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

      const text = await response.text();
      let result: any = {};
      try {
        result = text ? JSON.parse(text) : {};
      } catch (err) {
        console.error("Non-JSON response:", text);
      }

      if (!response.ok) {
        const errorMessage = result.detail || result.message || `Server error (${response.status})`;
        alert(`Intake form submission failed: ${errorMessage}`);
        return;
      }

      onSuccess();
    } catch (error) {
      alert(`Intake form submission failed: ${error}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8"
    >
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[#0D9488] mb-6">PATIENT CLINICAL INTAKE</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-2">
            Primary Communication Concern *
          </label>
          <textarea
            {...register('primary_concern', { required: 'Primary concern is required' })}
            rows={4}
            className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
            placeholder="Describe the main communication challenge (e.g., 'Stuttering on 's' sound, difficulty speaking at school')"
          />
          {errors.primary_concern && <p className="text-red-500 text-sm mt-1">{errors.primary_concern.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-2">
            Medical History
          </label>
          <textarea
            {...register('medical_history')}
            rows={3}
            className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
            placeholder="Any relevant medical conditions, surgeries, or developmental milestones"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-2">
            Prior Speech Therapy
          </label>
          <textarea
            {...register('prior_therapy')}
            rows={3}
            className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
            placeholder="Previous therapy experiences, duration, and outcomes"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-2">
            Current Medications
          </label>
          <textarea
            {...register('medications')}
            rows={2}
            className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
            placeholder="List any current medications that might affect speech or communication"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-2">
            Therapy Goals
          </label>
          <textarea
            {...register('therapy_goals')}
            rows={3}
            className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors"
            placeholder="What would you like to achieve through therapy? (e.g., 'Speak more clearly in class', 'Reduce stuttering frequency')"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-3">
            Daily Communication Challenges
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {challengeOptions.map(challenge => {
              const Icon = challenge.icon;
              return (
                <button
                  key={challenge.id}
                  type="button"
                  onClick={() => toggleChallenge(challenge.id)}
                  className={`p-3 rounded-lg border-2 transition-all text-left flex items-center gap-2 ${
                    selectedChallenges.includes(challenge.id)
                      ? 'border-[#0D9488] bg-[#CCFBF1] text-[#0D9488]'
                      : 'bg-white border-[#E2E8F0] hover:border-[#0D9488] text-[#64748B]'
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.75} />
                  <div className="text-sm font-medium">{challenge.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setValue('primary_concern', "Difficulty with 's' and 'th' phonemes, stuttering when excited");
            setValue('medical_history', "None");
            setValue('prior_therapy', "None");
            setValue('medications', "None");
            setValue('therapy_goals', "Clear articulation at school");
            setSelectedChallenges(['school', 'public_speaking']);
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
          {isSubmitting ? 'Submitting...' : 'Continue to Consent'}
        </button>
      </form>
    </motion.div>
  );
}
