-- Borrar un producto que ya tuvo pedidos fallaba con "violates foreign key
-- constraint": products -> product_variants es ON DELETE CASCADE, pero
-- product_variants -> order_items no tenía ON DELETE definido (RESTRICT
-- por defecto), así que la cascada chocaba justo ahí. order_items ya
-- guarda todo lo vendido "congelado" en las columnas *_snapshot (nombre,
-- talla, color, SKU), así que no depende de que la fila de la variante
-- siga viva — basta con permitir que la referencia quede en null.
do $$
declare
  v_conname text;
begin
  select conname into v_conname
  from pg_constraint
  where conrelid = 'order_items'::regclass
    and confrelid = 'product_variants'::regclass
    and contype = 'f';

  if v_conname is not null then
    execute format('alter table order_items drop constraint %I', v_conname);
  end if;
end $$;

alter table order_items
  alter column product_variant_id drop not null;

alter table order_items
  add constraint order_items_product_variant_id_fkey
  foreign key (product_variant_id) references product_variants(id) on delete set null;
