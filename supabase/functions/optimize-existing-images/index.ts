import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function unauthorized() {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function forbidden() {
  return new Response(
    JSON.stringify({ error: 'Forbidden: admin role required' }),
    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Admin-only gate. This function bulk-rewrites image URLs across the entire
// equipments table — must NOT be accessible to anon, regular users, or even
// non-admin team members. Service role (env key or JWT) is accepted because
// the function may be triggered from a maintenance script.
async function requireAdmin(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return unauthorized();
  const token = authHeader.replace(/^Bearer\s+/i, '');

  const envServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (envServiceRole && token === envServiceRole) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
    if (payload.role === 'service_role') return null;
  } catch { /* not a JWT */ }

  const anon = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );
  const { data: { user } } = await anon.auth.getUser(token);
  if (!user) return unauthorized();

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  const { data: roles } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  const isAdmin = (roles ?? []).some((r) => r.role === 'admin');
  if (!isAdmin) return forbidden();

  return null;
}

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

  const authFail = await requireAdmin(req);
  if (authFail) return authFail;

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
