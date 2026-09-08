import React from 'react';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Palette,
  Calendar,
  Layers,
  Database,
} from 'lucide-react';
import { useBrand } from '../lib/brand';
import { getMesRefText } from '../lib/formatters';
import { AuthUserState } from '../lib/firebase';

interface TopBarProps {
  onToggleSidebar: () => void;
  dataVisao: Date;
  onChangeMes: (delta: number) => void;
  categoriaAtiva: string;
  user: AuthUserState | null;
  onLogout: () => void;
  onOpenBrandSettings: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleSidebar,
  dataVisao,
  onChangeMes,
  categoriaAtiva,
  user,
  onLogout,
  onOpenBrandSettings,
}) => {
  const { brand, getThemeColors } = useBrand();
  const theme = getThemeColors();

  const mesAnoDisplay = dataVisao.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
  const mesRefText = getMesRefText(dataVisao);

  return (
    <header className="bg-white border-b border-[#ebdcd0] sticky top-0 z-30 shadow-xs">
      <div className="px-4 sm:px-6 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Lado Esquerdo: Botão Menu + Logo + Navegação do Mês */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            id="btn-toggle-menu"
            onClick={onToggleSidebar}
            className="p-2 rounded-xl border border-[#ded3c7] hover:bg-[#fcfaf8] text-[#42220e] transition cursor-pointer"
            title="Alternar barra lateral"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Miniatura da Logo + Nome */}
          <div className="flex items-center gap-2 pr-2 border-r border-[#ebdcd0]">
            <img
              src={brand.logoUrl || './logo.jpg'}
              alt={brand.companyName}
              className="w-8 h-8 rounded-full object-cover border border-[#42220e]/30 shadow-xs bg-white"
              onError={(e) => {
                e.currentTarget.src = './logo.jpg';
              }}
            />
            <span className="font-extrabold text-xs text-[#2e180a] tracking-tight hidden sm:inline">
              {brand.companyName}
            </span>
          </div>

          {/* Navegador de Mês */}
          <div className="flex items-center gap-1.5 bg-[#fbf8f5] p-1 rounded-xl border border-[#e8ded5]">
            <button
              id="btn-prev-month"
              onClick={() => onChangeMes(-1)}
              className="p-1.5 rounded-lg text-[#542d13] hover:bg-white hover:text-[#2e180a] transition cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-2.5 py-1 text-center min-w-[170px]">
              <div className="text-sm font-bold text-[#2e180a] capitalize flex items-center justify-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#8c674e]" />
                {mesAnoDisplay}
              </div>
              <div className="text-[11px] text-[#6e4b33] font-medium">
                {mesRefText}
              </div>
            </div>

            <button
              id="btn-next-month"
              onClick={() => onChangeMes(1)}
              className="p-1.5 rounded-lg text-[#542d13] hover:bg-white hover:text-[#2e180a] transition cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Categoria Ativa Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fbf8f5] border border-[#e8ded5] text-xs font-semibold text-[#42220e]">
            <Layers className="w-3.5 h-3.5 text-[#8c674e]" />
            <span>Categoria:</span>
            <span className="font-extrabold text-[#2e180a]">{categoriaAtiva}</span>
          </div>
        </div>

        {/* Lado Direito: Usuário, Customização de Marca e Sair */}
        <div className="flex items-center justify-between md:justify-end gap-2.5">
          {user?.isOfflineMode && (
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-medium flex items-center gap-1">
              <Database className="w-3 h-3" />
              Sessão Local
            </span>
          )}

          <button
            id="btn-brand-settings"
            onClick={onOpenBrandSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
            title="Personalizar Cores, Logo e Nome da Empresa"
          >
            <Palette className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Personalizar Marca</span>
          </button>

          <button
            id="btn-logout"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            title="Encerrar sessão"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};
