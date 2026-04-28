import React, { useMemo } from 'react';
import {
  calcularDiasRestantes,
  calcularStatus,
  STATUS_CONFIG,
  MARCAS,
  MARCA_CORES,
  UNIDADE_CORES,
  formatarData,
} from '../lib/validadeUtils';

// ── Barra horizontal (usada em algumas seções) ──────────────────────────
function BarraProgresso({ valor, total, cor, altura = 28 }) {
  const pct = total > 0 ? Math.round((valor / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        flex: 1, height: altura, background: '#f3f4f6',
        border: '2px solid #2d2d2d',
        borderRadius: '255px 8px 225px 8px / 8px 225px 8px 255px',
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: cor,
          borderRadius: '255px 8px 225px 8px / 8px 225px 8px 255px',
          transition: 'width 0.6s ease', minWidth: pct > 0 ? '8px' : 0,
        }} />
      </div>
      <span style={{ fontFamily: "'Kalam', cursive", fontSize: '14px', minWidth: '40px', textAlign: 'right' }}>
        {pct}%
      </span>
    </div>
  );
}

// ── Card de métrica ────────────────────────────────────────────────────
function MetricaCard({ emoji, valor, label, cor, rotate = '0deg' }) {
  return (
    <div style={{
      background: '#fff', border: `3px solid ${cor}`,
      borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
      boxShadow: `4px 4px 0px 0px ${cor}`,
      padding: '16px 12px', textAlign: 'center',
      transform: `rotate(${rotate})`, flex: 1, minWidth: '110px',
    }}>
      <div style={{ fontSize: '26px' }}>{emoji}</div>
      <div style={{ fontFamily: "'Kalam', cursive", fontSize: '34px', fontWeight: 700, color: cor, lineHeight: 1.1 }}>
        {typeof valor === 'number' ? valor.toLocaleString('pt-BR') : valor}
      </div>
      <div style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
        {label}
      </div>
    </div>
  );
}

// ── Gráfico de rosca SVG ───────────────────────────────────────────────
function DonutChart({ porStatus, total }) {
  const raio = 68;
  const cx = 110, cy = 110;
  const circ = 2 * Math.PI * raio;

  let offset = 0;
  const arcos = Object.entries(STATUS_CONFIG)
    .map(([key, cfg]) => {
      const val = porStatus[key] || 0;
      const len = total > 0 ? (val / total) * circ : 0;
      const a = { key, cfg, val, len, offset };
      offset += len;
      return a;
    })
    .filter(a => a.val > 0);

  return (
    <svg viewBox="0 0 220 220" style={{ width: '100%', maxWidth: '200px', display: 'block' }}>
      <circle cx={cx} cy={cy} r={raio} fill="none" stroke="#f3f4f6" strokeWidth="32" />
      {arcos.map(a => (
        <circle
          key={a.key}
          cx={cx} cy={cy} r={raio}
          fill="none"
          stroke={a.cfg.cor}
          strokeWidth="32"
          strokeDasharray={`${a.len} ${circ}`}
          strokeDashoffset={circ / 4 - a.offset}
          style={{ transition: 'all 0.9s ease' }}
        />
      ))}
      {/* anel branco interno */}
      <circle cx={cx} cy={cy} r={raio - 17} fill="#fff" />
      {/* borda pontilhada estilo hand-drawn */}
      <circle cx={cx} cy={cy} r={raio + 17} fill="none"
        stroke="#2d2d2d" strokeWidth="2" strokeDasharray="5 4" />
      {/* texto central */}
      <text x={cx} y={cy - 10} textAnchor="middle"
        style={{ fontFamily: 'Kalam, cursive', fontSize: '30px', fontWeight: 700, fill: '#2d2d2d' }}>
        {total}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle"
        style={{ fontFamily: 'Patrick Hand, cursive', fontSize: '13px', fill: '#9ca3af' }}>
        itens
      </text>
    </svg>
  );
}

