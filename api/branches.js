import { createClient } from '@libsql/client';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  // Set Cache-Control header for Edge / CDN caching (5 minutes)
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.error('❌ Error on Vercel: TURSO_DATABASE_URL environment variable is missing in Vercel Project Settings.');
    return res.status(500).json({
      success: false,
      message: 'Database configuration missing in Vercel environment variables. Please add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel Project Settings.'
    });
  }

  try {
    const client = createClient({
      url: url.trim(),
      authToken: authToken ? authToken.trim() : undefined
    });

    const query = `
      SELECT
        id,
        store,
        branch_name,
        province,
        floor,
        phone,
        lat,
        lng,
        map_url
      FROM branches
      WHERE LOWER(TRIM(status)) = 'active'
      ORDER BY store ASC, branch_name ASC;
    `;

    const result = await client.execute(query);

    const branches = result.rows.map(row => ({
      id: String(row.id || ''),
      store: String(row.store || ''),
      branchName: String(row.branch_name || ''),
      province: String(row.province || ''),
      floor: row.floor ? String(row.floor) : '',
      phone: row.phone ? String(row.phone) : '',
      lat: row.lat !== null && row.lat !== '' && !isNaN(Number(row.lat)) ? Number(row.lat) : null,
      lng: row.lng !== null && row.lng !== '' && !isNaN(Number(row.lng)) ? Number(row.lng) : null,
      mapUrl: row.map_url ? String(row.map_url) : ''
    }));

    return res.status(200).json({
      success: true,
      count: branches.length,
      data: branches
    });
  } catch (error) {
    console.error('❌ API Error in /api/branches:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to load branches'
    });
  }
}
