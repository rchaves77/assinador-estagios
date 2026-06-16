import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(request: Request) {
  try {
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const acao = formData.get('acao') as 'assinado' | 'recusado';
    const file = formData.get('file') as File; 
    const motivoRecusa = formData.get('motivo_recusa') as string;

    if (!id || !acao) {
      return NextResponse.json({ error: 'Dados insuficientes.' }, { status: 400 });
    }

    if (acao === 'recusado') {
      const { error } = await supabase
        .from('termos_estagio')
        .update({ status: 'recusado', motivo_recusa: motivoRecusa })
        .eq('id', id);
        
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (acao === 'assinado') {
      if (!file) return NextResponse.json({ error: 'Arquivo assinado é obrigatório.' }, { status: 400 });

      // Upload do arquivo assinado
      const fileName = `assinado_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const { error: storageError } = await supabase.storage
        .from('termos')
        .upload(`assinados/${fileName}`, file);

      if (storageError) throw storageError;

      const { data: { publicUrl } } = supabase.storage.from('termos').getPublicUrl(`assinados/${fileName}`);

      // Atualizar status e injetar a URL assinada
      const { error: dbError } = await supabase
        .from('termos_estagio')
        .update({ status: 'assinado', url_assinado: publicUrl })
        .eq('id', id);

      if (dbError) throw dbError;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ação não reconhecida.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
