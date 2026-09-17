import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<string, Record<string, string>> = {
  en: {
    welcome: 'Welcome',
    register: 'Register',
    login: 'Login',
    name: 'Name',
    email: 'Email',
    password: 'Password',
    submit: 'Submit',
    patient: 'Patient',
    guardian: 'Guardian',
    therapist: 'Therapist',
    supervisor: 'Supervisor',
  },
  es: {
    welcome: 'Bienvenido',
    register: 'Registrarse',
    login: 'Iniciar sesión',
    name: 'Nombre',
    email: 'Correo electrónico',
    password: 'Contraseña',
    submit: 'Enviar',
    patient: 'Paciente',
    guardian: 'Tutor',
    therapist: 'Terapeuta',
    supervisor: 'Supervisor',
  },
  hi: {
    welcome: 'स्वागत है',
    register: 'पंजीकरण करें',
    login: 'लॉग इन करें',
    name: 'नाम',
    email: 'ईमेल',
    password: 'पासवर्ड',
    submit: 'जमा करें',
    patient: 'रोगी',
    guardian: 'अभिभावक',
    therapist: 'चिकित्सक',
    supervisor: 'पर्यवेक्षक',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState('en');

  const t = (key: string): string => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
