-- ============================================================
-- Database Initialization Script
-- Runs automatically when PostgreSQL container starts fresh
-- ============================================================

-- Items table
CREATE TABLE IF NOT EXISTS items (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    price       NUMERIC(10, 2) DEFAULT 0,
    quantity    INTEGER DEFAULT 0,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    email      VARCHAR(255) NOT NULL UNIQUE,
    role       VARCHAR(50)  DEFAULT 'user' CHECK (role IN ('admin', 'user', 'moderator')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ── Seed Data ──────────────────────────────────────────────────────────────────

INSERT INTO items (name, description, price, quantity) VALUES
    ('Laptop Pro 15"',    'High-performance laptop with M3 chip',         1299.99, 25),
    ('Wireless Mouse',    'Ergonomic Bluetooth mouse, 3-month battery',      29.99, 120),
    ('USB-C Hub',         '7-in-1 hub with HDMI, USB 3.0, SD card reader',  49.99,  75),
    ('Mechanical Keyboard','TKL layout, Cherry MX Blue switches',            89.99,  40),
    ('Monitor 27" 4K',    'IPS panel, 144Hz, HDR400',                       449.99,  15)
ON CONFLICT DO NOTHING;

INSERT INTO users (name, email, role) VALUES
    ('Alice Admin',   'alice@example.com',   'admin'),
    ('Bob User',      'bob@example.com',     'user'),
    ('Carol Mod',     'carol@example.com',   'moderator'),
    ('Dave Developer','dave@example.com',    'user')
ON CONFLICT DO NOTHING;

\echo '✅ Database initialised with seed data'
