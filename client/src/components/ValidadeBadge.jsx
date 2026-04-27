import React from 'react';
import { calcularDiasRestantes, calcularStatus, STATUS_CONFIG } from '../lib/validadeUtils';

// Badge colorido que exibe o status e a contagem regressiva em dias
export default function ValidadeBadge({ dataValidade, tamanho = 'normal' }) {
  const dias = calcularDiasRestantes(dataValidade);
  const status = calcularStatus(dias);
  const cfg = STATUS_CONFIG[status];

  const isPequeno = tamanho === 'pequeno';

  const textoContagem =
    dias < 0
      ? `Há ${Math.abs(dias)} dia${Math.abs(dias) !== 1 ? 's' : ''}`
      : dias === 0
      ? 'Vence hoje!'
      : `${dias} dia${dias !== 1 ? 's' : ''}`;

  const estiloBase = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: isPequeno ? '4px' : '6px',
    padding: isPequeno ? '2px 8px' : '4px 12px',
    background: cfg.bg,
    border: `2px solid ${cfg.cor}`,
    borderRadius: '255px 8px 225px 8px / 8px 225px 8px 255px',
    boxShadow: `2px 2px 0px 0px ${cfg.cor}`,
    fontSize: isPequeno ? '11px' : '13px',
    fontFamily: "'Patrick Hand', cursive",
    fontWeight: 700,
    color: cfg.cor,
    whiteSpace: 'nowrap',
    // Texto tachado para produtos vencidos
    textDecoration: status === 'vencido' ? 'line-through' : 'none',
  };

  return (
    <span style={estiloBase}>
      <span>{cfg.emoji || ''}</span>
      <span>{cfg.texto}</span>
      <span style={{ opacity: 0.75, fontWeight: 400, fontSize: isPequeno ? '10px' : '12px' }}>
        — {textoContagem}
      </span>
    </span>
  );
}
