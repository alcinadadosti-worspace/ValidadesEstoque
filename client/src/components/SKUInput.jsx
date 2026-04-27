import React, { useState, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Campo de entrada de SKU com seta decorativa "desenhada à mão"
export default function SKUInput({ onProdutoEncontrado, onNovoProduto }) {
  const [sku, setSku] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState('');
  const inputRef = useRef(null);

  const handleBuscar = async (e) => {
    e.preventDefault();
    const skuLimpo = sku.trim();

    if (!skuLimpo) {
      setErro('Digite um SKU antes de buscar.');
      return;
    }
    if (!/^\d{4,6}$/.test(skuLimpo)) {
      setErro('O SKU deve ter entre 4 e 6 dígitos numéricos.');
      return;
    }

    setErro('');
    setBuscando(true);

    try {
      const docRef = doc(db, 'produtos', skuLimpo);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        onProdutoEncontrado({ sku: skuLimpo, ...snap.data() });
      } else {
        onNovoProduto(skuLimpo);
      }
    } catch (err) {
      console.error('Erro na busca de SKU:', err);
      setErro('Erro ao buscar produto. Verifique sua conexão.');
    } finally {
      setBuscando(false);
    }
  };

  const handleChange = (e) => {
    const valor = e.target.value.replace(/\D/g, '').slice(0, 6);
    setSku(valor);
    if (erro) setErro('');
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Seta desenhada à mão apontando para o input */}
      <svg
        width="80"
        height="60"
        viewBox="0 0 80 60"
        style={{
          position: 'absolute',
          top: '-52px',
          left: '20px',
          transform: 'rotate(-10deg)',
          opacity: 0.7,
        }}
      >
        <path
          d="M10 50 C20 30, 50 20, 65 10"
          stroke="#2d2d2d"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="0"
        />
        <path
          d="M60 6 L68 14 L56 14 Z"
          fill="#2d2d2d"
          transform="rotate(30, 64, 10)"
        />
        <text
          x="5"
          y="56"
          style={{
            fontFamily: "'Kalam', cursive",
            fontSize: '11px',
            fill: '#2d5da1',
          }}
        >
          Digite aqui!
        </text>
      </svg>

      <form onSubmit={handleBuscar} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            placeholder="Ex: 57207"
            value={sku}
            onChange={handleChange}
            maxLength={6}
            disabled={buscando}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontFamily: "'Patrick Hand', cursive",
              fontSize: '20px',
              border: `2px solid ${erro ? '#ef4444' : '#2d2d2d'}`,
              borderRadius: '15px 225px 15px 255px / 225px 15px 255px 15px',
              boxShadow: `3px 3px 0px 0px ${erro ? '#ef4444' : '#2d2d2d'}`,
              background: '#fff',
              outline: 'none',
              letterSpacing: '3px',
              transition: 'border-color 0.2s',
            }}
          />
          {erro && (
            <p
              style={{
                fontFamily: "'Patrick Hand', cursive",
                color: '#ef4444',
                fontSize: '13px',
                marginTop: '4px',
                marginLeft: '4px',
              }}
            >
              ⚠️ {erro}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={buscando}
          style={{
            padding: '12px 24px',
            fontFamily: "'Kalam', cursive",
            fontSize: '16px',
            fontWeight: 700,
            background: buscando ? '#e5e0d8' : '#fff',
            border: '3px solid #2d2d2d',
            borderRadius: '225px 15px 255px 15px / 15px 255px 15px 225px',
            boxShadow: '4px 4px 0px 0px #2d2d2d',
            cursor: buscando ? 'not-allowed' : 'pointer',
            transition: 'all 0.1s ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            if (!buscando) {
              e.currentTarget.style.background = '#ff4d4d';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.boxShadow = '2px 2px 0px 0px #2d2d2d';
              e.currentTarget.style.transform = 'translate(2px, 2px)';
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.color = '#2d2d2d';
            e.currentTarget.style.boxShadow = '4px 4px 0px 0px #2d2d2d';
            e.currentTarget.style.transform = 'none';
          }}
          onMouseDown={e => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translate(4px, 4px)';
          }}
          onMouseUp={e => {
            e.currentTarget.style.boxShadow = '2px 2px 0px 0px #2d2d2d';
            e.currentTarget.style.transform = 'translate(2px, 2px)';
          }}
        >
          {buscando ? '⏳ Buscando...' : '🔍 Buscar SKU'}
        </button>
      </form>
    </div>
  );
}
