-- Taille / pointure libre et facultative pour les articles de stock.
-- Les articles existants restent inchangés (NULL).
ALTER TABLE public.purchase_items
  ADD COLUMN item_size text
  CONSTRAINT purchase_items_item_size_length CHECK (char_length(item_size) <= 32);

COMMENT ON COLUMN public.purchase_items.item_size IS
  'Taille ou pointure facultative (S, M, XL, 42, 42,5...), par article.';
