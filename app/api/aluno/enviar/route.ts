import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const nome = formData.get('nome') as string;
    const matricula = formData.get('matricula') as string;
    const curso = formData.get('curso') as string;

    if (!file || !nome || !matricula || !curso) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 });
    }

    // 1. Upload do PDF original para o Storage
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const { error: storageError } = await supabase.storage
      .from('termos')
      .upload(`originais/${fileName}`, file);

    if (storageError) throw storageError;

    // Pegar a URL pública do arquivo
    const { data: { publicUrl } } = supabase.storage.from('termos').getPublicUrl(`originais/${fileName}`);

    // 2. Gerar um PIN numérico de 6 dígitos
    const pinAcesso = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Salvar o registro no banco de dados
    const { data: dbData, error: dbError } = await supabase
      .from('termos_estagio')
      .insert([{
        nome_aluno: nome,
        matricula,
        curso,
        url_original: publicUrl,
        pin_acesso: pinAcesso,
        status: 'pendente'
      }])
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ 
      success: true, 
      id: dbData.id, 
      pin: pinAcesso 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
