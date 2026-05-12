/**
 * ════════════════════════════════════════════════════════════════
 * zapsign-webhook — ingest ZapSign events into public.contracts
 * ════════════════════════════════════════════════════════════════
 *
 * ZapSign é a "source of truth" pros documentos. Toda criação,
 * envio, assinatura, recusa e expiração vira evento aqui — nós só
 * espelhamos.
 *
 * Eventos esperados (ZapSign v2):
 *   - doc_created       → linha nova em draft / awaiting_internal
 *   - doc_signed        → um signer assinou (atualiza array signers)
 *   - auto_finished     → todos assinaram (status = signed + PDF url)
 *   - doc_refused       → alguém recusou → status = refused
 *   - doc_deleted       → status = cancelled
 *   - auto_expiration   → status = expired
 *
 * Segurança:
 *   - Webhook é público (ZapSign chama de fora) mas exige header
 *     `Authorization: Bearer <ZAPSIGN_WEBHOOK_SECRET>` configurado
 *     na config do webhook lá. Se não bater → 401.
 *   - Usa service_role pra escrever (a tabela só tem policy de
 *     SELECT/UPDATE com has_permission — INSERT é via service_role
 *     only, exatamente como queremos).
 *
 * Idempotência:
 *   - Upsert por `zapsign_doc_token` (UNIQUE). Webhook duplicado é
 *     no-op semântico.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── Types (subset of ZapSign payload we actually use) ──────────
interface ZapSignSigner {
  token: string;
  name: string;
  email: string;
  status?: string; // "new" | "link-opened" | "signed" | "refused" | "deleted"
  times_viewed?: number;
  last_view_at?: string | null;
  signed_at?: string | null;
  refused_at?: string | null;
}

interface ZapSignPayload {
  event_type?: string;
  // Some events nest doc; some send fields at root. Handle both.
  open_id?: number;
  token?: string;
  name?: string;
  status?: string;
  signed_file?: string | null;
  original_file?: string | null;
  created_at?: string;
  last_update_at?: string;
  sent_at?: string | null;
  expires_at?: string | null;
  signers?: ZapSignSigner[];
  description?: string | null;
  // some events wrap the doc:
  doc?: ZapSignPayload;
}

function pickDoc(payload: ZapSignPayload): ZapSignPayload {
  // Some ZapSign events deliver the doc at root, some under .doc
  return payload.doc ?? payload;
}

/** Map ZapSign doc-level status → our ContractStatus. */
function mapStatus(
  zStatus: string | undefined,
  signers: ZapSignSigner[] | undefined,
): string {
  const s = (zStatus ?? "").toLowerCase();
  if (s === "signed" || s === "finished") return "signed";
  if (s === "refused") return "refused";
  if (s === "expired") return "expired";
  if (s === "deleted" || s === "cancelled" || s === "canceled") return "cancelled";

  // Pending — figure out if waiting on internal or client
  if (signers && signers.length > 0) {
    const internalUnsigned = signers.find(
      (sg) =>
        !sg.signed_at &&
        !sg.refused_at &&
        // Heuristic: emails on our domain are "internal"
        sg.email?.toLowerCase().endsWith("@hiro.film"),
    );
    if (internalUnsigned) return "awaiting_internal";

    const someoneSigned = signers.some((sg) => !!sg.signed_at);
    if (someoneSigned) return "awaiting_client";
  }

  if (s === "pending" || s === "running") return "awaiting_internal";
  return "draft";
}

/** Normalize signers array; preserve order via `position`. */
function normalizeSigners(signers: ZapSignSigner[] | undefined) {
  if (!signers) return [];
  return signers.map((s, i) => ({
    zapsign_token: s.token,
    name: s.name,
    email: s.email,
    role: s.email?.toLowerCase().endsWith("@hiro.film")
      ? "internal"
      : "external",
    position: i + 1,
    signed_at: s.signed_at ?? null,
    refused_at: s.refused_at ?? null,
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ─── Auth (shared secret) ─────────────────────────────────────
  const expectedSecret = Deno.env.get("ZAPSIGN_WEBHOOK_SECRET");
  if (!expectedSecret) {
    return new Response(
      JSON.stringify({ error: "ZAPSIGN_WEBHOOK_SECRET not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  if (token !== expectedSecret) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ─── Parse payload ────────────────────────────────────────────
  let payload: ZapSignPayload;
  try {
    payload = await req.json();
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const eventType = payload.event_type ?? "";
  const doc = pickDoc(payload);

  if (!doc.token) {
    return new Response(
      JSON.stringify({ error: "Missing doc token in payload", event_type: eventType }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const normalizedSigners = normalizeSigners(doc.signers);
  const status = mapStatus(doc.status, doc.signers);

  // ─── Build the upsert row ─────────────────────────────────────
  // We only touch ZapSign-mirror fields. Hiro-side enrichment
  // (linked_*, notes, contract_class, recurrence) stays untouched
  // on update — handled via the app.
  const docToken = doc.token;
  const zapsignDocUrl = `https://app.zapsign.com.br/verificar/${docToken}`;

  const isCompletion =
    eventType === "auto_finished" || status === "signed";

  const baseRow = {
    zapsign_doc_token: docToken,
    title: doc.name ?? "Sem título",
    status,
    party_type: "other", // user reclassifies in-app
    zapsign_description: doc.description ?? null,
    zapsign_doc_url: zapsignDocUrl,
    signed_pdf_url: doc.signed_file ?? null,
    zapsign_created_at: doc.created_at ?? new Date().toISOString(),
    sent_at: doc.sent_at ?? null,
    completed_at: isCompletion
      ? doc.last_update_at ?? new Date().toISOString()
      : null,
    expires_at: doc.expires_at ?? null,
    signers: normalizedSigners,
    updated_at: new Date().toISOString(),
  };

  // Upsert by zapsign_doc_token (UNIQUE). On insert, defaults fill
  // contract_class='project', recurrence=null, linked_*=null.
  const { error: upsertErr } = await supabase
    .from("contracts")
    .upsert(baseRow, { onConflict: "zapsign_doc_token" });

  if (upsertErr) {
    console.error("[zapsign-webhook] upsert failed:", upsertErr);
    return new Response(
      JSON.stringify({ error: upsertErr.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      event_type: eventType,
      doc_token: docToken,
      mapped_status: status,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
