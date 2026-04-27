import React, { useMemo, useState } from 'react';
import ValidadeBadge from './ValidadeBadge';
import {
  calcularDiasRestantes,
  calcularStatus,
  formatarData,
  MARCAS,
  MARCA_CORES,
} from '../lib/validadeUtils';

export default function ValidadeList({
  validades,
  filtroMarca,
  setFiltroMarca,
  filtroStatus,
  setFiltroStatus,
  onDeletar,
  unidade,
}) {
  const [deletandoId, setDeletandoId] = useState(null);
  const [confirmarId, setConfirmarId] = useState(null);

  const itensFiltrados = useMemo(() => {
    return validades
      .filter(v => {
        // Filtro por unidade
        if (unidade !== 'Ambas' && v.unidade && v.unidade !== unidade) return false;
        if (filtroMarca && v.marca !== filtroMarca) return false;
        if (filtroStatus) {
          const dias = calcularDiasRestantes(v.dataValidade);
          if (calcularStatus(dias) !== filtroStatus) return false;
        }
        return true;
      })
      .sort((a, b) => calcularDiasRestantes(a.dataValidade) - calcularDiasRestantes(b.dataValidade));
  }, [validades, filtroMarca, filtroStatus, unidade]);

  const handleDeletar = async (id) => {
    if (confirmarId !== id) { setConfirmarId(id); return; }
    setDeletandoId(id);
    setConfirmarId(null);
    await onDeletar(id);
    setDeletandoId(null);
  };

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
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
          📦 Estoque — {unidade} ({itensFiltrados.length} / {validades.filter(v => unidade === 'Ambas' || !v.unidade || v.unidade === unidade).length})
        </span>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={filtroMarca}
            onChange={e => setFiltroMarca(e.target.value)}
            style={{
              padding: '6px 12px',
              fontFamily: "'Patrick Hand', cursive",
              fontSize: '13px',
              border: '2px solid #2d2d2d',
              borderRadius: '15px 225px 15px 255px / 225px 15px 255px 15px',
              boxShadow: '2px 2px 0px 0px #2d2d2d',
              background: '#fff',
              cursor: 'pointer',
              appearance: 'none',
            }}
          >
            <option value="">Todas as marcas</option>
            {MARCAS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          {(filtroMarca || filtroStatus) && (
            <button
              onClick={() => { setFiltroMarca(''); setFiltroStatus(''); }}
              style={{
                padding: '6px 12px',
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '13px',
                background: '#fff',
                border: '2px solid #6b7280',
                borderRadius: '255px 8px 225px 8px / 8px 225px 8px 255px',
                boxShadow: '2px 2px 0px 0px #6b7280',
                cursor: 'pointer',
              }}
            >
              ✕ Limpar filtros
            </button>
          )}
        </div>
      </div>

      <div style={{ borderTop: '2px dashed #e5e0d8', marginBottom: '16px' }} />

      {/* Estado vazio */}
      {itensFiltrados.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 20px', fontFamily: "'Kalam', cursive", fontSize: '18px', color: '#9ca3af' }}>
          <div style={{ fontSize: '48px' }}>📭</div>
          <p style={{ marginTop: '12px' }}>
            {validades.length === 0 ? 'Nenhum produto registrado ainda.' : 'Nenhum item nos filtros selecionados.'}
          </p>
        </div>
      )}

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {itensFiltrados.map((item, idx) => {
          const dias = calcularDiasRestantes(item.dataValidade);
          const corMarca = MARCA_CORES[item.marca] || { bg: '#f3f4f6', border: '#2d2d2d', texto: '#2d2d2d' };
          const isVencido = dias < 0;
          const unidadeItem = item.unidade || '—';
          const unidadeCor = unidadeItem === 'Matriz' ? { bg: '#dbeafe', border: '#2d5da1', texto: '#1e3a8a' }
            : unidadeItem === 'Filial' ? { bg: '#d1fae5', border: '#065f46', texto: '#064e3b' }
            : { bg: '#f3f4f6', border: '#6b7280', texto: '#6b7280' };

          return (
            <div
              key={item.id}
              className="slide-in"
              style={{
                background: isVencido ? '#f9fafb' : '#fff',
                border: '2px solid #2d2d2d',
                borderRadius: idx % 3 === 0
                  ? '255px 15px 225px 15px / 15px 225px 15px 255px'
                  : idx % 3 === 1
                  ? '15px 225px 15px 255px / 225px 15px 255px 15px'
                  : '225px 15px 255px 15px / 15px 255px 15px 225px',
                boxShadow: '3px 3px 0px 0px rgba(45,45,45,0.12)',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap',
                opacity: isVencido ? 0.7 : 1,
              }}
            >
              {/* SKU */}
              <span style={{ fontFamily: "'Kalam', cursive", fontSize: '15px', fontWeight: 700, color: '#2d5da1', minWidth: '55px', letterSpacing: '1px' }}>
                {item.sku}
              </span>

              {/* Nome */}
              <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '14px', flex: 1, minWidth: '140px', textDecoration: isVencido ? 'line-through' : 'none', color: isVencido ? '#9ca3af' : '#2d2d2d' }}>
                {item.nome}
              </span>

              {/* Quantidade */}
              {item.quantidade && (
                <span
                  style={{
                    background: '#fff9c4',
                    border: '2px solid #2d2d2d',
                    borderRadius: '255px 4px 225px 4px / 4px 225px 4px 255px',
                    padding: '1px 8px',
                    fontFamily: "'Patrick Hand', cursive",
                    fontSize: '12px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  📦 {item.quantidade} un.
                </span>
              )}

              {/* Marca */}
              <span
                style={{
                  background: corMarca.bg,
                  border: `2px solid ${corMarca.border}`,
                  borderRadius: '4px 255px 4px 255px / 255px 4px 255px 4px',
                  padding: '1px 8px',
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '11px',
                  color: corMarca.texto,
                  whiteSpace: 'nowrap',
                }}
              >
                {item.marca}
              </span>

              {/* Unidade (só mostra quando está vendo "Ambas") */}
              {unidade === 'Ambas' && (
                <span
                  style={{
                    background: unidadeCor.bg,
                    border: `2px solid ${unidadeCor.border}`,
                    borderRadius: '255px 4px 225px 4px / 4px 225px 4px 255px',
                    padding: '1px 8px',
                    fontFamily: "'Patrick Hand', cursive",
                    fontSize: '11px',
                    color: unidadeCor.texto,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {unidadeItem === 'Matriz' ? '🏬' : '🏪'} {unidadeItem}
                </span>
              )}

              {/* Data */}
              <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '13px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                📅 {formatarData(item.dataValidade)}
              </span>

              {/* Badge de status */}
              <ValidadeBadge dataValidade={item.dataValidade} tamanho="pequeno" />

              {/* Deletar */}
              <button
                onClick={() => handleDeletar(item.id)}
                disabled={deletandoId === item.id}
                title={confirmarId === item.id ? 'Clique novamente para confirmar' : 'Remover registro'}
                style={{
                  padding: '4px 10px',
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '12px',
                  background: confirmarId === item.id ? '#fef2f2' : '#fff',
                  border: `2px solid ${confirmarId === item.id ? '#ef4444' : '#e5e0d8'}`,
                  borderRadius: '255px 8px 225px 8px / 8px 225px 8px 255px',
                  boxShadow: `2px 2px 0px 0px ${confirmarId === item.id ? '#ef4444' : '#e5e0d8'}`,
                  cursor: deletandoId === item.id ? 'not-allowed' : 'pointer',
                  color: confirmarId === item.id ? '#ef4444' : '#9ca3af',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {deletandoId === item.id ? '⏳' : confirmarId === item.id ? '⚠️ Confirmar?' : '🗑️'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
