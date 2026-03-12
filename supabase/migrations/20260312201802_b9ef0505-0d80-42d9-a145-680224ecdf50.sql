create or replace function public.auto_fill_net_profit_value()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.net_profit_value := coalesce(new.revenue, 0) - coalesce(new.costs, 0);
  return new;
end;
$$;

create or replace function public.auto_fill_net_profit_pct()
returns trigger
language plpgsql
set search_path = public
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