// Calcula quantos dias faltam (ou quantos passaram) até a data de validade
export function calcularDiasRestantes(dataValidade) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let validade;
  if (dataValidade?.toDate) {
    // Timestamp do Firestore
    validade = dataValidade.toDate();
  } else if (dataValidade instanceof Date) {
    validade = dataValidade;
  } else {
    validade = new Date(dataValidade);
  }
  validade.setHours(0, 0, 0, 0);

  const diffMs = validade.getTime() - hoje.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

// Retorna o identificador de status baseado nos dias restantes
export function calcularStatus(diasRestantes) {
  if (diasRestantes < 0) return 'vencido';
  if (diasRestantes <= 30) return 'critico';
  if (diasRestantes <= 60) return 'urgente';
  if (diasRestantes <= 120) return 'atencao';
  return 'ok';
}

// Configuração visual de cada status (cor, texto, fundo)
export const STATUS_CONFIG = {
  vencido: {
    cor: '#6b7280',
    texto: 'Vencido',
    bg: '#f3f4f6',
    label: 'Vencidos',
    emoji: '💀',
  },
  critico: {
    cor: '#ef4444',
    texto: 'CRÍTICO',
    bg: '#fef2f2',
    label: 'Críticos',
    emoji: '🚨',
  },
  urgente: {
    cor: '#f97316',
    texto: 'Urgente',
    bg: '#fff7ed',
    label: 'Urgentes',
    emoji: '⚠️',
  },
  atencao: {
    cor: '#eab308',
    texto: 'Atenção',
    bg: '#fefce8',
    label: 'Atenção',
    emoji: '👀',
  },
  ok: {
    cor: '#22c55e',
    texto: 'Válido',
    bg: '#f0fdf4',
    label: 'OK',
    emoji: '✅',
  },
};

// Marcas disponíveis no sistema
export const MARCAS = [
  'O Boticário',
  'Eudora',
  'Quem Disse, Berenice?',
  'O.U.I',
  'Aumigos',
];

// Cores dos badges por marca
export const MARCA_CORES = {
  'O Boticário':         { bg: '#dbeafe', border: '#2d5da1', texto: '#1e3a8a' },
  'Eudora':              { bg: '#fce7f3', border: '#9d174d', texto: '#831843' },
  'Quem Disse, Berenice?': { bg: '#ede9fe', border: '#6d28d9', texto: '#4c1d95' },
  'O.U.I':               { bg: '#fef3c7', border: '#b45309', texto: '#92400e' },
  'Aumigos':             { bg: '#d1fae5', border: '#065f46', texto: '#064e3b' },
};

// Detecta a marca pelo prefixo/palavra-chave da descrição do produto
// Baseado nos padrões de nomenclatura do Grupo Boticário
export function detectarMarca(descricao) {
  if (!descricao) return 'O Boticário';
  const d = descricao.toUpperCase().trim();

  if (d.startsWith('OUI') || d.startsWith('O.U.I'))          return 'O.U.I';
  if (d.startsWith('QDB') || d.includes('QUEM DISSE') || d.includes('BERENICE')) return 'Quem Disse, Berenice?';
  if (d.startsWith('AU MIGOS') || d.startsWith('AUMIGOS') || d.startsWith('AU MIGO')) return 'Aumigos';
  if (d.startsWith('EUDORA') || d.includes('EUDORA'))        return 'Eudora';

  return 'O Boticário';
}

// Formata a data de validade para exibição
export function formatarData(dataValidade) {
  let data;
  if (dataValidade?.toDate) {
    data = dataValidade.toDate();
  } else if (dataValidade instanceof Date) {
    data = dataValidade;
  } else {
    data = new Date(dataValidade);
  }
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
