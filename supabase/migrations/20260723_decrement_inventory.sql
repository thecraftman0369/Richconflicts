-- Atomic inventory decrement for a single product/size.
-- Returns JSON: { success, remaining } or { success: false, error }
-- Uses FOR UPDATE row lock to prevent race conditions when two orders
-- for the same item are processed concurrently.
CREATE OR REPLACE FUNCTION public.decrement_inventory(
  p_product_id UUID,
  p_size       TEXT,
  p_qty        INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_inv     JSONB;
  v_current INT;
  v_new_qty INT;
  v_new_inv JSONB;
  v_stock   INT;
BEGIN
  -- Lock the row for update so concurrent calls queue up
  SELECT inventory
    INTO v_inv
    FROM public.products
   WHERE id = p_product_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product not found');
  END IF;

  IF v_inv IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No inventory record');
  END IF;

  v_current := COALESCE((v_inv ->> p_size)::INT, 0);

  IF v_current < p_qty THEN
    RETURN jsonb_build_object(
      'success',   false,
      'error',     'Insufficient stock',
      'available', v_current
    );
  END IF;

  v_new_qty := v_current - p_qty;
  v_new_inv := jsonb_set(v_inv, ARRAY[p_size], to_jsonb(v_new_qty));

  -- Recalculate total stock from all sizes
  SELECT COALESCE(SUM(val::INT), 0)
    INTO v_stock
    FROM jsonb_each_text(v_new_inv) AS t(key, val);

  UPDATE public.products
     SET inventory  = v_new_inv,
         stock      = v_stock,
         updated_at = NOW()
   WHERE id = p_product_id;

  RETURN jsonb_build_object('success', true, 'remaining', v_new_qty, 'total_stock', v_stock);
END;
$$;

-- Grant execute to the service role (used by the webhook server)
GRANT EXECUTE ON FUNCTION public.decrement_inventory(UUID, TEXT, INT) TO service_role;
