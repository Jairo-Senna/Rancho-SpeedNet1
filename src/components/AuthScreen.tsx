import React, { useState } from 'react';
import { Building2, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useBrand } from '../lib/brand';
import { loginUser, registerUser } from '../lib/firebase';

interface AuthScreenProps {
  onLoginSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const { brand } = useBrand();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erroMsg, setErroMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroMsg('');

    if (!email || !password) {
      setErroMsg('Preencha seu e-mail e sua senha.');
      return;
    }

    if (password.length < 6) {
      setErroMsg('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    try {
      setCarregando(true);
      if (isRegister) {
        await registerUser(email, password);
      } else {
        await loginUser(email, password);
      }
      onLoginSuccess();
    } catch (err: any) {
      console.warn('Erro auth:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setErroMsg('Acesso negado. E-mail ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErroMsg('Este e-mail já está cadastrado. Faça login.');
      } else {
        setErroMsg(err.message || 'Falha na autenticação. Verifique os dados.');
      }
    } finally {
      setCarregando(false);
    }
  };

  const handleDemoAccess = async () => {
    try {
      setCarregando(true);
      setErroMsg('');
      await loginUser('admin@empresa.com.br', 'senha123');
      onLoginSuccess();
    } catch {
      // Cria sessão de demonstração local
      localStorage.setItem(
        'gestao_financeira_offline_user',
        JSON.stringify({
          uid: 'demo_user_1',
          email: 'admin@empresa.com.br',
          displayName: 'Administrador Demo',
          isOfflineMode: true,
        })
      );
      onLoginSuccess();
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div
      id="screen-login"
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#24150b] via-[#1a0e06] to-[#100803]"
    >
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-[#ebdcd0] relative overflow-hidden">
        {/* Barra superior de destaque em marrom rancho */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#42220e]" />

        {/* Logo e Cabeçalho */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3">
            <img
              src={brand.logoUrl || './logo.jpg'}
              alt={brand.companyName}
              className="w-28 h-28 rounded-full object-cover border-4 border-[#ede4d8] shadow-xl bg-white"
              onError={(e) => {
                e.currentTarget.src = './logo.jpg';
              }}
            />
          </div>

          <h2 className="text-2xl font-black text-[#2e180a] tracking-tight">
            {isRegister ? 'Criar Nova Conta' : 'Rancho SpeedNet'}
          </h2>
          <p className="text-xs text-[#6e4b33] mt-1 font-semibold">
            {isRegister
              ? 'Cadastre-se para gerenciar as finanças do Rancho'
              : 'Controlador Financeiro • Desde 2017'}
          </p>
        </div>

        {/* Formulário de Autenticação */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#3e2413]">
              E-mail Profissional
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#8c674e]" />
              <input
                id={isRegister ? 'reg-email' : 'login-email'}
                type="email"
                placeholder="seu.email@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#ded3c7] text-xs bg-[#fdfbf9] focus:bg-white focus:outline-none focus:border-[#42220e] font-medium text-slate-800"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#3e2413]">
              {isRegister ? 'Senha (mínimo 6 caracteres)' : 'Sua Senha'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#8c674e]" />
              <input
                id={isRegister ? 'reg-password' : 'login-password'}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#ded3c7] text-xs bg-[#fdfbf9] focus:bg-white focus:outline-none focus:border-[#42220e] text-slate-800"
              />
            </div>
          </div>

          {erroMsg && (
            <p
              id="auth-msg"
              className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-center"
            >
              {erroMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#42220e] hover:bg-[#301809] text-white font-bold text-xs shadow-lg shadow-[#42220e]/25 transition cursor-pointer disabled:opacity-50"
          >
            <span>
              {carregando
                ? 'Conectando...'
                : isRegister
                ? 'Cadastrar Agora'
                : 'Acessar Painel Financeiro'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Alternar entre Login e Cadastro */}
        <div className="mt-6 text-center text-xs text-[#6e4b33] border-t border-[#ede4d8] pt-4">
          {isRegister ? (
            <p>
              Já possui conta?{' '}
              <button
                id="go-to-login"
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setErroMsg('');
                }}
                className="font-bold text-[#42220e] hover:underline cursor-pointer"
              >
                Fazer Login
              </button>
            </p>
          ) : (
            <p>
              Novo por aqui?{' '}
              <button
                id="go-to-register"
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setErroMsg('');
                }}
                className="font-bold text-[#42220e] hover:underline cursor-pointer"
              >
                Crie uma conta
              </button>
            </p>
          )}
        </div>

        {/* Botão de Demonstração / Teste Rápido */}
        <div className="mt-4 pt-3 border-t border-[#ede4d8]">
          <button
            type="button"
            onClick={handleDemoAccess}
            disabled={carregando}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[#ded3c7] text-[#42220e] hover:bg-[#fbf7f4] font-bold text-[11px] transition cursor-pointer bg-white"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Entrar com Acesso Rápido de Teste</span>
          </button>
        </div>
      </div>
    </div>
  );
};
