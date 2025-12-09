import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Get the authorization header to verify the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a client with the user's token to verify they are admin
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the calling user
    const { data: { user: callingUser }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !callingUser) {
      console.error('Error getting calling user:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if calling user is admin using the has_role function
    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc('has_role', {
      _user_id: callingUser.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      console.error('User is not admin:', roleError);
      return new Response(
        JSON.stringify({ error: 'Only administrators can manage users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { userId, displayName, position, department, role } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Managing user:', { userId, displayName, position, department, role });

    // Prevent admin from changing their own role
    if (role && userId === callingUser.id) {
      return new Response(
        JSON.stringify({ error: 'You cannot change your own role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update profile data
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        display_name: displayName,
        position: position,
        department: department,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to update profile: ' + profileError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update role if provided
    if (role) {
      const { error: roleUpdateError } = await supabaseAdmin
        .from('user_roles')
        .update({ 
          role: role,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (roleUpdateError) {
        console.error('Error updating role:', roleUpdateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update role: ' + roleUpdateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Log the action in audit_logs
    await supabaseAdmin.rpc('log_audit_entry', {
      _action: 'update_user',
      _table_name: 'profiles',
      _record_id: userId,
      _old_values: null,
      _new_values: { displayName, position, department, role }
    });

    console.log('User updated successfully:', userId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User updated successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in manage-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
