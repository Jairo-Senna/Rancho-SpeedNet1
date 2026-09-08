# Rancho SpeedNet - Sistema de Gestão Financeira e Folha

Sistema moderno e completo para controle financeiro, salários, comissões, vales, diárias e baixas de pagamentos do **Rancho SpeedNet**.

---

## 🌟 Funcionalidades

- **Autenticação Segura:** Login e cadastro com Firebase Authentication (e modo offline resiliente).
- **Controle de Colaboradores:** Cadastro por nome e cargo/setor, busca dinâmica e seleção individual.
- **Lançamentos Financeiros:**
  - Registro de salários, vales, comissões, diárias e extras.
  - Histórico de pagamentos e baixas parciais ou quitação total.
  - Exclusão unitária e exclusão em lote de todos os lançamentos do mês.
- **Visão Global & Indicadores:** Painel consolidado com total previsto, total pago, pendências e percentuais por colaborador.
- **Relatório Completo:** Resumo mensal consolidado e detalhado pronto para visualização e prestação de contas.
- **Personalização de Marca:** Nome e logotipo do rancho customizáveis.
- **Multi-dispositivo:** Design responsivo adaptado para computadores, tablets e smartphones.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- `npm` ou `bun`

### Passo a passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/SEU-USUARIO/rancho-speednet.git
   cd rancho-speednet
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente (Opcional):**
   Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```
   *As credenciais do Firebase também podem ser preenchidas diretamente na tela de configurações da marca no próprio sistema.*

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   O aplicativo estará disponível em `http://localhost:3000`.

---

## 📦 Build e Produção

Para gerar a versão otimizada para deploy:
```bash
npm run build
```
Os arquivos estáticos serão gerados na pasta `dist/`, prontos para hospedagem no Firebase Hosting, Vercel, Netlify ou Cloud Run.

---

## 🔒 Regras de Segurança do Firebase Firestore

Se for conectar a um novo projeto do Firebase, utilize as regras contidas em `firestore.rules`:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

Desenvolvido para **Rancho SpeedNet**.
