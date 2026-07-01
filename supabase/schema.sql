-- =================================================================
-- RICH CONFLICTS — PostgreSQL Schema
-- Paste this entire script into the Supabase SQL Editor and run.
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE.
-- =================================================================

-- ── Extensions ────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Shared trigger: stamp updated_at on every write ───────────────
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- =================================================================
-- PROFILES
-- One row per auth.users entry.  Auto-created via trigger.
-- =================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id               UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email            TEXT        NOT NULL,
  phone            TEXT,
  -- { "line1":"...", "line2":"...", "city":"...", "postcode":"...", "country":"..." }
  shipping_address JSONB       NOT NULL DEFAULT '{}',
  role             TEXT        NOT NULL DEFAULT 'customer'
                                 CONSTRAINT profiles_role_check
                                 CHECK (role IN ('master_admin', 'admin', 'customer')),
  scopes           TEXT[]      NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);

-- Auto-create profile row when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles: user reads own"       ON public.profiles;
DROP POLICY IF EXISTS "profiles: user updates own"     ON public.profiles;
DROP POLICY IF EXISTS "profiles: admin reads all"      ON public.profiles;
DROP POLICY IF EXISTS "profiles: admin updates all"    ON public.profiles;

CREATE POLICY "profiles: user reads own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users may update their own profile but cannot escalate their role
CREATE POLICY "profiles: user updates own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "profiles: admin reads all"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'master_admin')
    )
  );

CREATE POLICY "profiles: admin updates all"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'master_admin')
    )
  );


-- =================================================================
-- PRODUCTS
-- =================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT           NOT NULL,
  slug        TEXT           NOT NULL UNIQUE,
  description TEXT,
  price       NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  images      TEXT[]         NOT NULL DEFAULT '{}',
  status      TEXT           NOT NULL DEFAULT 'draft'
                               CONSTRAINT products_status_check
                               CHECK (status IN ('draft', 'published')),
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX IF NOT EXISTS products_slug_idx   ON public.products (slug);
CREATE INDEX IF NOT EXISTS products_status_idx ON public.products (status);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products: published readable by all" ON public.products;
DROP POLICY IF EXISTS "products: admin reads all"           ON public.products;
DROP POLICY IF EXISTS "products: admin insert"              ON public.products;
DROP POLICY IF EXISTS "products: admin update"              ON public.products;
DROP POLICY IF EXISTS "products: admin delete"              ON public.products;

CREATE POLICY "products: published readable by all"
  ON public.products FOR SELECT USING (status = 'published');

CREATE POLICY "products: admin reads all"
  ON public.products FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master_admin')));

CREATE POLICY "products: admin insert"
  ON public.products FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master_admin')));

CREATE POLICY "products: admin update"
  ON public.products FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master_admin')));

CREATE POLICY "products: admin delete"
  ON public.products FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master_admin')));


-- =================================================================
-- PRODUCT VARIANTS
-- =================================================================
CREATE TABLE IF NOT EXISTS public.product_variants (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size           TEXT        NOT NULL
                               CONSTRAINT variants_size_check
                               CHECK (size IN ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  stock_quantity INTEGER     NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, size)
);

CREATE INDEX IF NOT EXISTS variants_product_id_idx ON public.product_variants (product_id);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "variants: publicly readable" ON public.product_variants;
DROP POLICY IF EXISTS "variants: admin manages"     ON public.product_variants;

CREATE POLICY "variants: publicly readable"
  ON public.product_variants FOR SELECT USING (TRUE);

CREATE POLICY "variants: admin manages"
  ON public.product_variants FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master_admin')));


-- =================================================================
-- ORDERS
-- items JSONB shape: [{ "product_id", "slug", "name", "size", "quantity", "price" }]
-- =================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id                       UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID           NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  items                    JSONB          NOT NULL DEFAULT '[]',
  total_amount             NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  stripe_payment_intent_id TEXT           UNIQUE,
  status                   TEXT           NOT NULL DEFAULT 'pending'
                                            CONSTRAINT orders_status_check
                                            CHECK (status IN (
                                              'pending','paid','processing',
                                              'shipped','delivered','cancelled','refunded'
                                            )),
  shipping_address         JSONB          NOT NULL DEFAULT '{}',
  created_at               TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx  ON public.orders (status);
