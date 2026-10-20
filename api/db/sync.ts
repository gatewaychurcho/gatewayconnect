import type { IncomingMessage, ServerResponse } from 'node:http';
import crypto from 'node:crypto';

type VercelRequest = IncomingMessage & { body?: any; query?: Record<string, string>; method?: string; url?: string };
type VercelResponse = ServerResponse & { status: (code: number) => VercelResponse; json: (body: unknown) => void };

function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk.toString(); });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

// 22 Artificially-generated mock accounts to permanently purge from all database layers
export const FAKE_MOCK_USER_IDS = new Set([
  'usr_rutendo_ndlovu',
  'usr_simba_hove',
  'usr_tariro_mutasa',
  'usr_blessings_sibanda',
  'usr_anesu_sithole',
  'usr_privilege_makoni',
  'usr_tapiwa_muzenda',
  'usr_nokuthula_moyo',
  'usr_rumbidzai_marufu',
  'usr_munyaradzi_chigumba',
  'usr_gamuchirai_kaseke',
  'usr_takudzwa_dube',
  'usr_fadzai_mashingaidze',
  'usr_panashe_nyoni',
  'usr_vimbai_zhou',
  'usr_knowledge_matarise',
  'usr_chengetai_shumba',
  'usr_shalom_chimedza',
  'usr_tendekai_mupfumi',
  'usr_tsitsi_gava',
  'usr_mthokozisi_nkomo',
  'usr_praise_magaya'
]);

