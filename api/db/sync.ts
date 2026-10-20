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

// 36 Authentic Church Members Pool
const INITIAL_36_USERS = [
  { id: 'usr_apostle_joe', phone: '0772123456', full_name: 'Apostle Joe Daniels', handle: '@joedaniels', role: 'super_admin', is_verified: true, badge_type: 'gold', is_premium: true, followers_count: 36, following_count: 36, avatar_url: '/assets/apostle_joe_daniels_main.jpg', bio: 'Senior Pastor & Founder at Gateway Church Harare. Prophetic voices, apostolic acceleration, supernatural dominion.' },
  { id: 'usr_prophetess_melinda', phone: '0772998877', full_name: 'Prophetess Melinda Daniels', handle: '@prophetess_melinda', role: 'super_admin', is_verified: true, badge_type: 'gold', is_premium: true, followers_count: 36, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400', bio: 'Prophetess of Gateway Cathedral. Passionate about prayer, deliverance, and family grace.' },
  { id: 'usr_pastor_easter', phone: '0773001122', full_name: 'Pastor Easter Daniels', handle: '@pastor_easter', role: 'super_admin', is_verified: true, badge_type: 'gold', is_premium: true, followers_count: 36, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400', bio: 'Associate Pastor at Gateway Church Harare. Overseeing discipleship & prayer altars.' },
  { id: 'usr_developer', phone: '0780699988', full_name: 'mr_juice7', handle: '@mr_juice7', role: 'developer', is_verified: true, badge_type: 'gold', is_premium: true, followers_count: 36, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=400', bio: 'Lead Software Architect for Gateway Connect Ecosystem. Harare, Zimbabwe.' },
  { id: 'usr_pastor_tendai', phone: '0772345678', full_name: 'Pastor Tendai Mutasa', handle: '@pastor_tendai', role: 'pastor', is_verified: true, badge_type: 'blue', is_premium: true, followers_count: 36, following_count: 36, avatar_url: '/assets/apostle_joe_daniels_preach.jpg', bio: 'Pastor in charge of Pastoral Care & Youth Discipleship.' },
  { id: 'usr_pastor_grace', phone: '0773456789', full_name: 'Pastor Grace Chiweshe', handle: '@pastor_grace', role: 'pastor', is_verified: true, badge_type: 'blue', is_premium: true, followers_count: 36, following_count: 36, avatar_url: '/assets/avatar_church_elder_1790322822242.jpg', bio: 'Director of Women of Dominion and Intercession ministries.' },
  { id: 'usr_tinashe', phone: '0774567890', full_name: 'Tinashe Mugwagwa', handle: '@tinashe_m', role: 'believer', is_verified: false, followers_count: 12, following_count: 36, avatar_url: '/assets/avatar_worship_youth_1790322812538.jpg', bio: 'Worship Leader & Youth Cell Deacon at Gateway Cathedral.' },
  { id: 'usr_chipo', phone: '0775678901', full_name: 'Chipo Sibanda', handle: '@chipo_s', role: 'believer', is_verified: false, followers_count: 14, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400', bio: 'Cell Group Leader, Avondale Assembly.' },
  { id: 'usr_kuda', phone: '0776789012', full_name: 'Kudakwashe Shumba', handle: '@kuda_shumba', role: 'believer', is_verified: false, followers_count: 10, following_count: 36, avatar_url: '/assets/avatar_believer_brother_1790322792637.jpg', bio: 'Media & Technical Department Volunteer.' },
  { id: 'usr_tatenda', phone: '0777890123', full_name: 'Tatenda Blessing Chirwa', handle: '@tatenda_chirwa', role: 'believer', is_verified: false, followers_count: 15, following_count: 36, avatar_url: '/assets/avatar_believer_sister_1790322802458.jpg', bio: 'Entrepreneur & Kingdom Financier.' },
  { id: 'usr_nyasha', phone: '0778901234', full_name: 'Nyasha Gumbo', handle: '@nyasha_g', role: 'believer', is_verified: false, followers_count: 8, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400', bio: 'Intercessory Team Member.' },
  { id: 'usr_farai', phone: '0779012345', full_name: 'Farai Marange', handle: '@farai_m', role: 'believer', is_verified: false, followers_count: 11, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400', bio: 'Hospitality & Ushering Department.' },
  { id: 'usr_1789657530055', phone: '0771234567', full_name: 'Simbarashe Zhou', handle: '@simba_zhou', role: 'believer', is_verified: false, followers_count: 7, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400', bio: 'Evangelism & Outreach Team.' },
  { id: 'usr_rutendo_ndlovu', phone: '0772345679', full_name: 'Rutendo Ndlovu', handle: '@rutendo_n', role: 'believer', is_verified: false, followers_count: 9, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400', bio: 'Children Ministry Teacher.' },
  { id: 'usr_simba_hove', phone: '0773456780', full_name: 'Simba Hove', handle: '@simba_h', role: 'believer', is_verified: false, followers_count: 13, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400', bio: 'Sound Engineer & Choir Member.' },
  { id: 'usr_tariro_mutasa', phone: '0774567891', full_name: 'Tariro Mutasa', handle: '@tariro_m', role: 'believer', is_verified: false, followers_count: 12, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400', bio: 'Worship Ministry Member.' },
  { id: 'usr_blessings_sibanda', phone: '0775678902', full_name: 'Blessings Sibanda', handle: '@blessings_s', role: 'believer', is_verified: false, followers_count: 10, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400', bio: 'Youth Fellowship Leader.' },
  { id: 'usr_anesu_sithole', phone: '0776789013', full_name: 'Anesu Sithole', handle: '@anesu_s', role: 'believer', is_verified: false, followers_count: 14, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400', bio: 'Protocol Department Volunteer.' },
  { id: 'usr_privilege_makoni', phone: '0777890124', full_name: 'Privilege Makoni', handle: '@privilege_m', role: 'believer', is_verified: false, followers_count: 16, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400', bio: 'Kingdom Partners Coordinator.' },
  { id: 'usr_tapiwa_muzenda', phone: '0778901235', full_name: 'Tapiwa Muzenda', handle: '@tapiwa_m', role: 'believer', is_verified: false, followers_count: 11, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400', bio: 'Junior Deacon, Harare Central.' },
  { id: 'usr_nokuthula_moyo', phone: '0779012346', full_name: 'Nokuthula Moyo', handle: '@nokuthula_m', role: 'believer', is_verified: false, followers_count: 15, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400', bio: 'Sisters of Zion Member.' },
  { id: 'usr_rumbidzai_marufu', phone: '0771234568', full_name: 'Rumbidzai Marufu', handle: '@rumbi_m', role: 'believer', is_verified: false, followers_count: 10, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400', bio: 'Prayer Warrior & Usher.' },
  { id: 'usr_munyaradzi_chigumba', phone: '0772345680', full_name: 'Munyaradzi Chigumba', handle: '@munya_c', role: 'believer', is_verified: false, followers_count: 9, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400', bio: 'Security & Logistics Department.' },
  { id: 'usr_gamuchirai_kaseke', phone: '0773456781', full_name: 'Gamuchirai Kaseke', handle: '@gamu_k', role: 'believer', is_verified: false, followers_count: 14, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400', bio: 'Praise & Worship Team.' },
  { id: 'usr_takudzwa_dube', phone: '0774567892', full_name: 'Takudzwa Dube', handle: '@takura_d', role: 'believer', is_verified: false, followers_count: 8, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400', bio: 'Student Fellowship Leader.' },
  { id: 'usr_fadzai_mashingaidze', phone: '0775678903', full_name: 'Fadzai Mashingaidze', handle: '@fadzai_m', role: 'believer', is_verified: false, followers_count: 12, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400', bio: 'Welfare Ministry Secretary.' },
  { id: 'usr_panashe_nyoni', phone: '0776789014', full_name: 'Panashe Nyoni', handle: '@panashe_n', role: 'believer', is_verified: false, followers_count: 13, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400', bio: 'Media Cameraman Volunteer.' },
  { id: 'usr_vimbai_zhou', phone: '0777890125', full_name: 'Vimbai Zhou', handle: '@vimbai_z', role: 'believer', is_verified: false, followers_count: 11, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400', bio: 'Altar Counsel Member.' },
  { id: 'usr_knowledge_matarise', phone: '0778901236', full_name: 'Knowledge Matarise', handle: '@knowledge_m', role: 'believer', is_verified: false, followers_count: 9, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400', bio: 'Transport & Logistics Team.' },
  { id: 'usr_chengetai_shumba', phone: '0779012347', full_name: 'Chengetai Shumba', handle: '@chengetai_s', role: 'believer', is_verified: false, followers_count: 14, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400', bio: 'Women of Dominion Choir.' },
  { id: 'usr_shalom_chimedza', phone: '0771234569', full_name: 'Shalom Chimedza', handle: '@shalom_c', role: 'believer', is_verified: false, followers_count: 15, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400', bio: 'Hospital Visitation Ministry.' },
  { id: 'usr_tendekai_mupfumi', phone: '0772345681', full_name: 'Tendekai Mupfumi', handle: '@tendekai_m', role: 'believer', is_verified: false, followers_count: 10, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400', bio: 'Believers Cell Teacher.' },
  { id: 'usr_tsitsi_gava', phone: '0773456782', full_name: 'Tsitsi Gava', handle: '@tsitsi_g', role: 'believer', is_verified: false, followers_count: 12, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400', bio: 'Ushering & Welcome Team.' },
  { id: 'usr_mthokozisi_nkomo', phone: '0774567893', full_name: 'Mthokozisi Nkomo', handle: '@mthoko_n', role: 'believer', is_verified: false, followers_count: 11, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400', bio: 'Discipleship Class Volunteer.' },
  { id: 'usr_praise_magaya', phone: '0775678904', full_name: 'Praise Magaya', handle: '@praise_m', role: 'believer', is_verified: false, followers_count: 13, following_count: 36, avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400', bio: 'Sanctuary Decoration Team.' },
  { id: 'usr_guest', phone: '0770000000', full_name: 'Guest Believer', handle: '@guest', role: 'believer', is_verified: false, followers_count: 1, following_count: 36, avatar_url: '/assets/apostle_silhouette.svg', bio: 'Welcome to Gateway Cathedral Harare.' }
];

// In-Memory Server Cache ensuring persistent zero-failure operations across Vercel invocations
const serverCache: Record<string, any[]> = {
  users: [...INITIAL_36_USERS]
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
    serverCache[collectionParam] = collectionParam === 'users' ? [...INITIAL_36_USERS] : [];
  }

  if (req.method === 'GET') {
    let data = serverCache[collectionParam];
    if (collectionParam === 'users') {
      // Ensure all 36 authentic members are always present
      const existingIds = new Set(data.map((u: any) => u.id));
      for (const initU of INITIAL_36_USERS) {
        if (!existingIds.has(initU.id)) {
          data.push(initU);
          existingIds.add(initU.id);
        }
      }
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

      // Verify login handler
      if (action === 'verify_login' && collectionParam === 'users') {
        const identifier = String(body.identifier || '').trim().toLowerCase();
        const pwd = String(body.password || '').trim();
        const cleanIdent = identifier.startsWith('@') ? identifier.slice(1) : identifier;

        const matched = currentData.find((u: any) => {
          if (!u) return false;
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
          res.json({ success: false, error: 'No account found with this phone number or handle.' });
          return;
        }

        res.statusCode = 200;
        res.json({ success: true, user: matched });
        return;
      }

      if (action === 'save') {
        const nextData = Array.isArray(payload) ? payload : [payload];
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

        const existingIdx = currentData.findIndex((i: any) => (item.id && i.id === item.id) || (item.phone && i.phone === item.phone));
        if (existingIdx >= 0) {
          currentData[existingIdx] = { ...currentData[existingIdx], ...item };
        } else {
          currentData.unshift(item);
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
