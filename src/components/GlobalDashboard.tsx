import React from 'react';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  PieChart,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { Colaborador, Receita } from '../types';
import { formatarMoeda } from '../lib/formatters';

interface GlobalDashboardProps {
  categoriaAtiva: string;
  dataVisao: Date;
  colaboradores: Colaborador[];
  receitas: Receita[];
  onSelectColab: (id: string) => void;
  onOpenRelatorio: () => void;
}

export const GlobalDashboard: React.FC<GlobalDashboardProps> = ({
  categoriaAtiva,
  dataVisao,
  colaboradores,
  receitas,
  onSelectColab,
  onOpenRelatorio,
}) => {
  const mesAtual = dataVisao.getMonth();
  const anoAtual = dataVisao.getFullYear();

  // Filtra receitas do mês atual, da categoria ativa e de colaboradores ativos
  const receitasFiltradas = receitas.filter((r) => {
    const rawData = r.dataRef || r.dataCriacao;
    if (!rawData) return false;
    const d = new Date(rawData);
    if (isNaN(d.getTime())) return false;

    const isMes = d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    const cat = r.categoria || 'Salário';
    const isCategoria = cat === categoriaAtiva;

    const idColab = r.colabId || r.utilizadorId;
    const isAtivo = colaboradores.some((u) => u.id === idColab);

    return isMes && isCategoria && isAtivo;
  });

  let totalPrevisto = 0;
  let totalRecebido = 0;

  // Agrupamento por colaborador para tabela
  const mapaColaboradores: Record<
    string,
    {
      colab: Colaborador;
      qtdLancamentos: number;
      previsto: number;
      recebido: number;
      restante: number;
    }
  > = {};

  receitasFiltradas.forEach((r) => {
    const pgs = r.pagamentos || r.historicoPagamentos || [];
    const somaPg = pgs.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
    const valTot = Number(r.valorTotal) || 0;

    totalPrevisto += valTot;
    totalRecebido += somaPg;

    const idColab = r.colabId || r.utilizadorId || '';
    const colabObj = colaboradores.find((u) => u.id === idColab);
    if (colabObj) {
      if (!mapaColaboradores[idColab]) {
        mapaColaboradores[idColab] = {
          colab: colabObj,
          qtdLancamentos: 0,
          previsto: 0,
          recebido: 0,
          restante: 0,
        };
      }
      mapaColaboradores[idColab].qtdLancamentos += 1;
      mapaColaboradores[idColab].previsto += valTot;
      mapaColaboradores[idColab].recebido += somaPg;
      mapaColaboradores[idColab].restante += valTot - somaPg;
    }
  });

  const saldoRestante = totalPrevisto - totalRecebido;
  const listaColabsComLancamento = Object.values(mapaColaboradores).sort(
    (a, b) => b.restante - a.restante
  );

  return (
    <div id="global-dashboard" className="space-y-6">
      {/* Título da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#ebdcd0]">
        <div>
          <h2
            id="titulo-visao-geral"
            className="text-xl sm:text-2xl font-extrabold text-[#2e180a] tracking-tight flex items-center gap-2"
          >
            <span>Visão Geral</span>
            <span className="text-[#8c674e] font-light">—</span>
            <span className="text-[#42220e] font-black">{categoriaAtiva}</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#6e4b33] mt-0.5">
            Consolidado empresarial da folha e lançamentos do Rancho SpeedNet.
          </p>
        </div>

        <button
          onClick={onOpenRelatorio}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#42220e] hover:bg-[#301809] text-white text-xs font-bold transition shadow-md cursor-pointer w-fit"
        >
          <PieChart className="w-4 h-4 text-amber-300" />
          <span>Exportar Relatório p/ WhatsApp</span>
        </button>
      </div>

      {/* Grid de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Total Previsto */}
        <div className="bg-white rounded-2xl p-5 border border-[#ebdcd0] shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#42220e]" />
          <div className="flex items-center justify-between text-[#6e4b33] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Previsto (Rancho)
            </span>
            <span className="p-2 rounded-xl bg-[#f7f1eb] text-[#42220e]">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p
            id="global-sum-total"
            className="text-2xl sm:text-3xl font-extrabold text-[#2e180a]"
          >
            {formatarMoeda(totalPrevisto)}
          </p>
          <p className="text-[11px] text-[#8c674e] mt-1">
            Soma de todos os lançamentos de {categoriaAtiva}
          </p>
        </div>

        {/* Total Recebido / Baixado */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Baixado / Pago
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p
            id="global-sum-rec"
            className="text-2xl sm:text-3xl font-extrabold text-emerald-600"
          >
            {formatarMoeda(totalRecebido)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Valores já recebidos/quitados neste mês
          </p>
        </div>

        {/* Saldo Restante / Pendente */}
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
            id="global-sum-rest"
            className={`text-2xl sm:text-3xl font-extrabold ${
              saldoRestante > 0 ? 'text-rose-600' : 'text-slate-800'
            }`}
          >
            {formatarMoeda(saldoRestante)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {saldoRestante <= 0
              ? 'Todos os pagamentos da categoria foram quitados!'
              : 'Diferença pendente a liquidar'}
          </p>
        </div>
      </div>

      {/* Tabela de Colaboradores e Lançamentos do Mês */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#42220e]" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Desempenho por Colaborador ({categoriaAtiva})
            </h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#fbf7f4] text-[#42220e] border border-[#ebdcd0]">
            {listaColabsComLancamento.length} com lançamentos
          </span>
        </div>

        {listaColabsComLancamento.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#fbf7f4] text-[#42220e] border border-[#ebdcd0] flex items-center justify-center text-xl">
              📊
            </div>
            <h4 className="text-base font-bold text-slate-800">
              Nenhum lançamento de {categoriaAtiva} registrado neste mês
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Selecione um colaborador na barra lateral para registrar valores de{' '}
              {categoriaAtiva}, baixar pagamentos ou consultar o histórico individual.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Colaborador</th>
                  <th className="py-3 px-4">Setor / Cargo</th>
                  <th className="py-3 px-4 text-right">Previsto</th>
                  <th className="py-3 px-4 text-right">Recebido</th>
                  <th className="py-3 px-4 text-right">Pendente</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listaColabsComLancamento.map((item) => {
                  const quitado = item.restante <= 0.01;
                  return (
                    <tr
                      key={item.colab.id}
                      className="hover:bg-slate-50/80 transition"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {item.colab.nome}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {item.colab.setor || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                        {formatarMoeda(item.previsto)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-600">
                        {formatarMoeda(item.recebido)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                        {formatarMoeda(item.restante)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {quitado ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" />
                            Quitado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                            <AlertCircle className="w-3 h-3" />
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onSelectColab(item.colab.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#fbf7f4] text-[#42220e] hover:bg-[#ebdcd0] border border-[#ded3c7] font-bold text-[11px] transition cursor-pointer"
                        >
                          <span>Ver Ficha</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
