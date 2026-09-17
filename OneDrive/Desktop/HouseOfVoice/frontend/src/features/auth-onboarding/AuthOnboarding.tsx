import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Stethoscope, Users, CheckCircle, ArrowRight, ArrowLeft, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RoleSelector } from './RoleSelector';
import { PatientForm } from './PatientForm';
import { GuardianForm } from './GuardianForm';
import { TherapistForm } from './TherapistForm';
import { SupervisorForm } from './SupervisorForm';
import { CommunicationProfileForm } from './CommunicationProfileForm';
import { IntakeForm } from './IntakeForm';
import { ConsentForm } from './ConsentForm';
import { useLanguage } from '../../shared/LanguageContext';
import type { CurrentUser } from '../../shared/types';

type Role = 'patient' | 'guardian' | 'therapist' | 'supervisor';
type Step = 'role' | 'registration' | 'communication' | 'intake' | 'consent' | 'complete';

const steps = [
  { id: 'role', label: 'Role Selection' },
  { id: 'registration', label: 'Account Setup' },
  { id: 'communication', label: 'Communication Profile' },
  { id: 'intake', label: 'Patient Intake' },
  { id: 'consent', label: 'Consent' }
];

export function AuthOnboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('role');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [demoMode, setDemoMode] = useState(false);
  const { t } = useLanguage();

  const handleRegistrationSuccess = (newUserId: string, email: string, name: string) => {
    setUserId(newUserId);
    setUserEmail(email);
    setUserName(name);
    setCurrentStep('communication');
  };

  const handleCommunicationSuccess = () => {
    setCurrentStep('intake');
  };

  const handleIntakeSuccess = () => {
    setCurrentStep('consent');
  };

  const handleConsentSuccess = () => {
    // Store user in localStorage
    const currentUser: CurrentUser = {
      id: userId!,
      email: userEmail,
      role: selectedRole!,
      name: userName
    };
    localStorage.setItem('current_user', JSON.stringify(currentUser));
    setCurrentStep('complete');
  };

  const handleBack = () => {
    if (currentStep === 'registration') {
      setSelectedRole(null);
      setCurrentStep('role');
    } else if (currentStep === 'communication') {
      setCurrentStep('registration');
    } else if (currentStep === 'intake') {
      setCurrentStep('communication');
    } else if (currentStep === 'consent') {
      setCurrentStep('intake');
    }
  };

  const handleReset = () => {
    setCurrentStep('role');
    setSelectedRole(null);
    setUserId(null);
  };

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const handleAutofillDemo = () => {
    setDemoMode(true);
    setSelectedRole('patient');
    setCurrentStep('registration');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 relative"
        >
          <button
            onClick={handleAutofillDemo}
            className="absolute top-0 right-0 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 transition-colors"
          >
            <Zap className="w-4 h-4" /> Autofill Demo Data
          </button>
          <h1 className="text-4xl font-bold text-indigo-600 mb-2">🏠 HouseOfVoice</h1>
          <p className="text-gray-600">{t('welcome')} - {t('register')}</p>
        </motion.div>

        {/* Progress Bar */}
        {currentStep !== 'role' && currentStep !== 'complete' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        index <= getCurrentStepIndex()
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {index < getCurrentStepIndex() ? '✓' : index + 1}
                    </div>
                    <span className="text-xs mt-2 text-gray-600 hidden sm:block">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 ${
                        index < getCurrentStepIndex() ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {currentStep === 'role' && (
            <motion.div
              key="role"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <RoleSelector onSelect={(role) => {
                setSelectedRole(role);
                setCurrentStep('registration');
              }} />
            </motion.div>
          )}

          {currentStep === 'registration' && selectedRole && (
            <motion.div
              key="registration"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button
                onClick={handleBack}
                className="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to role selection
              </button>

              {selectedRole === 'patient' && (
                <PatientForm onSuccess={(id, email, name) => handleRegistrationSuccess(id, email, name)} demoMode={demoMode} />
              )}
              {selectedRole === 'guardian' && (
                <GuardianForm onSuccess={(id, email, name) => handleRegistrationSuccess(id, email, name)} />
              )}
              {selectedRole === 'therapist' && (
                <TherapistForm onSuccess={(id, email, name) => handleRegistrationSuccess(id, email, name)} />
              )}
              {selectedRole === 'supervisor' && (
                <SupervisorForm onSuccess={(id, email, name) => handleRegistrationSuccess(id, email, name)} />
              )}
            </motion.div>
          )}

          {currentStep === 'communication' && userId && (
            <motion.div
              key="communication"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button
                onClick={handleBack}
                className="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to registration
              </button>
              <CommunicationProfileForm userId={userId} onSuccess={handleCommunicationSuccess} demoMode={demoMode} />
            </motion.div>
          )}

          {currentStep === 'intake' && userId && (
            <motion.div
              key="intake"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button
                onClick={handleBack}
                className="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to communication profile
              </button>
              <IntakeForm userId={userId} onSuccess={handleIntakeSuccess} demoMode={demoMode} />
            </motion.div>
          )}

          {currentStep === 'consent' && userId && (
            <motion.div
              key="consent"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button
                onClick={handleBack}
                className="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to intake
              </button>
              <ConsentForm userId={userId} onSuccess={handleConsentSuccess} demoMode={demoMode} />
            </motion.div>
          )}

          {currentStep === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl p-8 text-center"
            >
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">🎉 Onboarding Complete!</h2>
              <p className="text-gray-600 mb-2">You're ready for baseline screening.</p>
              <p className="text-gray-600 mb-8">Your account has been set up with all your preferences.</p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/docs')}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" /> Go to Patient Dashboard 📊
                </button>
                <button
                  onClick={() => navigate('/matching')}
                  className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                >
                  <User className="w-5 h-5" /> Explore Therapist Matching 👨‍⚕️
                </button>
              </div>
              <div className="mt-6">
                <button
                  onClick={handleReset}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  Register Another User
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
