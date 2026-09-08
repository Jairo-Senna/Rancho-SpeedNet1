import React, { useState } from 'react';
import { X, CheckCircle, DollarSign, Calendar } from 'lucide-react';
import { getDataFormatadaHoje } from '../lib/formatters';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  receitaId: string | null;
  tituloReceita: string;
  onConfirmPayment: (dados: {
    valor: number;
    observacao: string;
    data: string;
  }) => Promise<void>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  tituloReceita,
  onConfirmPayment,
}) => {
  const [valor, setValor] = useState('');
  const [obs, setObs] = useState('');
  const [data, setData] = useState(getDataFormatadaHoje());
  const [enviando, setEnviando] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(valor.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      alert('Por favor, informe um valor recebido válido.');
      return;
    }

    try {
      setEnviando(true);
      await onConfirmPayment({
        valor: val,
        observacao: obs.trim(),
        data: data.trim() || getDataFormatadaHoje(),
      });
      setValor('');
      setObs('');
      onClose();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      id="modal-pg"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 id="modal-title" className="text-base font-bold text-slate-900">
              Adicionar Pagamento / Baixa
            </h3>
            <p className="text-xs text-[#42220e] font-bold truncate max-w-[280px]">
              {tituloReceita}
            </p>
          </div>
          <button
            id="btn-close-modal"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Valor Recebido (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                R$
              </span>
              <input
                id="modal-val"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                autoFocus
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Data do Pagamento
            </label>
            <input
              type="text"
              placeholder="DD/MM/AAAA"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Observação (PIX, Banco, Conta, Comprovante...)
            </label>
            <textarea
              id="modal-obs"
              placeholder="Ex: Recebido em 25/03 via PIX Inter, comprovante arquivado."
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 min-h-[90px]"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              id="btn-confirm-pg"
              disabled={enviando}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{enviando ? 'Confirmando...' : 'Confirmar Pagamento'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
