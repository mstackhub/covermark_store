import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import https from 'https';

dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error('❌ Error: TURSO_DATABASE_URL is missing in environment variables (.env)');
  process.exit(1);
}

const client = createClient({
  url: url,
  authToken: authToken
});

const SPREADSHEET_ID = '1aV__Fpbrz03UWCj8t8NGxjDccQzFAjIx6mM80Ezz2N0';
const GID = '1126913998';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}`;

/**
 * Fetch text/CSV content from URL supporting redirects
 */
function fetchUrl(targetUrl) {
  return new Promise((resolve, reject) => {
    https.get(targetUrl, (res) => {
      // Handle HTTP redirects (301, 302, 307)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch CSV: HTTP ${res.statusCode} ${res.statusMessage}`));
      }

      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Parse CSV respecting quotes and newlines
 */
function parseCSV(text) {
  const lines = [];
  let row = [];
  let inQuotes = false;
  let currentStr = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentStr += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentStr.trim());
      currentStr = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(currentStr.trim());
      if (row.some(cell => cell !== '')) {
        lines.push(row);
      }
      row = [];
      currentStr = '';
    } else {
      currentStr += char;
    }
  }

  if (currentStr || row.length > 0) {
    row.push(currentStr.trim());
    if (row.some(cell => cell !== '')) {
      lines.push(row);
    }
  }

  return lines;
}

function findHeaderIndex(headers, possibleNames) {
  for (let i = 0; i < headers.length; i++) {
    const colName = headers[i].toLowerCase().replace(/\s+/g, '');
    for (let j = 0; j < possibleNames.length; j++) {
      const matchName = possibleNames[j].toLowerCase().replace(/\s+/g, '');
      if (colName === matchName) {
        return i;
      }
    }
  }
  return -1;
}

function getVal(row, index) {
  if (index === -1 || index >= row.length || row[index] === undefined || row[index] === null) {
    return '';
  }
  return String(row[index]).trim();
}

async function importFromGoogleSheet() {
  console.log(`📥 Downloading branch data from Google Sheet (${SPREADSHEET_ID})...`);

  try {
    const csvContent = await fetchUrl(CSV_URL);
    const rows = parseCSV(csvContent);

    if (!rows || rows.length < 2) {
      throw new Error('Google Sheet is empty or contains only header row');
    }

    const headers = rows[0];
    console.log('📋 Detected Headers:', headers.join(' | '));

    const headerMap = {
      id: findHeaderIndex(headers, ['ID', 'id', 'รหัสสาขา', 'Branch ID', 'BranchID']),
      store: findHeaderIndex(headers, ['Store', 'store', 'กลุ่มห้าง', 'ห้าง', 'Department Store']),
      name: findHeaderIndex(headers, ['ชื่อสาขา', 'Branch Name', 'BranchName', 'Name', 'สาขา']),
      province: findHeaderIndex(headers, ['จังหวัด', 'Province']),
      floor: findHeaderIndex(headers, ['ชั้น', 'Floor']),
      phone: findHeaderIndex(headers, ['เบอร์โทรศัพท์', 'เบอร์โทร', 'Phone', 'Tel', 'Telephone']),
      lat: findHeaderIndex(headers, ['Lat', 'Latitude', 'ละติจูด']),
      lng: findHeaderIndex(headers, ['Long', 'Lng', 'Longitude', 'ลองจิจูด']),
      map_url: findHeaderIndex(headers, ['Link สาขา', 'Link', 'Google Maps', 'Map Link', 'Url', 'Map']),
      status: findHeaderIndex(headers, ['Status', 'status', 'สถานะ'])
    };

    console.log('🗺️ Header Mapping:', JSON.stringify(headerMap));

    const upsertQuery = `
      INSERT INTO branches (
        id,
        store,
        branch_name,
        province,
        floor,
        phone,
        lat,
        lng,
        map_url,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id)
      DO UPDATE SET
        store = excluded.store,
        branch_name = excluded.branch_name,
        province = excluded.province,
        floor = excluded.floor,
        phone = excluded.phone,
        lat = excluded.lat,
        lng = excluded.lng,
        map_url = excluded.map_url,
        status = excluded.status;
    `;

    let totalRead = 0;
    let totalImported = 0;
    let activeCount = 0;
    let inactiveCount = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      totalRead++;

      let id = getVal(row, headerMap.id);
      const store = getVal(row, headerMap.store);
      const branchName = getVal(row, headerMap.name);
      const province = getVal(row, headerMap.province);
      const floor = getVal(row, headerMap.floor);
      const phone = getVal(row, headerMap.phone);
      const rawLat = getVal(row, headerMap.lat);
      const rawLng = getVal(row, headerMap.lng);
      const mapUrl = getVal(row, headerMap.map_url);
      let status = getVal(row, headerMap.status);

      // Auto assign fallback ID if empty
      if (!id) {
        id = 'C' + String(i).padStart(3, '0');
      }

      // Default status to Active if not explicitly set
      if (!status) {
        status = 'Active';
      }

      // Normalize lat & lng
      const lat = (rawLat && !isNaN(Number(rawLat))) ? Number(rawLat) : null;
      const lng = (rawLng && !isNaN(Number(rawLng))) ? Number(rawLng) : null;

      // Skip row if no branch name
      if (!branchName && !store) {
        console.warn(`Row ${i + 1}: Skipping row with missing branch name and store.`);
        continue;
      }

      await client.execute({
        sql: upsertQuery,
        args: [id, store || 'COVERMARK', branchName || store, province, floor, phone, lat, lng, mapUrl, status]
      });

      totalImported++;
      if (status.toLowerCase() === 'active') {
        activeCount++;
      } else {
        inactiveCount++;
      }
    }

    console.log(`\n========================================`);
    console.log(`✅ Import Summary:`);
    console.log(`- Total Rows Read: ${totalRead}`);
    console.log(`- Total Branches Upserted into Turso: ${totalImported}`);
    console.log(`- Active Branches: ${activeCount}`);
    console.log(`- Inactive Branches: ${inactiveCount}`);
    console.log(`========================================\n`);

  } catch (error) {
    console.error('❌ Error importing from Google Sheet:', error.message);
    process.exit(1);
  }
}

importFromGoogleSheet();
