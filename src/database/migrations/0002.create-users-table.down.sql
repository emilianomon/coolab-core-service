BEGIN;

DROP TRIGGER IF EXISTS ct_users_updated_at_auto_update ON public.users;
DROP INDEX IF EXISTS idx_users_email_unique;
DROP TABLE IF EXISTS public.users;

COMMIT;
