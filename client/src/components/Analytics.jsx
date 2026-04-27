import React, { useMemo } from 'react';
import {
  calcularDiasRestantes,
  calcularStatus,
  STATUS_CONFIG,
  MARCAS,
  MARCA_CORES,
  formatarData,
} from '../lib/validadeUtils';

// Barra de progresso estilo hand-drawn
function BarraProgresso({ valor, total, cor, altura = 28 }) {
  const pct = total > 0 ? Math.round((valor / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div
        style={{
          flex: 1,
          height: altura,
          background: '#f3f4f6',
          border: '2px solid #2d2d2d',
          borderRadius: '255px 8px 225px 8px / 8px 225px 8px 255px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: cor,
            borderRadius: '255px 8px 225px 8px / 8px 225px 8px 255px',
            transition: 'width 0.6s ease',
            minWidth: pct > 0 ? '8px' : 0,
          }}
        />
      </div>
      <span style={{ fontFamily: "'Kalam', cursive", fontSize: '14px', minWidth: '40px', textAlign: 'right' }}>
        {pct}%
      </span>
    </div>
  );
}

// Card de métrica individual
function MetricaCard({ emoji, valor, label, cor, rotate = '0deg' }) {
  return (
    <div
      style={{
        background: '#fff',
        border: `3px solid ${cor}`,
        borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
        boxShadow: `4px 4px 0px 0px ${cor}`,
        padding: '16px 12px',
        textAlign: 'center',
        transform: `rotate(${rotate})`,
        flex: 1,
        minWidth: '110px',
      }}
    >
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

export default function Analytics({ validades, unidade }) {
  const dadosFiltrados = useMemo(() =>
    validades.filter(v => unidade === 'Ambas' || !v.unidade || v.unidade === unidade),
    [validades, unidade]
  );

  const stats = useMemo(() => {
    const porStatus = { ok: 0, atencao: 0, urgente: 0, critico: 0, vencido: 0 };
    const qtdPorStatus = { ok: 0, atencao: 0, urgente: 0, critico: 0, vencido: 0 };
    const porMarca = {};
    const matrizPorStatus = { ok: 0, atencao: 0, urgente: 0, critico: 0, vencido: 0 };
    const filialPorStatus = { ok: 0, atencao: 0, urgente: 0, critico: 0, vencido: 0 };
    let totalQtd = 0;
    const criticos = [];
    const vencidos = [];

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

      if (unidade === 'Ambas') {
        if (v.unidade === 'Matriz') matrizPorStatus[status]++;
        else if (v.unidade === 'Filial') filialPorStatus[status]++;
      }

      if (status === 'critico') criticos.push({ ...v, dias });
      if (status === 'vencido') vencidos.push({ ...v, dias });
    });

    // Ordena críticos por urgência
    criticos.sort((a, b) => a.dias - b.dias);

    return {
      total: dadosFiltrados.length,
      totalQtd,
      porStatus,
      qtdPorStatus,
      porMarca,
      matrizPorStatus,
      filialPorStatus,
      criticos,
      vencidos,
    };
  }, [dadosFiltrados, unidade]);

  const totalMatriz = unidade === 'Ambas'
    ? validades.filter(v => v.unidade === 'Matriz').length
    : 0;
  const totalFilial = unidade === 'Ambas'
    ? validades.filter(v => v.unidade === 'Filial').length
    : 0;

  const etiqueta = (texto, cor = '#2d2d2d', bg = '#fff9c4') => (
    <span style={{
      background: bg,
      border: `2px solid ${cor}`,
      borderRadius: '4px 255px 4px 255px / 255px 4px 255px 4px',
      padding: '2px 12px',
      fontFamily: "'Kalam', cursive",
      fontSize: '18px',
      boxShadow: `2px 2px 0px 0px ${cor}`,
      color: cor === '#2d2d2d' ? '#2d2d2d' : cor,
      display: 'inline-block',
      marginBottom: '16px',
    }}>
      {texto}
    </span>
  );

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

      {/* ── MÉTRICAS GERAIS ─────────────────────────── */}
      <section>
        {etiqueta('📊 Visão Geral')}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <MetricaCard emoji="📋" valor={stats.total}    label="registros"      cor="#2d2d2d" rotate="-1deg" />
          <MetricaCard emoji="📦" valor={stats.totalQtd} label="unidades totais" cor="#2d5da1" rotate="1deg"  />
          <MetricaCard emoji="🚨" valor={stats.porStatus.critico} label="críticos (≤30d)" cor="#ef4444" rotate="-1deg" />
          <MetricaCard emoji="💀" valor={stats.porStatus.vencido} label="vencidos"         cor="#6b7280" rotate="1deg"  />
        </div>
      </section>

      {/* ── COMPARATIVO MATRIZ VS FILIAL (só em Ambas) ─ */}
      {unidade === 'Ambas' && (
        <section>
          {etiqueta('🏬🏪 Matriz vs Filial')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { label: 'Matriz', emoji: '🏬', cor: '#2d5da1', bg: '#dbeafe', dados: matrizPorStatus, total: totalMatriz },
              { label: 'Filial', emoji: '🏪', cor: '#16a34a', bg: '#d1fae5', dados: filialPorStatus, total: totalFilial },
            ].map(u => (
              <div
                key={u.label}
                style={{
                  background: '#fff',
                  border: `2px solid ${u.cor}`,
                  borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
                  boxShadow: `4px 4px 0px 0px ${u.cor}`,
                  padding: '18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '22px' }}>{u.emoji}</span>
                  <span style={{ fontFamily: "'Kalam', cursive", fontSize: '20px', color: u.cor }}>{u.label}</span>
                  <span style={{
                    marginLeft: 'auto',
                    background: u.bg,
                    border: `2px solid ${u.cor}`,
                    borderRadius: '255px',
                    padding: '1px 10px',
                    fontFamily: "'Kalam', cursive",
                    fontSize: '16px',
                    color: u.cor,
                  }}>
                    {u.total} itens
                  </span>
                </div>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <div key={key} style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '12px', color: cfg.cor }}>
                        {cfg.emoji} {cfg.label}
                      </span>
                      <span style={{ fontFamily: "'Kalam', cursive", fontSize: '13px', color: cfg.cor }}>
                        {u.dados[key]}
                      </span>
                    </div>
                    <BarraProgresso valor={u.dados[key]} total={u.total} cor={cfg.cor} altura={18} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── DISTRIBUIÇÃO POR STATUS ──────────────────── */}
      <section>
        {etiqueta('🎨 Distribuição por Status')}
        <div
          style={{
            background: '#fff',
            border: '2px solid #2d2d2d',
            borderRadius: '15px 225px 15px 255px / 225px 15px 255px 15px',
            boxShadow: '4px 4px 0px 0px rgba(45,45,45,0.12)',
            padding: '20px 24px',
          }}
        >
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '14px', color: cfg.cor, fontWeight: 600 }}>
                  {cfg.emoji} {cfg.texto} — {cfg.label}
                </span>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ fontFamily: "'Kalam', cursive", fontSize: '15px', color: cfg.cor }}>
                    {stats.porStatus[key]} reg.
                  </span>
                  <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '13px', color: '#9ca3af' }}>
                    {stats.qtdPorStatus[key]} un.
                  </span>
                </div>
              </div>
              <BarraProgresso valor={stats.porStatus[key]} total={stats.total} cor={cfg.cor} />
            </div>
          ))}
        </div>
      </section>

      {/* ── POR MARCA ────────────────────────────────── */}
      <section>
        {etiqueta('🏷️ Por Marca')}
        <div
          style={{
            background: '#fff',
            border: '2px solid #2d2d2d',
            borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
            boxShadow: '4px 4px 0px 0px rgba(45,45,45,0.12)',
            padding: '20px 24px',
          }}
        >
          {MARCAS
            .filter(m => stats.porMarca[m])
            .sort((a, b) => (stats.porMarca[b]?.count || 0) - (stats.porMarca[a]?.count || 0))
            .map(marca => {
              const cor = MARCA_CORES[marca];
              const d = stats.porMarca[marca];
              return (
                <div key={marca} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                    <span
                      style={{
                        background: cor?.bg,
                        border: `2px solid ${cor?.border}`,
                        borderRadius: '4px 255px 4px 255px / 255px 4px 255px 4px',
                        padding: '1px 10px',
                        fontFamily: "'Patrick Hand', cursive",
                        fontSize: '13px',
                        color: cor?.texto,
                        fontWeight: 600,
                      }}
                    >
                      {marca}
                    </span>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <span style={{ fontFamily: "'Kalam', cursive", fontSize: '15px', color: cor?.border }}>
                        {d.count} reg.
                      </span>
                      <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '13px', color: '#9ca3af' }}>
                        {d.qtd} un.
                      </span>
                    </div>
                  </div>
                  <BarraProgresso valor={d.count} total={stats.total} cor={cor?.border || '#2d2d2d'} />
                </div>
              );
            })}
        </div>
      </section>

      {/* ── ALERTAS CRÍTICOS ─────────────────────────── */}
      {(stats.criticos.length > 0 || stats.vencidos.length > 0) && (
        <section>
          {etiqueta('🚨 Alertas', '#ef4444', '#fef2f2')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[...stats.vencidos, ...stats.criticos].slice(0, 10).map((item, idx) => {
              const status = calcularStatus(item.dias);
              const cfg = STATUS_CONFIG[status];
              return (
                <div
                  key={item.id}
                  style={{
                    background: cfg.bg,
                    border: `2px solid ${cfg.cor}`,
                    borderRadius: idx % 2 === 0
                      ? '255px 8px 225px 8px / 8px 225px 8px 255px'
                      : '8px 255px 8px 225px / 255px 8px 225px 8px',
                    boxShadow: `2px 2px 0px 0px ${cfg.cor}`,
                    padding: '10px 16px',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontFamily: "'Kalam', cursive", fontSize: '14px', color: '#2d5da1', minWidth: '55px' }}>
                    {item.sku}
                  </span>
                  <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '13px', flex: 1, minWidth: '120px' }}>
                    {item.nome}
                  </span>
                  {unidade === 'Ambas' && item.unidade && (
                    <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '11px', color: '#6b7280' }}>
                      {item.unidade === 'Matriz' ? '🏬' : '🏪'} {item.unidade}
                    </span>
                  )}
                  <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '12px', color: '#6b7280' }}>
                    📅 {formatarData(item.dataValidade)}
                  </span>
                  <span style={{
                    fontFamily: "'Kalam', cursive",
                    fontSize: '13px',
                    color: cfg.cor,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}>
                    {item.dias < 0 ? `${Math.abs(item.dias)}d vencido` : `${item.dias}d restantes`}
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
