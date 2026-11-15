BEGIN;

-- ---------- Venue layouts ----------
CREATE TABLE IF NOT EXISTS venue_maps (
  id                       serial PRIMARY KEY,
  name                     text        NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  venue_name               text        NOT NULL CHECK (length(venue_name) BETWEEN 1 AND 160),
  view_width               integer     NOT NULL CHECK (view_width  BETWEEN 100 AND 10000),
  view_height              integer     NOT NULL CHECK (view_height BETWEEN 100 AND 10000),
  background_image_url     text CHECK (
                             background_image_url IS NULL OR
                             background_image_url ~ '^https://[a-z0-9]+\.public\.blob\.vercel-storage\.com/seat-maps/'
                           ),
  background_image_pathname text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS venue_map_sections (
  id          serial PRIMARY KEY,
  map_id      integer      NOT NULL REFERENCES venue_maps(id) ON DELETE CASCADE,
  code        text         NOT NULL CHECK (code ~ '^[A-Za-z0-9 _-]{1,20}$'),
  kind        text         NOT NULL DEFAULT 'seat' CHECK (kind IN ('seat','floor','stage')),
  path        text         NOT NULL CHECK (length(path) <= 20000 AND path ~ '^[MmLlHhVvCcSsQqTtAaZz0-9 ,.eE+-]+$'),
  label_x     numeric(8,2) NOT NULL,
  label_y     numeric(8,2) NOT NULL,
  label_size  numeric(6,2) NOT NULL DEFAULT 16 CHECK (label_size BETWEEN 4 AND 200),
  sort_order  integer      NOT NULL DEFAULT 0,
  UNIQUE (map_id, code)
);

-- ---------- Event -> layout (RESALE ONLY, enforced by trigger) ----------
CREATE TABLE IF NOT EXISTS event_seat_maps (
  event_id    integer     PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  map_id      integer     NOT NULL REFERENCES venue_maps(id) ON DELETE RESTRICT,
  enabled     boolean     NOT NULL DEFAULT false,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------- Inventory (all-in prices; no fee columns) ----------
CREATE TABLE IF NOT EXISTS seat_listings (
  id               serial PRIMARY KEY,
  event_id         integer       NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
  event_date_id    integer       REFERENCES event_dates(id) ON DELETE RESTRICT,
  section_code     text          NOT NULL CHECK (section_code ~ '^[A-Za-z0-9 _-]{1,20}$'),
  row_label        text          CHECK (length(row_label) <= 20),
  seats            text          CHECK (length(seats) <= 60),
  quantity_total   integer       NOT NULL CHECK (quantity_total BETWEEN 0 AND 100000),
  quantity_held    integer       NOT NULL DEFAULT 0 CHECK (quantity_held >= 0),
  quantity_sold    integer       NOT NULL DEFAULT 0 CHECK (quantity_sold >= 0),
  max_per_order    integer       NOT NULL DEFAULT 10 CHECK (max_per_order BETWEEN 1 AND 10),
  price            numeric(10,2) NOT NULL CHECK (price > 0),          -- all-in, per ticket
  original_price   numeric(10,2) CHECK (original_price IS NULL OR original_price > price),
  currency         text          NOT NULL DEFAULT 'PHP' CHECK (currency = 'PHP'),
  seated_together  boolean       NOT NULL DEFAULT true,
  view_note        text          CHECK (length(view_note) <= 120),
  featured         boolean       NOT NULL DEFAULT false,
  status           text          NOT NULL DEFAULT 'available'
                     CHECK (status IN ('available','hidden')),
  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT seat_listings_no_oversell CHECK (quantity_held + quantity_sold <= quantity_total)
);
CREATE INDEX IF NOT EXISTS seat_listings_event_idx ON seat_listings (event_id, status);

-- ---------- Holds / reservations ----------
-- checkout (15 min) -> payment_review (24 h) -> confirmed -> [sold_cancelled -> restocked]
--                   \-> released                \-> review_expired -> confirmed | released
CREATE TABLE IF NOT EXISTS seat_holds (
  id               serial PRIMARY KEY,
  token            text          NOT NULL UNIQUE CHECK (length(token) >= 32),
  listing_id       integer       NOT NULL REFERENCES seat_listings(id) ON DELETE RESTRICT,
  user_id          text          NOT NULL,
  quantity         integer       NOT NULL CHECK (quantity BETWEEN 1 AND 10),
  unit_price       numeric(10,2) NOT NULL CHECK (unit_price > 0),   -- all-in price locked at reservation
  order_id         integer       UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  state            text          NOT NULL DEFAULT 'checkout' CHECK (state IN (
                     'checkout','payment_review','review_expired',
                     'confirmed','released','sold_cancelled','restocked')),
  -- Which counter this hold currently occupies, so every transition can be checked
  counts_as        text          NOT NULL DEFAULT 'held' CHECK (counts_as IN ('held','sold','none')),
  expires_at       timestamptz   NOT NULL,
  release_reason   text          CHECK (release_reason IN ('checkout_expired','replaced','cancelled','admin')),
  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz   NOT NULL DEFAULT now(),
  submitted_at     timestamptz,
  review_expired_at timestamptz,
  confirmed_at     timestamptz,
  confirmed_by     text,
  released_at      timestamptz,
  cancelled_at     timestamptz,
  restocked_at     timestamptz,
  restocked_by     text,
  restock_note     text          CHECK (length(restock_note) <= 300),

  CONSTRAINT seat_holds_state_counter CHECK (
       (state IN ('checkout','payment_review')                  AND counts_as = 'held')
    OR (state IN ('confirmed','sold_cancelled')                 AND counts_as = 'sold')
    OR (state IN ('review_expired','released','restocked')      AND counts_as = 'none')
  ),
  CONSTRAINT seat_holds_order_link CHECK (
       (state = 'checkout' AND order_id IS NULL)
    OR (state = 'released')                       -- a checkout that was never submitted, or a cancelled order
    OR (state NOT IN ('checkout','released') AND order_id IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS seat_holds_expiry_idx
  ON seat_holds (expires_at) WHERE state IN ('checkout','payment_review');
CREATE INDEX IF NOT EXISTS seat_holds_listing_idx ON seat_holds (listing_id);
-- One active checkout per customer: a new reservation replaces the previous one
CREATE UNIQUE INDEX IF NOT EXISTS seat_holds_one_checkout_per_user
  ON seat_holds (user_id) WHERE state = 'checkout';

-- ---------- Append-only inventory audit log ----------
CREATE TABLE IF NOT EXISTS seat_inventory_log (
  id          bigserial PRIMARY KEY,
  listing_id  integer     NOT NULL REFERENCES seat_listings(id) ON DELETE RESTRICT,
  hold_id     integer     REFERENCES seat_holds(id) ON DELETE RESTRICT,
  action      text        NOT NULL CHECK (action IN (
                'reserve','submit','checkout_expired','replaced','review_expired',
                'confirm','reacquire','cancel_release','cancel_sold','restock','admin_adjust')),
  delta_held  integer     NOT NULL DEFAULT 0,
  delta_sold  integer     NOT NULL DEFAULT 0,
  actor       text        NOT NULL,          -- 'system' | 'customer:<id>' | 'admin:<name>'
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS seat_inventory_log_listing_idx ON seat_inventory_log (listing_id, created_at);

-- ---------- Resale-only enforcement (triggers on NEW tables only) ----------
CREATE OR REPLACE FUNCTION seat_map_assert_resale_event() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE ev_type text;
BEGIN
  SELECT type INTO ev_type FROM events WHERE id = NEW.event_id;
  IF ev_type IS DISTINCT FROM 'resale' THEN
    RAISE EXCEPTION 'Seat maps are only available for resale events (event %, type %)',
      NEW.event_id, coalesce(ev_type, 'missing') USING ERRCODE = 'check_violation';
  END IF;
  -- Nested IF: event_seat_maps has no event_date_id column, so it must never be referenced there.
  IF TG_TABLE_NAME = 'seat_listings' THEN
    IF NEW.event_date_id IS NOT NULL AND NOT EXISTS (
         SELECT 1 FROM event_dates WHERE id = NEW.event_date_id AND event_id = NEW.event_id) THEN
      RAISE EXCEPTION 'Event date % does not belong to event %', NEW.event_date_id, NEW.event_id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS event_seat_maps_resale_only ON event_seat_maps;
CREATE TRIGGER event_seat_maps_resale_only
  BEFORE INSERT OR UPDATE OF event_id ON event_seat_maps
  FOR EACH ROW EXECUTE FUNCTION seat_map_assert_resale_event();

DROP TRIGGER IF EXISTS seat_listings_resale_only ON seat_listings;
CREATE TRIGGER seat_listings_resale_only
  BEFORE INSERT OR UPDATE OF event_id, event_date_id ON seat_listings
  FOR EACH ROW EXECUTE FUNCTION seat_map_assert_resale_event();

-- ---------- The audit log can't be edited or deleted ----------
CREATE OR REPLACE FUNCTION seat_inventory_log_immutable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'seat_inventory_log is append-only' USING ERRCODE = 'insufficient_privilege';
END $$;

DROP TRIGGER IF EXISTS seat_inventory_log_no_change ON seat_inventory_log;
CREATE TRIGGER seat_inventory_log_no_change
  BEFORE UPDATE OR DELETE ON seat_inventory_log
  FOR EACH ROW EXECUTE FUNCTION seat_inventory_log_immutable();

COMMIT;
