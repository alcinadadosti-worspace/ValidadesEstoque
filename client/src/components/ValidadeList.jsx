import React, { useMemo, useState } from 'react';
import ValidadeBadge from './ValidadeBadge';
import {
  calcularDiasRestantes,
  calcularStatus,
  formatarData,
  MARCAS,
  MARCA_CORES,
  UNIDADE_CORES,
} from '../lib/validadeUtils';

// Modal de exclusão (total ou parcial)
function ModalDeletar({ item, onConfirmar, onFechar }) {
  const qtdMax = Number(item.quantidade) || 1;
  const [qtd, setQtd] = useState(1);

  const handleQtd = (v) => {
    const n = parseInt(v, 10);
    if (isNaN(n)) return;
    setQtd(Math.min(qtdMax, Math.max(1, n)));
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onFechar}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="slide-in"
        style={{
          background: '#fff',
          border: '3px solid #2d2d2d',
          borderRadius: '15px 225px 15px 255px / 225px 15px 255px 15px',
          boxShadow: '6px 6px 0px 0px #2d2d2d',
          padding: '28px 24px',
          maxWidth: '380px',
          width: '100%',
        }}
      >
        <div style={{ marginBottom: '6px' }}>
          <span style={{
            background: '#fef2f2', border: '2px solid #ef4444',
            borderRadius: '4px 255px 4px 255px / 255px 4px 255px 4px',
            padding: '2px 12px',
            fontFamily: "'Kalam', cursive", fontSize: '17px',
            boxShadow: '2px 2px 0px 0px #ef4444', color: '#ef4444',
          }}>
            🗑️ Remover unidades
          </span>
        </div>

        <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '14px', color: '#6b7280', margin: '14px 0 6px' }}>
          <strong style={{ color: '#2d2d2d', fontSize: '15px' }}>{item.nome}</strong>
          <br />
          SKU <strong>{item.sku}</strong> · Estoque atual: <strong style={{ color: '#2d5da1' }}>{qtdMax} un.</strong>
        </p>

        {qtdMax > 1 && (
          <div style={{ margin: '18px 0 4px' }}>
            <label style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '13px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>
              Quantas unidades remover?
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setQtd(q => Math.max(1, q - 1))}
                style={{
                  width: '36px', height: '36px',
                  fontFamily: "'Kalam', cursive", fontSize: '20px', fontWeight: 700,
                  background: '#fff', border: '2px solid #2d2d2d',
                  borderRadius: '255px', boxShadow: '2px 2px 0 #2d2d2d',
                  cursor: 'pointer', lineHeight: 1,
                }}
              >−</button>
              <input
                type="number"
                min={1}
                max={qtdMax}
                value={qtd}
                onChange={e => handleQtd(e.target.value)}
                style={{
                  width: '70px', textAlign: 'center',
                  padding: '6px 8px',
                  fontFamily: "'Kalam', cursive", fontSize: '20px', fontWeight: 700,
                  border: '2px solid #2d2d2d', borderRadius: '8px',
                  boxShadow: '2px 2px 0 #2d2d2d', outline: 'none',
                }}
              />
              <button
                onClick={() => setQtd(q => Math.min(qtdMax, q + 1))}
                style={{
                  width: '36px', height: '36px',
                  fontFamily: "'Kalam', cursive", fontSize: '20px', fontWeight: 700,
                  background: '#fff', border: '2px solid #2d2d2d',
                  borderRadius: '255px', boxShadow: '2px 2px 0 #2d2d2d',
                  cursor: 'pointer', lineHeight: 1,
                }}
              >+</button>
              <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '13px', color: '#9ca3af' }}>
                de {qtdMax}
              </span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '22px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button
            onClick={onFechar}
            style={{
              padding: '9px 18px',
              fontFamily: "'Patrick Hand', cursive", fontSize: '14px',
              background: '#fff', border: '2px solid #6b7280',
              borderRadius: '225px 15px 255px 15px / 15px 255px 15px 225px',
              boxShadow: '3px 3px 0 #6b7280', cursor: 'pointer',
            }}
          >
            Cancelar
          </button>

          {qtdMax > 1 && qtd < qtdMax && (
            <button
              onClick={() => onConfirmar(qtd)}
              style={{
                padding: '9px 18px',
                fontFamily: "'Kalam', cursive", fontSize: '14px', fontWeight: 700,
                background: '#fff7ed', border: '2px solid #f97316',
                borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
                boxShadow: '3px 3px 0 #f97316', cursor: 'pointer', color: '#ea580c',
              }}
            >
              ⬇️ Remover {qtd} un.
            </button>
          )}

          <button
            onClick={() => onConfirmar(qtdMax)}
            style={{
              padding: '9px 18px',
              fontFamily: "'Kalam', cursive", fontSize: '14px', fontWeight: 700,
              background: '#fef2f2', border: '2px solid #ef4444',
              borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
              boxShadow: '3px 3px 0 #ef4444', cursor: 'pointer', color: '#ef4444',
            }}
          >
            🗑️ Apagar tudo ({qtdMax} un.)
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ValidadeList({
  validades,
  filtroMarca,
  setFiltroMarca,
  filtroStatus,
  setFiltroStatus,
  onDeletar,
  onDeletarParcial,
  unidade,
}) {
  const [deletandoId, setDeletandoId] = useState(null);
  const [modalItem, setModalItem] = useState(null);

  const itensFiltrados = useMemo(() => {
    return validades
      .filter(v => {
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

  const abrirModal = (item) => setModalItem(item);
  const fecharModal = () => setModalItem(null);

  const confirmarDeletar = async (qtdRemover) => {
    if (!modalItem) return;
    const id = modalItem.id;
    const qtdTotal = Number(modalItem.quantidade) || 1;
    fecharModal();
    setDeletandoId(id);
    if (qtdRemover >= qtdTotal) {
      await onDeletar(id);
    } else {
      await onDeletarParcial(id, qtdRemover, qtdTotal);
    }
    setDeletandoId(null);
  };

  return (
    <div>
      {/* Modal */}
      {modalItem && (
        <ModalDeletar
          item={modalItem}
          onConfirmar={confirmarDeletar}
          onFechar={fecharModal}
        />
      )}

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <span style={{
          background: '#fff9c4', border: '2px solid #2d2d2d',
          borderRadius: '4px 255px 4px 255px / 255px 4px 255px 4px',
          padding: '2px 12px', fontFamily: "'Kalam', cursive", fontSize: '18px',
          boxShadow: '2px 2px 0px 0px #2d2d2d',
        }}>
          📦 Estoque — {unidade} ({itensFiltrados.length} / {validades.filter(v => unidade === 'Ambas' || !v.unidade || v.unidade === unidade).length})
        </span>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={filtroMarca}
            onChange={e => setFiltroMarca(e.target.value)}
            style={{
              padding: '6px 12px', fontFamily: "'Patrick Hand', cursive", fontSize: '13px',
              border: '2px solid #2d2d2d', borderRadius: '15px 225px 15px 255px / 225px 15px 255px 15px',
              boxShadow: '2px 2px 0px 0px #2d2d2d', background: '#fff',
              cursor: 'pointer', appearance: 'none',
            }}
          >
            <option value="">Todas as marcas</option>
            {MARCAS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          {(filtroMarca || filtroStatus) && (
            <button
              onClick={() => { setFiltroMarca(''); setFiltroStatus(''); }}
              style={{
                padding: '6px 12px', fontFamily: "'Patrick Hand', cursive", fontSize: '13px',
                background: '#fff', border: '2px solid #6b7280',
                borderRadius: '255px 8px 225px 8px / 8px 225px 8px 255px',
                boxShadow: '2px 2px 0px 0px #6b7280', cursor: 'pointer',
              }}
            >
              ✕ Limpar filtros
            </button>
          )}
        </div>
      </div>

      <div style={{ borderTop: '2px dashed #e5e0d8', marginBottom: '16px' }} />

      {itensFiltrados.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 20px', fontFamily: "'Kalam', cursive", fontSize: '18px', color: '#9ca3af' }}>
          <div style={{ fontSize: '48px' }}>📭</div>
          <p style={{ marginTop: '12px' }}>
            {validades.length === 0 ? 'Nenhum produto registrado ainda.' : 'Nenhum item nos filtros selecionados.'}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {itensFiltrados.map((item, idx) => {
          const dias = calcularDiasRestantes(item.dataValidade);
          const corMarca = MARCA_CORES[item.marca] || { bg: '#f3f4f6', border: '#2d2d2d', texto: '#2d2d2d' };
          const isVencido = dias <= 0;
          const unidadeItem = item.unidade || '—';
          const unidadeCor = UNIDADE_CORES[unidadeItem] || { bg: '#f3f4f6', border: '#6b7280', texto: '#6b7280', emoji: '🏪', label: unidadeItem };

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
                display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
                opacity: isVencido ? 0.7 : 1,
              }}
            >
              <span style={{ fontFamily: "'Kalam', cursive", fontSize: '15px', fontWeight: 700, color: '#2d5da1', minWidth: '55px', letterSpacing: '1px' }}>
                {item.sku}
              </span>

              <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '14px', flex: 1, minWidth: '140px', textDecoration: isVencido ? 'line-through' : 'none', color: isVencido ? '#9ca3af' : '#2d2d2d' }}>
                {item.nome}
              </span>

              {item.quantidade && (
                <span style={{
                  background: '#fff9c4', border: '2px solid #2d2d2d',
                  borderRadius: '255px 4px 225px 4px / 4px 225px 4px 255px',
                  padding: '1px 8px', fontFamily: "'Patrick Hand', cursive",
                  fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap',
                }}>
                  📦 {item.quantidade} un.
                </span>
              )}

              <span style={{
                background: corMarca.bg, border: `2px solid ${corMarca.border}`,
                borderRadius: '4px 255px 4px 255px / 255px 4px 255px 4px',
                padding: '1px 8px', fontFamily: "'Patrick Hand', cursive",
                fontSize: '11px', color: corMarca.texto, whiteSpace: 'nowrap',
              }}>
                {item.marca}
              </span>

              {unidade === 'Ambas' && (
                <span style={{
                  background: unidadeCor.bg, border: `2px solid ${unidadeCor.border}`,
                  borderRadius: '255px 4px 225px 4px / 4px 225px 4px 255px',
                  padding: '1px 8px', fontFamily: "'Patrick Hand', cursive",
                  fontSize: '11px', color: unidadeCor.texto, whiteSpace: 'nowrap',
                }}>
                  {unidadeCor.emoji} {unidadeCor.label}
                </span>
              )}

              <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '13px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                📅 {formatarData(item.dataValidade)}
              </span>

              <ValidadeBadge dataValidade={item.dataValidade} tamanho="pequeno" />

              <button
                onClick={() => abrirModal(item)}
                disabled={deletandoId === item.id}
                title="Remover unidades"
                style={{
                  padding: '4px 10px',
                  fontFamily: "'Patrick Hand', cursive", fontSize: '12px',
                  background: '#fff', border: '2px solid #e5e0d8',
                  borderRadius: '255px 8px 225px 8px / 8px 225px 8px 255px',
                  boxShadow: '2px 2px 0px 0px #e5e0d8',
                  cursor: deletandoId === item.id ? 'not-allowed' : 'pointer',
                  color: '#9ca3af', transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}
              >
                {deletandoId === item.id ? '⏳' : '🗑️'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
