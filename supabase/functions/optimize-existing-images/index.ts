import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OptimizationResult {
  total_found: number;
  processed: number;
  already_webp: number;
  errors: number;
  space_saved_bytes: number;
  error_details: Array<{ file: string; error: string }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const result: OptimizationResult = {
      total_found: 0,
      processed: 0,
      already_webp: 0,
      errors: 0,
      space_saved_bytes: 0,
      error_details: []
    };

    // 1. Listar todas as imagens do bucket
    console.log('🔍 Listando imagens do bucket equipment-images...');
    const { data: files, error: listError } = await supabase.storage
      .from('equipment-images')
      .list();

    if (listError) throw listError;
    if (!files || files.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Nenhuma imagem encontrada', result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    result.total_found = files.length;
    console.log(`📦 Total de arquivos encontrados: ${files.length}`);

    // 2. Filtrar apenas imagens não-WebP
    const nonWebpFiles = files.filter(file => {
      const ext = file.name.toLowerCase().split('.').pop();
      return ext !== 'webp';
    });

    console.log(`🎯 Imagens não-WebP para processar: ${nonWebpFiles.length}`);
    result.already_webp = files.length - nonWebpFiles.length;

    // 3. Processar cada imagem
    for (const file of nonWebpFiles) {
      try {
        console.log(`⚙️ Processando: ${file.name}`);
        
        // Download da imagem original
        const { data: downloadData, error: downloadError } = await supabase.storage
          .from('equipment-images')
          .download(file.name);

        if (downloadError) throw downloadError;

        const originalSize = downloadData.size;
        
        // Converter para base64 para processar
        const arrayBuffer = await downloadData.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        // Comprimir usando imagescript
        const optimizedBlob = await compressImageDeno(base64);
        
        // Nome do novo arquivo WebP
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        const newFileName = `${nameWithoutExt}.webp`;

        // Upload da versão otimizada
        const { error: uploadError } = await supabase.storage
          .from('equipment-images')
          .upload(newFileName, optimizedBlob, {
            contentType: 'image/webp',
            upsert: true
          });

        if (uploadError) throw uploadError;

        // Obter URLs públicas
        const { data: { publicUrl: newPublicUrl } } = supabase.storage
          .from('equipment-images')
          .getPublicUrl(newFileName);

        const { data: { publicUrl: oldPublicUrl } } = supabase.storage
          .from('equipment-images')
          .getPublicUrl(file.name);

        // Atualizar equipamentos que usam esta imagem
        const { error: updateError } = await supabase
          .from('equipments')
          .update({ image: newPublicUrl })
          .eq('image', oldPublicUrl);

        if (updateError) {
          console.warn(`⚠️ Erro ao atualizar equipments: ${updateError.message}`);
        }

        // Deletar arquivo antigo
        const { error: deleteError } = await supabase.storage
          .from('equipment-images')
          .remove([file.name]);

        if (deleteError) {
          console.warn(`⚠️ Erro ao deletar ${file.name}: ${deleteError.message}`);
        }

        const optimizedSize = optimizedBlob.size;
        result.space_saved_bytes += (originalSize - optimizedSize);
        result.processed++;

        console.log(`✅ ${file.name} → ${newFileName} (${(originalSize / 1024).toFixed(1)}KB → ${(optimizedSize / 1024).toFixed(1)}KB)`);

      } catch (error) {
        result.errors++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.error_details.push({ file: file.name, error: errorMsg });
        console.error(`❌ Erro ao processar ${file.name}:`, errorMsg);
      }
    }

    const spaceSavedMB = (result.space_saved_bytes / 1024 / 1024).toFixed(2);
    console.log(`
🎉 OTIMIZAÇÃO CONCLUÍDA!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Total encontrado: ${result.total_found}
✅ Processadas: ${result.processed}
🎯 Já WebP: ${result.already_webp}
❌ Erros: ${result.errors}
💾 Espaço economizado: ${spaceSavedMB} MB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

    return new Response(
      JSON.stringify({
        message: 'Otimização concluída com sucesso!',
        result: {
          ...result,
          space_saved_mb: parseFloat(spaceSavedMB)
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

// Função auxiliar para comprimir imagem usando imagescript (Deno)
async function compressImageDeno(base64Data: string): Promise<Blob> {
  // Importar imagescript para Deno
  const { Image } = await import("https://deno.land/x/imagescript@1.2.15/mod.ts");
  
  // Decodificar base64
  const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  
  // Carregar imagem
  const image = await Image.decode(binaryData);
  
  // Calcular novas dimensões (max 1920x1920)
  const maxSize = 1920;
  let width = image.width;
  let height = image.height;
  
  if (width > maxSize || height > maxSize) {
    if (width > height) {
      height = Math.round((height * maxSize) / width);
      width = maxSize;
    } else {
      width = Math.round((width * maxSize) / height);
      height = maxSize;
    }
  }
  
  // Redimensionar
  const resized = image.resize(width, height);
  
  // Codificar para WebP (quality 85)
  const encoded = await resized.encodeWebP(85);
  
  return new Blob([encoded], { type: 'image/webp' });
}