CREATE INDEX IF NOT EXISTS orders_pi_idx      ON public.orders (stripe_payment_intent_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders: user reads own"   ON public.orders;
DROP POLICY IF EXISTS "orders: user creates own" ON public.orders;
DROP POLICY IF EXISTS "orders: admin reads all"  ON public.orders;
DROP POLICY IF EXISTS "orders: admin updates"    ON public.orders;

CREATE POLICY "orders: user reads own"
  ON public.orders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "orders: user creates own"
  ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders: admin reads all"
  ON public.orders FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master_admin')));

CREATE POLICY "orders: admin updates"
  ON public.orders FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master_admin')));


-- =================================================================
-- TICKETS
-- =================================================================
CREATE TABLE IF NOT EXISTS public.tickets (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject    TEXT        NOT NULL,
  order_id   UUID        REFERENCES public.orders(id) ON DELETE SET NULL,
  status     TEXT        NOT NULL DEFAULT 'open'
                           CONSTRAINT tickets_status_check
                           CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX IF NOT EXISTS tickets_user_id_idx  ON public.tickets (user_id);
CREATE INDEX IF NOT EXISTS tickets_status_idx   ON public.tickets (status);
CREATE INDEX IF NOT EXISTS tickets_order_id_idx ON public.tickets (order_id);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tickets: user reads own"   ON public.tickets;
DROP POLICY IF EXISTS "tickets: user creates own" ON public.tickets;
DROP POLICY IF EXISTS "tickets: admin reads all"  ON public.tickets;
DROP POLICY IF EXISTS "tickets: admin updates"    ON public.tickets;

CREATE POLICY "tickets: user reads own"
  ON public.tickets FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "tickets: user creates own"
  ON public.tickets FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tickets: admin reads all"
  ON public.tickets FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master_admin')));

CREATE POLICY "tickets: admin updates"
  ON public.tickets FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master_admin')));


-- =================================================================
-- TICKET MESSAGES
-- =================================================================
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id    UUID        NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  message_body TEXT        NOT NULL,
  is_admin     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS messages_ticket_id_idx ON public.ticket_messages (ticket_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.ticket_messages (sender_id);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages: user reads own ticket messages"   ON public.ticket_messages;
DROP POLICY IF EXISTS "messages: user inserts on own ticket"       ON public.ticket_messages;
DROP POLICY IF EXISTS "messages: admin reads all"                  ON public.ticket_messages;
DROP POLICY IF EXISTS "messages: admin inserts on any ticket"      ON public.ticket_messages;

CREATE POLICY "messages: user reads own ticket messages"
  ON public.ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "messages: user inserts on own ticket"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "messages: admin reads all"
  ON public.ticket_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master_admin')));

CREATE POLICY "messages: admin inserts on any ticket"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master_admin')));


-- =================================================================
-- BLOGS
-- =================================================================
CREATE TABLE IF NOT EXISTS public.blogs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT        NOT NULL,
  slug       TEXT        NOT NULL UNIQUE,
  excerpt    TEXT,
  keywords   TEXT[]      NOT NULL DEFAULT '{}',
  read_time  INTEGER     CHECK (read_time > 0),   -- minutes
  content    TEXT        NOT NULL DEFAULT '',
  images     TEXT[]      NOT NULL DEFAULT '{}',
  published  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER blogs_updated_at
  BEFORE UPDATE ON public.blogs
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX IF NOT EXISTS blogs_slug_idx      ON public.blogs (slug);
CREATE INDEX IF NOT EXISTS blogs_published_idx ON public.blogs (published);

ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blogs: published readable by all" ON public.blogs;
DROP POLICY IF EXISTS "blogs: admin reads all"           ON public.blogs;
DROP POLICY IF EXISTS "blogs: admin manages"             ON public.blogs;

CREATE POLICY "blogs: published readable by all"
  ON public.blogs FOR SELECT USING (published = TRUE);

CREATE POLICY "blogs: admin reads all"
  ON public.blogs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master_admin')));

CREATE POLICY "blogs: admin manages"
  ON public.blogs FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master_admin')));


-- =================================================================
-- Enable Supabase Realtime on messaging tables
-- =================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
