'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PainelAdmin() {
  const [termos, setTermos] = useState<any[]>([]);
  const [selecionado, setSelecionado] = useState<any>(null);
  const [motivoRecusa, setMotivoRecusa] = useState('');
  const [arquivoAssinado, setArquivoAssinado] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Buscar termos vindos do Supabase
  const buscarTermos = async () => {
    const { data, error } = await supabase
      .from('termos_estagio')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) setTermos(data);
  };

  useEffect(() => {
    buscarTermos();
  }, []);

  const atualizarStatus = async (acao: 'assinado' | 'recusado') => {
    if (!selecionado) return;
    setEnviando(true);

    const formData = new FormData();
    formData.append('id', selecionado.id);
    formData.append('acao', acao);
    if (acao === 'recusado') formData.append('motivo_recusa', motivoRecusa);
    if (acao === 'assinado' && arquivoAssinado) formData.append('file', arquivoAssinado);

    try {
      const res = await fetch('/api/admin/atualizar', { method: 'PUT', body: formData });
      if (res.ok) {
        setSelecionado(null);
        setMotivoRecusa('');
        setArquivoAssinado(null);
        buscarTermos();
      } else {
        alert('Erro ao atualizar termo.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Painel de Revisão de Estágios</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tabela de Alunos */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow p-4 border border-gray-200 overflow-y-auto max-h-[750px]">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Solicitações</h2>
            <div className="space-y-3">
              {termos.map((t) => (
                <div 
                  key={t.id}
                  onClick={() => setSelecionado(t)}
                  className={`p-3 rounded-lg border cursor-pointer transition ${selecionado?.id === t.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <p className="font-medium text-gray-900">{t.nome_aluno}</p>
                  <p className="text-xs text-gray-500">Matrícula: {t.matricula} | {t.curso}</p>
                  <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-semibold ${t.status === 'pendente' ? 'bg-amber-100 text-amber-800' : t.status === 'assinado' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {t.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Área de Avaliação e PDF */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow p-6 border border-gray-200 flex flex-col">
            {selecionado ? (
              <div className="flex flex-col h-full space-y-4">
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{selecionado.nome_aluno}</h2>
                    <p className="text-sm text-gray-600">Curso: {selecionado.curso} | Status: <strong className="text-blue-600">{selecionado.status}</strong></p>
                  </div>
                  <a 
                    href={selecionado.url_original} 
                    target="_blank" 
                    className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded font-medium transition"
                  >
                    Abrir original em nova aba
                  </a>
                </div>

                {/* Iframe que exibe o PDF na tela sem baixar */}
                <div className="w-full h-[450px] border border-gray-300 rounded-lg bg-gray-50 overflow-hidden">
                  <iframe src={`${selecionado.url_original}#toolbar=1`} className="w-full h-full" />
                </div>

                {selecionado.status === 'pendente' && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                    <h3 className="font-semibold text-gray-700">Ações de Avaliação:</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {/* Subir Assinado */}
                      <div className="border p-3 rounded bg-white space-y-2">
                        <label className="block text-xs font-bold text-gray-600 uppercase">1. Aprovar e Subir Assinado</label>
                        <input 
                          type="file" 
                          accept="application/pdf"
                          onChange={(e) => setArquivoAssinado(e.target.files?.[0] || null)}
                          className="w-full text-xs"
                        />
                        <button
                          disabled={!arquivoAssinado || enviando}
                          onClick={() => atualizarStatus('assinado')}
                          className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-1.5 rounded disabled:bg-gray-300"
                        >
                          {enviando ? 'Processando...' : 'Finalizar como Assinado'}
                        </button>
                      </div>

                      {/* Recusar */}
                      <div className="border p-3 rounded bg-white space-y-2">
                        <label className="block text-xs font-bold text-gray-600 uppercase">Motivo da Recusa</label>
                        <input 
                          type="text" 
                          value={motivoRecusa}
                          onChange={(e) => setMotivoRecusa(e.target.value)}
                          placeholder="Ex: Falta assinatura da empresa"
                          className="w-full border rounded p-1 text-sm text-gray-800"
                        />
                        <button
                          disabled={!motivoRecusa || enviando}
                          onClick={() => atualizarStatus('recusated')}
                          className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-1.5 rounded disabled:bg-gray-300"
                        >
                          Recusar Termo
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[500px] text-gray-400">
                <p className="text-lg">Selecione um aluno na lista ao lado para avaliar o termo.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
