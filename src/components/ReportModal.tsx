import React, { useState, useMemo } from 'react';
import { X, Copy, Check, MessageSquare, Filter, Calendar } from 'lucide-react';
import { Colaborador, Receita, CATEGORIAS_PADRAO } from '../types';
import { compilarRelatorioMensal } from '../lib/formatters';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataVisao: Date;
  receitas: Receita[];
  colaboradores: Colaborador[];
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  dataVisao,
  receitas,
  colaboradores,
}) => {
  // Inicializa o mês com base no dataVisao
  const [anoMes, setAnoMes] = useState(() => {
    const y = dataVisao.getFullYear();
    const m = (dataVisao.getMonth() + 1).toString().padStart(2, '0');
    return `${y}-${m}`;
  });

  const [categoriasAtivas, setCategoriasAtivas] = useState<string[]>(
    CATEGORIAS_PADRAO.map((c) => c.id)
  );

  const [ordem, setOrdem] = useState<'decrescente' | 'crescente' | 'alfabetica'>(
    'decrescente'
  );

  const [copiado, setCopiado] = useState(false);

  // Toggle categoria checkbox
  const toggleCategoria = (catId: string) => {
    setCategoriasAtivas((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  // Selecionar / desselecionar todas
  const selecionarTodas = () => {
    setCategoriasAtivas(CATEGORIAS_PADRAO.map((c) => c.id));
  };

  const { relatorioTexto, relatorioDados } = useMemo(() => {
    if (!anoMes) {
      return {
        relatorioTexto: 'Selecione um mês para compilar o relatório.',
        relatorioDados: null,
      };
    }
    const [anoStr, mesStr] = anoMes.split('-');
    const ano = parseInt(anoStr, 10);
    const mes = parseInt(mesStr, 10) - 1;

    if (categoriasAtivas.length === 0) {
      return {
        relatorioTexto:
          'Selecione pelo menos uma categoria acima para gerar o relatório consolidado.',
        relatorioDados: null,
      };
    }

    const { textoWhatsapp, dados } = compilarRelatorioMensal(
      ano,
      mes,
      categoriasAtivas,
      ordem,
      receitas,
      colaboradores
    );

    return { relatorioTexto: textoWhatsapp, relatorioDados: dados };
  }, [anoMes, categoriasAtivas, ordem, receitas, colaboradores]);

  if (!isOpen) return null;

  const handleCopiarWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(relatorioTexto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Fallback
      const textarea = document.getElementById('texto-relatorio') as HTMLTextAreaElement;
      if (textarea) {
        textarea.select();
        document.execCommand('copy');
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
      }
    }
  };

  return (
    <div
      id="modal-relatorio"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200 my-8">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-[#ebdcd0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#fbf7f4] text-[#42220e] border border-[#ebdcd0] flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Gerar Relatório Inteligente (WhatsApp)
              </h3>
              <p className="text-xs text-[#6e4b33]">
                Exportação formatada para o Rancho SpeedNet com pendências por funcionário.
              </p>
            </div>
          </div>
          <button
            id="btn-fechar-relatorio"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Checkboxes de Categorias */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#3e2413] uppercase tracking-wider">
                Categorias a incluir no cálculo:
              </label>
              <button
                type="button"
                onClick={selecionarTodas}
                className="text-[11px] font-bold text-[#42220e] hover:underline cursor-pointer"
              >
                Marcar todas
              </button>
            </div>

            <div
              id="container-checkboxes-relatorio"
              className="grid grid-cols-2 sm:grid-cols-3 gap-2"
            >
              {CATEGORIAS_PADRAO.map((cat) => {
                const isChecked = categoriasAtivas.includes(cat.id);
                return (
                  <label
                    key={cat.id}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition select-none ${
                      isChecked
                        ? 'bg-[#fbf7f4] border-[#42220e] text-[#42220e] font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCategoria(cat.id)}
                      className="rounded text-[#42220e] focus:ring-0 cursor-pointer"
                    />
                    <span>
                      {cat.icon} {cat.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Filtros de Mês e Ordenação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Mês de Referência</span>
              </label>
              <input
                id="input-mes-relatorio"
                type="month"
                value={anoMes}
                onChange={(e) => setAnoMes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Critério de Ordenação</span>
              </label>
              <select
                id="select-ordem-relatorio"
                value={ordem}
                onChange={(e) =>
                  setOrdem(e.target.value as 'decrescente' | 'crescente' | 'alfabetica')
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
              >
                <option value="decrescente">Maior Valor Pendente</option>
                <option value="crescente">Menor Valor Pendente</option>
                <option value="alfabetica">Ordem Alfabética</option>
              </select>
            </div>
          </div>

          {/* Pré-visualização do Relatório Formato WhatsApp */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wider text-slate-700">
                Pré-visualização da Mensagem:
              </span>
              <span className="text-[11px] font-mono">Formatado para WhatsApp</span>
            </div>

            <textarea
              id="texto-relatorio"
              readOnly
              value={relatorioTexto}
              className="w-full min-h-[220px] max-h-[300px] p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-mono text-xs focus:outline-none resize-y leading-relaxed select-all"
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              id="btn-copiar-relatorio"
              onClick={handleCopiarWhatsApp}
              className={`flex-1 w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs shadow-md transition cursor-pointer ${
                copiado
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {copiado ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copiado com Sucesso! Pronto para o WhatsApp</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Relatório p/ WhatsApp</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto py-3 px-5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
