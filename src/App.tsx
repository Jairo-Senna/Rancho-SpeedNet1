import React, { useState, useEffect } from 'react';
import { BrandProvider } from './lib/brand';
import {
  subscribeAuth,
  logoutUser,
  subscribeColaboradores,
  addColaborador,
  deleteColaborador,
  subscribeReceitas,
  addReceita,
  deleteReceita,
  deleteMultipleReceitas,
  updateReceitaPagamentos,
  AuthUserState,
} from './lib/firebase';
import { Colaborador, Receita, PagamentoItem } from './types';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { GlobalDashboard } from './components/GlobalDashboard';
import { CollaboratorDashboard } from './components/CollaboratorDashboard';
import { PaymentModal } from './components/PaymentModal';
import { ReportModal } from './components/ReportModal';
import { BrandSettingsModal } from './components/BrandSettingsModal';
import { AuthScreen } from './components/AuthScreen';
import { FirestoreRulesAlert } from './components/FirestoreRulesAlert';
import { ConfirmModal } from './components/ConfirmModal';

function MainApp() {
  const [user, setUser] = useState<AuthUserState | null>(null);
  const [authCarregando, setAuthCarregando] = useState(true);

  // Estados principais de navegação e filtros
  const [dataVisao, setDataVisao] = useState<Date>(() => new Date());
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('Salário');
  const [selectedColabId, setSelectedColabId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Dados em tempo real
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [receitas, setReceitas] = useState<Receita[]>([]);

  // Modais
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isBrandSettingsOpen, setIsBrandSettingsOpen] = useState(false);
  const [colabParaRemover, setColabParaRemover] = useState<{
    id: string;
    nome: string;
  } | null>(null);
  const [paymentModalState, setPaymentModalState] = useState<{
    isOpen: boolean;
    receitaId: string | null;
    titulo: string;
  }>({
    isOpen: false,
    receitaId: null,
    titulo: '',
  });

  // Listener de Autenticação
  useEffect(() => {
    const unsub = subscribeAuth((usuario) => {
      setUser(usuario);
      setAuthCarregando(false);
    });
    return () => unsub();
  }, []);

  // Listeners de dados sincronizados com Firebase / Cache local
  useEffect(() => {
    if (!user) {
      setColaboradores([]);
      setReceitas([]);
      return;
    }

    const unsubColabs = subscribeColaboradores(user.uid, (data) => {
      // Se for a primeira vez e estiver vazio no modo demo/local, semeia dados iniciais
      if (data.length === 0 && user.isOfflineMode) {
        const seedColabs = [
          { nome: 'Carlos Silva', setor: 'Técnico de Redes' },
          { nome: 'Mariana Souza', setor: 'Atendimento Comercial' },
          { nome: 'Rodrigo Lima', setor: 'Suporte NOC' },
        ];
        seedColabs.forEach((s) => addColaborador(user.uid, s));
      }
      setColaboradores(data);
    });

    const unsubRecs = subscribeReceitas(user.uid, (data) => {
      setReceitas(data);
    });

    return () => {
      unsubColabs();
      unsubRecs();
    };
  }, [user]);

  // Se o colaborador selecionado for removido, volta para a Visão Global
  useEffect(() => {
    if (
      selectedColabId &&
      colaboradores.length > 0 &&
      !colaboradores.some((c) => c.id === selectedColabId)
    ) {
      setSelectedColabId(null);
    }
  }, [colaboradores, selectedColabId]);

  // Manipulação de Navegação de Mês
  const handleChangeMes = (delta: number) => {
    setDataVisao((prev) => {
      const nextDate = new Date(prev);
      nextDate.setMonth(nextDate.getMonth() + delta);
      return nextDate;
    });
  };

  // Operações de Colaborador
  const handleAddColaborador = async (nome: string, setor: string) => {
    if (!user) return;
    const newId = await addColaborador(user.uid, { nome, setor });
    if (newId) {
      setSelectedColabId(newId);
    }
  };

  const handleDeleteColaborador = (id: string, nome: string) => {
    setColabParaRemover({ id, nome });
  };

  const handleConfirmarRemocaoColab = async () => {
    if (!user || !colabParaRemover) return;
    const targetId = colabParaRemover.id;
    await deleteColaborador(user.uid, targetId);
    if (selectedColabId === targetId) {
      setSelectedColabId(null);
    }
    setColabParaRemover(null);
  };

  // Operações de Receita
  const handleAddReceita = async (dados: {
    titulo: string;
    valorTotal: number;
    observacoes: string;
  }) => {
    if (!user || !selectedColabId) return;
    const dataCriacao = new Date(
      dataVisao.getFullYear(),
      dataVisao.getMonth(),
      10
    ).toISOString();

    await addReceita(user.uid, {
      colabId: selectedColabId,
      titulo: dados.titulo,
      categoria: categoriaAtiva,
      valorTotal: dados.valorTotal,
      observacoes: dados.observacoes,
      dataRef: dataCriacao,
    });
  };

  const handleDeleteReceita = async (receitaId: string) => {
    if (!user) return;
    await deleteReceita(user.uid, receitaId);
  };

  const handleDeleteMultipleReceitas = async (receitaIds: string[]) => {
    if (!user || !receitaIds.length) return;
    await deleteMultipleReceitas(user.uid, receitaIds);
  };

  const handleDeletePagamento = async (
    receitaId: string,
    index: number,
    _valor: number
  ) => {
    if (!user) return;
    const rec = receitas.find((r) => r.id === receitaId);
    if (!rec) return;
    const arrayAtual = [
      ...(rec.pagamentos || rec.historicoPagamentos || []),
    ];
    arrayAtual.splice(index, 1);
    await updateReceitaPagamentos(user.uid, receitaId, arrayAtual);
  };

  const handleConfirmarPagamento = async (dados: {
    valor: number;
    observacao: string;
    data: string;
  }) => {
    if (!user || !paymentModalState.receitaId) return;
    const rec = receitas.find((r) => r.id === paymentModalState.receitaId);
    if (!rec) return;

    const arrayAtual = [
      ...(rec.pagamentos || rec.historicoPagamentos || []),
    ];
    const novoItem: PagamentoItem = {
      valor: dados.valor,
      obs: dados.observacao,
      observacao: dados.observacao,
      data: dados.data,
    };

    await updateReceitaPagamentos(user.uid, rec.id, [...arrayAtual, novoItem]);
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setSelectedColabId(null);
  };

  if (authCarregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-400">
            Carregando sistema financeiro...
          </p>
        </div>
      </div>
    );
  }

  // Se não estiver logado, exibe tela de login / registro
  if (!user) {
    return (
      <AuthScreen
        onLoginSuccess={() => {
          /* o listener onAuthChange cuidará do estado */
        }}
      />
    );
  }

  const colaboradorSelecionado = colaboradores.find(
    (c) => c.id === selectedColabId
  );

  return (
    <div id="screen-app" className="min-h-screen flex bg-[#fcfaf7] text-slate-800">
      {/* Barra Lateral */}
      <Sidebar
        isOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        colaboradores={colaboradores}
        selectedColabId={selectedColabId}
        onSelectColab={(id) => setSelectedColabId(id)}
        categoriaAtiva={categoriaAtiva}
        onSelectCategoria={(cat) => setCategoriaAtiva(cat)}
        onAddColaborador={handleAddColaborador}
        onDeleteColaborador={handleDeleteColaborador}
        onOpenRelatorio={() => setIsReportOpen(true)}
      />

      {/* Conteúdo Principal */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'lg:pl-72' : 'pl-0'
        }`}
      >
        {/* Alerta de Regras de Segurança caso necessário */}
        <FirestoreRulesAlert />

        {/* TopBar */}
        <TopBar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          dataVisao={dataVisao}
          onChangeMes={handleChangeMes}
          categoriaAtiva={categoriaAtiva}
          user={user}
          onLogout={handleLogout}
          onOpenBrandSettings={() => setIsBrandSettingsOpen(true)}
        />

        {/* Área de Visualização com Rolagem */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {colaboradorSelecionado ? (
            <CollaboratorDashboard
              colaborador={colaboradorSelecionado}
              categoriaAtiva={categoriaAtiva}
              dataVisao={dataVisao}
              receitas={receitas}
              onVoltarVisaoGeral={() => setSelectedColabId(null)}
              onAddReceita={handleAddReceita}
              onDeleteReceita={handleDeleteReceita}
              onDeleteMultipleReceitas={handleDeleteMultipleReceitas}
              onDeletePagamento={handleDeletePagamento}
              onAbrirModalBaixa={(recId, titulo) =>
                setPaymentModalState({
                  isOpen: true,
                  receitaId: recId,
                  titulo,
                })
              }
            />
          ) : (
            <GlobalDashboard
              categoriaAtiva={categoriaAtiva}
              dataVisao={dataVisao}
              colaboradores={colaboradores}
              receitas={receitas}
              onSelectColab={(id) => setSelectedColabId(id)}
              onOpenRelatorio={() => setIsReportOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Modais do Sistema */}
      <ConfirmModal
        isOpen={!!colabParaRemover}
        title="Remover Colaborador?"
        message={`Tem certeza que deseja remover ${colabParaRemover?.nome} da lista lateral do Rancho SpeedNet?\n\nOs lançamentos já efetuados continuarão guardados caso decida reativá-lo, mas não farão mais parte da contabilidade ativa deste mês.`}
        confirmText="Sim, Remover Colaborador"
        onConfirm={handleConfirmarRemocaoColab}
        onCancel={() => setColabParaRemover(null)}
      />

      <PaymentModal
        isOpen={paymentModalState.isOpen}
        receitaId={paymentModalState.receitaId}
        tituloReceita={paymentModalState.titulo}
        onClose={() =>
          setPaymentModalState({ isOpen: false, receitaId: null, titulo: '' })
        }
        onConfirmPayment={handleConfirmarPagamento}
      />

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        dataVisao={dataVisao}
        receitas={receitas}
        colaboradores={colaboradores}
      />

      <BrandSettingsModal
        isOpen={isBrandSettingsOpen}
        onClose={() => setIsBrandSettingsOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrandProvider>
      <MainApp />
    </BrandProvider>
  );
}
