import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

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

// Seed branch dataset with normalization
const initialBranches = [
  {
    id: 'C001',
    store: 'Central',
    branch_name: 'ห้างเซ็นทรัล ชิดลม',
    province: 'กรุงเทพมหานคร',
    floor: '1',
    phone: '080-070-5220',
    lat: 13.7443044841007,
    lng: 100.544279322671,
    map_url: 'https://maps.app.goo.gl/Chidlom',
    status: 'Active'
  },
  {
    id: 'C002',
    store: 'Central',
    branch_name: 'ห้างเซ็นทรัล ลาดพร้าว',
    province: 'กรุงเทพมหานคร',
    floor: '1',
    phone: '080-070-5221',
    lat: 13.816300,
    lng: 100.561100,
    map_url: 'https://maps.app.goo.gl/Ladprao',
    status: 'Active'
  },
  {
    id: 'C003',
    store: 'Central',
    branch_name: 'ห้างเซ็นทรัล ปิ่นเกล้า',
    province: 'กรุงเทพมหานคร',
    floor: '1',
    phone: '080-070-5222',
    lat: 13.778100,
    lng: 100.476400,
    map_url: 'https://maps.app.goo.gl/Pinklao',
    status: 'Active'
  },
  {
    id: 'C004',
    store: 'Central',
    branch_name: 'ห้างเซ็นทรัล บางนา',
    province: 'กรุงเทพมหานคร',
    floor: '1',
    phone: '080-070-5223',
    lat: 13.668700,
    lng: 100.634600,
    map_url: 'https://maps.app.goo.gl/Bangna',
    status: 'Active'
  },
  {
    id: 'C005',
    store: 'The Mall',
    branch_name: 'เดอะมอลล์ไลฟ์สโตร์ งามวงศ์วาน',
    province: 'นนทบุรี',
    floor: '1',
    phone: '080-070-5224',
    lat: 13.859600,
    lng: 100.542000,
    map_url: 'https://maps.app.goo.gl/Ngamwongwan',
    status: 'Active'
  },
  {
    id: 'C006',
    store: 'The Mall',
    branch_name: 'เดอะมอลล์ไลฟ์สโตร์ ท่าพระ',
    province: 'กรุงเทพมหานคร',
    floor: '1',
    phone: '080-070-5225',
    lat: 13.713100,
    lng: 100.479500,
    map_url: 'https://maps.app.goo.gl/Thaphra',
    status: 'Active'
  },
  {
    id: 'C007',
    store: 'Robinson',
    branch_name: 'โรบินสัน พระราม 9',
    province: 'กรุงเทพมหานคร',
    floor: '1',
    phone: '080-070-5226',
    lat: 13.757800,
    lng: 100.565800,
    map_url: 'https://maps.app.goo.gl/Rama9',
    status: 'Active'
  },
  {
    id: 'C008',
    store: 'Robinson',
    branch_name: 'โรบินสัน ฟิวเจอร์พาร์ค รังสิต',
    province: 'ปทุมธานี',
    floor: 'G',
    phone: '080-070-5227',
    lat: 13.989200,
    lng: 100.617900,
    map_url: 'https://maps.app.goo.gl/Rangsit',
    status: 'Active'
  },
  {
    id: 'C009',
    store: 'Central',
    branch_name: 'เซ็นทรัล เชียงใหม่ (เฟสติวัล)',
    province: 'เชียงใหม่',
    floor: '1',
    phone: '080-070-5228',
    lat: 18.802800,
    lng: 99.018200,
    map_url: 'https://maps.app.goo.gl/ChiangmaiFest',
    status: 'Active'
  },
  {
    id: 'C010',
    store: 'Central',
    branch_name: 'เซ็นทรัล พัทยา บีช',
    province: 'ชลบุรี',
    floor: '1',
    phone: '080-070-5229',
    lat: 12.934700,
    lng: 100.883300,
    map_url: 'https://maps.app.goo.gl/PattayaBeach',
    status: 'Active'
  },
  {
    id: 'C011',
    store: 'Siam Paragon',
    branch_name: 'สยามพารากอน (Beauty Hall)',
    province: 'กรุงเทพมหานคร',
    floor: 'M',
    phone: '080-070-5230',
    lat: 13.746000,
    lng: 100.534800,
    map_url: 'https://maps.app.goo.gl/Paragon',
    status: 'Active'
  },
  {
    id: 'C012',
    store: 'Emporium',
    branch_name: 'เอ็มโพเรียม',
    province: 'กรุงเทพมหานคร',
    floor: 'M',
    phone: '080-070-5231',
    lat: 13.729900,
    lng: 100.569400,
    map_url: 'https://maps.app.goo.gl/Emporium',
    status: 'Active'
  },
  {
    id: 'C013',
    store: 'Central',
    branch_name: 'เซ็นทรัล ขอนแก่น',
    province: 'ขอนแก่น',
    floor: '1',
    phone: '080-070-5232',
    lat: 16.432200,
    lng: 102.824200,
    map_url: 'https://maps.app.goo.gl/KhonKaen',
    status: 'Active'
  },
  {
    id: 'C014',
    store: 'Central',
    branch_name: 'เซ็นทรัล ภูเก็ต ฟลอเรสต้า',
    province: 'ภูเก็ต',
    floor: '1',
    phone: '080-070-5233',
    lat: 7.892000,
    lng: 98.367000,
    map_url: 'https://maps.app.goo.gl/PhuketFloresta',
    status: 'Active'
  },
  {
    id: 'C099',
    store: 'Central',
    branch_name: 'สาขาทดสอบปิดปรับปรุง (Inactive Branch)',
    province: 'กรุงเทพมหานคร',
    floor: '2',
    phone: '080-000-0000',
    lat: 13.750000,
    lng: 100.500000,
    map_url: 'https://maps.app.goo.gl/Inactive',
    status: 'Inactive'
  }
];

async function seedDatabase() {
  console.log('🌱 Seeding branches into Turso database...');

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

  try {
    let successCount = 0;

    for (const b of initialBranches) {
      // Normalize data
      const id = String(b.id || '').trim();
      const store = String(b.store || '').trim();
      const branchName = String(b.branch_name || '').trim();
      const province = String(b.province || '').trim();
      const floor = b.floor !== undefined && b.floor !== null ? String(b.floor).trim() : '';
      const phone = b.phone !== undefined && b.phone !== null ? String(b.phone).trim() : '';
      const lat = b.lat !== null && b.lat !== '' && !isNaN(Number(b.lat)) ? Number(b.lat) : null;
      const lng = b.lng !== null && b.lng !== '' && !isNaN(Number(b.lng)) ? Number(b.lng) : null;
      const mapUrl = b.map_url !== undefined && b.map_url !== null ? String(b.map_url).trim() : '';
      const status = String(b.status || 'Active').trim();

      if (!id || !branchName) {
        console.warn(`⚠️ Skipping invalid branch record: ID=${id}, Name=${branchName}`);
        continue;
      }

      await client.execute({
        sql: upsertQuery,
        args: [id, store, branchName, province, floor, phone, lat, lng, mapUrl, status]
      });

      successCount++;
    }

    console.log(`✅ Successfully seeded/upserted ${successCount} branches into Turso!`);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedDatabase();
