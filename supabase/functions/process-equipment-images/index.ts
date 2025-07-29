import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para encontrar equipamento por matching
function findEquipmentMatch(filename: string, equipments: any[]) {
  const normalizedFilename = filename.toLowerCase().replace(/\.(jpg|jpeg|png|webp)$/i, '')
  
  // Tentar match por patrimônio
  const patrimonioMatch = normalizedFilename.match(/(?:pat|patrimonio|patrimônio)[-_]?(\w+)/i)
  if (patrimonioMatch) {
    const patrimonio = patrimonioMatch[1]
    const match = equipments.find(eq => 
      eq.patrimony_number?.toLowerCase().includes(patrimonio.toLowerCase())
    )
    if (match) return { equipment: match, confidence: 0.9, method: 'patrimonio' }
  }
  
  // Tentar match por serial
  const serialMatch = normalizedFilename.match(/(?:sn|serial)[-_]?(\w+)/i)
  if (serialMatch) {
    const serial = serialMatch[1]
    const match = equipments.find(eq => 
      eq.serial_number?.toLowerCase().includes(serial.toLowerCase())
    )
    if (match) return { equipment: match, confidence: 0.9, method: 'serial' }
  }
  
  // Match por nome exato
  const exactMatch = equipments.find(eq => 
    normalizedFilename.includes(eq.name.toLowerCase()) ||
    eq.name.toLowerCase().includes(normalizedFilename)
  )
  if (exactMatch) return { equipment: exactMatch, confidence: 0.8, method: 'nome_exato' }
  
  // Match fuzzy por nome (parcial)
  const fuzzyMatches = equipments.filter(eq => {
    const words = normalizedFilename.split(/[-_\s]+/)
    const equipmentWords = eq.name.toLowerCase().split(/\s+/)
    return words.some(word => 
      word.length > 2 && equipmentWords.some(eqWord => 
        eqWord.includes(word) || word.includes(eqWord)
      )
    )
  })
  
  if (fuzzyMatches.length === 1) {
    return { equipment: fuzzyMatches[0], confidence: 0.6, method: 'nome_fuzzy' }
  }
  
  return null
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { images } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar todos os equipamentos
    const { data: equipments, error: equipmentError } = await supabase
      .from('equipments')
      .select('*')
    
    if (equipmentError) {
      throw new Error(`Erro ao buscar equipamentos: ${equipmentError.message}`)
    }

    const results = []
    
    for (const image of images) {
      const { filename, fileData } = image
      
      try {
        // Converter base64 para Uint8Array
        const base64Data = fileData.split(',')[1]
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
        
        // Tentar encontrar match
        const match = findEquipmentMatch(filename, equipments)
        
        if (match && match.confidence >= 0.8) {
          // Upload automático para equipamentos com alta confiança
          const fileExt = filename.split('.').pop()
          const filePath = `${match.equipment.id}.${fileExt}`
          
          const { error: uploadError } = await supabase.storage
            .from('equipment-images')
            .upload(filePath, binaryData, {
              contentType: `image/${fileExt}`,
              upsert: true
            })
          
          if (uploadError) {
            results.push({
              filename,
              status: 'error',
              error: uploadError.message,
              match: null
            })
            continue
          }
          
          // Atualizar URL da imagem no equipamento
          const { data: { publicUrl } } = supabase.storage
            .from('equipment-images')
            .getPublicUrl(filePath)
          
          const { error: updateError } = await supabase
            .from('equipments')
            .update({ image: publicUrl })
            .eq('id', match.equipment.id)
          
          if (updateError) {
            console.error('Erro ao atualizar equipamento:', updateError)
          }
          
          results.push({
            filename,
            status: 'success',
            equipmentId: match.equipment.id,
            equipmentName: match.equipment.name,
            confidence: match.confidence,
            method: match.method,
            imageUrl: publicUrl
          })
        } else {
          // Não foi possível fazer match automático
          results.push({
            filename,
            status: 'pending_manual',
            possibleMatches: match ? [match] : [],
            imageData: fileData // Manter para seleção manual
          })
        }
      } catch (error) {
        results.push({
          filename,
          status: 'error',
          error: error.message,
          match: null
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        results,
        summary: {
          total: images.length,
          success: results.filter(r => r.status === 'success').length,
          pending: results.filter(r => r.status === 'pending_manual').length,
          errors: results.filter(r => r.status === 'error').length
        }
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in process-equipment-images function:', error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})