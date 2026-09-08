import React, { useState } from 'react';
import {
  FileText,
  Home,
  ChevronDown,
  UserPlus,
  Search,
  Trash2,
  Building2,
  Users,
  Briefcase,
} from 'lucide-react';
import { Colaborador, CATEGORIAS_PADRAO } from '../types';
import { useBrand } from '../lib/brand';
import { normalizarTexto } from '../lib/formatters';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
  colaboradores: Colaborador[];
  selectedColabId: string | null;
  onSelectColab: (id: string | null) => void;
  categoriaAtiva: string;
  onSelectCategoria: (cat: string) => void;
  onAddColaborador: (nome: string, setor: string) => Promise<void>;
  onDeleteColaborador: (id: string, nome: string) => Promise<void>;
  onOpenRelatorio: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onCloseMobile,
  colaboradores,
  selectedColabId,
  onSelectColab,
  categoriaAtiva,
  onSelectCategoria,
  onAddColaborador,
  onDeleteColaborador,
  onOpenRelatorio,
}) => {
  const { brand } = useBrand();

  // Acordeões
  const [accCategoriasAberto, setAccCategoriasAberto] = useState(true);
  const [accCadastroAberto, setAccCadastroAberto] = useState(false);

  // Form novo colaborador
  const [novoNome, setNovoNome] = useState('');
  const [novoSetor, setNovoSetor] = useState('');
  const [salvandoColab, setSalvandoColab] = useState(false);

  // Busca
  const [termoBusca, setTermoBusca] = useState('');

  const handleSubmeterColab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) return;
    try {
      setSalvandoColab(true);
      await onAddColaborador(novoNome.trim(), novoSetor.trim());
      setNovoNome('');
      setNovoSetor('');
      setAccCadastroAberto(false);
    } finally {
      setSalvandoColab(false);
    }
  };

  const termoNormalizado = normalizarTexto(termoBusca);
  const colabsFiltrados = [...colaboradores]
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
    .filter((c) => {
      if (!termoNormalizado) return true;
      const nomeMatch = normalizarTexto(c.nome).includes(termoNormalizado);
      const setorMatch = normalizarTexto(c.setor || '').includes(termoNormalizado);
      return nomeMatch || setorMatch;
    });

  return (
    <>
      {/* Overlay Mobile */}
      <div
        onClick={onCloseMobile}
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar Container */}
      <aside
        id="sidebar-menu"
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#221309] text-white flex flex-col transition-all duration-300 ease-in-out border-r border-[#382012] ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:-translate-x-72'
        }`}
      >
        {/* Topo / Logo & Empresa */}
        <div className="p-4 border-b border-[#382012] bg-[#1a0e06]/70">
          <div className="flex items-center gap-3">
            <img
              src={brand.logoUrl || './logo.jpg'}
              alt={brand.companyName}
              className="w-12 h-12 rounded-full object-cover border-2 border-[#542d13] bg-white shadow-md shrink-0"
              onError={(e) => {
                e.currentTarget.src = './logo.jpg';
              }}
            />
            <div className="min-w-0">
              <h1 className="font-extrabold text-sm tracking-tight text-white truncate">
                {brand.companyName || 'Rancho SpeedNet'}
              </h1>
              <p className="text-[11px] text-amber-200/80 font-medium truncate">
                {brand.subtitle || 'Desde 2017 • Controle'}
              </p>
            </div>
          </div>
        </div>

        {/* Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-amber-950">
          {/* Ações Rápidas */}
          <div className="space-y-2">
            <button
              id="btn-abrir-relatorio"
              onClick={() => {
                onOpenRelatorio();
                if (window.innerWidth < 1024) onCloseMobile();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white text-[#42220e] hover:bg-amber-50 font-bold text-xs shadow-md transition cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#42220e]" />
              <span>📋 Relatório do Mês</span>
            </button>

            <button
              id="btn-visao-geral"
              onClick={() => {
                onSelectColab(null);
                if (window.innerWidth < 1024) onCloseMobile();
              }}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition border cursor-pointer ${
                selectedColabId === null
                  ? 'bg-[#42220e] text-white border-[#6a3817] shadow-sm'
                  : 'bg-[#2f1b0e]/70 text-amber-100/80 border-[#382012] hover:bg-[#382012]'
              }`}
            >
              <Home className="w-4 h-4 text-amber-300" />
              <span>🏠 Visão Global</span>
            </button>
          </div>

          {/* Acordeão: Categorias */}
          <div className="rounded-xl border border-[#382012] bg-[#2a170b]/60 p-2.5">
            <button
              onClick={() => setAccCategoriasAberto(!accCategoriasAberto)}
              className="w-full flex items-center justify-between text-xs uppercase tracking-wider font-bold text-amber-200/70 hover:text-white transition py-1 cursor-pointer"
            >
              <span>Categorias ({categoriaAtiva})</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  accCategoriasAberto ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </button>

            {accCategoriasAberto && (
              <div className="mt-2.5 space-y-1">
                {CATEGORIAS_PADRAO.map((cat) => {
                  const isAtivo = categoriaAtiva === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => onSelectCategoria(cat.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-left transition cursor-pointer ${
                        isAtivo
                          ? 'bg-[#42220e] text-white shadow-xs font-bold border border-[#6a3817]'
                          : 'text-amber-100/70 hover:bg-[#382012]/80 hover:text-white'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Acordeão: Cadastro de Novo Colaborador */}
          <div className="rounded-xl border border-[#382012] bg-[#2a170b]/60 p-2.5">
            <button
              onClick={() => setAccCadastroAberto(!accCadastroAberto)}
              className="w-full flex items-center justify-between text-xs uppercase tracking-wider font-bold text-amber-300 hover:text-white transition py-1 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Novo Cadastro</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  accCadastroAberto ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </button>

            {accCadastroAberto && (
              <form onSubmit={handleSubmeterColab} className="mt-3 space-y-2">
                <input
                  id="user-name"
                  type="text"
                  placeholder="Nome Completo"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[#1a0e06] border border-[#442816] text-white placeholder-amber-200/40 focus:outline-none focus:border-amber-400"
                  required
                />
                <input
                  id="user-setor"
                  type="text"
                  placeholder="Setor / Cargo (ex: Tratador, Veterinário)"
                  value={novoSetor}
                  onChange={(e) => setNovoSetor(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[#1a0e06] border border-[#442816] text-white placeholder-amber-200/40 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  disabled={salvandoColab}
                  className="w-full py-2 px-3 rounded-lg bg-[#542d13] hover:bg-[#42220e] text-white text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer border border-[#6a3817]"
                >
                  {salvandoColab ? 'Cadastrando...' : '+ Adicionar Colaborador'}
                </button>
              </form>
            )}
          </div>

          {/* Seção: Colaboradores com Campo de Busca */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-200/70 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Colaboradores</span>
              </span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#1a0e06] text-amber-300 font-mono">
                {colaboradores.length}
              </span>
            </div>

            {/* Input de Busca */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-amber-200/40" />
              <input
                id="search-colab"
                type="text"
                placeholder="Buscar funcionário ou setor..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-[#1a0e06] border border-[#442816] text-white placeholder-amber-200/40 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Lista de Colaboradores */}
            <div id="list-users" className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
              {colabsFiltrados.length === 0 ? (
                <div className="text-center py-6 px-3 rounded-lg bg-[#1a0e06]/60 border border-[#382012]">
                  <p className="text-xs text-amber-200/60">
                    {termoBusca
                      ? 'Nenhum funcionário encontrado.'
                      : 'Nenhum colaborador cadastrado. Use o formulário acima para adicionar.'}
                  </p>
                </div>
              ) : (
                colabsFiltrados.map((u) => {
                  const isSelecionado = u.id === selectedColabId;
                  return (
                    <div
                      key={u.id}
                      onClick={() => {
                        onSelectColab(u.id);
                        if (window.innerWidth < 1024) onCloseMobile();
                      }}
                      className={`group relative flex items-center justify-between p-2.5 rounded-xl text-left transition cursor-pointer border ${
                        isSelecionado
                          ? 'bg-[#42220e] text-white border-[#6a3817] shadow-md font-semibold'
                          : 'bg-[#2a170b]/60 text-amber-100/90 border-[#382012] hover:bg-[#382012] hover:text-white'
                      }`}
                    >
                      <div className="min-w-0 pr-6">
                        <div className="text-xs font-bold truncate">{u.nome}</div>
                        {u.setor && (
                          <div
                            className={`text-[11px] truncate flex items-center gap-1 mt-0.5 ${
                              isSelecionado ? 'text-amber-200' : 'text-amber-200/60'
                            }`}
                          >
                            <Briefcase className="w-3 h-3 shrink-0" />
                            <span>{u.setor}</span>
                          </div>
                        )}
                      </div>

                      {/* Botão de Excluir */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteColaborador(u.id, u.nome);
                        }}
                        title="Remover Colaborador"
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-60 hover:opacity-100 transition cursor-pointer ${
                          isSelecionado
                            ? 'text-white hover:bg-[#542d13]'
                            : 'text-amber-200/60 hover:text-rose-400 hover:bg-[#1a0e06]'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Rodapé da Barra Lateral */}
        <div className="p-3.5 border-t border-[#382012] bg-[#1a0e06] text-center">
          <p className="text-[11px] text-amber-200/60 font-medium">
            Rancho SpeedNet • Desde 2017
          </p>
        </div>
      </aside>
    </>
  );
};
