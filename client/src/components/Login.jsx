import React, { useState } from 'react';

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
      if (email.trim().toLowerCase() === EMAIL_VALIDO && senha === SENHA_VALIDA) {
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
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        gap: '0px',
      }}
    >
      {/* Logo principal — flutua acima do card como se estivesse pregada */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          marginBottom: '-32px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {/* Sombra/reflexo da logo */}
        <div
          style={{
            position: 'absolute',
            bottom: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '120px',
            height: '16px',
            background: 'rgba(45,45,45,0.15)',
            borderRadius: '50%',
            filter: 'blur(6px)',
          }}
        />
        <img
          src="/logo.png"
          alt="Grupo Alcina Maria"
          style={{
            width: '160px',
            height: '160px',
            objectFit: 'contain',
            filter: 'drop-shadow(4px 6px 0px rgba(45,45,45,0.25))',
            transform: 'rotate(-3deg)',
            transition: 'transform 0.3s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'rotate(0deg) scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'rotate(-3deg) scale(1)'}
        />
      </div>

      {/* Card de login */}
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: '#fff',
          border: '3px solid #2d2d2d',
          borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
          boxShadow: '6px 6px 0px 0px #2d2d2d',
          padding: '52px 32px 36px',
          position: 'relative',
        }}
      >
        {/* Fita adesiva no topo do card */}
        <div
          style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%) rotate(-1.5deg)',
            width: '100px',
            height: '24px',
            background: 'rgba(180,180,180,0.4)',
            borderRadius: '2px',
            boxShadow: '1px 1px 0px rgba(0,0,0,0.1)',
          }}
        />

        {/* Título */}
        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
          <h1
            style={{
              fontFamily: "'Kalam', cursive",
              fontSize: '26px',
              margin: '0 0 4px',
              color: '#2d2d2d',
              lineHeight: 1.2,
            }}
          >
            Grupo Alcina Maria
          </h1>
          <p
            style={{
              fontFamily: "'Patrick Hand', cursive",
              fontSize: '13px',
              color: '#9ca3af',
              margin: '0 0 20px',
            }}
          >
            Controle de Validades — Boticário / AL
          </p>
        </div>

        {/* Linha tracejada */}
        <div style={{ borderTop: '2px dashed #e5e0d8', marginBottom: '24px' }} />

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontFamily: "'Kalam', cursive", fontSize: '15px', marginBottom: '6px' }}>
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

          {/* Senha */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontFamily: "'Kalam', cursive", fontSize: '15px', marginBottom: '6px' }}>
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

          {/* Erro */}
          {erro && (
            <p style={{ fontFamily: "'Patrick Hand', cursive", color: '#ef4444', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
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
              transform: carregando ? 'translate(4px,4px)' : 'none',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              if (!carregando) {
                e.currentTarget.style.background = '#ff4d4d';
                e.currentTarget.style.boxShadow = '2px 2px 0px 0px #2d2d2d';
                e.currentTarget.style.transform = 'translate(2px,2px)';
              }
            }}
            onMouseLeave={e => {
              if (!carregando) {
                e.currentTarget.style.background = '#2d2d2d';
                e.currentTarget.style.boxShadow = '4px 4px 0px 0px #ff4d4d';
                e.currentTarget.style.transform = 'none';
              }
            }}
          >
            {carregando ? '⏳ Verificando...' : '🚀 Entrar'}
          </button>
        </form>

        {/* Rodapé decorativo */}
        <p
          style={{
            fontFamily: "'Patrick Hand', cursive",
            fontSize: '11px',
            color: '#d1d5db',
            textAlign: 'center',
            marginTop: '20px',
            marginBottom: 0,
          }}
        >
          Sistema interno — acesso restrito
        </p>
      </div>

      {/* Linha decorativa de papel abaixo do card */}
      <div style={{ display: 'flex', gap: '6px', marginTop: '16px', opacity: 0.3 }}>
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#2d2d2d',
              transform: `rotate(${i * 15}deg)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
