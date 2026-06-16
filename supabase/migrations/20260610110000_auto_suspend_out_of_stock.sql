-- Fase 12.2: Auto-suspender productos sin stock para evitar sobreventas.

-- Función que evalúa el stock y desactiva el producto si llega a 0
CREATE OR REPLACE FUNCTION public.auto_suspend_out_of_stock_product()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el stock nuevo es 0 o negativo, forzamos is_available a false
  IF NEW.stock <= 0 THEN
    NEW.is_available := false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminamos el trigger si ya existe para ser idempotentes
DROP TRIGGER IF EXISTS tr_auto_suspend_out_of_stock ON public.products;

-- Creamos el trigger que se dispara ANTES de insertar o actualizar la columna stock
CREATE TRIGGER tr_auto_suspend_out_of_stock
BEFORE INSERT OR UPDATE OF stock
ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.auto_suspend_out_of_stock_product();