// ── Gráfico de colunas — vencimentos por mês ───────────────────────────
function VencimentosChart({ dados }) {
  const maxCount = Math.max(...dados.map(d => d.count), 1);
  const barW = 30;
  const gap = 10;
  const chartH = 120;
  const padL = 32;
  const padB = 44;
  const svgW = padL + dados.length * (barW + gap) + 8;
  const svgH = chartH + padB + 10;

  const cor = (i) => {
    if (i === 0) return '#ef4444';
    if (i === 1) return '#f97316';
    if (i <= 3) return '#eab308';
    if (i <= 6) return '#22c55e';
    return '#93c5fd';
  };

  const grades = [0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', overflow: 'visible' }}>
      {/* Linhas de grade */}
      {grades.map(f => {
        const gy = 8 + chartH - f * chartH;
        return (
          <g key={f}>
            <line x1={padL - 6} y1={gy} x2={svgW - 6} y2={gy}
              stroke="#f3f4f6" strokeWidth="1.5" strokeDasharray="4 3" />
            <text x={padL - 10} y={gy + 4} textAnchor="end"
              style={{ fontFamily: 'Patrick Hand, cursive', fontSize: '10px', fill: '#9ca3af' }}>
              {Math.round(f * maxCount)}
            </text>
          </g>
        );
      })}

      {dados.map((mes, i) => {
        const altBar = mes.count > 0 ? Math.max((mes.count / maxCount) * chartH, 4) : 3;
        const x = padL + i * (barW + gap);
        const y = 8 + chartH - altBar;
        const c = cor(i);
        return (
          <g key={mes.chave}>
            {/* sombra */}
            {mes.count > 0 && (
              <rect x={x + 3} y={y + 4} width={barW} height={altBar}
                rx="5" fill={c} opacity="0.18" />
            )}
            {/* barra */}
            <rect x={x} y={mes.count > 0 ? y : chartH + 5} width={barW}
              height={mes.count > 0 ? altBar : 3}
              rx="5"
              fill={mes.count > 0 ? c : '#f3f4f6'}
              stroke={mes.count > 0 ? c : '#e5e0d8'}
              strokeWidth="1.5" />
            {/* valor */}
            {mes.count > 0 && (
              <text x={x + barW / 2} y={y - 5} textAnchor="middle"
                style={{ fontFamily: 'Kalam, cursive', fontSize: '11px', fill: c, fontWeight: 700 }}>
                {mes.count}
              </text>
            )}
            {/* label mês */}
            <text x={x + barW / 2} y={chartH + 24} textAnchor="middle"
              style={{ fontFamily: 'Patrick Hand, cursive', fontSize: '10px', fill: '#6b7280' }}>
              {mes.labelCurto}
            </text>
            {/* ano (só quando muda) */}
            {(i === 0 || mes.ano !== dados[i - 1]?.ano) && (
              <text x={x + barW / 2} y={chartH + 37} textAnchor="middle"
                style={{ fontFamily: 'Patrick Hand, cursive', fontSize: '9px', fill: '#9ca3af' }}>
                {mes.ano}
              </text>
            )}
          </g>
        );
      })}

      {/* linha base */}
      <line x1={padL - 6} y1={chartH + 8} x2={svgW - 6} y2={chartH + 8}
        stroke="#2d2d2d" strokeWidth="2.5"
        strokeLinecap="round" />
    </svg>
  );
}

