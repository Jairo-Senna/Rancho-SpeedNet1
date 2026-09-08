import React, { useState, useEffect } from 'react';
import { AlertTriangle, Copy, Check, ExternalLink, X } from 'lucide-react';

export const FirestoreRulesAlert: React.FC = () => {
  const [temAviso, setTemAviso] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    const handler = () => {
      setTemAviso(true);
    };
    window.addEventListener('firebase_permission_warning', handler);
    return () => window.removeEventListener('firebase_permission_warning', handler);
  }, []);

  const regrasTexto = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permite leitura e escrita para quem estiver logado no sistema
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`;

  const handleCopiar = () => {
    navigator.clipboard.writeText(regrasTexto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  if (!temAviso) return null;

  return (
    <>
      {/* Banner Superior de Aviso */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-amber-900 text-xs flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Aviso de Permissão do Firebase:</strong> O Firestore bloqueou a gravação na nuvem (regras bloqueadas). Seus lançamentos e colaboradores estão <strong>salvos e seguros no seu dispositivo</strong>, mas para salvar na nuvem do Firebase você precisa ativar as Regras.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setModalAberto(true)}
            className="px-2.5 py-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold cursor-pointer transition shadow-2xs"
          >
            Como Liberar (1 Minuto)
          </button>
          <button
            onClick={() => setTemAviso(false)}
            className="p-1 text-amber-700 hover:text-amber-900 cursor-pointer"
            title="Fechar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modal Explicativo de Regras */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#ebdcd0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#2e180a]">
                    Liberar Gravação no Firebase Firestore
                  </h3>
                  <p className="text-xs text-[#6e4b33]">
                    Passo a passo rápido para seu banco de dados aceitar os cadastros
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                Quando o Firestore é criado, o Google ativa por padrão o modo bloqueado (<code className="bg-slate-100 px-1 py-0.5 rounded text-red-600">allow read, write: false;</code>), o que impede salvar colaboradores e receitas na nuvem.
              </p>

              <div className="bg-[#fcfaf7] border border-[#ebdcd0] rounded-xl p-3 space-y-2">
                <span className="font-bold text-[#42220e]">Instruções:</span>
                <ol className="list-decimal list-inside space-y-1 text-slate-700">
                  <li>Clique no botão abaixo para abrir a aba de Regras do Firestore.</li>
                  <li>Substitua o código atual pelo código abaixo.</li>
                  <li>Clique no botão azul <strong>Publicar (Publish)</strong> no topo da tela do Firebase.</li>
                </ol>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-slate-700 uppercase tracking-wider">
                    Regras Prontas para Copiar:
                  </span>
                  <button
                    onClick={handleCopiar}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#42220e] hover:underline cursor-pointer"
                  >
                    {copiado ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Código</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-100 font-mono text-[11px] p-3 rounded-xl overflow-x-auto leading-relaxed">
                  {regrasTexto}
                </pre>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <a
                href="https://console.firebase.google.com/project/rancho-speednet/firestore/rules"
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#42220e] hover:bg-[#301809] text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                <span>Abrir Regras no Console do Firebase</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setModalAberto(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