// Authentic Church Foundation Members & Leaders
export const AUTHENTIC_CHURCH_USERS = [
  {
    id: 'usr_apostle_joe',
    phone: '0772123456',
    password: 'Pastor2026!',
    full_name: 'Apostle Joe Daniels',
    handle: '@apostle_joe_daniels',
    role: 'super_admin',
    is_verified: true,
    badge_type: 'gold',
    is_premium: true,
    followers_count: 36,
    following_count: 2,
    avatar_url: '/assets/apostle_joe_daniels_main.jpg',
    cell_group: 'Apostolic Directorate',
    bio: 'Senior Pastor & Founder at Gateway Church Harare. Prophetic voices, apostolic acceleration, supernatural dominion.',
    location: 'Harare, Zimbabwe',
    member_id: 'GCZ-001-FOUNDER',
    created_at: '2020-01-01T00:00:00Z',
    saved_verses: ['Isaiah 60:1', 'Romans 8:37']
  },
  {
    id: 'usr_prophetess_melinda',
    phone: '0775112233',
    password: 'Melinda2026!',
    full_name: 'Prophetess Melinda Daniels',
    handle: '@prophetess_melinda',
    role: 'super_admin',
    is_verified: true,
    badge_type: 'gold',
    is_premium: true,
    followers_count: 36,
    following_count: 2,
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
    cell_group: 'Women of Dominion & Prophetic Council',
    bio: 'Prophetess of Gateway Cathedral. Passionate about prayer, deliverance, and family grace.',
    location: 'Harare, Zimbabwe',
    member_id: 'GCZ-002-FOUNDER',
    created_at: '2020-01-01T00:00:00Z',
    saved_verses: ['Jeremiah 29:11', 'Psalms 91:1']
  },
  {
    id: 'usr_pastor_easter',
    phone: '0771889900',
    password: 'Easter2026!',
    full_name: 'Pastor Easter',
    handle: '@pastor_easter',
    role: 'admin',
    is_verified: true,
    badge_type: 'gold',
    is_premium: true,
    followers_count: 12,
    following_count: 2,
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400',
    cell_group: 'Pastoral Council',
    bio: 'Associate Pastor at Gateway Church Harare. Overseeing discipleship & prayer altars.',
    location: 'Harare, Zimbabwe',
    member_id: 'GCZ-003-ADMIN',
    created_at: '2020-06-01T00:00:00Z',
    saved_verses: ['1 Corinthians 15:58', 'Colossians 1:28']
  },
  {
    id: 'usr_developer',
    phone: '0780699988',
    password: 'juice2026',
    full_name: 'mr_juice7',
    handle: '@mr_juice7',
    role: 'developer',
    is_verified: true,
    badge_type: 'gold',
    is_premium: true,
    followers_count: 36,
    following_count: 4,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    cell_group: 'Gateway Tech Ministry',
    bio: 'Platform Architect & Kingdom Technologist. Engineering scalable cloud solutions for Gateway Connect ecosystem.',
    location: 'Harare, Zimbabwe',
    member_id: 'GCZ-DEV-001',
    created_at: '2023-05-15T00:00:00Z',
    saved_verses: ['Psalms 23:1', 'Proverbs 3:5']
  },
  {
    id: 'usr_pastor_tendai',
    phone: '0773998877',
    password: 'Pastor2026!',
    full_name: 'Pastor Tendai Moyo',
    handle: '@pastor_tendai',
    role: 'moderator',
    is_verified: true,
    badge_type: 'silver',
    is_premium: true,
    followers_count: 15,
    following_count: 3,
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    cell_group: 'Harare Central Hub',
    bio: 'Harare Central Hub Overseer. Devoted to pastoral counseling, cell multiplication, and fiery intercessory prayer.',
    location: 'Harare Central, Zimbabwe',
    member_id: 'GCZ-MOD-442',
    created_at: '2022-08-10T00:00:00Z',
    saved_verses: ['Matthew 28:19', 'Acts 2:42']
  },
  {
    id: 'usr_pastor_grace',
    phone: '0775889911',
    password: 'Grace2026!',
    full_name: 'Pastor Grace Daniels',
    handle: '@pastor_grace',
    role: 'moderator',
    is_verified: true,
    badge_type: 'gold',
    is_premium: true,
    followers_count: 14,
    following_count: 2,
    avatar_url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=200&auto=format&fit=crop&q=80',
    cell_group: 'Women of Honor Fellowship',
    bio: 'Mother in the house, leader in Women of Honor. Raising believers grounded in holiness, grace, and prayer.',
    location: 'Harare, Zimbabwe',
    member_id: 'GCZ-MOD-002',
    created_at: '2021-03-12T00:00:00Z',
    saved_verses: ['Proverbs 31:25', 'Luke 1:45']
  },
  {
    id: 'usr_tinashe',
    phone: '0712345678',
    password: 'Member2026!',
    full_name: 'Tinashe Chikwava',
    handle: '@tinashe_zim',
    role: 'member',
    is_verified: true,
    badge_type: 'blue',
    is_premium: true,
    followers_count: 8,
    following_count: 4,
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    cell_group: 'Bulawayo North Cell',
    bio: 'Bulawayo tech entrepreneur & active intercessor. Partnering in the 2026 Cathedral Building Project.',
    location: 'Bulawayo, Zimbabwe',
    member_id: 'GCZ-MEM-8921',
    created_at: '2023-01-14T00:00:00Z',
    saved_verses: ['Psalms 91:1', 'Philippians 4:13']
  },
  {
    id: 'usr_chipo',
    phone: '0774334455',
    password: 'Chipo2026!',
    full_name: 'Chipo Ruvimbo Mandaza',
    handle: '@chipo_mandaza',
    role: 'member',
    is_verified: true,
    badge_type: 'blue',
    is_premium: true,
    followers_count: 9,
    following_count: 3,
    avatar_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&auto=format&fit=crop&q=80',
    cell_group: 'Worship & Creative Arts Hub',
    bio: 'Gateway Praise & Worship Lead. Living to worship Jesus in spirit and in truth. Songwriter & psalmist.',
    location: 'Harare, Zimbabwe',
    member_id: 'GCZ-MEM-4311',
    created_at: '2023-07-22T00:00:00Z',
    saved_verses: ['Psalms 100:1-5', 'John 4:24']
  },
  {
    id: 'usr_kuda',
    phone: '0782112244',
    password: 'Kuda2026!',
    full_name: 'Kudakwashe Sibanda',
    handle: '@kuda_sibanda',
    role: 'member',
    is_verified: true,
    badge_type: 'blue',
    is_premium: true,
    followers_count: 7,
    following_count: 4,
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    cell_group: 'Campus Ignite Hub',
    bio: 'UZ Campus Fellowship President. Igniting young hearts with the fire of the Holy Spirit across universities.',
    location: 'Mount Pleasant, Harare',
    member_id: 'GCZ-MEM-9920',
    created_at: '2024-02-10T00:00:00Z',
    saved_verses: ['1 Timothy 4:12', 'Joel 2:28']
  },
  {
    id: 'usr_tatenda',
    phone: '0778556677',
    password: 'Tatenda2026!',
    full_name: 'Tatenda Blessing Chirwa',
    handle: '@tatenda_chirwa',
    role: 'member',
    is_verified: false,
    badge_type: 'none',
    is_premium: true,
    followers_count: 6,
    following_count: 3,
    avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
    cell_group: 'Business & Professionals Network',
    bio: 'Marketplace partner & agribusiness founder in Mashonaland East. Standing on Deuteronomy 8:18.',
    location: 'Marondera, Zimbabwe',
    member_id: 'GCZ-MEM-1044',
    created_at: '2023-11-05T00:00:00Z',
    saved_verses: ['Deuteronomy 8:18', 'Malachi 3:10']
  },
  {
    id: 'usr_nyasha',
    phone: '0719887766',
    password: 'Nyasha2026!',
    full_name: 'Nyasha Lorraine Gumbo',
    handle: '@nyasha_gumbo',
    role: 'member',
    is_verified: true,
    badge_type: 'blue',
    is_premium: true,
    followers_count: 8,
    following_count: 3,
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    cell_group: 'Gateway Media & Broadcast',
    bio: 'Broadcast director. Connecting thousands of diaspora believers to the prophetic altar of Gateway Church.',
    location: 'Harare, Zimbabwe',
    member_id: 'GCZ-MEM-5512',
    created_at: '2023-09-18T00:00:00Z',
    saved_verses: ['Mark 16:15', 'Isaiah 52:7']
  },
  {
    id: 'usr_farai',
    phone: '0733221100',
    password: 'Farai2026!',
    full_name: 'Farai Takawira',
    handle: '@farai_taka',
    role: 'member',
    is_verified: false,
    badge_type: 'none',
    is_premium: false,
    followers_count: 5,
    following_count: 3,
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    cell_group: 'Chitungwiza Community Cell',
    bio: 'Dedicated to serving in the house of the Lord. Believing God for supernatural acceleration in 2026.',
    location: 'Chitungwiza, Zimbabwe',
    member_id: 'GCZ-MEM-7731',
    created_at: '2024-04-01T00:00:00Z',
    saved_verses: ['Psalms 84:10', 'Colossians 3:23']
  },
  {
    id: 'usr_1789657530055',
    phone: '0771238269',
    password: 'Jason2026!',
    full_name: 'Jason Daniels',
    handle: '@jason_daniels',
    role: 'member',
    is_verified: true,
    badge_type: 'blue',
    is_premium: true,
    followers_count: 7,
    following_count: 3,
    avatar_url: '/assets/apostle_joe_daniels_main.jpg',
    cell_group: 'Apostolic Youth Directorate',
    bio: 'Gateway Cathedral Youth & Prophetic Ministry Partner.',
    location: 'Harare, Zimbabwe',
    member_id: 'GCZ-MEM-8269',
    created_at: '2026-10-07T10:00:00Z',
    saved_verses: ['Philippians 4:13', 'Romans 8:28']
  },
  {
    id: 'usr_guest',
    phone: '0770000000',
    password: 'Guest2026!',
    full_name: 'Guest Believer',
    handle: '@guest_believer',
    role: 'guest',
    is_verified: false,
    badge_type: 'none',
    is_premium: false,
    followers_count: 0,
    following_count: 0,
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    cell_group: 'Visitor / Guest',
    bio: 'Welcome to Gateway Cathedral Harare.',
    location: 'Harare, Zimbabwe',
    member_id: 'GCZ-GST-000',
    created_at: '2026-01-01T00:00:00Z',
    saved_verses: []
  }
];

