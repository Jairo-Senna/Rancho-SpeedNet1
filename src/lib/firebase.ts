import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';
import { Colaborador, Receita, PagamentoItem, FirebaseCustomConfig } from '../types';

// Credenciais padrão do Rancho SpeedNet
const DEFAULT_FIREBASE_CONFIG: FirebaseCustomConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBdC2F6cWjhxCiUeSmae76pelG6F76KP_E',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'rancho-speednet.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'rancho-speednet',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'rancho-speednet.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '509622442109',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:509622442109:web:3616b6eff46d2e01213914',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-H8K47NS3RB',
};

const STORAGE_KEY_CONFIG = 'gestao_financeira_firebase_config';
const STORAGE_KEY_OFFLINE_USER = 'gestao_financeira_offline_user';
const STORAGE_KEY_OFFLINE_COLABS = 'gestao_financeira_offline_colabs';
const STORAGE_KEY_OFFLINE_RECS = 'gestao_financeira_offline_recs';

export function getStoredFirebaseConfig(): FirebaseCustomConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Se for o projeto legado 'controle-paloma', migra para o oficial 'rancho-speednet'
      if (parsed.projectId === 'controle-paloma') {
        localStorage.removeItem(STORAGE_KEY_CONFIG);
        return DEFAULT_FIREBASE_CONFIG;
      }
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Erro ao ler configuração personalizada do Firebase:', e);
  }
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveStoredFirebaseConfig(config: FirebaseCustomConfig) {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let isFirebaseOperational = false;

function initFirebase() {
  try {
    const config = getStoredFirebaseConfig();
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseOperational = true;
  } catch (err) {
    console.error('Falha ao inicializar Firebase (modo local/offline ativado):', err);
    isFirebaseOperational = false;
  }
}

initFirebase();

export { auth, db };

export interface AuthUserState {
  uid: string;
  email: string | null;
  displayName: string | null;
  isOfflineMode?: boolean;
}

export function subscribeAuth(callback: (user: AuthUserState | null) => void): () => void {
  if (auth && isFirebaseOperational) {
    return onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        callback({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          isOfflineMode: false,
        });
      } else {
        // Verifica se há sessão local
        const offlineSaved = localStorage.getItem(STORAGE_KEY_OFFLINE_USER);
        if (offlineSaved) {
          try {
            callback(JSON.parse(offlineSaved));
            return;
          } catch {
            // ignore
          }
        }
        callback(null);
      }
    });
  } else {
    // Modo offline/local
    const offlineSaved = localStorage.getItem(STORAGE_KEY_OFFLINE_USER);
    if (offlineSaved) {
      try {
        callback(JSON.parse(offlineSaved));
      } catch {
        callback(null);
      }
    } else {
      callback(null);
    }
    return () => {};
  }
}

export async function loginUser(email: string, pass: string): Promise<AuthUserState> {
  if (auth && isFirebaseOperational) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      localStorage.removeItem(STORAGE_KEY_OFFLINE_USER);
      return {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName,
        isOfflineMode: false,
      };
    } catch (firebaseErr: any) {
      console.warn('Login no Firebase falhou, verificando se é credencial offline ou erro:', firebaseErr);
      // Se a conta não existe no Firebase mas o usuário quer testar localmente
      if (email && pass.length >= 6) {
        // permitimos login local se solicitado
        throw firebaseErr;
      }
      throw firebaseErr;
    }
  } else {
    // Local session
    const localUser: AuthUserState = {
      uid: 'offline_' + btoa(email).substring(0, 12),
      email,
      displayName: email.split('@')[0],
      isOfflineMode: true,
    };
    localStorage.setItem(STORAGE_KEY_OFFLINE_USER, JSON.stringify(localUser));
    return localUser;
  }
}

export async function registerUser(email: string, pass: string): Promise<AuthUserState> {
  if (auth && isFirebaseOperational) {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    localStorage.removeItem(STORAGE_KEY_OFFLINE_USER);
    return {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: cred.user.displayName,
      isOfflineMode: false,
    };
  } else {
    const localUser: AuthUserState = {
      uid: 'offline_' + btoa(email).substring(0, 12),
      email,
      displayName: email.split('@')[0],
      isOfflineMode: true,
    };
    localStorage.setItem(STORAGE_KEY_OFFLINE_USER, JSON.stringify(localUser));
    return localUser;
  }
}

export async function logoutUser(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY_OFFLINE_USER);
  if (auth && isFirebaseOperational) {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Erro ao sair:', e);
    }
  }
}

// Fallback de armazenamento local para desenvolvimento/offline
function getLocalColabs(userId: string): Colaborador[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_OFFLINE_COLABS}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalColabs(userId: string, data: Colaborador[]) {
  localStorage.setItem(`${STORAGE_KEY_OFFLINE_COLABS}_${userId}`, JSON.stringify(data));
}

