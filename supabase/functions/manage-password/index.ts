import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, password, encryptedPassword } = await req.json();

    // Require the encryption key to be configured. No more hardcoded fallback —
    // if PASSWORD_ENCRYPTION_KEY isn't set, fail loudly instead of silently
    // using a key that's checked into the public repo.
    const encryptionKey = Deno.env.get('PASSWORD_ENCRYPTION_KEY');
    if (!encryptionKey) {
      console.error('PASSWORD_ENCRYPTION_KEY env var is not configured');
      return new Response(
        JSON.stringify({ error: 'Server misconfigured: encryption key missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'encrypt') {
      // Encrypt password using Web Crypto API
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      
      // Import key for AES-GCM encryption
      const keyData = encoder.encode(encryptionKey.padEnd(32, '0').slice(0, 32));
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      // Combine IV + encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      // Base64 encode
      const base64 = btoa(String.fromCharCode(...combined));

      console.log('Password encrypted successfully for user:', user.id);

      return new Response(
        JSON.stringify({ encrypted: base64 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'decrypt') {
      // Decrypt password
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();

      // Decode base64
      const combined = Uint8Array.from(atob(encryptedPassword), c => c.charCodeAt(0));
      
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const keyData = encoder.encode(encryptionKey.padEnd(32, '0').slice(0, 32));
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );

      const decryptedPassword = decoder.decode(decrypted);

      // Log audit entry
      await supabase.rpc('log_audit_entry', {
        _action: 'decrypt_password',
        _table_name: 'platform_accesses',
        _record_id: null,
        _old_values: null,
        _new_values: { 
          timestamp: new Date().toISOString(),
          user_id: user.id 
        }
      });

      console.log('Password decrypted successfully for user:', user.id);

      return new Response(
        JSON.stringify({ password: decryptedPassword }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action. Use "encrypt" or "decrypt"');

  } catch (error) {
    console.error('Error in manage-password:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
