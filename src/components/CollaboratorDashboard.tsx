import React, { useState } from 'react';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  PlusCircle,
  Calendar,
  CreditCard,
  Trash2,
  ArrowLeft,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { Colaborador, Receita } from '../types';
import { formatarMoeda, getMesRefText } from '../lib/formatters';
import { ConfirmModal } from './ConfirmModal';

interface CollaboratorDashboardProps {
  colaborador: Colaborador;
  categoriaAtiva: string;
  dataVisao: Date;
  receitas: Receita[];
  onVoltarVisaoGeral: () => void;
  onAddReceita: (dados: {
    titulo: string;
    valorTotal: number;
    observacoes: string;
  }) => Promise<void>;
  onDeleteReceita: (id: string) => Promise<void>;
  onDeleteMultipleReceitas?: (ids: string[]) => Promise<void>;
  onDeletePagamento: (receitaId: string, index: number, valor: number) => Promise<void>;
  onAbrirModalBaixa: (receitaId: string, titulo: string) => void;
}

export const CollaboratorDashboard: React.FC<CollaboratorDashboardProps> = ({
  colaborador,
  categoriaAtiva,
  dataVisao,
  receitas,
  onVoltarVisaoGeral,
  onAddReceita,
  onDeleteReceita,
  onDeleteMultipleReceitas,
  onDeletePagamento,
  onAbrirModalBaixa,
}) => {
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novoValor, setNovoValor] = useState('');
  const [novasObs, setNovasObs] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  // Estado do Modal de Confirmação Seguro
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    action: () => Promise<void>;
  } | null>(null);

  const mesAtual = dataVisao.getMonth();
  const anoAtual = dataVisao.getFullYear();
  const mesRefTexto = getMesRefText(dataVisao);

  // Filtra receitas deste colaborador no mês e categoria ativa
  const receitasFiltradas = receitas
    .filter((r) => {
      const raw = r.dataRef || r.dataCriacao;
      if (!raw) return false;
      const d = new Date(raw);
      if (isNaN(d.getTime())) return false;

      const isMes = d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
      const cat = r.categoria || 'Salário';
      const isColab = r.colabId === colaborador.id || r.utilizadorId === colaborador.id;

      return isColab && isMes && cat === categoriaAtiva;
    })
    .sort((a, b) => {
      const d1 = a.dataRef || a.dataCriacao || '';
      const d2 = b.dataRef || b.dataCriacao || '';
      return d2.localeCompare(d1);
    });

  let totalPrevisto = 0;
  let totalRecebido = 0;

  receitasFiltradas.forEach((r) => {
    const pgs = r.pagamentos || r.historicoPagamentos || [];
    const somaPg = pgs.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
    totalPrevisto += Number(r.valorTotal) || 0;
    totalRecebido += somaPg;
  });

  const saldoRestante = totalPrevisto - totalRecebido;

  const handleSubmitReceita = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm(null);
    const val = parseFloat(novoValor.replace(',', '.'));
    if (!novoTitulo.trim() || isNaN(val) || val <= 0) {
      setErroForm('Por favor, preencha o título e um valor válido maior que zero.');
      return;
    }

    try {
      setSalvando(true);
      await onAddReceita({
        titulo: novoTitulo.trim(),
        valorTotal: val,
        observacoes: novasObs.trim(),
      });
      setNovoTitulo('');
      setNovoValor('');
      setNovasObs('');
      setErroForm(null);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div id="dashboard-content" className="space-y-6">
      {/* Topo do Colaborador com Botão Voltar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <button
            onClick={onVoltarVisaoGeral}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para a Visão Global</span>
          </button>
          <div className="flex items-center gap-3">
            <h2
              id="view-title"
              className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight"
            >
              {colaborador.nome}
            </h2>
            {colaborador.setor && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <Briefcase className="w-3 h-3 text-slate-400" />
                {colaborador.setor}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ficha financeira individual — Categoria ativa:{' '}
            <strong className="text-[#42220e] font-black">{categoriaAtiva}</strong>
          </p>
        </div>
      </div>

      {/* Grid de Resumo do Colaborador */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl p-5 border border-[#ebdcd0] shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#42220e]" />
          <div className="flex items-center justify-between text-[#6e4b33] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Previsto ({categoriaAtiva})
            </span>
            <span className="p-2 rounded-xl bg-[#f7f1eb] text-[#42220e]">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p
            id="sum-total"
            className="text-2xl sm:text-3xl font-extrabold text-[#2e180a]"
          >
            {formatarMoeda(totalPrevisto)}
          </p>
          <p className="text-[11px] text-[#8c674e] mt-1">Lançado neste mês</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Recebido / Baixado
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p
            id="sum-rec"
            className="text-2xl sm:text-3xl font-extrabold text-emerald-600"
          >
            {formatarMoeda(totalRecebido)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Total já liquidado</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Saldo Restante (Pendente)
            </span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p
            id="sum-rest"
            className={`text-2xl sm:text-3xl font-extrabold ${
              saldoRestante > 0 ? 'text-rose-600' : 'text-slate-800'
            }`}
          >
            {formatarMoeda(saldoRestante)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {saldoRestante <= 0 ? '100% Liquidado' : 'Valor ainda a pagar'}
          </p>
        </div>
      </div>

      {/* Card de Formulário: Nova Entrada de Valor */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <PlusCircle className="w-4 h-4 text-blue-600" />
          <h3
            id="titulo-nova-entrada"
            className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2"
          >
            <span>Nova Entrada de Valor</span>
            <span className="text-xs font-normal lowercase text-slate-500">
              {mesRefTexto}
            </span>
          </h3>
        </div>

        <form
          id="form-receita"
          onSubmit={handleSubmitReceita}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <div className="space-y-1 sm:col-span-1">
            <label className="text-xs font-bold text-slate-700">
              Título Descritivo
            </label>
            <input
              id="rec-title"
              type="text"
              placeholder={`Ex: ${categoriaAtiva} Mensal, Adiantamento, Bônus`}
              value={novoTitulo}
              onChange={(e) => setNovoTitulo(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="space-y-1 sm:col-span-1">
            <label className="text-xs font-bold text-slate-700">
              Valor Total (R$)
            </label>
            <input
              id="rec-val"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={novoValor}
              onChange={(e) => setNovoValor(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 font-semibold"
              required
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-bold text-slate-700">
              Observações Adicionais (Opcional)
            </label>
            <textarea
              id="rec-obs"
              placeholder="Detalhes, metas alcançadas, observações financeiras..."
              value={novasObs}
              onChange={(e) => setNovasObs(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 min-h-[70px]"
            />
          </div>

          {erroForm && (
            <div className="sm:col-span-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{erroForm}</span>
            </div>
          )}

          <div className="sm:col-span-2 pt-1">
            <button
              type="submit"
              id="btn-submit-lancamento"
              disabled={salvando}
              className="w-full py-3 px-4 rounded-xl bg-[#42220e] hover:bg-[#301809] text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {salvando
                ? 'Gravando lançamento...'
                : `Registrar ${categoriaAtiva} no Mês Atual`}
            </button>
          </div>
        </form>
      </div>

      {/* Lista / Relatório Detalhado de Receitas */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#ebdcd0]">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#3e2413]">
              Relatório Detalhado de Lançamentos ({categoriaAtiva})
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#ebdcd0]/80 text-[#42220e]">
              {receitasFiltradas.length} {receitasFiltradas.length === 1 ? 'item' : 'itens'}
            </span>
          </div>

          {/* Botão de Excluir Todos de uma vez */}
          {receitasFiltradas.length > 0 && (
            <button
              type="button"
              id="btn-excluir-todos"
              onClick={() => {
                const ids = receitasFiltradas.map((r) => r.id);
                setConfirmConfig({
                  isOpen: true,
                  title: `Excluir todos os lançamentos de ${mesRefTexto}?`,
                  message: `Tem certeza que deseja apagar permanentemente TODOS os ${receitasFiltradas.length} lançamentos de ${categoriaAtiva} de ${colaborador.nome} em ${mesRefTexto}?\n\nO montante de ${formatarMoeda(totalPrevisto)} será totalmente removido. Esta operação é irreversível.`,
                  confirmText: `Sim, Excluir Todos (${receitasFiltradas.length})`,
                  action: async () => {
                    if (onDeleteMultipleReceitas) {
                      await onDeleteMultipleReceitas(ids);
                    } else {
                      for (const id of ids) {
                        await onDeleteReceita(id);
                      }
                    }
                  },
                });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100/80 text-xs font-bold transition cursor-pointer self-start sm:self-auto shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir Todos Deste Mês</span>
            </button>
          )}
        </div>

        <div id="list-receitas" className="space-y-4">
          {receitasFiltradas.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-[#ebdcd0] text-center space-y-2">
              <p className="text-xs font-medium text-slate-500">
                Nenhum lançamento de {categoriaAtiva} neste mês para{' '}
                {colaborador.nome}.
              </p>
              <p className="text-[11px] text-slate-400">
                Preencha o formulário acima para adicionar um novo registro.
              </p>
            </div>
          ) : (
            receitasFiltradas.map((r) => {
              const arrayPgs = r.pagamentos || r.historicoPagamentos || [];
              const somaPg = arrayPgs.reduce(
                (acc, p) => acc + (Number(p.valor) || 0),
                0
              );
              const restante = (Number(r.valorTotal) || 0) - somaPg;
              const isQuitado = restante <= 0.01;

              return (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl p-5 border border-[#ebdcd0] shadow-xs border-l-4 border-l-[#42220e] space-y-4"
                >
                  {/* Topo do Lançamento */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900">
                        {r.titulo}
                      </h4>
                      {isQuitado ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Quitado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Pendente
                        </span>
                      )}
                    </div>
                    <span className="text-lg font-extrabold text-[#42220e]">
                      {formatarMoeda(r.valorTotal)}
                    </span>
                  </div>

                  {/* Detalhes de Valores */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 bg-[#fdfbf9] p-2.5 rounded-xl border border-[#ebdcd0]">
                    <div>
                      <span>Recebido: </span>
                      <strong className="text-emerald-600 font-bold">
                        {formatarMoeda(somaPg)}
                      </strong>
                    </div>
                    <div>
                      <span>Restante: </span>
                      <strong className="text-rose-600 font-bold">
                        {formatarMoeda(restante)}
                      </strong>
                    </div>
                    {r.dataRef && (
                      <div className="text-slate-400 font-normal ml-auto flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3" />
                        {new Date(r.dataRef).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>

                  {/* Observações */}
                  {r.observacoes && (
                    <div className="text-xs bg-amber-50/50 border border-amber-200/60 p-3 rounded-xl text-slate-700">
                      <strong className="font-semibold text-amber-900">
                        Observação:{' '}
                      </strong>
                      <span>{r.observacoes}</span>
                    </div>
                  )}

                  {/* Histórico de Pagamentos */}
                  {arrayPgs.length > 0 && (
                    <div className="bg-[#fcfaf7] rounded-xl p-3 border border-[#ebdcd0] space-y-2">
                      <div className="text-[11px] font-bold text-[#42220e] uppercase tracking-wider">
                        Histórico de Pagamentos / Baixas:
                      </div>

                      <div className="space-y-1.5 divide-y divide-slate-200/60">
                        {arrayPgs.map((p, index) => (
                          <div
                            key={index}
                            className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 font-semibold">
                                <span className="text-slate-500 font-mono text-[11px]">
                                  📅 {p.data}
                                </span>
                                <span className="text-emerald-700 font-bold">
                                  + {formatarMoeda(p.valor)}
                                </span>
                              </div>
                              {(p.obs || p.observacao) && (
                                <p className="text-[11px] text-slate-500 italic mt-0.5 bg-white px-2 py-0.5 rounded border border-slate-200 w-fit">
                                  {p.obs || p.observacao}
                                </p>
                              )}
                            </div>

                            {/* Botão de Excluir Pagamento Parcial */}
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmConfig({
                                  isOpen: true,
                                  title: 'Remover Baixa / Pagamento?',
                                  message: `Deseja realmente apagar esta baixa de ${formatarMoeda(p.valor)} registrada em ${p.data}?\n\nO saldo pendente deste lançamento voltará a ser cobrado.`,
                                  confirmText: 'Sim, Remover Baixa',
                                  action: async () => {
                                    await onDeletePagamento(r.id, index, p.valor);
                                  },
                                });
                              }}
                              title="Apagar este pagamento individual e recalcular pendência"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botões de Ação */}
                  <div className="flex items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => onAbrirModalBaixa(r.id, r.titulo)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Baixar Valor</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setConfirmConfig({
                          isOpen: true,
                          title: 'Excluir este lançamento?',
                          message: `Tem certeza que deseja apagar permanentemente o lançamento "${r.titulo}" no valor de ${formatarMoeda(r.valorTotal)}?\n\nO registro e suas baixas serão removidos do sistema.`,
                          confirmText: 'Sim, Excluir Lançamento',
                          action: async () => {
                            await onDeleteReceita(r.id);
                          },
                        });
                      }}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
                      title="Excluir lançamento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir Lançamento</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de Confirmação Seguro */}
      <ConfirmModal
        isOpen={!!confirmConfig?.isOpen}
        title={confirmConfig?.title || ''}
        message={confirmConfig?.message || ''}
        confirmText={confirmConfig?.confirmText || 'Confirmar Exclusão'}
        onConfirm={async () => {
          if (confirmConfig?.action) {
            await confirmConfig.action();
          }
          setConfirmConfig(null);
        }}
        onCancel={() => setConfirmConfig(null)}
      />
    </div>
  );
};
