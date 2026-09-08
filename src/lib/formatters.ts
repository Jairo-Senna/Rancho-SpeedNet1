import { Colaborador, Receita } from '../types';

export function formatarMoeda(val: number | undefined | null): string {
  return (val || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function normalizarTexto(texto: string): string {
  if (!texto) return '';
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function getMesRefText(dataVisao: Date): string {
  const dataRef = new Date(dataVisao);
  dataRef.setMonth(dataRef.getMonth() - 1);
  const nomeMes = dataRef.toLocaleDateString('pt-BR', { month: 'long' });
  return `(Referente a ${nomeMes})`;
}

export function getDataFormatadaHoje(): string {
  return new Date().toLocaleDateString('pt-BR');
}

export interface RelatorioDados {
  totalGeral: number;
  recebidoGeral: number;
  pendenteGeral: number;
  categoriasAtivas: string[];
  mesAnoNome: string;
  linhasPorColaborador: {
    colabId: string;
    nome: string;
    pendenteTotal: number;
    detalhesPorCategoria: Record<string, number>;
  }[];
}

export function compilarRelatorioMensal(
  ano: number,
  mes: number,
  categoriasAtivas: string[],
  ordem: 'decrescente' | 'crescente' | 'alfabetica',
  todasReceitas: Receita[],
  todosColaboradores: Colaborador[]
): { textoWhatsapp: string; dados: RelatorioDados } {
  const recsDoMes = todasReceitas.filter((r) => {
    const rawDate = r.dataRef || r.dataCriacao;
    if (!rawDate) return false;
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return false;

    const isMes = d.getMonth() === mes && d.getFullYear() === ano;
    const cat = r.categoria || 'Salário';
    const isInSelectedCategories = categoriasAtivas.includes(cat);

    // Filtro de colaboradores excluídos (fantasmas)
    const idColab = r.colabId || r.utilizadorId;
    const isAtivo = todosColaboradores.some((u) => u.id === idColab);

    return isMes && isInSelectedCategories && isAtivo;
  });

  let totalGeral = 0;
  let recebidoGeral = 0;
  const mapaPorColab: Record<
    string,
    { nome: string; pendenteTotal: number; detalhesPorCategoria: Record<string, number> }
  > = {};

  recsDoMes.forEach((r) => {
    const arrayPgs = r.pagamentos || r.historicoPagamentos || [];
    const somaPg = arrayPgs.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
    const valorTot = Number(r.valorTotal) || 0;

    totalGeral += valorTot;
    recebidoGeral += somaPg;

    const idColab = r.colabId || r.utilizadorId || 'sem-id';
    if (!mapaPorColab[idColab]) {
      const user = todosColaboradores.find((u) => u.id === idColab);
      const nomeDisplay = user ? user.nome.toUpperCase() : `COLABORADOR (${r.titulo || 'Sem título'})`;
      mapaPorColab[idColab] = {
        nome: nomeDisplay,
        pendenteTotal: 0,
        detalhesPorCategoria: {},
      };
    }

    const pendenteDaReceita = valorTot - somaPg;
    mapaPorColab[idColab].pendenteTotal += pendenteDaReceita;

    const cat = r.categoria || 'Salário';
    if (!mapaPorColab[idColab].detalhesPorCategoria[cat]) {
      mapaPorColab[idColab].detalhesPorCategoria[cat] = 0;
    }
    mapaPorColab[idColab].detalhesPorCategoria[cat] += pendenteDaReceita;
  });

  const linhasPorColaborador = Object.entries(mapaPorColab).map(([colabId, val]) => ({
    colabId,
    nome: val.nome,
    pendenteTotal: val.pendenteTotal,
    detalhesPorCategoria: val.detalhesPorCategoria,
  }));

  if (ordem === 'crescente') {
    linhasPorColaborador.sort((a, b) => a.pendenteTotal - b.pendenteTotal);
  } else if (ordem === 'decrescente') {
    linhasPorColaborador.sort((a, b) => b.pendenteTotal - a.pendenteTotal);
  } else {
    linhasPorColaborador.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
  }

  const dtRef = new Date(ano, mes, 10);
  const mesAnoNome = dtRef.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
  const pendenteGeral = totalGeral - recebidoGeral;

  // Montagem do texto pronto para WhatsApp
  let texto = `*FECHAMENTO DO MÊS - ${mesAnoNome}*\n`;
  texto += `_Categorias: ${categoriasAtivas.join(', ')}_\n\n`;
  texto += `📊 *Resumo Consolidado*\n`;
  texto += `• Total Previsto: ${formatarMoeda(totalGeral)}\n`;
  texto += `• Total Recebido: ${formatarMoeda(recebidoGeral)}\n`;
  texto += `• Total Pendente: ${formatarMoeda(pendenteGeral)}\n\n`;
  texto += `👥 *Detalhes por Colaborador:*\n`;

  if (linhasPorColaborador.length === 0) {
    texto += `Nenhum registro financeiro pendente encontrado.\n`;
  } else {
    linhasPorColaborador.forEach((d) => {
      if (d.pendenteTotal <= 0.01) {
        texto += `- *${d.nome}*: Pagamento finalizado ✅\n`;
      } else {
        texto += `- *${d.nome}*: Pendente ${formatarMoeda(d.pendenteTotal)} ⏳\n`;

        const subLinhas: string[] = [];
        for (const [cat, val] of Object.entries(d.detalhesPorCategoria)) {
          if (val > 0.01) {
            subLinhas.push(`${cat}: ${formatarMoeda(val)}`);
          }
        }
        if (subLinhas.length > 0) {
          texto += `  ↳ _${subLinhas.join(' | ')}_\n`;
        }
      }
    });
  }

  return {
    textoWhatsapp: texto,
    dados: {
      totalGeral,
      recebidoGeral,
      pendenteGeral,
      categoriasAtivas,
      mesAnoNome,
      linhasPorColaborador,
    },
  };
}
