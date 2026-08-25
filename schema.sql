-- COVERMARK Store Locator Database Schema (Turso / libSQL)
-- Database Name: covermark-store
-- Region: AWS AP Northeast (Tokyo)

-- 1. Branches Table
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  store TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  province TEXT NOT NULL,
  floor TEXT,
  phone TEXT,
  lat REAL,
  lng REAL,
  map_url TEXT,
  status TEXT NOT NULL DEFAULT 'Active'
);

-- 2. Indexes for Query & Filter Optimization
CREATE INDEX IF NOT EXISTS idx_branches_status
ON branches(status);

CREATE INDEX IF NOT EXISTS idx_branches_store
ON branches(store);

CREATE INDEX IF NOT EXISTS idx_branches_province
ON branches(province);

CREATE INDEX IF NOT EXISTS idx_branches_active_location
ON branches(status, province, store);
