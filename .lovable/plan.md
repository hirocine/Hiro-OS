

# Fix auth in ai-proposal-assistant edge function

## Problem
`supabase.auth.getClaims(token)` doesn't exist in the Supabase JS client, causing a 401 error.

## Change

**File: `supabase/functions/ai-proposal-assistant/index.ts`**

Replace lines 124-132 (the `getClaims` block):
```typescript
const token = authHeader.replace("Bearer ", "");
const { data: claimsData, error: claimsError } =
  await supabase.auth.getClaims(token);
if (claimsError || !claimsData?.claims) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

With:
```typescript
const { data: userData, error: userError } = await supabase.auth.getUser();
if (userError || !userData?.user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

No other files changed. Edge function will be redeployed automatically.

