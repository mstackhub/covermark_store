import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@libsql/client';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname)); // fallback to root static files

// Initialize Turso Client (Server-side ONLY)
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

let dbClient = null;
if (url) {
  dbClient = createClient({
    url: url,
    authToken: authToken
  });
} else {
  console.warn('⚠️ WARNING: TURSO_DATABASE_URL is not set. API will return fallback mock data.');
}

// In-Memory Cache (5 Minutes = 300,000 ms)
const CACHE_TTL_MS = 5 * 60 * 1000;
let branchCache = {
  timestamp: 0,
  data: null
};

/**
 * GET /api/branches
 * Public read-only endpoint returning all Active branches for COVERMARK Store Locator
 */
app.get('/api/branches', async (req, res) => {
  const startTime = Date.now();

  try {
    const now = Date.now();

    // 1. Return cached data if valid
    if (branchCache.data && (now - branchCache.timestamp < CACHE_TTL_MS)) {
      res.set('X-Cache', 'HIT');
      return res.json({
        success: true,
        cached: true,
        count: branchCache.data.length,
        data: branchCache.data
      });
    }

    // 2. Query Turso Database
    if (!dbClient) {
      throw new Error('Database client is not configured');
    }

    const query = `
      SELECT
        id,
        store,
        region,
        branch_name,
        province,
        floor,
        phone,
        lat,
        lng,
        map_url
      FROM branches
      WHERE LOWER(TRIM(status)) = 'active'
      ORDER BY
        CASE WHEN UPPER(TRIM(region)) = 'BKK' THEN 1 ELSE 2 END ASC,
        store ASC,
        branch_name ASC;
    `;

    const result = await dbClient.execute(query);

    // Map rows to camelCase API format
    const branches = result.rows.map(row => ({
      id: String(row.id || ''),
      store: String(row.store || ''),
      region: String(row.region || ''),
      branchName: String(row.branch_name || ''),
      province: String(row.province || ''),
      floor: row.floor ? String(row.floor) : '',
      phone: row.phone ? String(row.phone) : '',
      lat: row.lat !== null && row.lat !== '' && !isNaN(Number(row.lat)) ? Number(row.lat) : null,
      lng: row.lng !== null && row.lng !== '' && !isNaN(Number(row.lng)) ? Number(row.lng) : null,
      mapUrl: row.map_url ? String(row.map_url) : ''
    }));

    // Update Cache
    branchCache = {
      timestamp: now,
      data: branches
    };

    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] GET /api/branches - 200 OK (${branches.length} branches, ${duration}ms)`);

    res.set('X-Cache', 'MISS');
    return res.json({
      success: true,
      count: branches.length,
      data: branches
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    // Log error internally without exposing credentials/tokens
    console.error(`[${new Date().toISOString()}] GET /api/branches - Error (${duration}ms):`, error.message);

    // If cache exists from prior fetch, fallback to stale cache gracefully
    if (branchCache.data) {
      console.warn('Serving stale cache due to database error');
      return res.json({
        success: true,
        stale: true,
        count: branchCache.data.length,
        data: branchCache.data
      });
    }

    // Return safe user-facing error response
    return res.status(500).json({
      success: false,
      message: 'Unable to load branches'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 COVERMARK Store Locator Server running at http://localhost:${PORT}`);
  console.log(`📡 API Endpoint: http://localhost:${PORT}/api/branches`);
});
