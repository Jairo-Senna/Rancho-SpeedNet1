import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrandSettings } from '../types';

interface BrandContextType {
  brand: BrandSettings;
  updateBrand: (newBrand: Partial<BrandSettings>) => void;
  resetBrand: () => void;
  getThemeColors: () => {
    primary: string;
    primaryHover: string;
    primaryLight: string;
    badgeBg: string;
    borderAccent: string;
  };
}

const STORAGE_KEY_BRAND = 'gestao_financeira_brand_settings';

export const THEME_PALETTES: Record<
  string,
  {
    name: string;
    hex: string;
    primary: string;
    primaryHover: string;
    primaryLight: string;
    badgeBg: string;
    borderAccent: string;
  }
> = {
  brown: {
    name: 'Marrom Rancho (Oficial)',
    hex: '#42220e',
    primary: 'bg-[#42220e] text-white',
    primaryHover: 'hover:bg-[#301809]',
    primaryLight: 'bg-[#fcfaf7] text-[#42220e] border-[#e8ded5]',
    badgeBg: 'bg-[#efe6dc] text-[#42220e]',
    borderAccent: 'border-[#42220e]',
  },
  blue: {
    name: 'Azul Corporativo',
    hex: '#2563eb',
    primary: 'bg-blue-600 text-white',
    primaryHover: 'hover:bg-blue-700',
    primaryLight: 'bg-blue-50 text-blue-700 border-blue-200',
    badgeBg: 'bg-blue-100 text-blue-800',
    borderAccent: 'border-blue-500',
  },
  emerald: {
    name: 'Verde Esmeralda',
    hex: '#059669',
    primary: 'bg-emerald-600 text-white',
    primaryHover: 'hover:bg-emerald-700',
    primaryLight: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    borderAccent: 'border-emerald-500',
  },
  orange: {
    name: 'Laranja Dinâmico',
    hex: '#ea580c',
    primary: 'bg-orange-600 text-white',
    primaryHover: 'hover:bg-orange-700',
    primaryLight: 'bg-orange-50 text-orange-700 border-orange-200',
    badgeBg: 'bg-orange-100 text-orange-800',
    borderAccent: 'border-orange-500',
  },
  violet: {
    name: 'Roxo Tecnológico',
    hex: '#7c3aed',
    primary: 'bg-violet-600 text-white',
    primaryHover: 'hover:bg-violet-700',
    primaryLight: 'bg-violet-50 text-violet-700 border-violet-200',
    badgeBg: 'bg-violet-100 text-violet-800',
    borderAccent: 'border-violet-500',
  },
  slate: {
    name: 'Grafite Executivo',
    hex: '#334155',
    primary: 'bg-slate-800 text-white',
    primaryHover: 'hover:bg-slate-900',
    primaryLight: 'bg-slate-100 text-slate-800 border-slate-300',
    badgeBg: 'bg-slate-200 text-slate-800',
    borderAccent: 'border-slate-700',
  },
  rose: {
    name: 'Rubi Elegante',
    hex: '#e11d48',
    primary: 'bg-rose-600 text-white',
    primaryHover: 'hover:bg-rose-700',
    primaryLight: 'bg-rose-50 text-rose-700 border-rose-200',
    badgeBg: 'bg-rose-100 text-rose-800',
    borderAccent: 'border-rose-500',
  },
};

const DEFAULT_BRAND: BrandSettings = {
  companyName: 'Rancho SpeedNet',
  subtitle: 'Desde 2017 • Controlador Financeiro',
  logoUrl: './logo.jpg',
  colorTheme: 'brown',
};

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brand, setBrand] = useState<BrandSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BRAND);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Atualiza para Rancho SpeedNet se ainda tiver o genérico
        if (parsed.companyName === 'Gestão Financeira' || !parsed.logoUrl) {
          return DEFAULT_BRAND;
        }
        return { ...DEFAULT_BRAND, ...parsed };
      }
    } catch {
      // ignore
    }
    return DEFAULT_BRAND;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BRAND, JSON.stringify(brand));
    } catch {
      // ignore
    }
  }, [brand]);

  const updateBrand = (newValues: Partial<BrandSettings>) => {
    setBrand((prev) => ({ ...prev, ...newValues }));
  };

  const resetBrand = () => {
    setBrand(DEFAULT_BRAND);
  };

  const getThemeColors = () => {
    return THEME_PALETTES[brand.colorTheme] || THEME_PALETTES.blue;
  };

  return (
    <BrandContext.Provider value={{ brand, updateBrand, resetBrand, getThemeColors }}>
      {children}
    </BrandContext.Provider>
  );
};

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand deve ser usado dentro de um BrandProvider');
  }
  return context;
}