function getLocalRecs(userId: string): Receita[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_OFFLINE_RECS}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalRecs(userId: string, data: Receita[]) {
  localStorage.setItem(`${STORAGE_KEY_OFFLINE_RECS}_${userId}`, JSON.stringify(data));
}

// --- FIRESTORE LISTENERS E OPERAÇÕES RESILIENTES ---

function notifyPermissionWarning(err: any) {
  const msg = err?.message || String(err);
  console.warn('⚠️ Alerta do Firebase Firestore:', msg);
  window.dispatchEvent(
    new CustomEvent('firebase_permission_warning', {
      detail: {
        code: err?.code || 'unknown',
        message: msg,
      },
    })
  );
}

export function subscribeColaboradores(
  userId: string,
  onData: (data: Colaborador[]) => void
): Unsubscribe {
  // 1. Sempre entrega os dados locais de imediato (sem delay na UI)
  onData(getLocalColabs(userId));

  // 2. Sempre ouve alterações locais
  const localHandler = () => {
    onData(getLocalColabs(userId));
  };
  window.addEventListener('local_colabs_changed', localHandler);

  // 3. Se conectado ao Firebase, sincroniza com Firestore em segundo plano
  let firestoreUnsub: Unsubscribe = () => {};
  if (db && isFirebaseOperational && !userId.startsWith('offline_')) {
    try {
      const colRef = collection(db, 'gestao-financeira', userId, 'colaboradores');
      firestoreUnsub = onSnapshot(
        colRef,
        (snap) => {
          const items: Colaborador[] = snap.docs.map((d) => ({
            id: d.id,
            nome: d.data().nome || '',
            setor: d.data().setor || '',
            criadoEm: d.data().criadoEm || new Date().toISOString(),
          }));
          
          // O Firestore é a fonte de verdade quando a escuta está ativa
          saveLocalColabs(userId, items);
          onData(items);
        },
        (error) => {
          console.warn('Firestore colaboradores snapshot error:', error);
          notifyPermissionWarning(error);
          onData(getLocalColabs(userId));
        }
      );
    } catch (e) {
      console.warn('Erro ao configurar listener do Firestore:', e);
    }
  }

  return () => {
    window.removeEventListener('local_colabs_changed', localHandler);
    firestoreUnsub();
  };
}

export async function addColaborador(
  userId: string,
  data: { nome: string; setor?: string }
): Promise<string> {
  const id = 'colab_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const novo: Colaborador = {
    id,
    nome: data.nome.trim(),
    setor: (data.setor || '').trim(),
    criadoEm: new Date().toISOString(),
  };

  // Salva imediatamente no armazenamento local para exibição instantânea garantida
  const current = getLocalColabs(userId);
  saveLocalColabs(userId, [...current, novo]);
  window.dispatchEvent(new Event('local_colabs_changed'));

  // Grava no Firestore se disponível
  if (db && isFirebaseOperational && !userId.startsWith('offline_')) {
    try {
      const docRef = doc(db, 'gestao-financeira', userId, 'colaboradores', id);
      await setDoc(docRef, {
        nome: novo.nome,
        setor: novo.setor,
        criadoEm: novo.criadoEm,
      });
    } catch (err: any) {
      console.error('Erro ao salvar colaborador no Firestore (mantido localmente):', err);
      notifyPermissionWarning(err);
    }
  }

  return id;
}

export async function deleteColaborador(userId: string, colabId: string): Promise<void> {
  // Remove do local imediatamente
  const filtered = getLocalColabs(userId).filter((c) => c.id !== colabId);
  saveLocalColabs(userId, filtered);
  window.dispatchEvent(new Event('local_colabs_changed'));

  // Remove do Firestore se disponível
  if (db && isFirebaseOperational && !userId.startsWith('offline_')) {
    try {
      const docRef = doc(db, 'gestao-financeira', userId, 'colaboradores', colabId);
      await deleteDoc(docRef);
    } catch (err: any) {
      console.error('Erro ao excluir colaborador no Firestore:', err);
      notifyPermissionWarning(err);
    }
  }
}

