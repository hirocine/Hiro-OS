-- Ensure net profit value is always revenue - costs
create or replace function public.auto_fill_net_profit_value()
returns trigger
language plpgsql
as $$
begin
  new.net_profit_value := coalesce(new.revenue, 0) - coalesce(new.costs, 0);
  return new;
end;
$$;

-- Ensure net profit pct is always (net_profit_value / revenue) * 100
create or replace function public.auto_fill_net_profit_pct()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.revenue, 0) > 0 then
    new.net_profit_pct := round((coalesce(new.net_profit_value, 0) / new.revenue) * 100, 2);
  else
    new.net_profit_pct := 0;
  end if;
  return new;
end;
$$;

-- Recreate triggers with deterministic execution order (value first, pct second)
drop trigger if exists trg_10_auto_fill_net_profit_value on public.financial_snapshots;
drop trigger if exists trg_20_auto_fill_net_profit_pct on public.financial_snapshots;
drop trigger if exists trg_auto_fill_net_profit_value on public.financial_snapshots;
drop trigger if exists trg_auto_fill_net_profit_pct on public.financial_snapshots;

create trigger trg_10_auto_fill_net_profit_value
before insert or update of revenue, costs
on public.financial_snapshots
for each row
execute function public.auto_fill_net_profit_value();

create trigger trg_20_auto_fill_net_profit_pct
before insert or update of revenue, costs, net_profit_value
on public.financial_snapshots
for each row
execute function public.auto_fill_net_profit_pct();

-- Recalculate existing rows to fix historical incorrect percentages
update public.financial_snapshots
set
  net_profit_value = coalesce(revenue, 0) - coalesce(costs, 0),
  net_profit_pct = case
    when coalesce(revenue, 0) > 0 then round(((coalesce(revenue, 0) - coalesce(costs, 0)) / revenue) * 100, 2)
    else 0
  end
where
  net_profit_value is distinct from (coalesce(revenue, 0) - coalesce(costs, 0))
  or net_profit_pct is distinct from case
    when coalesce(revenue, 0) > 0 then round(((coalesce(revenue, 0) - coalesce(costs, 0)) / revenue) * 100, 2)
    else 0
  end;