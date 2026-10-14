CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS resources (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  type        VARCHAR(50)  NOT NULL,
  capacity    INT CHECK (capacity IS NULL OR capacity > 0),
  location    VARCHAR(100),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
  id           SERIAL PRIMARY KEY,
  resource_id  INT NOT NULL REFERENCES resources(id),
  reserved_by  VARCHAR(100) NOT NULL,
  purpose      VARCHAR(255),
  start_time   TIMESTAMPTZ NOT NULL,
  end_time     TIMESTAMPTZ NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
               CHECK (status IN ('ACTIVE', 'CANCELLED')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time),
  -- same resource, overlapping time, both active -> database rejects it
  CONSTRAINT no_overlapping_reservations
    EXCLUDE USING gist (
      resource_id WITH =,
      tstzrange(start_time, end_time) WITH &&
    ) WHERE (status = 'ACTIVE')
);

CREATE INDEX IF NOT EXISTS idx_reservations_resource_start
  ON reservations (resource_id, start_time);

INSERT INTO resources (name, type, capacity, location) VALUES
  ('Meeting Room A', 'Room', 10, 'Floor 1'),
  ('Conference Hall', 'Room', 50, 'Ground Floor'),
  ('Projector 01', 'Equipment', NULL, 'IT Store'),
  ('Company Van', 'Vehicle', 8, 'Parking')
ON CONFLICT (name) DO NOTHING;