export function subscribeReceitas(
  userId: string,
  onData: (data: Receita[]) => void
): Unsubscribe {
  // 1. Entrega local imediata
  onData(getLocalRecs(userId));

  // 2. Listener local
  const localHandler = () => {
    onData(getLocalRecs(userId));
  };
  window.addEventListener('local_recs_changed', localHandler);

  // 3. Listener Firestore
  let firestoreUnsub: Unsubscribe = () => {};
  if (db && isFirebaseOperational && !userId.startsWith('offline_')) {
    try {
      const colRef = collection(db, 'gestao-financeira', userId, 'receitas');
      firestoreUnsub = onSnapshot(
        colRef,
        (snap) => {
          const items: Receita[] = snap.docs.map((d) => {
            const item = d.data();
            return {
              id: d.id,
              colabId: item.colabId || item.utilizadorId || '',
              utilizadorId: item.utilizadorId,
              titulo: item.titulo || '',
              categoria: item.categoria || 'Salário',
              valorTotal: Number(item.valorTotal) || 0,
              observacoes: item.observacoes || '',
              dataRef: item.dataRef || item.dataCriacao || new Date().toISOString(),
              dataCriacao: item.dataCriacao,
              pagamentos: item.pagamentos || item.historicoPagamentos || [],
              historicoPagamentos: item.historicoPagamentos || item.pagamentos || [],
            };
          });

          // O Firestore é a fonte de verdade quando a sincronização está ativa
          saveLocalRecs(userId, items);
          onData(items);
        },
        (error) => {
          console.warn('Firestore receitas snapshot error:', error);
          notifyPermissionWarning(error);
          onData(getLocalRecs(userId));
        }
      );
    } catch (e) {
      console.warn('Erro ao assinar receitas no Firestore:', e);
    }
  }

  return () => {
    window.removeEventListener('local_recs_changed', localHandler);
    firestoreUnsub();
  };
}

export async function addReceita(
  userId: string,
  receita: {
    colabId: string;
    titulo: string;
    categoria: string;
    valorTotal: number;
    observacoes: string;
    dataRef: string;
  }
): Promise<string> {
  const id = 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const nova: Receita = {
    id,
    colabId: receita.colabId,
    titulo: receita.titulo.trim(),
    categoria: receita.categoria,
    valorTotal: Number(receita.valorTotal) || 0,
    observacoes: (receita.observacoes || '').trim(),
    dataRef: receita.dataRef,
    pagamentos: [],
    historicoPagamentos: [],
    dataCriacao: new Date().toISOString(),
  };

  // Salva localmente com disparo instantâneo
  const current = getLocalRecs(userId);
  saveLocalRecs(userId, [...current, nova]);
  window.dispatchEvent(new Event('local_recs_changed'));

  // Grava no Firestore
  if (db && isFirebaseOperational && !userId.startsWith('offline_')) {
    try {
      const docRef = doc(db, 'gestao-financeira', userId, 'receitas', id);
      await setDoc(docRef, {
        colabId: nova.colabId,
        titulo: nova.titulo,
        categoria: nova.categoria,
        valorTotal: nova.valorTotal,
        observacoes: nova.observacoes,
        dataRef: nova.dataRef,
        pagamentos: [],
        historicoPagamentos: [],
        dataCriacao: nova.dataCriacao,
      });
    } catch (err: any) {
      console.error('Erro ao salvar receita no Firestore (mantido localmente):', err);
      notifyPermissionWarning(err);
    }
  }

  return id;
}

export async function deleteReceita(userId: string, receitaId: string): Promise<void> {
  const filtered = getLocalRecs(userId).filter((r) => r.id !== receitaId);
  saveLocalRecs(userId, filtered);
  window.dispatchEvent(new Event('local_recs_changed'));

  if (db && isFirebaseOperational && !userId.startsWith('offline_')) {
    try {
      const docRef = doc(db, 'gestao-financeira', userId, 'receitas', receitaId);
      await deleteDoc(docRef);
    } catch (err: any) {
      console.error('Erro ao excluir receita no Firestore:', err);
      notifyPermissionWarning(err);
    }
  }
}

export async function deleteMultipleReceitas(userId: string, receitaIds: string[]): Promise<void> {
  if (!receitaIds || receitaIds.length === 0) return;
  const setIds = new Set(receitaIds);
  const filtered = getLocalRecs(userId).filter((r) => !setIds.has(r.id));
  saveLocalRecs(userId, filtered);
  window.dispatchEvent(new Event('local_recs_changed'));

  if (db && isFirebaseOperational && !userId.startsWith('offline_')) {
    try {
      const promises = receitaIds.map((id) =>
        deleteDoc(doc(db!, 'gestao-financeira', userId, 'receitas', id))
      );
      await Promise.all(promises);
    } catch (err: any) {
      console.error('Erro ao excluir lote de receitas no Firestore:', err);
      notifyPermissionWarning(err);
    }
  }
}

export async function updateReceitaPagamentos(
  userId: string,
  receitaId: string,
  pagamentos: PagamentoItem[]
): Promise<void> {
  const current = getLocalRecs(userId).map((r) => {
    if (r.id === receitaId) {
      return {
        ...r,
        pagamentos: pagamentos,
        historicoPagamentos: pagamentos,
      };
    }
    return r;
  });
  saveLocalRecs(userId, current);
  window.dispatchEvent(new Event('local_recs_changed'));

  if (db && isFirebaseOperational && !userId.startsWith('offline_')) {
    try {
      const docRef = doc(db, 'gestao-financeira', userId, 'receitas', receitaId);
      await updateDoc(docRef, {
        pagamentos: pagamentos,
        historicoPagamentos: pagamentos,
      });
    } catch (err: any) {
      console.error('Erro ao atualizar pagamentos no Firestore:', err);
      notifyPermissionWarning(err);
    }
  }
}
