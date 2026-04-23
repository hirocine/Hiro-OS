UPDATE orcamentos
SET services = jsonb_set(
  jsonb_set(
    jsonb_set(
      services,
      '{phases,0,subcategories,0,items,0,included}', 'true'::jsonb
    ),
    '{phases,0,subcategories,0,items,0,specification}', '"Versão curta + versão longa"'::jsonb
  ),
  '{phases,0,subcategories,0,items,0,quantity}', '1'::jsonb
)
WHERE slug='548-grupo-primo-evento-portfel-connect-v1';