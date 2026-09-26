CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id serial PRIMARY KEY,
  type text NOT NULL DEFAULT 'resale',
  title text NOT NULL,
  country text NOT NULL,
  dates text,
  platform text,
  sale_info text,
  image_url text,
  seat_map_url text,
  hidden boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_dates (
  id serial PRIMARY KEY,
  event_id integer NOT NULL,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS date_sections (
  id serial PRIMARY KEY,
  date_id integer NOT NULL,
  name text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  price numeric(10,2) NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS reviews (
  id serial PRIMARY KEY,
  name text NOT NULL,
  event text,
  text text NOT NULL,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  hidden boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS qrph_merchants (
  id serial PRIMARY KEY,
  name text NOT NULL,
  qr_image_url text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id serial PRIMARY KEY,
  reference text NOT NULL UNIQUE,
  event_id integer,
  event_title text NOT NULL,
  service_type text NOT NULL,
  country text,
  dates text NOT NULL,
  quantity_per_date integer NOT NULL DEFAULT 1,
  sections text,
  total_amount numeric(10,2),
  account_email text NOT NULL,
  account_password text,
  holder_name text NOT NULL,
  holder_dob text,
  contact_number text NOT NULL,
  telegram text,
  instagram text,
  memberships text,
  payment_method text,
  payment_merchant text,
  payment_reference text,
  date_paid text,
  time_paid text,
  amount_sent numeric(10,2),
  screenshots text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
