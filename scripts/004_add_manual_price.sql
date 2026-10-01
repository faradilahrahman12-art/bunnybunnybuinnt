ALTER TABLE date_sections ADD COLUMN IF NOT EXISTS manual_price numeric(10, 2) NOT NULL DEFAULT 0;
