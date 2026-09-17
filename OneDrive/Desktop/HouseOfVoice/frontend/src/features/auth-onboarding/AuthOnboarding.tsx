import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, CheckCircle, ArrowLeft, Zap } from 'lucide-react';
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
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="text-center mb-8 relative"
        >
          <button
            onClick={handleAutofillDemo}
            className="absolute top-0 right-0 bg-[#F4F6F8] hover:bg-[#E2E8F0] text-[#64748B] px-3 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <Zap className="w-3 h-3" strokeWidth={1.75} /> Autofill Demo Data
          </button>
          <h1 className="text-4xl font-bold text-[#1E3A5F] mb-2">HouseOfVoice</h1>
          <p className="text-[#64748B]">{t('welcome')} - {t('register')}</p>
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
                          ? 'bg-[#0D9488] text-white'
                          : 'bg-[#E2E8F0] text-[#64748B]'
                      }`}
                    >
                      {index < getCurrentStepIndex() ? '✓' : index + 1}
                    </div>
                    <span className="text-xs mt-2 text-[#64748B] hidden sm:block">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 ${
                        index < getCurrentStepIndex() ? 'bg-[#0D9488]' : 'bg-[#E2E8F0]'
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
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
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
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <button
                onClick={handleBack}
                className="mb-4 text-[#0D9488] hover:text-[#0D9488]/80 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.75} /> Back to role selection
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
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <button
                onClick={handleBack}
                className="mb-4 text-[#0D9488] hover:text-[#0D9488]/80 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.75} /> Back to registration
              </button>
              <CommunicationProfileForm userId={userId} onSuccess={handleCommunicationSuccess} demoMode={demoMode} />
            </motion.div>
          )}

          {currentStep === 'intake' && userId && (
            <motion.div
              key="intake"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <button
                onClick={handleBack}
                className="mb-4 text-[#0D9488] hover:text-[#0D9488]/80 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.75} /> Back to communication profile
              </button>
              <IntakeForm userId={userId} onSuccess={handleIntakeSuccess} demoMode={demoMode} />
            </motion.div>
          )}

          {currentStep === 'consent' && userId && (
            <motion.div
              key="consent"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <button
                onClick={handleBack}
                className="mb-4 text-[#0D9488] hover:text-[#0D9488]/80 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.75} /> Back to intake
              </button>
              <ConsentForm userId={userId} onSuccess={handleConsentSuccess} demoMode={demoMode} />
            </motion.div>
          )}

          {currentStep === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8 text-center"
            >
              <div className="w-24 h-24 bg-[#CCFBF1] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-[#0D9488]" strokeWidth={1.75} />
              </div>
              <h2 className="text-3xl font-bold text-[#0F172A] mb-4">Onboarding Complete!</h2>
              <p className="text-[#64748B] mb-2">You're ready for baseline screening.</p>
              <p className="text-[#64748B] mb-8">Your account has been set up with all your preferences.</p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/screening')}
                  className="bg-[#0D9488] text-white px-6 py-3 rounded-lg hover:bg-[#0D9488]/90 transition-colors flex items-center justify-center gap-2"
                >
                  Proceed to Speech Screening
                </button>
              </div>
              <div className="mt-6">
                <button
                  onClick={handleReset}
                  className="text-[#64748B] hover:text-[#0F172A] text-sm"
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
