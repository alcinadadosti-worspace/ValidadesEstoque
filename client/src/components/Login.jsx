import React, { useState } from 'react';

// Credenciais fixas — app interno sem cadastro de novos usuários
const EMAIL_VALIDO = 'logisticavdpenedo@cpalcina.com';
const SENHA_VALIDA = '151530';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    setTimeout(() => {
      if (
        email.trim().toLowerCase() === EMAIL_VALIDO &&
        senha === SENHA_VALIDA
      ) {
        onLogin();
      } else {
        setErro('Email ou senha incorretos.');
      }
      setCarregando(false);
    }, 500);
  };

  const estiloInput = (temErro) => ({
    width: '100%',
    padding: '12px 16px',
    fontFamily: "'Patrick Hand', cursive",
    fontSize: '16px',
    border: `2px solid ${temErro ? '#ef4444' : '#2d2d2d'}`,
    borderRadius: '15px 225px 15px 255px / 225px 15px 255px 15px',
    boxShadow: `3px 3px 0px 0px ${temErro ? '#ef4444' : '#2d2d2d'}`,
    background: '#fff',
    outline: 'none',
  });

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
          maxWidth: '400px',
          background: '#fff',
          border: '3px solid #2d2d2d',
          borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
          boxShadow: '6px 6px 0px 0px #2d2d2d',
          padding: '40px 32px',
          position: 'relative',
        }}
      >
        {/* Fita adesiva decorativa */}
        <div
          style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%) rotate(-1deg)',
            width: '90px',
            height: '22px',
            background: 'rgba(180,180,180,0.45)',
            borderRadius: '2px',
          }}
        />

        {/* Título */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '48px', lineHeight: 1 }}>✏️</div>
          <h1
            style={{
              fontFamily: "'Kalam', cursive",
              fontSize: '26px',
              margin: '8px 0 4px',
              color: '#2d2d2d',
            }}
          >
            Validades do Estoque
          </h1>
          <p
            style={{
              fontFamily: "'Patrick Hand', cursive",
              fontSize: '14px',
              color: '#6b7280',
              margin: 0,
            }}
          >
            Grupo Alcina Maria — Boticário / AL
          </p>
        </div>

        {/* Linha decorativa */}
        <div style={{ borderTop: '2px dashed #e5e0d8', marginBottom: '24px' }} />

        <form onSubmit={handleSubmit}>
          {/* Campo email */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontFamily: "'Kalam', cursive",
                fontSize: '15px',
                marginBottom: '6px',
                color: '#2d2d2d',
              }}
            >
              📧 Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErro(''); }}
              placeholder="seu@email.com"
              autoComplete="username"
              required
              style={estiloInput(!!erro)}
            />
          </div>

          {/* Campo senha */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontFamily: "'Kalam', cursive",
                fontSize: '15px',
                marginBottom: '6px',
                color: '#2d2d2d',
              }}
            >
              🔒 Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={e => { setSenha(e.target.value); setErro(''); }}
              placeholder="••••••"
              autoComplete="current-password"
              required
              style={estiloInput(!!erro)}
            />
          </div>

          {/* Mensagem de erro */}
          {erro && (
            <p
              style={{
                fontFamily: "'Patrick Hand', cursive",
                color: '#ef4444',
                fontSize: '14px',
                marginBottom: '16px',
                textAlign: 'center',
              }}
            >
              ⚠️ {erro}
            </p>
          )}

          {/* Botão entrar */}
          <button
            type="submit"
            disabled={carregando}
            style={{
              width: '100%',
              padding: '14px',
              fontFamily: "'Kalam', cursive",
              fontSize: '18px',
              fontWeight: 700,
              background: carregando ? '#e5e0d8' : '#2d2d2d',
              color: '#fdfbf7',
              border: '3px solid #2d2d2d',
              borderRadius: '225px 15px 255px 15px / 15px 255px 15px 225px',
              boxShadow: carregando ? 'none' : '4px 4px 0px 0px #ff4d4d',
              cursor: carregando ? 'not-allowed' : 'pointer',
              transform: carregando ? 'translate(4px, 4px)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {carregando ? '⏳ Verificando...' : '🚀 Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
