import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Stethoscope, Users } from 'lucide-react';
import { RoleSelector } from './RoleSelector';
import { PatientForm } from './PatientForm';
import { GuardianForm } from './GuardianForm';
import { TherapistForm } from './TherapistForm';
import { SupervisorForm } from './SupervisorForm';
import { useLanguage } from '../../shared/LanguageContext';

type Role = 'patient' | 'guardian' | 'therapist' | 'supervisor';

export function AuthOnboarding() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const { t } = useLanguage();

  const handleRegistrationSuccess = () => {
    setIsSuccess(true);
  };

  const handleBack = () => {
    setSelectedRole(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-indigo-600 mb-2">🏠 HouseOfVoice</h1>
          <p className="text-gray-600">{t('welcome')} - {t('register')}</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="registration"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {!selectedRole ? (
                <RoleSelector onSelect={setSelectedRole} />
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <button
                    onClick={handleBack}
                    className="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center gap-2"
                  >
                    ← Back to role selection
                  </button>

                  {selectedRole === 'patient' && (
                    <PatientForm onSuccess={handleRegistrationSuccess} />
                  )}
                  {selectedRole === 'guardian' && (
                    <GuardianForm onSuccess={handleRegistrationSuccess} />
                  )}
                  {selectedRole === 'therapist' && (
                    <TherapistForm onSuccess={handleRegistrationSuccess} />
                  )}
                  {selectedRole === 'supervisor' && (
                    <SupervisorForm onSuccess={handleRegistrationSuccess} />
                  )}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl p-8 text-center"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Successful!</h2>
              <p className="text-gray-600 mb-6">Your account has been created successfully.</p>
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setSelectedRole(null);
                }}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Register Another User
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
