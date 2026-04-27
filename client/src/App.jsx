import React, { useState, useEffect, useCallback } from 'react';
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

import DashboardCards from './components/DashboardCards';
import SKUInput from './components/SKUInput';
import ProductForm from './components/ProductForm';
import ValidadeList from './components/ValidadeList';
import BulkUpload from './components/BulkUpload';

export default function App() {
  // Estado global da aplicação
  const [validades, setValidades] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Estado do fluxo de entrada de produto
  const [skuAtual, setSkuAtual] = useState('');
  const [produtoAtual, setProdutoAtual] = useState(null); // null = aguardando, {} = encontrado, false = não encontrado
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [enviandoLote, setEnviandoLote] = useState(false);

  // Filtros da lista
  const [filtroMarca, setFiltroMarca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  // Mensagem de feedback para o usuário
  const [mensagem, setMensagem] = useState(null);

  // Escuta em tempo real a coleção de validades no Firestore
  useEffect(() => {
    const q = query(collection(db, 'validades'), orderBy('dataValidade', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setValidades(docs);
        setCarregando(false);
      },
      (err) => {
        console.error('Erro ao escutar validades:', err);
        setCarregando(false);
        mostrarMensagem('Erro ao carregar dados. Verifique a conexão.', 'erro');
      }
    );
    return () => unsub();
  }, []);

  // Exibe uma mensagem de feedback temporária (3 segundos)
  const mostrarMensagem = (texto, tipo = 'sucesso') => {
    setMensagem({ texto, tipo });
    setTimeout(() => setMensagem(null), 4000);
  };

  // Callback quando produto é encontrado no Firestore
  const handleProdutoEncontrado = (produto) => {
    setSkuAtual(produto.sku);
    setProdutoAtual(produto);
    setMostrarForm(true);
  };

  // Callback quando produto NÃO é encontrado (precisa cadastrar)
  const handleNovoProduto = (sku) => {
    setSkuAtual(sku);
    setProdutoAtual(false);
    setMostrarForm(true);
  };

  // Salva a validade (e o produto, se for novo)
  const handleSalvar = async ({ sku, nome, marca, dataValidade, produtoNovo }) => {
    setSalvando(true);
    try {
      // Se o produto é novo, persiste na coleção de produtos
      if (produtoNovo) {
        await setDoc(doc(db, 'produtos', sku), {
          sku,
          nome,
          marca,
          criadoEm: serverTimestamp(),
        });
      }

      // Registra a validade na coleção de validades
      await addDoc(collection(db, 'validades'), {
        sku,
        nome,
        marca,
        dataValidade: Timestamp.fromDate(new Date(dataValidade + 'T12:00:00')),
        registradoEm: serverTimestamp(),
      });

      mostrarMensagem(`✅ Validade de "${nome}" registrada com sucesso!`);
      handleCancelar();
    } catch (err) {
      console.error('Erro ao salvar:', err);
      mostrarMensagem('❌ Erro ao salvar. Tente novamente.', 'erro');
    } finally {
      setSalvando(false);
    }
  };

  // Reseta o formulário de entrada
  const handleCancelar = () => {
    setMostrarForm(false);
    setSkuAtual('');
    setProdutoAtual(null);
  };

  // Deleta um registro de validade (sem deletar o produto)
  const handleDeletar = async (id) => {
    try {
      await deleteDoc(doc(db, 'validades', id));
      mostrarMensagem('🗑️ Registro removido.');
    } catch (err) {
      console.error('Erro ao deletar:', err);
      mostrarMensagem('❌ Erro ao remover registro.', 'erro');
    }
  };

  // Processa upload em lote de planilha
  const handleBulkUpload = async (itens) => {
    setEnviandoLote(true);
    let importados = 0;
    let erros = 0;

    try {
      for (const { sku, dataValidade } of itens) {
        try {
          // Tenta buscar o produto no Firestore
          const prodSnap = await getDoc(doc(db, 'produtos', sku));
          let nome, marca;

          if (prodSnap.exists()) {
            ({ nome, marca } = prodSnap.data());
          } else {
            // Produto desconhecido: registra com dados genéricos para revisão posterior
            nome = `Produto SKU ${sku}`;
            marca = 'O Boticário';
          }

          await addDoc(collection(db, 'validades'), {
            sku,
            nome,
            marca,
            dataValidade: Timestamp.fromDate(new Date(dataValidade + 'T12:00:00')),
            registradoEm: serverTimestamp(),
          });
          importados++;
        } catch {
          erros++;
        }
      }

      mostrarMensagem(
        `📥 Lote importado: ${importados} registro${importados !== 1 ? 's' : ''} adicionado${importados !== 1 ? 's' : ''}${erros > 0 ? `, ${erros} com erro` : ''}.`
      );
    } catch (err) {
      console.error('Erro no upload em lote:', err);
      mostrarMensagem('❌ Erro no upload em lote. Tente novamente.', 'erro');
    } finally {
      setEnviandoLote(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '60px' }}>
      {/* Cabeçalho */}
      <header
        style={{
          background: '#2d2d2d',
          color: '#fdfbf7',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '0 4px 0px 0px rgba(45,45,45,0.5)',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Kalam', cursive",
              fontSize: '22px',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            ✏️ Validades do Estoque
          </h1>
          <p
            style={{
              fontFamily: "'Patrick Hand', cursive",
              fontSize: '13px',
              margin: 0,
              opacity: 0.7,
            }}
          >
            Grupo Alcina Maria — Grupo Boticário / Alagoas
          </p>
        </div>

        {carregando && (
          <span
            style={{
              fontFamily: "'Patrick Hand', cursive",
              fontSize: '13px',
              opacity: 0.6,
              marginLeft: 'auto',
            }}
          >
            ⏳ Carregando...
          </span>
        )}
      </header>

      {/* Toast de feedback */}
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
            fontSize: '15px',
            maxWidth: '380px',
            color: '#2d2d2d',
          }}
        >
          {mensagem.texto}
        </div>
      )}

      {/* Conteúdo principal */}
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>

        {/* Dashboard de resumo */}
        {!carregando && (
          <DashboardCards
            validades={validades}
            filtroStatus={filtroStatus}
            setFiltroStatus={setFiltroStatus}
          />
        )}

        {/* Linha tracejada */}
        <div style={{ borderTop: '2px dashed #e5e0d8', margin: '24px 0' }} />

        {/* Seção de entrada de produto */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
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

          {/* SKU Input — fica visível quando o formulário não está aberto */}
          {!mostrarForm && (
            <div style={{ marginTop: '40px' }}>
              <SKUInput
                onProdutoEncontrado={handleProdutoEncontrado}
                onNovoProduto={handleNovoProduto}
              />

              {/* Upload em lote */}
              <div style={{ marginTop: '16px' }}>
                <BulkUpload onUpload={handleBulkUpload} enviando={enviandoLote} />
              </div>
            </div>
          )}

          {/* Formulário de validade (produto encontrado ou novo) */}
          {mostrarForm && (
            <ProductForm
              sku={skuAtual}
              produto={produtoAtual || null}
              onSalvar={handleSalvar}
              onCancelar={handleCancelar}
              salvando={salvando}
            />
          )}
        </section>

        {/* Linha tracejada */}
        <div style={{ borderTop: '2px dashed #e5e0d8', margin: '24px 0' }} />

        {/* Lista de validades */}
        <section>
          <ValidadeList
            validades={validades}
            filtroMarca={filtroMarca}
            setFiltroMarca={setFiltroMarca}
            filtroStatus={filtroStatus}
            setFiltroStatus={setFiltroStatus}
            onDeletar={handleDeletar}
          />
        </section>
      </main>
    </div>
  );
}
