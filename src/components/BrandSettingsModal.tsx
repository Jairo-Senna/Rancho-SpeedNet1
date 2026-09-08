import React, { useState } from 'react';
import {
  X,
  Palette,
  Upload,
  Building,
  Check,
  RotateCcw,
  Database,
  ExternalLink,
} from 'lucide-react';
import { useBrand, THEME_PALETTES } from '../lib/brand';
import {
  getStoredFirebaseConfig,
  saveStoredFirebaseConfig,
} from '../lib/firebase';
import { FirebaseCustomConfig } from '../types';

interface BrandSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrandSettingsModal: React.FC<BrandSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { brand, updateBrand, resetBrand } = useBrand();

  const [companyName, setCompanyName] = useState(brand.companyName);
  const [subtitle, setSubtitle] = useState(brand.subtitle);
  const [logoUrl, setLogoUrl] = useState(brand.logoUrl);
  const [colorTheme, setColorTheme] = useState(brand.colorTheme);

  // Firebase Config State
  const [mostrarFirebase, setMostrarFirebase] = useState(false);
  const [fbConfig, setFbConfig] = useState<FirebaseCustomConfig>(() =>
    getStoredFirebaseConfig()
  );
  const [fbSalvoSucesso, setFbSalvoSucesso] = useState(false);

  if (!isOpen) return null;

  const handleSalvarMarca = (e: React.FormEvent) => {
    e.preventDefault();
    updateBrand({
      companyName: companyName.trim() || 'Gestão Financeira',
      subtitle: subtitle.trim() || 'Controle de Equipes',
      logoUrl: logoUrl.trim(),
      colorTheme,
    });
    onClose();
  };

  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Por favor, selecione uma imagem com menos de 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSalvarFirebase = () => {
    if (!fbConfig.apiKey || !fbConfig.projectId) {
      alert('Informe ao menos a apiKey e o projectId do Firebase.');
      return;
    }
    saveStoredFirebaseConfig(fbConfig);
    setFbSalvoSucesso(true);
    setTimeout(() => {
      setFbSalvoSucesso(false);
      window.location.reload();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200 my-8">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-[#ebdcd0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#fbf7f4] text-[#42220e] border border-[#ebdcd0] flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2e180a]">
                Personalizar Marca, Logo & Cores
              </h3>
              <p className="text-xs text-[#6e4b33]">
                Altere o nome da empresa, logo e paleta de estilo do sistema.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSalvarMarca} className="mt-4 space-y-4">
          {/* Nome da Empresa */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Nome da Empresa / Sistema
            </label>
            <input
              type="text"
              placeholder="Ex: Minha Empresa, SpeedNet, Soluções Web"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 font-semibold"
            />
          </div>

          {/* Subtítulo */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Subtítulo / Slogan
            </label>
            <input
              type="text"
              placeholder="Ex: Controle Financeiro de Equipes"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Logo */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Logo da Empresa (Imagem)
            </label>
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div className="relative p-2 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
                  <img
                    src={logoUrl}
                    alt="Preview Logo"
                    className="max-h-9 max-w-[120px] object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs"
                    title="Remover logo"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                  <Building className="w-5 h-5" />
                </div>
              )}

              <div className="flex-1 space-y-1.5">
                <input
                  type="text"
                  placeholder="URL da imagem (https://...)"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
                />
                <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
                  <Upload className="w-3 h-3" />
                  <span>Ou selecione arquivo do computador</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadLogo}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Seletor de Paleta de Cores */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-slate-700">
              Cor do Site / Tema Visual
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(THEME_PALETTES).map(([key, paleta]) => {
                const isSelected = colorTheme === key;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setColorTheme(key)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50 shadow-xs ring-1 ring-slate-900'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: paleta.hex }}
                    />
                    <span className="truncate">{paleta.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configuração Avançada do Firebase */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setMostrarFirebase(!mostrarFirebase)}
              className="flex items-center justify-between w-full text-xs font-bold text-slate-600 hover:text-slate-900 py-1"
            >
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-500" />
                <span>Configurar Conta / Projeto do Firebase</span>
              </span>
              <span className="text-[11px] text-blue-600">
                {mostrarFirebase ? 'Ocultar' : 'Exibir chaves'}
              </span>
            </button>

            {mostrarFirebase && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                <p className="text-[11px] text-slate-500">
                  Quando criar seu projeto no Firebase Console (ou para o deploy
                  no GitHub Pages), insira suas credenciais abaixo:
                </p>

                <div>
                  <label className="text-[11px] font-bold text-slate-600">
                    Project ID
                  </label>
                  <input
                    type="text"
                    value={fbConfig.projectId}
                    onChange={(e) =>
                      setFbConfig({ ...fbConfig, projectId: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600">
                    API Key
                  </label>
                  <input
                    type="text"
                    value={fbConfig.apiKey}
                    onChange={(e) =>
                      setFbConfig({ ...fbConfig, apiKey: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600">
                    Auth Domain
                  </label>
                  <input
                    type="text"
                    value={fbConfig.authDomain}
                    onChange={(e) =>
                      setFbConfig({ ...fbConfig, authDomain: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleSalvarFirebase}
                    className="py-1.5 px-3 rounded-lg bg-[#42220e] text-white font-bold text-[11px] hover:bg-[#301809] transition"
                  >
                    {fbSalvoSucesso ? 'Salvo! Recarregando...' : 'Aplicar Credenciais'}
                  </button>
                  <a
                    href="https://console.firebase.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-[#42220e] font-bold hover:underline"
                  >
                    <span>Console Firebase</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#42220e] hover:bg-[#301809] text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Alterações de Marca</span>
            </button>

            <button
              type="button"
              onClick={() => {
                resetBrand();
                onClose();
              }}
              title="Restaurar padrões"
              className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
