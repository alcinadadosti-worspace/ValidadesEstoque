import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

// Upload em lote de planilhas XLSX ou CSV com preview antes de salvar
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
        const workbook = XLSX.read(e.target.result, { type: 'binary', cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const linhas = XLSX.utils.sheet_to_json(sheet, { raw: false });

        const validos = [];
        const invalidos = [];

        linhas.forEach((linha, idx) => {
          const sku = String(
            linha.SKU || linha.sku || linha['Código'] || linha['codigo'] || ''
          ).trim();
          const dataRaw =
            linha.DataValidade ||
            linha.dataValidade ||
            linha['Data Validade'] ||
            linha['Data de Validade'] ||
            '';

          if (!sku || !dataRaw) {
            invalidos.push({ linha: idx + 2, motivo: 'SKU ou data ausente' });
            return;
          }

          const data = new Date(dataRaw);
          if (isNaN(data.getTime())) {
            invalidos.push({ linha: idx + 2, sku, motivo: `Data inválida: ${dataRaw}` });
            return;
          }

          validos.push({ sku, dataValidade: data.toISOString().split('T')[0] });
        });

        setPreview(validos);
        setErros(invalidos);
      } catch (err) {
        setErros([{ motivo: 'Arquivo inválido ou corrompido. Use XLSX ou CSV.' }]);
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
    if (preview.length > 0) {
      onUpload(preview);
    }
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
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            fontFamily: "'Patrick Hand', cursive",
          }}
        >
          ✕
        </button>
      </div>

      <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
        A planilha deve ter colunas <strong>SKU</strong> e <strong>DataValidade</strong> (formato dd/mm/yyyy ou yyyy-mm-dd).
      </p>

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

      {/* Preview dos dados lidos */}
      {preview.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '14px', color: '#16a34a', marginBottom: '8px' }}>
            ✅ {preview.length} registro{preview.length !== 1 ? 's' : ''} válido{preview.length !== 1 ? 's' : ''} encontrado{preview.length !== 1 ? 's' : ''}
            {arquivo && ` em "${arquivo.name}"`}
          </p>

          <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #e5e0d8', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Patrick Hand', cursive", fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid #e5e0d8' }}>SKU</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid #e5e0d8' }}>Data de Validade</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '4px 10px', fontWeight: 600 }}>{item.sku}</td>
                    <td style={{ padding: '4px 10px' }}>
                      {new Date(item.dataValidade + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Erros de validação */}
      {erros.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <p style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '14px', color: '#ef4444', marginBottom: '6px' }}>
            ⚠️ {erros.length} linha{erros.length !== 1 ? 's' : ''} com problema:
          </p>
          <ul style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '12px', color: '#6b7280', paddingLeft: '16px' }}>
            {erros.slice(0, 5).map((e, i) => (
              <li key={i}>
                {e.linha ? `Linha ${e.linha}: ` : ''}{e.motivo}
              </li>
            ))}
            {erros.length > 5 && <li>... e mais {erros.length - 5} erros.</li>}
          </ul>
        </div>
      )}

      {/* Botões de ação */}
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
