import React, { useMemo } from 'react';
import { calcularDiasRestantes, calcularStatus, STATUS_CONFIG } from '../lib/validadeUtils';

// Cards de resumo no topo da página — clicáveis para filtrar a lista
export default function DashboardCards({ validades, filtroStatus, setFiltroStatus }) {
  const contagens = useMemo(() => {
    const c = { total: 0, ok: 0, atencao: 0, urgente: 0, critico: 0, vencido: 0 };
    validades.forEach(v => {
      c.total++;
      const dias = calcularDiasRestantes(v.dataValidade);
      const s = calcularStatus(dias);
      c[s]++;
    });
    return c;
  }, [validades]);

  const cartoes = [
    {
      key: '',
      rotulo: 'Total',
      valor: contagens.total,
      cor: '#2d2d2d',
      bg: '#fdfbf7',
      emoji: '📋',
      rotate: '-rotate-1',
    },
    {
      key: 'ok',
      rotulo: STATUS_CONFIG.ok.label,
      valor: contagens.ok,
      cor: '#22c55e',
      bg: '#f0fdf4',
      emoji: STATUS_CONFIG.ok.emoji,
      rotate: 'rotate-1',
    },
    {
      key: 'atencao',
      rotulo: STATUS_CONFIG.atencao.label,
      valor: contagens.atencao,
      cor: '#eab308',
      bg: '#fefce8',
      emoji: STATUS_CONFIG.atencao.emoji,
      rotate: '-rotate-1',
    },
    {
      key: 'urgente',
      rotulo: STATUS_CONFIG.urgente.label,
      valor: contagens.urgente,
      cor: '#f97316',
      bg: '#fff7ed',
      emoji: STATUS_CONFIG.urgente.emoji,
      rotate: 'rotate-1',
    },
    {
      key: 'critico',
      rotulo: STATUS_CONFIG.critico.label,
      valor: contagens.critico,
      cor: '#ef4444',
      bg: '#fef2f2',
      emoji: STATUS_CONFIG.critico.emoji,
      rotate: '-rotate-1',
    },
    {
      key: 'vencido',
      rotulo: STATUS_CONFIG.vencido.label,
      valor: contagens.vencido,
      cor: '#6b7280',
      bg: '#f3f4f6',
      emoji: STATUS_CONFIG.vencido.emoji,
      rotate: 'rotate-1',
    },
  ];

  return (
    <div style={{ marginBottom: '32px' }}>
      {/* Título da seção com etiqueta adesiva */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <span
          style={{
            background: '#fff9c4',
            border: '2px solid #2d2d2d',
            borderRadius: '4px 255px 4px 255px / 255px 4px 255px 4px',
            padding: '2px 12px',
            fontFamily: "'Kalam', cursive",
            fontSize: '18px',
            boxShadow: '2px 2px 0px 0px #2d2d2d',
          }}
        >
          📊 Resumo do Estoque
        </span>
      </div>

      {/* Grid de cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
        }}
      >
        {cartoes.map(cartao => {
          const ativo = filtroStatus === cartao.key;
          return (
            <button
              key={cartao.key}
              onClick={() => setFiltroStatus(ativo ? '' : cartao.key)}
              className={`${cartao.rotate}`}
              style={{
                background: ativo ? cartao.cor : cartao.bg,
                border: `3px solid ${cartao.cor}`,
                borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
                boxShadow: ativo
                  ? `1px 1px 0px 0px ${cartao.cor}`
                  : `4px 4px 0px 0px ${cartao.cor}`,
                padding: '16px 12px',
                cursor: 'pointer',
                transform: ativo ? 'translate(3px, 3px)' : undefined,
                transition: 'all 0.15s ease',
                textAlign: 'center',
                color: ativo ? '#fff' : cartao.cor,
              }}
            >
              <div style={{ fontSize: '28px', lineHeight: 1 }}>{cartao.emoji}</div>
              <div
                style={{
                  fontFamily: "'Kalam', cursive",
                  fontSize: '32px',
                  fontWeight: 700,
                  lineHeight: 1.1,
                  marginTop: '4px',
                }}
              >
                {cartao.valor}
              </div>
              <div
                style={{
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '12px',
                  marginTop: '4px',
                  opacity: 0.85,
                }}
              >
                {cartao.rotulo}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
