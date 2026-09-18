import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, ShieldCheck, Stethoscope, Award } from 'lucide-react';
import { useLanguage } from '../../shared/LanguageContext';

interface RoleSelectorProps {
  onSelect: (role: 'patient' | 'guardian' | 'therapist' | 'supervisor') => void;
}

const roles = [
  {
    id: 'patient' as const,
    icon: User,
    title: 'Patient',
    description: 'For individuals seeking speech therapy'
  },
  {
    id: 'guardian' as const,
    icon: ShieldCheck,
    title: 'Guardian',
    description: 'For parents registering their children'
  },
  {
    id: 'therapist' as const,
    icon: Stethoscope,
    title: 'Therapist',
    description: 'For speech-language professionals'
  },
  {
    id: 'supervisor' as const,
    icon: Award,
    title: 'Supervisor',
    description: 'For clinical supervisors and administrators'
  }
];

export function RoleSelector({ onSelect }: RoleSelectorProps) {
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleSelect = (role: 'patient' | 'guardian' | 'therapist' | 'supervisor') => {
    setSelectedRole(role);
    onSelect(role);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {roles.map((role, index) => {
        const Icon = role.icon;
        const isSelected = selectedRole === role.id;
        
        return (
          <motion.div
            key={role.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut', delay: index * 0.05 }}
            onClick={() => handleSelect(role.id)}
            className="cursor-pointer"
          >
            <div 
              className={`rounded-2xl p-6 shadow-sm transition-all duration-200 h-full ${
                isSelected 
                  ? 'border-2 border-[#0D9488] bg-[#CCFBF1]' 
                  : 'bg-white border border-[#E2E8F0] hover:border-[#0D9488]'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`rounded-lg p-3 ${
                  isSelected ? 'bg-[#0D9488]/10' : 'bg-[#F4F6F8]'
                }`}>
                  <Icon className={`w-8 h-8 ${isSelected ? 'text-[#0D9488]' : 'text-[#64748B]'} strokeWidth={1.75}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`text-xl font-bold mb-2 ${isSelected ? 'text-[#0D9488]' : 'text-[#0F172A]'}`}>
                    {role.title}
                  </h3>
                  <p className={`text-sm ${isSelected ? 'text-[#0D9488]/80' : 'text-[#64748B]'}`}>
                    {role.description}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}