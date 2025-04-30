
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS text
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT auth.uid()::text;
$$;
