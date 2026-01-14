
import React, { createContext, useContext, useState, useEffect } from 'react';
import { DigitalSoulProfile } from '../types';

interface SoulContextType {
  soul: DigitalSoulProfile | null;
  setSoul: (soul: DigitalSoulProfile) => void;
  isSyncing: boolean;
  setIsSyncing: (state: boolean) => void;
}

const SoulContext = createContext<SoulContextType | undefined>(undefined);

export const SoulProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [soul, setSoulState] = useState<DigitalSoulProfile | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('nexus_digital_soul');
    if (saved) setSoulState(JSON.parse(saved));
  }, []);

  const setSoul = (newSoul: DigitalSoulProfile) => {
    setSoulState(newSoul);
    localStorage.setItem('nexus_digital_soul', JSON.stringify(newSoul));
  };

  return (
    <SoulContext.Provider value={{ soul, setSoul, isSyncing, setIsSyncing }}>
      {children}
    </SoulContext.Provider>
  );
};

export const useSoul = () => {
  const context = useContext(SoulContext);
  if (!context) throw new Error('useSoul must be used within a SoulProvider');
  return context;
};
