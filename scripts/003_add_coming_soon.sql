ALTER TABLE events ADD COLUMN IF NOT EXISTS coming_soon boolean NOT NULL DEFAULT false;
