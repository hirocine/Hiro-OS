-- Clean up orphaned functions that referenced the old columns
DROP FUNCTION IF EXISTS public.auto_fill_contribution_margin_pct() CASCADE;
DROP FUNCTION IF EXISTS public.auto_fill_contribution_margin_value() CASCADE;
DROP FUNCTION IF EXISTS public.auto_fill_net_profit_value() CASCADE;
DROP FUNCTION IF EXISTS public.auto_fill_snapshot_revenue_goal() CASCADE;
DROP FUNCTION IF EXISTS public.sync_current_balance_to_projections() CASCADE;