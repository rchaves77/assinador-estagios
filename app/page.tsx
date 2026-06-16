'use client';

import { useState } from 'react';

export default function PaginaAluno() {
  const [nome, setNome] = useState('');
  const [matricula, setMatricula] = useState('');
  const [curso, setCurso] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<{ id: string; pin: string } | null>(null);
  const [erro, setErro] = useState('');

  const handleEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arquivo) return setErro('Por favor, selecione o arquivo PDF do termo.');

    setCarregando(true);
    setErro('');

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('matricula', matricula);
    formData.append('curso', curso);
    formData.append('file', arquivo);

    try {
      const resposta = await fetch('/api/aluno/enviar', {
        method: 'POST',
        body: formData,
      });

      const dados = await resposta.json();

      if (!resposta.ok) throw new Error(dados.error || 'Erro ao enviar.');

      setResultado({ id: dados.id, pin: dados.pin });
      // Limpa o formulário
      setNome('');
      setMatricula('');
      setCurso('');
      setArquivo(null);
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">
          Envio de Termo de Estágio
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Preencha os dados abaixo para enviar o seu termo para avaliação.
        </p>

        {resultado ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-5 text-center">
            <h3 className="text-lg font-semibold text-green-800 mb-2">¡Termo Enviado!</h3>
            <p className="text-sm text-green-700 mb-4">
              Guarde os dados abaixo para consultar o status da assinatura depois:
            </p>
            <div className="bg-white border rounded p-3 font-mono text-sm text-gray-700 shadow-sm">
              <p><strong>ID:</strong> {resultado.id}</p>
              <p><strong>PIN de Acesso:</strong> {resultado.pin}</p>
            </div>
            <button
              onClick={() => setResultado(null)}
              className="mt-5 text-sm text-green-600 hover:underline font-medium"
            >
              Enviar outro termo
            </button>
          </div>
        ) : (
          <form onSubmit={handleEnvio} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula</label>
              <input
                type="text"
                required
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
              <input
                type="text"
                required
                value={curso}
                onChange={(e) => setCurso(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Termo de Estágio (PDF)</label>
              <input
                type="file"
                required
                accept="application/pdf"
                onChange={(e) => setArquivo(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {erro && <p className="text-sm text-red-600 font-medium">{erro}</p>}

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200 disabled:bg-gray-400"
            >
              {carregando ? 'Enviando...' : 'Enviar para Avaliação'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
