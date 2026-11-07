CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone VARCHAR(30),
  role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS waste_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS pickup_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES waste_categories(id),
  quantity VARCHAR(80) NOT NULL,
  pickup_address TEXT NOT NULL,
  pickup_date DATE NOT NULL,
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending','Approved','Rejected','Scheduled','Completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO waste_categories (name, description) VALUES
 ('Wet Waste', 'Food scraps, vegetable peels and other biodegradable waste'),
 ('Dry Waste', 'Paper, cardboard, plastic and clean packaging'),
 ('E-Waste', 'Old electronics, cables, chargers and small appliances'),
 ('Metal', 'Reusable metal cans and scrap metal'),
 ('Glass', 'Bottles and clean glass containers')
ON CONFLICT (name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_requests_user ON pickup_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON pickup_requests(status);
