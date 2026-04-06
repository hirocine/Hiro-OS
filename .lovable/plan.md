

# Add 6 new tools to ai-assistant edge function

## Overview
Add tools for suppliers, policies, platform accesses, post-production queue, SSDs, and AV projects. Several column names in the proposed code don't match the actual database schema and need correction.

## Schema corrections needed

| Tool | Proposed | Actual |
|------|----------|--------|
| search_suppliers | `name, specialty, type, email, phone` | `full_name, primary_role, secondary_role, whatsapp, instagram` — no `is_active` filter needed (check if column exists) |
| search_policies | `is_active` filter | Column doesn't exist — remove filter |
| search_platform_accesses | `login_email, url` | `username, platform_url` — no `login_email` column |
| get_post_production_queue | `deadline` | `due_date` |
| get_ssds_status | `equipment_id, responsible_name, status` on ssd_allocations | `ssd_id, project_name, allocated_gb` — no responsible or status columns |
| search_av_projects | table `av_projects`, columns `title, client_name` | table `audiovisual_projects`, columns `name, company` |

## Changes in `supabase/functions/ai-assistant/index.ts`

### 1. Update SYSTEM_PROMPT links section (line ~34)
Add after existing links:
```
- Fornecedor: [LINK:/fornecedores]
- Política: [LINK:/politicas]
- Plataforma: [LINK:/plataformas]
- Esteira de Pós: [LINK:/pos-producao]
- Armazenamento/SSD: [LINK:/armazenamento]
- Projeto AV: [LINK:/projetos-av]
```

### 2. Add 6 tool definitions to the `tools` array
Add the 6 tools as specified by the user, with corrected descriptions where needed.

### 3. Add 6 tool implementations in `executeTool`
All corrected to match actual schema:

**search_suppliers**: Query `suppliers` table with `full_name, primary_role, secondary_role, whatsapp, daily_rate, expertise, is_active`. Filter by `full_name.ilike` and `primary_role.ilike`.

**search_policies**: Query `company_policies` with `title, category, content`. No `is_active` filter.

**search_platform_accesses**: Query `platform_accesses` with `platform_name, username, platform_url, category, is_active`. Never expose `encrypted_password`.

**get_post_production_queue**: Query `post_production_queue` with `title, status, editor_name, client_name, project_name, due_date, priority`. Use `due_date` not `deadline`.

**get_ssds_status**: Query `equipments` where `category = 'Armazenamento'` + client-side drive filter. Then query `ssd_allocations` with `ssd_id, project_name, allocated_gb` to show usage per SSD.

**search_av_projects**: Query `audiovisual_projects` with `id, name, company, status, deadline, responsible_user_name`. Use `name` and `company` for search.

### 4. Redeploy edge function

