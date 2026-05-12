/**
 * ════════════════════════════════════════════════════════════════
 * CONTRACTS — types
 * ════════════════════════════════════════════════════════════════
 *
 * Hiro tracks a *mirror* of contracts that live in ZapSign. We never
 * create signature-bearing documents inside Hiro — the user does that
 * in ZapSign (where templates, signer ordering and field placement
 * already work well). ZapSign pings our webhook on every event, and
 * the rows here update to match.
 *
 * The fields below split naturally into two groups:
 *
 *   1. Mirror of ZapSign state (read-only from Hiro's POV)
 *      - title, status, signers, created_at, ZapSign IDs and URLs
 *   2. Hiro-local enrichment
 *      - linked_client_id, linked_project_id, linked_supplier_id, tags
 *
 * When a webhook arrives for a doc we haven't seen, we create a row
 * with `linked_client_id` etc. null — that's the "Aguardando
 * vinculação" bucket. One quick form per contract resolves it.
 */

/** Lifecycle status reflected from ZapSign + a couple Hiro-only ones. */
export type ContractStatus =
  | 'draft'              // created in ZapSign but not yet sent for signing
  | 'awaiting_internal'  // sent, waiting on someone from our company (signer #1)
  | 'awaiting_client'    // we signed, waiting on client (next signer)
  | 'signed'             // everyone signed; PDF certificate available
  | 'refused'            // someone refused
  | 'expired'            // ZapSign expired the doc
  | 'cancelled';         // doc cancelled in ZapSign

/** Who the other party is. Drives where in Hiro it gets linked. */
export type ContractPartyType =
  | 'client'      // B2B service contract — links to CRM contact + project
  | 'freelancer' // freelancer/PJ — links to fornecedores.freelancers
  | 'company'    // empresa contratada — links to fornecedores.empresas
  | 'talent'     // image rights cession
  | 'nda'        // confidentiality
  | 'other';

/** Per-signer state inside a contract. */
export interface ContractSigner {
  /** ZapSign signer token. */
  zapsign_token: string;
  name: string;
  email: string;
  /** 'internal' means someone from our company; 'external' the other party. */
  role: 'internal' | 'external';
  /** Signing order — ZapSign sends emails one at a time. */
  position: number;
  signed_at: string | null;
  refused_at: string | null;
}

export interface Contract {
  id: string;

  // ─── Mirror of ZapSign ──────────────────────────────────────────
  zapsign_doc_token: string;
  title: string;
  status: ContractStatus;
  party_type: ContractPartyType;
  signers: ContractSigner[];

  /** Free-text from ZapSign (extra context / sometimes used for tags). */
  zapsign_description: string | null;

  created_at: string;
  /** When the doc was sent to signers — null if still draft. */
  sent_at: string | null;
  /** When the last signer signed. */
  completed_at: string | null;
  /** ZapSign-side expiration (rare; we mostly leave it null). */
  expires_at: string | null;

  /** Where to open the doc in ZapSign UI. */
  zapsign_doc_url: string;
  /** Direct download of the signed PDF with certificate (filled when status === 'signed'). */
  signed_pdf_url: string | null;

  // ─── Hiro-local enrichment ──────────────────────────────────────
  /** When set, contract shows up linked to a CRM contact (B2B clients). */
  linked_client_id: string | null;
  linked_client_name: string | null;

  /** When set, contract shows up under a specific AV project. */
  linked_project_id: string | null;
  linked_project_name: string | null;

  /** Fornecedor (PF freelancer or PJ empresa) — only one of these is set. */
  linked_supplier_id: string | null;
  linked_supplier_name: string | null;

  /** Optional monetary value of the contract (purely informational). */
  value_brl: number | null;

  /** When the linkage was done. Null means it's in the "Aguardando vinculação" bucket. */
  linked_at: string | null;

  /** Free notes the team adds inside Hiro. */
  notes: string | null;

  /** When the row first arrived from ZapSign. */
  imported_at: string;
}

export type ContractTab =
  | 'unlinked'  // needs to be linked to project/client (highlighted bucket)
  | 'in_progress' // anything still awaiting signature (draft / awaiting_internal / awaiting_client)
  | 'signed'
  | 'archived'  // refused / expired / cancelled
  | 'all';

export type ContractStatusFilter = ContractStatus | 'all';
export type ContractPartyFilter = ContractPartyType | 'all';
