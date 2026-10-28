-- =====================================================================
-- 015: base_price se recalcula solo cuando cambia el costeo.
--
-- base_price se guardaba resuelto desde ProductForm (el catálogo público
-- solo lee un número), pero nada en la base lo recalculaba si el costeo
-- se actualizaba por fuera del admin (ej. un UPDATE directo por SQL) —
-- por eso el UPDATE de freight_cost/admin_cost/markup_percentage no se
-- reflejó en el catálogo hasta editar y volver a guardar cada producto.
-- =====================================================================

create or replace function compute_product_base_price()
returns trigger
language plpgsql
as $$
declare
  v_total_cost numeric;
  v_margin_ratio numeric;
begin
  v_total_cost := coalesce(new.cost_price, 0) + coalesce(new.freight_cost, 0) + coalesce(new.admin_cost, 0);
  v_margin_ratio := least(coalesce(new.markup_percentage, 0), 99) / 100;
  if v_margin_ratio < 1 then
    new.base_price := round(v_total_cost / (1 - v_margin_ratio), 2);
  else
    new.base_price := 0;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_products_compute_base_price on products;

create trigger trg_products_compute_base_price
before insert or update of cost_price, freight_cost, admin_cost, markup_percentage on products
for each row execute function compute_product_base_price();

-- Dispara el trigger de arriba para TODOS los productos ya existentes, para
-- que el freight_cost/admin_cost/markup_percentage que ya actualizaste por
-- SQL se vea reflejado de una en el catálogo sin tener que reabrir cada uno.
update products set markup_percentage = markup_percentage;
