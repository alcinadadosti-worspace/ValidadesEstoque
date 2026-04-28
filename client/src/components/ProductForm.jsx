import React, { useState } from 'react';
import { MARCAS, MARCA_CORES, UNIDADES, UNIDADE_CORES } from '../lib/validadeUtils';

// Formulário de registro de validade com suporte a quantidade e unidade
export default function ProductForm({ sku, produto, onSalvar, onCancelar, salvando, unidade }) {
  const [nome, setNome] = useState(produto?.nome || '');
  const [marca, setMarca] = useState(produto?.marca || MARCAS[0]);
  const [dataValidade, setDataValidade] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  // Sempre inicia com a unidade atual como padrão, mas o usuário pode trocar
  const [unidadeItem, setUnidadeItem] = useState(
    unidade === 'Ambas' ? 'Matriz' : unidade
  );
  const [erros, setErros] = useState({});

  const produtoExistente = !!produto;

  const validar = () => {
    const e = {};
    if (!produtoExistente && !nome.trim()) e.nome = 'Nome obrigatório';
    if (!dataValidade) e.dataValidade = 'Data de validade obrigatória';
    if (!quantidade || quantidade < 1) e.quantidade = 'Quantidade mínima é 1';
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validar()) return;

    onSalvar({
      sku,
      nome: produtoExistente ? produto.nome : nome.trim(),
      marca: produtoExistente ? produto.marca : marca,
      dataValidade,
      quantidade: Number(quantidade),
      unidade: unidadeItem,
      produtoNovo: !produtoExistente,
    });
  };

  const estiloInput = (temErro) => ({
    width: '100%',
    padding: '10px 14px',
    fontFamily: "'Patrick Hand', cursive",
    fontSize: '16px',
    border: `2px solid ${temErro ? '#ef4444' : '#2d2d2d'}`,
    borderRadius: '15px 225px 15px 255px / 225px 15px 255px 15px',
    boxShadow: `2px 2px 0px 0px ${temErro ? '#ef4444' : '#2d2d2d'}`,
    background: '#fff',
    outline: 'none',
  });

  const corMarca = MARCA_CORES[produto?.marca || marca] || { bg: '#f3f4f6', border: '#2d2d2d', texto: '#2d2d2d' };

  return (
    <div
      className="slide-in"
      style={{
        marginTop: '20px',
        background: '#fff',
        border: '2px solid #2d2d2d',
        borderRadius: '15px 225px 15px 255px / 225px 15px 255px 15px',
        boxShadow: '4px 4px 0px 0px rgba(45,45,45,0.15)',
        padding: '24px',
        position: 'relative',
      }}
    >
      {/* Fita adesiva */}
      <div
        style={{
          position: 'absolute',
          top: '-10px',
          left: '50%',
          transform: 'translateX(-50%) rotate(-1deg)',
          width: '80px',
          height: '20px',
          background: 'rgba(180,180,180,0.5)',
          borderRadius: '2px',
        }}
      />

      <form onSubmit={handleSubmit}>
        {/* SKU */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span style={{ fontFamily: "'Kalam', cursive", fontSize: '13px', color: '#6b7280' }}>SKU:</span>
          <span style={{ fontFamily: "'Kalam', cursive", fontSize: '22px', fontWeight: 700, color: '#2d5da1', letterSpacing: '2px' }}>
            {sku}
          </span>
        </div>

        {/* Produto encontrado */}
        {produtoExistente && (
          <div
            style={{
              background: '#f0fdf4',
              border: '2px solid #22c55e',
              borderRadius: '255px 8px 225px 8px / 8px 225px 8px 255px',
              boxShadow: '3px 3px 0px 0px #22c55e',
              padding: '12px 16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '14px', color: '#16a34a' }}>
                ✅ Produto encontrado!
              </span>
              <span
                style={{
                  background: corMarca.bg,
                  border: `2px solid ${corMarca.border}`,
                  borderRadius: '4px',
                  padding: '1px 8px',
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '12px',
                  color: corMarca.texto,
                }}
              >
                {produto.marca}
              </span>
            </div>
            <p style={{ fontFamily: "'Kalam', cursive", fontSize: '18px', marginTop: '6px', color: '#2d2d2d' }}>
              {produto.nome}
            </p>
          </div>
        )}

        {/* Campos para produto novo */}
        {!produtoExistente && (
          <>
            <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '14px', color: '#f97316', marginBottom: '16px' }}>
              ⚠️ Produto não encontrado. Preencha os dados:
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontFamily: "'Kalam', cursive", fontSize: '15px', marginBottom: '6px' }}>
                Nome do produto *
              </label>
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: Body Splash..."
                style={estiloInput(!!erros.nome)}
              />
              {erros.nome && <span style={{ fontFamily: "'Patrick Hand', cursive", color: '#ef4444', fontSize: '12px' }}>{erros.nome}</span>}
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontFamily: "'Kalam', cursive", fontSize: '15px', marginBottom: '6px' }}>
                Marca *
              </label>
              <select
                value={marca}
                onChange={e => setMarca(e.target.value)}
                style={{ ...estiloInput(false), appearance: 'none', cursor: 'pointer' }}
              >
                {MARCAS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

          </>
        )}

        {/* Unidade — só pergunta quando está visualizando todas as unidades */}
        {unidade === 'Ambas' && (
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontFamily: "'Kalam', cursive", fontSize: '15px', marginBottom: '6px' }}>
              🏪 Cadastrar em qual unidade? *
            </label>
            <select
              value={unidadeItem}
              onChange={e => setUnidadeItem(e.target.value)}
              style={{ ...estiloInput(false), appearance: 'none', cursor: 'pointer' }}
            >
              {UNIDADES.map(u => (
                <option key={u} value={u}>
                  {UNIDADE_CORES[u]?.emoji || '🏪'} {UNIDADE_CORES[u]?.label || u}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Quantidade */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontFamily: "'Kalam', cursive", fontSize: '15px', marginBottom: '6px' }}>
            📦 Quantidade de itens *
          </label>
          <input
            type="number"
            min="1"
            max="9999"
            value={quantidade}
            onChange={e => setQuantidade(e.target.value)}
            style={estiloInput(!!erros.quantidade)}
          />
          {erros.quantidade && (
            <span style={{ fontFamily: "'Patrick Hand', cursive", color: '#ef4444', fontSize: '12px' }}>
              {erros.quantidade}
            </span>
          )}
        </div>

        {/* Data de validade */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontFamily: "'Kalam', cursive", fontSize: '15px', marginBottom: '6px' }}>
            📅 Validade (mês/ano) *
          </label>
          <input
            type="month"
            value={dataValidade}
            onChange={e => setDataValidade(e.target.value)}
            style={estiloInput(!!erros.dataValidade)}
          />
          {erros.dataValidade && (
            <span style={{ fontFamily: "'Patrick Hand', cursive", color: '#ef4444', fontSize: '12px' }}>
              {erros.dataValidade}
            </span>
          )}
        </div>


        {/* Botões */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
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
            type="submit"
            disabled={salvando}
            style={{
              padding: '10px 24px',
              fontFamily: "'Kalam', cursive",
              fontSize: '16px',
              fontWeight: 700,
              background: salvando ? '#e5e0d8' : '#fff',
              border: '3px solid #2d5da1',
              borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
              boxShadow: '4px 4px 0px 0px #2d5da1',
              cursor: salvando ? 'not-allowed' : 'pointer',
              color: '#2d5da1',
            }}
          >
            {salvando ? '⏳ Salvando...' : '💾 Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}