// ── Gráfico de bolhas — por marca ──────────────────────────────────────
function BubbleChart({ porMarca, totalItens }) {
  const marcasComDados = MARCAS
    .filter(m => porMarca[m]?.count > 0)
    .sort((a, b) => porMarca[b].count - porMarca[a].count);

  if (marcasComDados.length === 0) return null;

  const maxCount = porMarca[marcasComDados[0]].count;
  const maxR = 62, minR = 22;

  const bolhas = marcasComDados.map(marca => ({
    marca,
    count: porMarca[marca].count,
    qtd: porMarca[marca].qtd,
    pct: Math.round((porMarca[marca].count / totalItens) * 100),
    r: minR + ((porMarca[marca].count / maxCount) * (maxR - minR)),
    cor: MARCA_CORES[marca],
  }));

  // posiciona as bolhas lado a lado com folga
  let cx = 0;
  const posicionadas = bolhas.map(b => {
    cx += b.r + 12;
    const pos = { ...b, cx };
    cx += b.r + 12;
    return pos;
  });

  const svgW = cx + 4;
  const maxRaio = bolhas[0]?.r || maxR;
  const svgH = maxRaio * 2 + 48;
  const midY = maxRaio + 4;

  // abreviação para caber na bolha
  const abrev = (nome) => {
    if (nome === 'O Boticário') return 'Botic.';
    if (nome === 'Quem Disse, Berenice?') return 'QDB';
    if (nome === 'O.U.I') return 'O.U.I';
    return nome.split(' ')[0];
  };

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', overflow: 'visible' }}>
      {posicionadas.map(b => {
        const fs = Math.min(b.r * 0.32, 13);
        const fsCount = Math.min(b.r * 0.38, 15);
        return (
          <g key={b.marca}>
            {/* sombra */}
            <circle cx={b.cx + 5} cy={midY + 5} r={b.r}
              fill={b.cor?.border} opacity="0.15" />
            {/* bolha */}
            <circle cx={b.cx} cy={midY} r={b.r}
              fill={b.cor?.bg}
              stroke={b.cor?.border} strokeWidth="2.5" />
            {/* marca (abreviado) */}
            <text x={b.cx} y={midY - fsCount * 0.6} textAnchor="middle"
              style={{ fontFamily: 'Patrick Hand, cursive', fontSize: `${fs}px`, fill: b.cor?.texto, fontWeight: 600 }}>
              {abrev(b.marca)}
            </text>
            {/* contagem */}
            <text x={b.cx} y={midY + fsCount * 0.7} textAnchor="middle"
              style={{ fontFamily: 'Kalam, cursive', fontSize: `${fsCount}px`, fill: b.cor?.border, fontWeight: 700 }}>
              {b.count}
            </text>
            {/* % abaixo da bolha */}
            <text x={b.cx} y={midY + b.r + 16} textAnchor="middle"
              style={{ fontFamily: 'Patrick Hand, cursive', fontSize: '11px', fill: '#6b7280' }}>
              {b.pct}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Label de seção ─────────────────────────────────────────────────────
function Etiqueta({ texto, cor = '#2d2d2d', bg = '#fff9c4' }) {
  return (
    <span style={{
      background: bg, border: `2px solid ${cor}`,
      borderRadius: '4px 255px 4px 255px / 255px 4px 255px 4px',
      padding: '2px 12px',
      fontFamily: "'Kalam', cursive", fontSize: '18px',
      boxShadow: `2px 2px 0px 0px ${cor}`,
      color: cor, display: 'inline-block', marginBottom: '16px',
    }}>
      {texto}
    </span>
  );
}

// ── Componente principal ───────────────────────────────────────────────
export default function Analytics({ validades, unidade }) {
  const dadosFiltrados = useMemo(() =>
    validades.filter(v => unidade === 'Ambas' || !v.unidade || v.unidade === unidade),
    [validades, unidade]
  );

  const stats = useMemo(() => {
    const emptyStatus = () => ({ ok: 0, bom: 0, atencao: 0, critico: 0, vencido: 0 });
    const porStatus = emptyStatus();
    const qtdPorStatus = emptyStatus();
    const porMarca = {};
    const porUnidade = {};
    let totalQtd = 0;
    const criticos = [], vencidos = [];

    dadosFiltrados.forEach(v => {
      const dias = calcularDiasRestantes(v.dataValidade);
      const status = calcularStatus(dias);
      const qtd = Number(v.quantidade) || 1;

      porStatus[status]++;
      qtdPorStatus[status] += qtd;
      totalQtd += qtd;

      if (!porMarca[v.marca]) porMarca[v.marca] = { count: 0, qtd: 0 };
      porMarca[v.marca].count++;
      porMarca[v.marca].qtd += qtd;

      if (unidade === 'Ambas' && v.unidade) {
        if (!porUnidade[v.unidade]) porUnidade[v.unidade] = { ...emptyStatus(), total: 0 };
        porUnidade[v.unidade][status]++;
        porUnidade[v.unidade].total++;
      }

      if (status === 'critico') criticos.push({ ...v, dias });
      if (status === 'vencido') vencidos.push({ ...v, dias });
    });

    criticos.sort((a, b) => a.dias - b.dias);

    return { total: dadosFiltrados.length, totalQtd, porStatus, qtdPorStatus, porMarca, porUnidade, criticos, vencidos };
  }, [dadosFiltrados, unidade]);

  // Calendário de vencimentos: próximos 12 meses
  const vencimentosPorMes = useMemo(() => {
    const hoje = new Date();
    const meses = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
      return {
        chave: `${d.getFullYear()}-${d.getMonth()}`,
        ano: d.getFullYear(),
        mes: d.getMonth(),
        labelCurto: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        count: 0,
        qtd: 0,
      };
    });

    dadosFiltrados.forEach(v => {
      let data;
      if (v.dataValidade?.toDate) data = v.dataValidade.toDate();
      else data = new Date(v.dataValidade);
      const idx = meses.findIndex(m => m.ano === data.getFullYear() && m.mes === data.getMonth());
      if (idx >= 0) {
        meses[idx].count++;
        meses[idx].qtd += Number(v.quantidade) || 1;
      }
    });

    return meses;
  }, [dadosFiltrados]);


  if (dadosFiltrados.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: "'Kalam', cursive", color: '#9ca3af' }}>
        <div style={{ fontSize: '56px' }}>📊</div>
        <p style={{ fontSize: '20px', marginTop: '16px' }}>Nenhum dado para analisar ainda.</p>
        <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '14px' }}>Cadastre produtos para ver os analytics.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* ── MÉTRICAS + ROSCA ─────────────────────────────────────── */}
      <section>
        <Etiqueta texto="📊 Visão Geral" />
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

          {/* Rosca de status */}
          <div style={{
            background: '#fff', border: '2px solid #2d2d2d',
            borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
            boxShadow: '4px 4px 0px 0px rgba(45,45,45,0.12)',
            padding: '20px 16px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
            minWidth: '200px', flex: '0 0 auto',
          }}>
            <DonutChart porStatus={stats.porStatus} total={stats.total} />
            {/* Legenda */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: cfg.cor, flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '12px', color: '#6b7280', flex: 1 }}>
                    {cfg.emoji} {cfg.label}
                  </span>
                  <span style={{ fontFamily: "'Kalam', cursive", fontSize: '13px', color: cfg.cor, fontWeight: 700 }}>
                    {stats.porStatus[key]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cards de métricas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <MetricaCard emoji="📋" valor={stats.total}    label="registros"      cor="#2d2d2d" rotate="-1deg" />
              <MetricaCard emoji="📦" valor={stats.totalQtd} label="unidades totais" cor="#2d5da1" rotate="1deg"  />
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <MetricaCard emoji="🚨" valor={stats.porStatus.critico} label="críticos ≤30d" cor="#ef4444" rotate="-1deg" />
              <MetricaCard emoji="💀" valor={stats.porStatus.vencido} label="vencidos"       cor="#6b7280" rotate="1deg"  />
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <MetricaCard emoji="⚠️" valor={stats.porStatus.urgente} label="urgentes ≤60d" cor="#f97316" rotate="1deg"  />
              <MetricaCard emoji="👀" valor={stats.porStatus.atencao} label="atenção ≤120d"  cor="#eab308" rotate="-1deg" />
            </div>
          </div>
        </div>
      </section>

      {/* ── CALENDÁRIO DE VENCIMENTOS ─────────────────────────────── */}
      <section>
        <Etiqueta texto="📅 Calendário de Vencimentos" />
        <div style={{
          background: '#fff', border: '2px solid #2d2d2d',
          borderRadius: '15px 225px 15px 255px / 225px 15px 255px 15px',
          boxShadow: '4px 4px 0px 0px rgba(45,45,45,0.12)',
          padding: '20px 24px',
        }}>
          <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '13px', color: '#9ca3af', margin: '0 0 16px' }}>
            Quantidade de itens por mês de vencimento nos próximos 12 meses
          </p>
          <VencimentosChart dados={vencimentosPorMes} />

          {/* Legenda de cores do calendário */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px', justifyContent: 'center' }}>
            {[
              { cor: '#ef4444', label: 'Este mês' },
              { cor: '#f97316', label: 'Próximo mês' },
              { cor: '#eab308', label: '2–3 meses' },
              { cor: '#22c55e', label: '4–6 meses' },
              { cor: '#93c5fd', label: '7+ meses' },
            ].map(l => (
              <div key={l.cor} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: l.cor }} />
                <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '11px', color: '#9ca3af' }}>
                  {l.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POR MARCA (BOLHAS) ────────────────────────────────────── */}
      <section>
        <Etiqueta texto="🏷️ Por Marca" />
        <div style={{
          background: '#fff', border: '2px solid #2d2d2d',
          borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
          boxShadow: '4px 4px 0px 0px rgba(45,45,45,0.12)',
          padding: '20px 24px',
        }}>
          <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '13px', color: '#9ca3af', margin: '0 0 16px' }}>
            Tamanho proporcional ao número de registros
          </p>
          <BubbleChart porMarca={stats.porMarca} totalItens={stats.total} />

          {/* Detalhe em texto abaixo */}
          <div style={{ borderTop: '2px dashed #e5e0d8', marginTop: '20px', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {MARCAS.filter(m => stats.porMarca[m]).sort((a, b) => stats.porMarca[b].count - stats.porMarca[a].count).map(marca => {
              const cor = MARCA_CORES[marca];
              const d = stats.porMarca[marca];
              return (
                <div key={marca} style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{
                    background: cor?.bg, border: `2px solid ${cor?.border}`,
                    borderRadius: '4px 255px 4px 255px / 255px 4px 255px 4px',
                    padding: '1px 10px', fontFamily: "'Patrick Hand', cursive",
                    fontSize: '13px', color: cor?.texto, fontWeight: 600, minWidth: '140px',
                  }}>
                    {marca}
                  </span>
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <BarraProgresso valor={d.count} total={stats.total} cor={cor?.border || '#2d2d2d'} altura={18} />
                  </div>
                  <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '12px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                    {d.count} reg. · {d.qtd} un.
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── COMPARATIVO POR UNIDADE ──────────────────────────────── */}
      {unidade === 'Ambas' && Object.keys(stats.porUnidade).length > 0 && (
        <section>
          <Etiqueta texto="🏪 Por Unidade" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {Object.entries(stats.porUnidade).map(([nomeUnidade, dados]) => {
              const uc = UNIDADE_CORES[nomeUnidade] || { bg: '#f3f4f6', border: '#6b7280', texto: '#6b7280', emoji: '🏪', label: nomeUnidade };
              return (
                <div key={nomeUnidade} style={{
                  background: '#fff', border: `2px solid ${uc.border}`,
                  borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
                  boxShadow: `4px 4px 0px 0px ${uc.border}`, padding: '18px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '22px' }}>{uc.emoji}</span>
                    <span style={{ fontFamily: "'Kalam', cursive", fontSize: '17px', color: uc.border, flex: 1 }}>{uc.label}</span>
                    <span style={{
                      background: uc.bg, border: `2px solid ${uc.border}`,
                      borderRadius: '255px', padding: '1px 10px',
                      fontFamily: "'Kalam', cursive", fontSize: '15px', color: uc.border,
                    }}>
                      {dados.total} itens
                    </span>
                  </div>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <div key={key} style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '12px', color: cfg.cor }}>
                          {cfg.emoji} {cfg.label}
                        </span>
                        <span style={{ fontFamily: "'Kalam', cursive", fontSize: '13px', color: cfg.cor }}>
                          {dados[key] || 0}
                        </span>
                      </div>
                      <BarraProgresso valor={dados[key] || 0} total={dados.total} cor={cfg.cor} altura={18} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── ALERTAS CRÍTICOS ──────────────────────────────────────── */}
      {(stats.criticos.length > 0 || stats.vencidos.length > 0) && (
        <section>
          <Etiqueta texto="🚨 Alertas" cor="#ef4444" bg="#fef2f2" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[...stats.vencidos, ...stats.criticos].slice(0, 10).map((item, idx) => {
              const status = calcularStatus(item.dias);
              const cfg = STATUS_CONFIG[status];
              return (
                <div key={item.id} style={{
                  background: cfg.bg, border: `2px solid ${cfg.cor}`,
                  borderRadius: idx % 2 === 0
                    ? '255px 8px 225px 8px / 8px 225px 8px 255px'
                    : '8px 255px 8px 225px / 255px 8px 225px 8px',
                  boxShadow: `2px 2px 0px 0px ${cfg.cor}`,
                  padding: '10px 16px', display: 'flex', gap: '10px',
                  alignItems: 'center', flexWrap: 'wrap',
                }}>
                  <span style={{ fontFamily: "'Kalam', cursive", fontSize: '14px', color: '#2d5da1', minWidth: '55px' }}>
                    {item.sku}
                  </span>
                  <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '13px', flex: 1, minWidth: '120px' }}>
                    {item.nome}
                  </span>
                  {unidade === 'Ambas' && item.unidade && (
                    <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '11px', color: '#6b7280' }}>
                      {UNIDADE_CORES[item.unidade]?.emoji || '🏪'} {UNIDADE_CORES[item.unidade]?.label || item.unidade}
                    </span>
                  )}
                  <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '12px', color: '#6b7280' }}>
                    📅 {formatarData(item.dataValidade)}
                  </span>
                  <span style={{ fontFamily: "'Kalam', cursive", fontSize: '13px', color: cfg.cor, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {item.dias < 0 ? `${Math.abs(item.dias)}d vencido` : item.dias === 0 ? 'vence hoje' : `${item.dias}d restantes`}
                  </span>
                </div>
              );
            })}
            {stats.criticos.length + stats.vencidos.length > 10 && (
              <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '13px', color: '#9ca3af', textAlign: 'center' }}>
                ...e mais {stats.criticos.length + stats.vencidos.length - 10} item(ns) em alerta.
              </p>
            )}
          </div>
        </section>
      )}

    </div>
  );
}
