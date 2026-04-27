import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  setDoc,
  serverTimestamp,
  Timestamp,
  query,
  orderBy,
  getDoc,
} from 'firebase/firestore';
import { db } from './lib/firebase';

import Login from './components/Login';
import SelecionarUnidade from './components/SelecionarUnidade';
import DashboardCards from './components/DashboardCards';
import SKUInput from './components/SKUInput';
import ProductForm from './components/ProductForm';
import ValidadeList from './components/ValidadeList';
import BulkUpload from './components/BulkUpload';

export default function App() {
  // Estado de autenticação e unidade (persistido em localStorage)
  const [autenticado, setAutenticado] = useState(() => localStorage.getItem('auth') === 'true');
  const [unidade, setUnidade] = useState(() => localStorage.getItem('unidade') || '');

  // Dados do estoque
  const [validades, setValidades] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Fluxo de cadastro de produto
  const [skuAtual, setSkuAtual] = useState('');
  const [produtoAtual, setProdutoAtual] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [enviandoLote, setEnviandoLote] = useState(false);

  // Filtros da lista
  const [filtroMarca, setFiltroMarca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  // Toast de feedback
  const [mensagem, setMensagem] = useState(null);

  // Escuta o Firestore apenas quando autenticado e com unidade selecionada
  useEffect(() => {
    if (!autenticado || !unidade) return;

    const q = query(collection(db, 'validades'), orderBy('dataValidade', 'asc'));
    const unsub = onSnapshot(
      q,
      snap => {
        setValidades(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setCarregando(false);
      },
      err => {
        console.error('Erro ao escutar validades:', err);
        setCarregando(false);
        mostrarMensagem('Erro ao carregar dados. Verifique a conexão.', 'erro');
      }
    );
    return () => unsub();
  }, [autenticado, unidade]);

  const mostrarMensagem = (texto, tipo = 'sucesso') => {
    setMensagem({ texto, tipo });
    setTimeout(() => setMensagem(null), 4000);
  };

  // Login
  const handleLogin = () => {
    localStorage.setItem('auth', 'true');
    setAutenticado(true);
  };

  // Seleção de unidade
  const handleSelecionarUnidade = (u) => {
    localStorage.setItem('unidade', u);
    setUnidade(u);
  };

  // Logout completo
  const handleSair = () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('unidade');
    setAutenticado(false);
    setUnidade('');
    setValidades([]);
    setMostrarForm(false);
  };

  // Trocar unidade sem fazer logout
  const handleTrocarUnidade = () => {
    localStorage.removeItem('unidade');
    setUnidade('');
    setMostrarForm(false);
    setFiltroMarca('');
    setFiltroStatus('');
  };

  const handleProdutoEncontrado = (produto) => {
    setSkuAtual(produto.sku);
    setProdutoAtual(produto);
    setMostrarForm(true);
  };

  const handleNovoProduto = (sku) => {
    setSkuAtual(sku);
    setProdutoAtual(false);
    setMostrarForm(true);
  };

  const handleSalvar = async ({ sku, nome, marca, dataValidade, quantidade, unidade: unidadeItem, produtoNovo }) => {
    setSalvando(true);
    try {
      if (produtoNovo) {
        await setDoc(doc(db, 'produtos', sku), {
          sku, nome, marca,
          criadoEm: serverTimestamp(),
        });
      }

      await addDoc(collection(db, 'validades'), {
        sku,
        nome,
        marca,
        quantidade: Number(quantidade) || 1,
        unidade: unidadeItem,
        dataValidade: Timestamp.fromDate(new Date(dataValidade + 'T12:00:00')),
        registradoEm: serverTimestamp(),
      });

      mostrarMensagem(`✅ "${nome}" — ${quantidade} un. registrado em ${unidadeItem}!`);
      handleCancelar();
    } catch (err) {
      console.error('Erro ao salvar:', err);
      mostrarMensagem('❌ Erro ao salvar. Tente novamente.', 'erro');
    } finally {
      setSalvando(false);
    }
  };

  const handleCancelar = () => {
    setMostrarForm(false);
    setSkuAtual('');
    setProdutoAtual(null);
  };

  const handleDeletar = async (id) => {
    try {
      await deleteDoc(doc(db, 'validades', id));
      mostrarMensagem('🗑️ Registro removido.');
    } catch (err) {
      console.error('Erro ao deletar:', err);
      mostrarMensagem('❌ Erro ao remover registro.', 'erro');
    }
  };

  const handleBulkUpload = async (itens) => {
    setEnviandoLote(true);
    let importados = 0;
    let erros = 0;
    const unidadeImport = unidade !== 'Ambas' ? unidade : 'Matriz';

    try {
      for (const { sku, dataValidade } of itens) {
        try {
          const prodSnap = await getDoc(doc(db, 'produtos', sku));
          let nome, marca;
          if (prodSnap.exists()) {
            ({ nome, marca } = prodSnap.data());
          } else {
            nome = `Produto SKU ${sku}`;
            marca = 'O Boticário';
          }

          await addDoc(collection(db, 'validades'), {
            sku, nome, marca,
            quantidade: 1,
            unidade: unidadeImport,
            dataValidade: Timestamp.fromDate(new Date(dataValidade + 'T12:00:00')),
            registradoEm: serverTimestamp(),
          });
          importados++;
        } catch { erros++; }
      }

      mostrarMensagem(`📥 ${importados} registro${importados !== 1 ? 's' : ''} importado${importados !== 1 ? 's' : ''} em ${unidadeImport}${erros > 0 ? `, ${erros} com erro` : ''}.`);
    } catch (err) {
      mostrarMensagem('❌ Erro no upload em lote.', 'erro');
    } finally {
      setEnviandoLote(false);
    }
  };

  // Filtra validades pela unidade selecionada para o dashboard
  const validadesDaUnidade = validades.filter(v =>
    unidade === 'Ambas' || !v.unidade || v.unidade === unidade
  );

  // --- Renderização condicional por estado de auth ---

  if (!autenticado) {
    return <Login onLogin={handleLogin} />;
  }

  if (!unidade) {
    return <SelecionarUnidade onSelecionar={handleSelecionarUnidade} onSair={handleSair} />;
  }

  // Badge de cor da unidade no header
  const unidadeCfg = {
    Matriz:  { bg: '#2d5da1', label: '🏬 Matriz' },
    Filial:  { bg: '#16a34a', label: '🏪 Filial' },
    Ambas:   { bg: '#7c3aed', label: '🏬🏪 Ambas' },
  }[unidade];

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '60px' }}>
      {/* Header */}
      <header
        style={{
          background: '#2d2d2d',
          color: '#fdfbf7',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '0 4px 0px 0px rgba(45,45,45,0.5)',
          flexWrap: 'wrap',
        }}
      >
        {/* Logo no header — fundo branco para preservar as cores originais */}
        <div
          style={{
            background: '#fff',
            borderRadius: '6px 20px 6px 20px',
            padding: '3px',
            boxShadow: '2px 2px 0px 0px rgba(255,255,255,0.2)',
            transform: 'rotate(-4deg)',
            flexShrink: 0,
          }}
        >
          <img
            src="/logo.png"
            alt="AM"
            style={{
              width: '42px',
              height: '42px',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "'Kalam', cursive", fontSize: '20px', margin: 0, lineHeight: 1.2 }}>
            Validades do Estoque
          </h1>
          <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '12px', margin: 0, opacity: 0.6 }}>
            Grupo Alcina Maria — Boticário / AL
          </p>
        </div>

        {/* Badge da unidade */}
        <span
          style={{
            background: unidadeCfg.bg,
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: '255px 8px 225px 8px / 8px 225px 8px 255px',
            padding: '4px 12px',
            fontFamily: "'Kalam', cursive",
            fontSize: '14px',
            color: '#fff',
          }}
        >
          {unidadeCfg.label}
        </span>

        {/* Botão trocar unidade */}
        <button
          onClick={handleTrocarUnidade}
          title="Trocar unidade"
          style={{
            padding: '5px 12px',
            fontFamily: "'Patrick Hand', cursive",
            fontSize: '13px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            color: '#fdfbf7',
            cursor: 'pointer',
          }}
        >
          🔄 Unidade
        </button>

        {/* Botão sair */}
        <button
          onClick={handleSair}
          title="Sair"
          style={{
            padding: '5px 12px',
            fontFamily: "'Patrick Hand', cursive",
            fontSize: '13px',
            background: 'rgba(255,77,77,0.2)',
            border: '1px solid rgba(255,77,77,0.5)',
            borderRadius: '8px',
            color: '#fca5a5',
            cursor: 'pointer',
          }}
        >
          Sair
        </button>

        {carregando && (
          <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '12px', opacity: 0.5 }}>
            ⏳
          </span>
        )}
      </header>

      {/* Toast */}
      {mensagem && (
        <div
          className="slide-in"
          style={{
            position: 'fixed',
            top: '72px',
            right: '20px',
            zIndex: 100,
            background: mensagem.tipo === 'erro' ? '#fef2f2' : '#f0fdf4',
            border: `3px solid ${mensagem.tipo === 'erro' ? '#ef4444' : '#22c55e'}`,
            borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
            boxShadow: `4px 4px 0px 0px ${mensagem.tipo === 'erro' ? '#ef4444' : '#22c55e'}`,
            padding: '12px 20px',
            fontFamily: "'Patrick Hand', cursive",
            fontSize: '14px',
            maxWidth: '360px',
            color: '#2d2d2d',
          }}
        >
          {mensagem.texto}
        </div>
      )}

      {/* Conteúdo principal */}
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>
        {!carregando && (
          <DashboardCards
            validades={validadesDaUnidade}
            filtroStatus={filtroStatus}
            setFiltroStatus={setFiltroStatus}
          />
        )}

        <div style={{ borderTop: '2px dashed #e5e0d8', margin: '24px 0' }} />

        {/* Seção de cadastro */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
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
              📝 Registrar Produto
            </span>
          </div>

          {!mostrarForm && (
            <div style={{ marginTop: '40px' }}>
              <SKUInput
                onProdutoEncontrado={handleProdutoEncontrado}
                onNovoProduto={handleNovoProduto}
              />
              <div style={{ marginTop: '16px' }}>
                <BulkUpload onUpload={handleBulkUpload} enviando={enviandoLote} />
              </div>
            </div>
          )}

          {mostrarForm && (
            <ProductForm
              sku={skuAtual}
              produto={produtoAtual || null}
              onSalvar={handleSalvar}
              onCancelar={handleCancelar}
              salvando={salvando}
              unidade={unidade}
            />
          )}
        </section>

        <div style={{ borderTop: '2px dashed #e5e0d8', margin: '24px 0' }} />

        {/* Lista */}
        <section>
          <ValidadeList
            validades={validades}
            filtroMarca={filtroMarca}
            setFiltroMarca={setFiltroMarca}
            filtroStatus={filtroStatus}
            setFiltroStatus={setFiltroStatus}
            onDeletar={handleDeletar}
            unidade={unidade}
          />
        </section>
      </main>
    </div>
  );
}
