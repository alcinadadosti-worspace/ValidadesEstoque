import React, { useState } from 'react';

// PINs de acesso por unidade (4 dígitos = legado, 5 dígitos = novas lojas)
const PINS = {
  '1048':  'Matriz',
  '1515':  'Filial',
  '7776':  'Ambas',
  '24668': 'Loja Palmeira',
  '24669': 'Loja Penedo',
  '24671': 'Loja Teotônio',
  '24670': 'Loja Coruripe',
  '24617': 'Loja Palmeira (Sustentável)',
};

export default function SelecionarUnidade({ onSelecionar, onSair }) {
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    setTimeout(() => {
      const unidade = PINS[codigo.trim()];
      if (unidade) {
        onSelecionar(unidade);
      } else {
        setErro('Código inválido. Tente novamente.');
        setCodigo('');
      }
      setCarregando(false);
    }, 400);
  };

  const handleChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 5);
    setCodigo(val);
    if (erro) setErro('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#fff',
          border: '3px solid #2d2d2d',
          borderRadius: '15px 225px 15px 255px / 225px 15px 255px 15px',
          boxShadow: '6px 6px 0px 0px #2d5da1',
          padding: '40px 32px',
          position: 'relative',
        }}
      >
        {/* Tachinha decorativa */}
        <div
          style={{
            position: 'absolute',
            top: '-10px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '20px',
            height: '20px',
            background: '#ff4d4d',
            borderRadius: '50%',
            border: '2px solid #2d2d2d',
            boxShadow: '1px 1px 0px 0px #2d2d2d',
          }}
        />

        {/* Logo + Título */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img
            src="/logo.png"
            alt="Grupo Alcina Maria"
            style={{
              width: '90px',
              height: '90px',
              objectFit: 'contain',
              filter: 'drop-shadow(3px 4px 0px rgba(45,45,45,0.2))',
              transform: 'rotate(2deg)',
              marginBottom: '8px',
            }}
          />
          <h2
            style={{
              fontFamily: "'Kalam', cursive",
              fontSize: '24px',
              margin: '4px 0 4px',
              color: '#2d2d2d',
            }}
          >
            Selecionar Unidade
          </h2>
          <p
            style={{
              fontFamily: "'Patrick Hand', cursive",
              fontSize: '14px',
              color: '#6b7280',
              margin: 0,
            }}
          >
            Digite o código da sua unidade
          </p>
        </div>

        <div style={{ borderTop: '2px dashed #e5e0d8', marginBottom: '20px' }} />

        {/* Input do código */}
        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: 'block',
              fontFamily: "'Kalam', cursive",
              fontSize: '15px',
              marginBottom: '8px',
            }}
          >
            🔢 Código de acesso
          </label>
          <input
            type="password"
            inputMode="numeric"
            value={codigo}
            onChange={handleChange}
            placeholder="····"
            maxLength={5}
            autoFocus
            style={{
              width: '100%',
              padding: '14px',
              fontFamily: "'Kalam', cursive",
              fontSize: '28px',
              letterSpacing: '8px',
              textAlign: 'center',
              border: `2px solid ${erro ? '#ef4444' : '#2d2d2d'}`,
              borderRadius: '15px 225px 15px 255px / 225px 15px 255px 15px',
              boxShadow: `3px 3px 0px 0px ${erro ? '#ef4444' : '#2d2d2d'}`,
              background: '#fff',
              outline: 'none',
              marginBottom: '8px',
            }}
          />

          {erro && (
            <p
              style={{
                fontFamily: "'Patrick Hand', cursive",
                color: '#ef4444',
                fontSize: '13px',
                textAlign: 'center',
                marginBottom: '12px',
              }}
            >
              ⚠️ {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando || codigo.length < 4}
            style={{
              width: '100%',
              padding: '13px',
              fontFamily: "'Kalam', cursive",
              fontSize: '17px',
              fontWeight: 700,
              background: carregando || codigo.length < 4 ? '#e5e0d8' : '#2d2d2d',
              color: '#fdfbf7',
              border: '3px solid #2d2d2d',
              borderRadius: '225px 15px 255px 15px / 15px 255px 15px 225px',
              boxShadow: carregando || codigo.length < 4 ? 'none' : '4px 4px 0px 0px #2d5da1',
              cursor: carregando || codigo.length < 4 ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              marginTop: '4px',
            }}
          >
            {carregando ? '⏳...' : '✅ Confirmar'}
          </button>
        </form>

        {/* Botão sair */}
        <button
          onClick={onSair}
          style={{
            marginTop: '16px',
            width: '100%',
            padding: '8px',
            fontFamily: "'Patrick Hand', cursive",
            fontSize: '14px',
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Sair / Trocar conta
        </button>
      </div>
    </div>
  );
}