// Persistent server-side in-memory cache initialized strictly with authentic church profiles
const serverCache: Record<string, any[]> = {
  users: [...AUTHENTIC_CHURCH_USERS]
};

const ALLOWED_COLLECTIONS = new Set(['posts', 'users', 'settings', 'donations', 'gallery', 'prayers', 'orders', 'follows', 'calls']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

  const urlObj = new URL(req.url || '/', 'http://localhost');
  const collectionParam = (urlObj.searchParams.get('collection') || 'users').toLowerCase();

  if (!ALLOWED_COLLECTIONS.has(collectionParam)) {
    res.statusCode = 400;
    res.json({ error: `Unknown collection '${collectionParam}'` });
    return;
  }

  // Ensure collection exists in server cache
  if (!serverCache[collectionParam]) {
    serverCache[collectionParam] = collectionParam === 'users' ? [...AUTHENTIC_CHURCH_USERS] : [];
  }

  // Always sanitize out any fake mock IDs from users collection
  if (collectionParam === 'users') {
    serverCache.users = serverCache.users.filter((u: any) => u && u.id && !FAKE_MOCK_USER_IDS.has(u.id));
  }

  if (req.method === 'GET') {
    let data = serverCache[collectionParam];
    if (collectionParam === 'users') {
      // Ensure authentic church leaders and founders are always present
      const existingIds = new Set(data.map((u: any) => u.id));
      for (const initU of AUTHENTIC_CHURCH_USERS) {
        if (!existingIds.has(initU.id)) {
          data.push(initU);
          existingIds.add(initU.id);
        }
      }
      // Guarantee zero fake mock profiles
      data = data.filter((u: any) => u && !FAKE_MOCK_USER_IDS.has(u.id));
      serverCache.users = data;
    }

    res.statusCode = 200;
    res.json({ success: true, collection: collectionParam, count: data.length, data });
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = req.body && typeof req.body === 'object' ? req.body : await readBody(req);
      const action = (body.action || 'upsert') as string;
      const payload = body.data;

      let currentData = serverCache[collectionParam];

      // Merge pool: Allows client (e.g. dev account browser with all registered users) to push real profiles to server
      if ((action === 'merge_pool' || action === 'sync_pool') && collectionParam === 'users') {
        const incoming = Array.isArray(payload) ? payload : [payload];
        for (const item of incoming) {
          if (!item || (!item.id && !item.phone)) continue;
          if (FAKE_MOCK_USER_IDS.has(item.id)) continue; // Strictly reject fake personas
          const existingIdx = currentData.findIndex((i: any) => (item.id && i.id === item.id) || (item.phone && i.phone === item.phone));
          if (existingIdx >= 0) {
            currentData[existingIdx] = { ...currentData[existingIdx], ...item };
          } else {
            currentData.push(item);
          }
        }
        currentData = currentData.filter((u: any) => u && !FAKE_MOCK_USER_IDS.has(u.id));
        serverCache.users = currentData;
        res.statusCode = 200;
        res.json({ success: true, action: 'merge_pool', count: currentData.length, data: currentData });
        return;
      }

      // Verify login handler
      if (action === 'verify_login' && collectionParam === 'users') {
        const identifier = String(body.identifier || '').trim().toLowerCase();
        const pwd = String(body.password || '').trim();
        const cleanIdent = identifier.startsWith('@') ? identifier.slice(1) : identifier;

        const matched = currentData.find((u: any) => {
          if (!u || FAKE_MOCK_USER_IDS.has(u.id)) return false;
          const uPhone = String(u.phone || '').replace(/[^0-9]/g, '');
          const qPhone = identifier.replace(/[^0-9]/g, '');
          const phoneMatch = uPhone && qPhone && (uPhone.endsWith(qPhone) || qPhone.endsWith(uPhone));
          const emailMatch = u.email && String(u.email).toLowerCase() === identifier;
          const handleMatch = u.handle && (
            String(u.handle).toLowerCase() === identifier ||
            String(u.handle).toLowerCase() === `@${cleanIdent}` ||
            String(u.handle).toLowerCase().replace('@', '') === cleanIdent
          );
          return phoneMatch || emailMatch || handleMatch;
        });

        if (!matched) {
          res.statusCode = 404;
          res.json({ success: false, error: 'No authentic account found with this phone number or handle.' });
          return;
        }

        res.statusCode = 200;
        res.json({ success: true, user: matched });
        return;
      }

      if (action === 'save') {
        let nextData = Array.isArray(payload) ? payload : [payload];
        if (collectionParam === 'users') {
          nextData = nextData.filter((u: any) => u && !FAKE_MOCK_USER_IDS.has(u.id));
        }
        serverCache[collectionParam] = nextData;
        res.statusCode = 200;
        res.json({ success: true, action: 'save', count: nextData.length });
        return;
      }

      if (action === 'append' || action === 'upsert') {
        const item = payload as any;
        if (!item || (!item.id && !item.phone)) {
          res.statusCode = 400;
          res.json({ error: 'Item id or phone is required' });
          return;
        }

        if (collectionParam === 'users' && FAKE_MOCK_USER_IDS.has(item.id)) {
          res.statusCode = 400;
          res.json({ error: 'Mock accounts are prohibited' });
          return;
        }

        const existingIdx = currentData.findIndex((i: any) => (item.id && i.id === item.id) || (item.phone && i.phone === item.phone));
        if (existingIdx >= 0) {
          currentData[existingIdx] = { ...currentData[existingIdx], ...item };
        } else {
          currentData.unshift(item);
        }

        if (collectionParam === 'users') {
          serverCache.users = currentData.filter((u: any) => u && !FAKE_MOCK_USER_IDS.has(u.id));
          currentData = serverCache.users;
        }

        res.statusCode = 200;
        res.json({ success: true, action, item, totalCount: currentData.length });
        return;
      }

      if (action === 'delete') {
        const targetId = body.id || (payload && (payload as any).id);
        if (targetId) {
          serverCache[collectionParam] = currentData.filter((i: any) => i.id !== targetId);
        }
        res.statusCode = 200;
        res.json({ success: true, action: 'delete', deletedId: targetId });
        return;
      }

      res.statusCode = 200;
      res.json({ success: true, count: currentData.length });
    } catch (err) {
      res.statusCode = 200;
      res.json({ success: false, error: err instanceof Error ? err.message : 'Error handled safely' });
    }
    return;
  }

  res.statusCode = 405;
  res.json({ error: 'Method not allowed' });
}
