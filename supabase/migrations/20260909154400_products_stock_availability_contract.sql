-- PROD-P1-4 / PROD-P2-10: stock governs availability ONLY when track_stock is enabled.
--
-- Before this migration, tr_auto_suspend_out_of_stock forced is_available=false on any
-- stock<=0 write, ignoring track_stock. That made untracked products with stock 0
-- (including the create default) invisible, and re-suspended them on every edit save.
--
-- New contract (defense in depth; app actions must agree):
--   track_stock=true  AND stock<=0  → force is_available=false
--   track_stock=false               → availability unchanged by stock
--   restock                         → never auto-reactivates
--   manual unavailable              → stays unavailable
--
-- Trigger must also fire on track_stock and is_available so that:
--   - enabling track_stock on a zero-stock product suspends it;
--   - an inline availability toggle cannot leave a tracked zero-stock product available.
--
-- No data backfill. Historical inactive rows keep their current is_available.
-- create_order / stock_movements / restock-on-cancel are UNTOUCHED.

CREATE OR REPLACE FUNCTION public.auto_suspend_out_of_stock_product()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.track_stock = true AND NEW.stock <= 0 THEN
    NEW.is_available := false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_auto_suspend_out_of_stock ON public.products;

CREATE TRIGGER tr_auto_suspend_out_of_stock
BEFORE INSERT OR UPDATE OF stock, track_stock, is_available
ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.auto_suspend_out_of_stock_product();
