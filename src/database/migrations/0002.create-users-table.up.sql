BEGIN;

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR NOT NULL,
  name VARCHAR NULL,
  picture VARCHAR NULL,
  email_status VARCHAR NOT NULL DEFAULT 'verified',
  last_authentication_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER ct_users_updated_at_auto_update
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime('updated_at');

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON public.users(email);

COMMIT;
