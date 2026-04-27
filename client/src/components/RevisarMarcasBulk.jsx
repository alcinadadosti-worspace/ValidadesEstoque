import React, { useState } from 'react';
import { MARCAS, MARCA_CORES, detectarMarca } from '../lib/validadeUtils';

// Tela de revisão de marcas para produtos novos encontrados no upload em lote
export default function RevisarMarcasBulk({ itens, onConfirmar, onCancelar }) {
  // Inicializa cada produto com a marca detectada automaticamente como sugestão
  const [marcas, setMarcas] = useState(() =>
    Object.fromEntries(itens.map((item, i) => [i, detectarMarca(item.nome)]))
  );

  const handleMarca = (idx, valor) => {
    setMarcas(prev => ({ ...prev, [idx]: valor }));
  };

  const handleConfirmar = () => {
    const itensComMarca = itens.map((item, i) => ({
      ...item,
      marca: marcas[i],
    }));
    onConfirmar(itensComMarca);
  };

  return (
    <div
      className="slide-in"
      style={{
        background: '#fff',
        border: '3px solid #f97316',
        borderRadius: '15px 225px 15px 255px / 225px 15px 255px 15px',
        boxShadow: '5px 5px 0px 0px rgba(249,115,22,0.25)',
        padding: '24px',
        marginTop: '16px',
      }}
    >
      {/* Cabeçalho */}
      <div style={{ marginBottom: '16px' }}>
        <span
          style={{
            background: '#fff7ed',
            border: '2px solid #f97316',
            borderRadius: '4px 255px 4px 255px / 255px 4px 255px 4px',
            padding: '2px 12px',
            fontFamily: "'Kalam', cursive",
            fontSize: '17px',
            boxShadow: '2px 2px 0px 0px #f97316',
            color: '#ea580c',
          }}
        >
          ⚠️ Produtos novos — confirme a marca
        </span>
        <p
          style={{
            fontFamily: "'Patrick Hand', cursive",
            fontSize: '13px',
            color: '#9a3412',
            marginTop: '10px',
            marginBottom: 0,
          }}
        >
          {itens.length} produto{itens.length !== 1 ? 's' : ''} não encontrado{itens.length !== 1 ? 's' : ''} no cadastro.
          A marca foi sugerida automaticamente — corrija se necessário.
        </p>
      </div>

      <div style={{ borderTop: '2px dashed #fed7aa', marginBottom: '16px' }} />

      {/* Lista de produtos para revisão */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
        {itens.map((item, idx) => {
          const corMarca = MARCA_CORES[marcas[idx]] || { bg: '#f3f4f6', border: '#2d2d2d', texto: '#2d2d2d' };
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap',
                background: '#fdfbf7',
                border: '2px solid #e5e0d8',
                borderRadius: idx % 2 === 0
                  ? '255px 8px 225px 8px / 8px 225px 8px 255px'
                  : '8px 255px 8px 225px / 255px 8px 225px 8px',
                padding: '10px 14px',
              }}
            >
              {/* SKU */}
              <span
                style={{
                  fontFamily: "'Kalam', cursive",
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#2d5da1',
                  minWidth: '58px',
                }}
              >
                {item.sku}
              </span>

              {/* Nome */}
              <span
                style={{
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '13px',
                  flex: 1,
                  minWidth: '140px',
                  color: '#2d2d2d',
                }}
              >
                {item.nome}
              </span>

              {/* Dropdown de marca */}
              <select
                value={marcas[idx]}
                onChange={e => handleMarca(idx, e.target.value)}
                style={{
                  padding: '6px 10px',
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '13px',
                  border: `2px solid ${corMarca.border}`,
                  borderRadius: '255px 8px 225px 8px / 8px 225px 8px 255px',
                  boxShadow: `2px 2px 0px 0px ${corMarca.border}`,
                  background: corMarca.bg,
                  color: corMarca.texto,
                  cursor: 'pointer',
                  appearance: 'none',
                  fontWeight: 600,
                  minWidth: '180px',
                }}
              >
                {MARCAS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: '2px dashed #fed7aa', margin: '16px 0' }} />

      {/* Botões */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          onClick={onCancelar}
          style={{
            padding: '10px 20px',
            fontFamily: "'Patrick Hand', cursive",
            fontSize: '15px',
            background: '#fff',
            border: '2px solid #6b7280',
            borderRadius: '225px 15px 255px 15px / 15px 255px 15px 225px',
            boxShadow: '3px 3px 0px 0px #6b7280',
            cursor: 'pointer',
          }}
        >
          Cancelar
        </button>

        <button
          onClick={handleConfirmar}
          style={{
            padding: '10px 24px',
            fontFamily: "'Kalam', cursive",
            fontSize: '16px',
            fontWeight: 700,
            background: '#fff',
            border: '3px solid #f97316',
            borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
            boxShadow: '4px 4px 0px 0px #f97316',
            cursor: 'pointer',
            color: '#ea580c',
          }}
        >
          ✅ Confirmar e Importar
        </button>
      </div>
    </div>
  );
}
