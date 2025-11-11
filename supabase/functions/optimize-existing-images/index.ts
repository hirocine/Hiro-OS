import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OptimizationResult {
  total_equipments: number;
  updated: number;
  already_optimized: number;
  errors: number;
  error_details: Array<{ equipment_id: string; error: string }>;
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
      total_equipments: 0,
      updated: 0,
      already_optimized: 0,
      errors: 0,
      error_details: []
    };

    // 1. Buscar todos os equipamentos com imagens
    console.log('🔍 Buscando equipamentos com imagens...');
    const { data: equipments, error: fetchError } = await supabase
      .from('equipments')
      .select('id, image')
      .not('image', 'is', null);

    if (fetchError) throw fetchError;
    if (!equipments || equipments.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Nenhum equipamento com imagem encontrado', result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    result.total_equipments = equipments.length;
    console.log(`📦 Total de equipamentos com imagem: ${equipments.length}`);

    // 2. Processar cada equipamento
    for (const equipment of equipments) {
      try {
        const currentUrl = equipment.image;
        
        // Verificar se já tem parâmetros de transformação
        if (currentUrl.includes('?format=webp') || currentUrl.includes('&format=webp')) {
          result.already_optimized++;
          console.log(`⏭️ Já otimizado: ${equipment.id}`);
          continue;
        }

        // Adicionar parâmetros de transformação do Supabase
        const optimizedUrl = `${currentUrl}?format=webp&quality=85&width=1920`;

        // Atualizar URL no banco
        const { error: updateError } = await supabase
          .from('equipments')
          .update({ image: optimizedUrl })
          .eq('id', equipment.id);

        if (updateError) throw updateError;

        result.updated++;
        console.log(`✅ Atualizado: ${equipment.id}`);

      } catch (error) {
        result.errors++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.error_details.push({ equipment_id: equipment.id, error: errorMsg });
        console.error(`❌ Erro ao processar ${equipment.id}:`, errorMsg);
      }
    }

    console.log(`
🎉 OTIMIZAÇÃO CONCLUÍDA!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Total de equipamentos: ${result.total_equipments}
✅ URLs atualizadas: ${result.updated}
🎯 Já otimizadas: ${result.already_optimized}
❌ Erros: ${result.errors}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 As imagens agora são servidas automaticamente
   como WebP otimizado pelo Supabase!
    `);

    return new Response(
      JSON.stringify({
        message: 'Otimização concluída com sucesso!',
        result
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
