export type CategoriaFinanceira = 'Salário' | 'Comissões' | 'Extras' | 'Bonificação' | 'Metas' | string;

export const CATEGORIAS_PADRAO: { id: CategoriaFinanceira; label: string; icon: string }[] = [
  { id: 'Salário', label: 'Salário', icon: '💰' },
  { id: 'Comissões', label: 'Comissões', icon: '📈' },
  { id: 'Extras', label: 'Extras', icon: '⏱️' },
  { id: 'Bonificação', label: 'Bonificação', icon: '🎁' },
  { id: 'Metas', label: 'Metas', icon: '🎯' },
];

export interface Colaborador {
  id: string;
  nome: string;
  setor?: string;
  criadoEm?: string;
}

export interface PagamentoItem {
  valor: number;
  data: string; // e.g. "DD/MM/AAAA"
  obs?: string;
  observacao?: string;
}

export interface Receita {
  id: string;
  colabId: string;
  utilizadorId?: string; // fallback para compatibilidade legado
  titulo: string;
  categoria: CategoriaFinanceira;
  valorTotal: number;
  observacoes?: string;
  dataRef: string; // ISO string do mês/ano
  dataCriacao?: string;
  pagamentos?: PagamentoItem[];
  historicoPagamentos?: PagamentoItem[];
}

export interface BrandSettings {
  companyName: string;
  subtitle: string;
  logoUrl: string;
  colorTheme: string; // 'blue' | 'emerald' | 'orange' | 'violet' | 'slate' | 'rose'
  customHex?: string;
}

export interface FirebaseCustomConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}
