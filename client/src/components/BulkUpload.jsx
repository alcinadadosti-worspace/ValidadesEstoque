import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

// Converte o formato MM-AA (ex: "07-26") para o último dia daquele mês (2026-07-31)
function parseMMAA(valor) {
  if (!valor) return null;
  const str = String(valor).trim();

  // Formato MM-AA ou MM/AA
  const match = str.match(/^(\d{1,2})[-/](\d{2,4})$/);
  if (match) {
    const mes = parseInt(match[1], 10);
    const anoRaw = parseInt(match[2], 10);
    const ano = anoRaw < 100 ? 2000 + anoRaw : anoRaw;
    if (mes >= 1 && mes <= 12) {
      // Último dia do mês (dia 0 do mês seguinte)
      const ultimoDia = new Date(ano, mes, 0);
      return ultimoDia;
    }
  }

  // Tenta parse direto (YYYY-MM-DD, DD/MM/YYYY etc.)
  const tentativa = new Date(valor);
  if (!isNaN(tentativa.getTime())) return tentativa;

  return null;
}

export default function BulkUpload({ onUpload, enviando }) {
  const [aberto, setAberto] = useState(false);
  const [preview, setPreview] = useState([]);
  const [erros, setErros] = useState([]);
  const [arquivo, setArquivo] = useState(null);
  const inputRef = useRef(null);

  const processarArquivo = (file) => {
    setArquivo(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'binary', cellDates: false });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const linhas = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: '' });

        const validos = [];
        const invalidos = [];

        linhas.forEach((linha, idx) => {
          // Aceita "Cod Material", "SKU", "sku", "Código" etc.
          const sku = String(
            linha['Cod Material'] || linha['Cod. Material'] || linha['Código'] ||
            linha.SKU || linha.sku || linha.codigo || ''
          ).trim();

          // Aceita "Desc Material", "Nome", "nome", "Produto" etc.
          const nome = String(
            linha['Desc Material'] || linha['Desc. Material'] || linha['Descrição'] ||
            linha.Nome || linha.nome || linha.Produto || ''
          ).trim();

          // Aceita "Quantidade", "Qtd", "qtd" etc.
          const qtd = parseInt(
            linha['Quantidade'] || linha['Qtd'] || linha['qtd'] || linha['QTD'] || '1', 10
          ) || 1;

          // Aceita "Validade", "DataValidade", "Data Validade" etc.
          const dataRaw = String(
            linha['Validade'] || linha['DataValidade'] || linha['Data Validade'] ||
            linha['Data de Validade'] || linha['dataValidade'] || ''
          ).trim();

          if (!sku) {
            invalidos.push({ linha: idx + 2, motivo: 'SKU ausente' });
            return;
          }

          if (!dataRaw) {
            invalidos.push({ linha: idx + 2, sku, motivo: 'Data de validade ausente' });
            return;
          }

          const data = parseMMAA(dataRaw);
          if (!data || isNaN(data.getTime())) {
            invalidos.push({ linha: idx + 2, sku, motivo: `Data inválida: "${dataRaw}"` });
            return;
          }

          // Formata para YYYY-MM-DD para enviar ao Firebase
          const dataISO = data.toISOString().split('T')[0];
          validos.push({ sku, nome, quantidade: qtd, dataValidade: dataISO });
        });

        setPreview(validos);
        setErros(invalidos);
      } catch (err) {
        setErros([{ motivo: 'Arquivo inválido ou corrompido. Use .xlsx ou .csv.' }]);
        setPreview([]);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleArquivo = (e) => {
    const file = e.target.files[0];
    if (file) processarArquivo(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processarArquivo(file);
  };

  const handleEnviar = () => {
    if (preview.length > 0) onUpload(preview);
  };

  const handleLimpar = () => {
    setArquivo(null);
    setPreview([]);
    setErros([]);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        style={{
          padding: '8px 16px',
          fontFamily: "'Patrick Hand', cursive",
          fontSize: '14px',
          background: '#fff',
          border: '2px solid #2d2d2d',
          borderRadius: '15px 225px 15px 255px / 225px 15px 255px 15px',
          boxShadow: '3px 3px 0px 0px #2d2d2d',
          cursor: 'pointer',
          color: '#2d2d2d',
        }}
      >
        📁 Upload em Lote (.xlsx / .csv)
      </button>
    );
  }

  return (
    <div
      className="slide-in"
      style={{
        background: '#fff',
        border: '2px solid #2d5da1',
        borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
        boxShadow: '4px 4px 0px 0px rgba(45,93,161,0.2)',
        padding: '20px',
        marginTop: '16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={{ fontFamily: "'Kalam', cursive", fontSize: '18px', margin: 0 }}>
          📁 Upload em Lote
        </h3>
        <button
          onClick={() => { setAberto(false); handleLimpar(); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
        >
          ✕
        </button>
      </div>

      {/* Formato esperado */}
      <div
        style={{
          background: '#fefce8',
          border: '2px solid #eab308',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '14px',
          fontFamily: "'Patrick Hand', cursive",
          fontSize: '13px',
          color: '#713f12',
        }}
      >
        <strong>Formato esperado das colunas:</strong><br />
        <code>Cod Material</code> · <code>Desc Material</code> · <code>Quantidade</code> · <code>Validade</code> (MM-AA)
      </div>

      {/* Área de drag-and-drop */}
      {!arquivo && (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          style={{
            border: '2px dashed #2d2d2d',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
            cursor: 'pointer',
            background: '#fdfbf7',
            fontFamily: "'Patrick Hand', cursive",
            color: '#6b7280',
          }}
        >
          <div style={{ fontSize: '32px' }}>📂</div>
          <p style={{ marginTop: '8px' }}>Arraste o arquivo aqui ou clique para selecionar</p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.csv,.xls"
            onChange={handleArquivo}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '14px', color: '#16a34a', marginBottom: '8px' }}>
            ✅ {preview.length} registro{preview.length !== 1 ? 's' : ''} válido{preview.length !== 1 ? 's' : ''} em "{arquivo?.name}"
          </p>
          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e0d8', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Patrick Hand', cursive", fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f3f4f6', position: 'sticky', top: 0 }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid #e5e0d8' }}>SKU</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid #e5e0d8' }}>Nome</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid #e5e0d8' }}>Qtd</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid #e5e0d8' }}>Validade</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '4px 8px', fontWeight: 600, color: '#2d5da1' }}>{item.sku}</td>
                    <td style={{ padding: '4px 8px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nome || '—'}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'center' }}>{item.quantidade}</td>
                    <td style={{ padding: '4px 8px' }}>
                      {new Date(item.dataValidade + 'T12:00:00').toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Erros */}
      {erros.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '13px', color: '#ef4444', marginBottom: '6px' }}>
            ⚠️ {erros.length} linha{erros.length !== 1 ? 's' : ''} ignorada{erros.length !== 1 ? 's' : ''}:
          </p>
          <ul style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '12px', color: '#6b7280', paddingLeft: '16px', margin: 0 }}>
            {erros.slice(0, 5).map((e, i) => (
              <li key={i}>{e.linha ? `Linha ${e.linha}: ` : ''}{e.motivo}</li>
            ))}
            {erros.length > 5 && <li>...e mais {erros.length - 5}</li>}
          </ul>
        </div>
      )}

      {/* Botões */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
        <button
          onClick={handleLimpar}
          style={{
            padding: '8px 16px',
            fontFamily: "'Patrick Hand', cursive",
            fontSize: '14px',
            background: '#fff',
            border: '2px solid #6b7280',
            borderRadius: '15px 225px 15px 255px / 225px 15px 255px 15px',
            boxShadow: '3px 3px 0px 0px #6b7280',
            cursor: 'pointer',
          }}
        >
          Limpar
        </button>

        {preview.length > 0 && (
          <button
            onClick={handleEnviar}
            disabled={enviando}
            style={{
              padding: '8px 20px',
              fontFamily: "'Kalam', cursive",
              fontSize: '15px',
              fontWeight: 700,
              background: enviando ? '#e5e0d8' : '#fff',
              border: '3px solid #2d5da1',
              borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
              boxShadow: '4px 4px 0px 0px #2d5da1',
              cursor: enviando ? 'not-allowed' : 'pointer',
              color: '#2d5da1',
            }}
          >
            {enviando ? '⏳ Importando...' : `📥 Importar ${preview.length} itens`}
          </button>
        )}
      </div>
    </div>
  );
}
