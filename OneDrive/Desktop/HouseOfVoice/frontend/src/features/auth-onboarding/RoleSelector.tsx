import React from 'react';
import { motion } from 'framer-motion';
import { User, Shield, Stethoscope, Users } from 'lucide-react';
import { useLanguage } from '../../shared/LanguageContext';

interface RoleSelectorProps {
  onSelect: (role: 'patient' | 'guardian' | 'therapist' | 'supervisor') => void;
}

const roles = [
  {
    id: 'patient' as const,
    icon: User,
    title: 'Patient',
    description: 'For individuals seeking speech therapy',
    color: 'from-blue-500 to-blue-600',
    hoverColor: 'from-blue-600 to-blue-700'
  },
  {
    id: 'guardian' as const,
    icon: Shield,
    title: 'Guardian',
    description: 'For parents registering their children',
    color: 'from-purple-500 to-purple-600',
    hoverColor: 'from-purple-600 to-purple-700'
  },
  {
    id: 'therapist' as const,
    icon: Stethoscope,
    title: 'Therapist',
    description: 'For speech-language professionals',
    color: 'from-teal-500 to-teal-600',
    hoverColor: 'from-teal-600 to-teal-700'
  },
  {
    id: 'supervisor' as const,
    icon: Users,
    title: 'Supervisor',
    description: 'For clinical supervisors and administrators',
    color: 'from-indigo-500 to-indigo-600',
    hoverColor: 'from-indigo-600 to-indigo-700'
  }
];

export function RoleSelector({ onSelect }: RoleSelectorProps) {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {roles.map((role, index) => {
        const Icon = role.icon;
        return (
          <motion.div
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(role.id)}
            className="cursor-pointer"
          >
            <div className={`bg-gradient-to-br ${role.color} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full`}>
              <div className="flex items-start gap-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{role.title}</h3>
                  <p className="text-white/80 text-sm">{role.description}</p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
