import { 
  User, 
  Sermon, 
  Devotional, 
  CommunityGroup, 
  PrayerRequest, 
  ChurchEvent, 
  Product, 
  Donation, 
  ServiceBooking, 
  Order, 
  JoeVibesSubmission, 
  PushNotification, 
  Testimony,
  PremiumPlan
} from '../types';

export const DEFAULT_PREMIUM_PLANS: PremiumPlan[] = [
  {
    id: 'plan_3m',
    durationMonths: 3,
    title: '3 Months Kingdom Pass',
    priceUsd: 30,
    priceZig: 440,
    savings: 'Standard Plan'
  },
  {
    id: 'plan_6m',
    durationMonths: 6,
    title: '6 Months Apostolic Masterclass',
    priceUsd: 60,
    priceZig: 880,
    popular: true,
    savings: 'Most Popular'
  },
  {
    id: 'plan_1y',
    durationMonths: 12,
    title: '1 Year Full Ministry Covenant Access',
    priceUsd: 120,
    priceZig: 1750,
    savings: 'Best Value'
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_super_admin',
    phone: '0772123456',
    full_name: 'Apostle Joe Daniels',
    role: 'super_admin',
    avatar_url: '/assets/apostle_joe_daniels_main.jpg',
    cell_group: 'Apostolic Directorate',
    is_verified: true,
    badge_type: 'gold',
    is_premium: true,
    member_id: 'GCZ-001-FOUNDER',
    baptism_date: '1998-04-12',
    created_at: '2020-01-01T00:00:00Z',
    saved_verses: ['John 1:1', 'Romans 8:28', 'Isaiah 40:31'],
    offline_sermon_ids: ['sermon_1', 'sermon_2']
  },
  {
    id: 'usr_developer',
    phone: '0771445642',
    full_name: 'Lead System Developer (mrjuice017)',
    role: 'developer',
    avatar_url: '/assets/apostle_joe_daniels_podcast.jpg',
    cell_group: 'Gateway Tech Ministry',
    is_verified: true,
    badge_type: 'gold',
    is_premium: true,
    member_id: 'GCZ-DEV-001',
    created_at: '2023-05-15T00:00:00Z',
    saved_verses: ['Psalms 23:1', 'Proverbs 3:5']
  },
  {
    id: 'usr_moderator',
    phone: '0773998877',
    full_name: 'Pastor Tendai Moyo',
    role: 'moderator',
    referral_code: 'jd#mode',
    avatar_url: '/assets/apostle_joe_daniels_grad.jpg',
    cell_group: 'Harare Central Hub',
    is_verified: true,
    badge_type: 'silver',
    is_premium: true,
    member_id: 'GCZ-MOD-442',
    created_at: '2022-08-10T00:00:00Z',
    saved_verses: ['Matthew 28:19']
  },
  {
    id: 'usr_member',
    phone: '0712345678',
    full_name: 'Tinashe Chikwava',
    role: 'member',
    avatar_url: '/assets/apostle_joe_daniels_main.jpg',
    cell_group: 'Bulawayo North Cell',
    is_verified: true,
    badge_type: 'blue',
    is_premium: true,
    premium_expires_at: '2026-12-31',
    member_id: 'GCZ-MEM-8921',
    baptism_date: '2021-11-20',
    created_at: '2023-01-14T00:00:00Z',
    saved_verses: ['Psalms 91:1', 'Philippians 4:13']
  },
  {
    id: 'usr_guest',
    phone: '0770000000',
    full_name: 'Guest Believer',
    role: 'guest',
    avatar_url: '',
    cell_group: 'Visitor / Guest',
    is_verified: false,
    badge_type: 'none',
    is_premium: false,
    member_id: 'GCZ-GST-000',
    created_at: '2026-01-01T00:00:00Z',
    saved_verses: []
  }
];

export const MOCK_SERMONS: Sermon[] = [
  {
    id: 'sermon_1',
    title: 'Supernatural Acceleration: Stepping Into Divine Speed',
    speaker: 'Apostle Joe Daniels',
    date: 'Last Sunday • 10:00 AM CAT',
    series: 'Prophetic Dimensions 2026',
    duration: '1h 14m',
    youtube_id: 'Tde5rGafeBE',
    thumbnail_url: '/assets/apostle_joe_daniels_preach.jpg',
    scriptures: ['1 Kings 18:46', 'Amos 9:13', 'Habakkuk 2:3'],
    description: 'When the hand of the Lord rests upon a believer, divine acceleration defies human logic. Hear how God is shifting families and businesses in Zimbabwe and the diaspora.',
    view_count: 14200,
    is_live: true,
    is_premium: false,
    notes: 'Key Takeaways:\n1. The hand of God brings effortless speed.\n2. Elijah outran the chariot of Ahab.\n3. Your prayer life is your engine of supernatural lift.'
  },
  {
    id: 'sermon_2',
    title: 'Breaking Generational Limitations Through Kingdom Covenant',
    speaker: 'Apostle Joe Daniels',
    date: 'Aug 27, 2026',
    series: 'Covenant Secrets',
    duration: '58m',
    snippet_duration: '0:45 Preview',
    is_premium: true,
    unlock_price_usd: 5,
    youtube_id: 'LXb3EKWsInQ',
    thumbnail_url: '/assets/apostle_joe_daniels_grad.jpg',
    scriptures: ['Galatians 3:13-14', 'Deuteronomy 28:1-14'],
    description: 'Exclusive Apostolic Masterclass: Understand the legal spiritual authority of the blood of Jesus to sever ancestry setbacks and activate generational blessings.',
    view_count: 9850,
    notes: 'Blood covenant supersedes earthly decree. Stand fast in liberty.'
  },
  {
    id: 'sermon_3',
    title: 'The Mystery of Seed & Harvest in Famine Seasons',
    speaker: 'Apostle Joe Daniels',
    date: 'Aug 20, 2026',
    series: 'Kingdom Economics',
    duration: '1h 05m',
    snippet_duration: '0:45 Preview',
    is_premium: true,
    unlock_price_usd: 5,
    youtube_id: 'fJ9rUzIMcZQ',
    thumbnail_url: '/assets/apostle_joe_daniels_podcast.jpg',
    scriptures: ['Genesis 26:12', '2 Corinthians 9:6-10'],
    description: 'Isaac sowed in the land of drought and reaped a hundredfold in the same year because he trusted the covenant.',
    view_count: 12400
  },
  {
    id: 'sermon_4',
    title: 'Empowered by the Holy Spirit: Walking in Gifts & Wisdom',
    speaker: 'Pastor Grace Daniels',
    date: 'Aug 13, 2026',
    series: 'Holy Ghost Encounter',
    duration: '45m',
    youtube_id: 'kJQP7kiw5Fk',
    thumbnail_url: '/assets/apostle_joe_daniels_preach.jpg',
    scriptures: ['Acts 1:8', '1 Corinthians 12:4-11'],
    description: 'The Holy Spirit is not just power for the pulpit, but divine intelligence for your daily decisions.',
    view_count: 8100
  },
  {
    id: 'sermon_5',
    title: 'Overcoming the Spirit of Delay & Stagnation',
    speaker: 'Apostle Joe Daniels',
    date: 'Aug 06, 2026',
    series: 'Deliverance & Victory',
    duration: '1h 22m',
    youtube_id: '9bZkp7q19f0',
    thumbnail_url: '/assets/apostle_joe_daniels_main.jpg',
    scriptures: ['Daniel 10:12-14', 'Psalms 102:13'],
    description: 'The set time to favor Zion has come. Learn how to press through spiritual resistance into sudden breakthrough.',
    view_count: 16900
  }
];

export const MOCK_DEVOTIONALS: Devotional[] = [
  {
    id: 'dev_today',
    date: 'Today • 2 September 2026',
    title: 'Divine Remembrance: God Has Not Forgotten You',
    scripture_reference: 'Isaiah 49:15-16',
    scripture_verse: '"Can a mother forget the baby at her breast and have no compassion on the child she has borne? Though she may forget, I will not forget you! See, I have engraved you on the palms of my hands."',
    content: 'Beloved, when delay seems prolonged, the enemy whispers that heaven is silent. But God says your name is engraved upon His palms. Every prayer you prayed over your family, your health, and your career in Zimbabwe or across the nations is before the altar of incense. Today, step out with high expectation!',
    prayer: 'Heavenly Father, I thank You that You are mindful of me. I rebuke every spirit of discouragement. Your promises over my destiny are YES and AMEN in Christ Jesus.',
    declaration: 'I declare that this day marks the beginning of unusual favor, open doors, and restored peace in Jesus name!',
    audio_duration: '3m 45s',
    author: 'Apostle Joe Daniels'
  },
  {
    id: 'dev_yesterday',
    date: '1 September 2026',
    title: 'The Atmosphere of Gratitude',
    scripture_reference: '1 Thessalonians 5:18',
    scripture_verse: '"In everything give thanks; for this is the will of God in Christ Jesus for you."',
    content: 'Gratitude is not a reaction to good news; it is the generator of supernatural victory. Praise God in the hallway before the door opens.',
    prayer: 'Lord, I choose thanksgiving over anxiety today. Fill my heart with songs of deliverance.',
    declaration: 'My praise confuses the enemy and unlocks my breakthrough!',
    audio_duration: '4m 10s',
    author: 'Apostle Joe Daniels'
  }
];

export const MOCK_PARTNER_TICKERS = [
  '⚡ Harare Crusade 2026: 2,450 decisions for Christ & 180 confirmed healings!',
  '🌍 Gateway Diaspora Chapel: Connecting 14 nations weekly across UK, US, SA & Canada',
  '🌾 Chitungwiza Community Food Basket: 450 vulnerable families supported this month',
  '📖 Shona Audio Bible Initiative: 12,000 chapters streamed offline in rural Mashonaland',
  '🏛️ Gateway Cathedral Building Project: Phase 2 Roofing completed to the Glory of God!'
];

export const MOCK_COMMUNITY_GROUPS: CommunityGroup[] = [
  {
    id: 'grp_1',
    name: 'Harare Central Grace Cell',
    category: 'Location',
    location: 'Avondale & CBD, Harare',
    leader_name: 'Elder Brian Sibanda',
    leader_phone: '+263 77 312 3456',
    meeting_time: 'Wednesdays @ 6:00 PM CAT',
    member_count: 48,
    image_url: '/assets/apostle_joe_daniels_preach.jpg',
    description: 'A vibrant family meeting weekly for deep fellowship, prayer walks, and mutual encouragement across Harare.',
    joined: true
  },
  {
    id: 'grp_2',
    name: 'Gateway UK & European Diaspora',
    category: 'Diaspora',
    location: 'London / Birmingham / Online Zoom',
    leader_name: 'Pastor Rudo Mwale',
    leader_phone: '+44 79 1122 3344',
    meeting_time: 'Thursdays @ 8:00 PM BST',
    member_count: 124,
    image_url: '/assets/apostle_joe_daniels_podcast.jpg',
    description: 'Uniting Zimbabweans and believers across the UK, Ireland, and mainland Europe in prayer and kingdom support.',
    joined: false
  },
  {
    id: 'grp_3',
    name: 'Youth Ignite & Campus OnFire',
    category: 'Youth',
    location: 'UZ & Gateway Youth Center',
    leader_name: 'Minister Taku Daniels',
    leader_phone: '+263 78 456 7890',
    meeting_time: 'Saturdays @ 3:00 PM CAT',
    member_count: 95,
    image_url: '/assets/apostle_joe_daniels_grad.jpg',
    description: 'High energy worship, relevant discussions, mentorship, and creative arts (music, design, media).',
    joined: false
  },
  {
    id: 'grp_4',
    name: 'Gateway Kingdom Business Network',
    category: 'Business',
    location: 'Borrowdale & Virtual',
    leader_name: 'Deacon Charles Mutasa',
    leader_phone: '+263 77 987 6543',
    meeting_time: '1st Saturday of Month @ 8:00 AM',
    member_count: 67,
    image_url: '/assets/apostle_joe_daniels_main.jpg',
    description: 'Empowering Christian entrepreneurs, tenders, trade, and financial stewardship with biblical integrity.',
    joined: false
  }
];

export const MOCK_PRAYER_REQUESTS: PrayerRequest[] = [
  {
    id: 'pray_1',
    user_name: 'Sister Chiedza M.',
    is_anonymous: false,
    category: 'Healing',
    request_text: 'Please agree with me in prayer for my mother scheduled for surgery in Bulawayo. We stand on Isaiah 53:5 for complete wholeness.',
    is_answered: true,
    answered_testimony: 'Praise the Lord! The doctors ran tests before surgery and the tumor was completely gone! Glory to God!',
    prayer_count: 142,
    user_prayed: true,
    created_at: '2026-08-30T10:15:00Z',
    apostle_notes: 'Amen! The healing power of Jesus is confirmed in her body.',
    is_public: true,
    status: 'apostle_prayed'
  },
  {
    id: 'pray_2',
    user_name: 'Brother in Diaspora',
    is_anonymous: true,
    category: 'Financial Breakthrough',
    request_text: 'Seeking God for my visa renewal and a permanent contract in the UK. Believing Apostle Joe Daniels word of supernatural acceleration.',
    is_answered: false,
    prayer_count: 89,
    user_prayed: false,
    created_at: '2026-09-01T14:30:00Z',
    apostle_notes: 'I decree divine speed over your immigration papers in Jesus name.',
    is_public: true,
    status: 'approved'
  },
  {
    id: 'pray_3',
    user_name: 'Tatenda K.',
    is_anonymous: false,
    category: 'Family & Marriage',
    request_text: 'Praying for restoration of peace in our marriage and spiritual breakthrough for my husband.',
    is_answered: false,
    prayer_count: 63,
    user_prayed: false,
    created_at: '2026-09-01T19:00:00Z',
    is_public: true,
    status: 'approved'
  }
];

export const MOCK_EVENTS: ChurchEvent[] = [
  {
    id: 'evt_1',
    title: 'Supernatural Acceleration Conference 2026',
    date: 'Sept 18 - 20, 2026',
    time: '5:30 PM Nightly • 9:00 AM Sunday',
    location: 'Gateway Cathedral, Belvedere, Harare',
    description: 'Three explosive days of the prophetic word, miraculous healing, worship, and apostolic impartation with Apostle Joe Daniels & International Guests.',
    banner_url: '/assets/apostle_joe_daniels_preach.jpg',
    rsvp_count: 1840,
    user_rsvpd: true,
    category: 'Conference',
    speaker: 'Apostle Joe Daniels & Guests',
    is_featured: true,
    ticket_required: false
  },
  {
    id: 'evt_2',
    title: 'Night of Total Deliverance & Prophecy',
    date: 'Last Friday of Sept',
    time: '9:00 PM - 5:00 AM CAT',
    location: 'Main Auditorium & Live Stream',
    description: 'An all-night prayer vigil breaking covenants of delay, witchcraft, poverty, and sickness.',
    banner_url: '/assets/apostle_joe_daniels_podcast.jpg',
    rsvp_count: 920,
    user_rsvpd: false,
    category: 'All-Night Prayer',
    speaker: 'Apostle Joe Daniels',
    is_featured: false
  },
  {
    id: 'evt_3',
    title: 'Kingdom Business & Marketplace Summit',
    date: 'Oct 10, 2026',
    time: '8:30 AM - 2:00 PM CAT',
    location: 'Meikles Hotel & Virtual',
    description: 'Strategic kingdom wealth creation, diaspora investments in Zimbabwe, and business anointing.',
    banner_url: '/assets/apostle_joe_daniels_main.jpg',
    rsvp_count: 310,
    user_rsvpd: false,
    category: 'Sunday Service',
    speaker: 'Apostle Joe Daniels & Industry Leaders',
    is_featured: false,
    ticket_required: true,
    ticket_price_usd: 25
  }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'Unlocking Supernatural Acceleration (Hardcover)',
    category: 'Books',
    price_usd: 15,
    price_zig: 220,
    image_url: '/assets/apostle_joe_daniels_preach.jpg',
    description: 'The definitive blueprint on activating divine speed and breaking cycles of delay by Apostle Joe Daniels.',
    author_or_brand: 'Apostle Joe Daniels',
    in_stock: true,
    is_bestseller: true
  },
  {
    id: 'prod_2',
    name: 'The Prophetic Dimension: Hearing God with Precision',
    category: 'Books',
    price_usd: 12,
    price_zig: 180,
    image_url: '/assets/apostle_joe_daniels_grad.jpg',
    description: 'A deep biblical guide to discerning spiritual voices and operating in prophetic accuracy in modern times.',
    author_or_brand: 'Apostle Joe Daniels',
    in_stock: true,
    is_bestseller: true
  },
  {
    id: 'prod_3',
    name: 'Gateway Official Navy & Gold Kingdom Hoodie',
    category: 'Kingdom Apparel',
    price_usd: 28,
    price_zig: 410,
    image_url: '/assets/apostle_joe_daniels_main.jpg',
    description: 'Premium heavyweight cotton hoodie with embroidered Gateway Church Zimbabwe crest and scripture cuff.',
    in_stock: true,
    is_bestseller: false
  },
  {
    id: 'prod_4',
    name: 'Apostolic Impartation Anointing Oil (Set of 3)',
    category: 'Anointing Oil & Media',
    price_usd: 10,
    price_zig: 150,
    image_url: '/assets/apostle_joe_daniels_podcast.jpg',
    description: 'Consecrated frankincense and myrrh oil for family dedication, home blessing, and prayer.',
    in_stock: true,
    is_bestseller: false
  },
  {
    id: 'prod_5',
    name: 'VIP Delegate Pass: Acceleration Conference',
    category: 'Conference Passes',
    price_usd: 50,
    price_zig: 750,
    image_url: '/assets/apostle_joe_daniels_preach.jpg',
    description: 'Includes reserved front seating, exclusive dinner session with Apostle Joe Daniels, and signed book copy.',
    in_stock: true,
    is_bestseller: false
  }
];

export const MOCK_DONATIONS: Donation[] = [
  {
    id: 'don_101',
    donor_name: 'Covenant Partner (Private)',
    amount: 150,
    currency: 'USD',
    fund_type: 'Tithe',
    payment_method: 'EcoCash',
    status: 'completed',
    receipt_number: 'GCZ-RC-2026-8891',
    created_at: '2026-09-01T16:20:00Z',
    impact_tag: 'Harare Evangelism Outreaches',
    is_anonymous: false
  },
  {
    id: 'don_102',
    donor_name: 'Diaspora Partner UK',
    amount: 250,
    currency: 'GBP',
    fund_type: 'Building Foundation',
    payment_method: 'Stripe',
    status: 'completed',
    receipt_number: 'GCZ-RC-2026-8892',
    created_at: '2026-09-01T18:45:00Z',
    impact_tag: 'Cathedral Roofing Phase',
    is_anonymous: true
  },
  {
    id: 'don_103',
    donor_name: 'Faithful Seed Partner',
    amount: 1200,
    currency: 'ZiG',
    fund_type: 'Seed Faith',
    payment_method: 'Paynow',
    status: 'completed',
    receipt_number: 'GCZ-RC-2026-8893',
    created_at: '2026-09-02T02:10:00Z',
    impact_tag: 'Chitungwiza Food Outreach',
    is_anonymous: false
  }
];

export const MOCK_BOOKINGS: ServiceBooking[] = [
  {
    id: 'bk_1',
    user_name: 'Tinashe Chikwava',
    user_phone: '+263 71 234 5678',
    user_email: 'tinashe@gatewayzim.org',
    service_type: 'Prophetic Mentorship',
    date: '2026-09-10',
    time_slot: '02:00 PM CAT',
    status: 'confirmed',
    deposit_amount: 30,
    deposit_paid: true,
    zoom_link: 'https://zoom.us/j/98437291823?pwd=GATEWAY_CONNECT',
    notes: 'Seeking direction for new business launch in Southern Africa.',
    reminder_phone: '+263 71 234 5678',
    created_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'bk_2',
    user_name: 'Makanaka Sibanda (Diaspora)',
    user_phone: '+44 77 8899 0011',
    user_email: 'makanaka.uk@gmail.com',
    service_type: 'Pastoral Counseling',
    date: '2026-09-12',
    time_slot: '04:30 PM BST',
    status: 'pending',
    deposit_amount: 50,
    deposit_paid: true,
    zoom_link: 'https://zoom.us/j/81239019284?pwd=GATEWAY_CONNECT',
    notes: 'Family blessing and spiritual encouragement.',
    reminder_phone: '+44 77 8899 0011',
    created_at: '2026-09-02T01:30:00Z'
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord_901',
    user_name: 'Tatenda K.',
    user_phone: '+263 77 111 2233',
    items: [
      { product: MOCK_PRODUCTS[0], quantity: 1 },
      { product: MOCK_PRODUCTS[2], quantity: 1, selectedSize: 'L' }
    ],
    total_usd: 43,
    payment_method: 'EcoCash',
    status: 'Processing',
    delivery_address: '14 Samora Machel Ave, Harare CBD',
    created_at: '2026-09-01T12:00:00Z'
  }
];

export const MOCK_JOE_VIBES: JoeVibesSubmission[] = [
  {
    id: 'vibes_1',
    artist_name: 'Minister Blessed Moyo',
    song_title: 'Mweya Mutsvene (Holy Spirit Overflow)',
    genre: 'Worship',
    audio_url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
    contact_phone: '+263 77 444 5566',
    status: 'approved',
    submitted_at: '2026-08-28T14:00:00Z',
    notes: 'Phenomenal acoustic worship piece in Shona and English. Scheduled for Sunday choir special.'
  },
  {
    id: 'vibes_2',
    artist_name: 'Kingdom Flow Crew',
    song_title: 'Unstoppable Grace (Afrobeat Mix)',
    genre: 'Afro-Gospel',
    audio_url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3',
    contact_phone: '+263 78 999 1122',
    status: 'submitted',
    submitted_at: '2026-09-01T17:20:00Z',
    notes: 'High energy praise submitted for Youth Ignite.'
  }
];

export const MOCK_TESTIMONIES: Testimony[] = [
  {
    id: 'post_apostle_preaching',
    user_name: 'Apostle Joe Daniels',
    user_avatar: '/assets/apostle_joe_daniels_main.jpg',
    title: 'Prophetic Decree: The Hand of the Lord Brings Divine Speed',
    category: 'Prophetic Word',
    content: 'God is positioning you right now for supernatural acceleration! What took your family 10 years to achieve, the Holy Ghost will release in 10 months. Step boldly into the altar of agreement and declare that stagnation is broken over your life, career, and household!',
    image_url: '/assets/apostle_joe_daniels_preach.jpg',
    scripture_tag: '1 Kings 18:46',
    date: 'Just Now',
    likes_count: 384,
    verified_by_church: true,
    user_liked: true,
    comments_count: 56
  },
  {
    id: 'post_apostle_podcast',
    user_name: 'Apostle Joe Daniels',
    user_avatar: '/assets/apostle_joe_daniels_main.jpg',
    title: 'Studio Broadcast: Unlocking Your Kingdom Mandate',
    category: 'Spiritual Growth',
    content: 'In our latest studio teaching, we sat down to dissect the mysteries of divine timing and discerning spiritual seasons. You cannot afford to walk blindly in this hour. Tune in and let your faith be stirred!',
    image_url: '/assets/apostle_joe_daniels_podcast.jpg',
    scripture_tag: '1 Chronicles 12:32',
    date: 'Yesterday • 6:30 PM',
    likes_count: 245,
    verified_by_church: true,
    user_liked: true,
    comments_count: 32
  },
  {
    id: 'post_apostle_grad',
    user_name: 'Apostle Joe Daniels',
    user_avatar: '/assets/apostle_joe_daniels_main.jpg',
    title: 'Thanksgiving & Ministry Milestone: Spiritual & Academic Excellence',
    category: 'Kingdom Impact',
    content: 'To God be the glory for the completion of our advanced theological & apostolic leadership degree. Anointed intellect combined with spiritual power is God’s blueprint for shifting nations and raising generational leaders. Thank you to all our covenant partners for standing with us!',
    image_url: '/assets/apostle_joe_daniels_grad.jpg',
    scripture_tag: '2 Timothy 2:15',
    date: '3 days ago',
    likes_count: 512,
    verified_by_church: true,
    user_liked: true,
    comments_count: 78
  },
  {
    id: 'post_apostle_welcome',
    user_name: 'Apostle Joe Daniels',
    user_avatar: '/assets/apostle_joe_daniels_main.jpg',
    title: 'Pastoral Heart: You Are Specially Loved & Chosen',
    category: 'Pastoral Care',
    content: 'To every son and daughter of this commission in Zimbabwe and across the globe: You are not forgotten. The Lord has made you a sign and a wonder. Walk in boldness today knowing that mercy surrounds you on every side.',
    image_url: '/assets/apostle_joe_daniels_main.jpg',
    scripture_tag: 'Isaiah 8:18',
    date: '5 days ago',
    likes_count: 420,
    verified_by_church: true,
    user_liked: false,
    comments_count: 41
  },
  {
    id: 'test_1',
    user_name: 'Tendai Mutasa (Harare)',
    user_avatar: '/assets/apostle_joe_daniels_main.jpg',
    title: 'Instant Debt Cancellation & Visa Grant',
    category: 'Financial Breakthrough',
    content: 'During the July Prophetic Night with Apostle Joe Daniels, he decreed a 7-day turnaround for stagnant applications. On day 5, my UK nursing visa was unexpectedly approved and a 3-year debt was forgiven in writing! Glory to God!',
    image_url: '/assets/apostle_joe_daniels_preach.jpg',
    scripture_tag: 'Amos 9:13',
    date: '6 days ago',
    likes_count: 89,
    verified_by_church: true,
    user_liked: true,
    comments_count: 14
  },
  {
    id: 'test_2',
    user_name: 'Ruvimbo Ndlovu (Bulawayo)',
    user_avatar: '/assets/apostle_joe_daniels_grad.jpg',
    title: 'Healed of Chronic Spinal Pain After Altar Prayer',
    category: 'Healing',
    content: 'I lived with disc degeneration for 4 years. When the altar prayer was offered on the livestream by Apostle Joe, heat flooded my spine. I bent over with zero pain for the first time in years!',
    image_url: '/assets/apostle_joe_daniels_podcast.jpg',
    scripture_tag: 'Isaiah 53:5',
    date: '1 week ago',
    likes_count: 142,
    verified_by_church: true,
    user_liked: false,
    comments_count: 26
  }
];

export const MOCK_PUSH_NOTIFICATIONS: PushNotification[] = [
  {
    id: 'push_1',
    title: '🔴 Apostle Joe Daniels is LIVE!',
    body: 'Tune in now for "Supernatural Acceleration" - Prophet impartation is flowing!',
    target_segment: 'All Members',
    sent_at: '2026-09-01T08:00:00Z',
    read_count: 3420
  },
  {
    id: 'push_2',
    title: '📖 Today\'s Devotional: Divine Remembrance',
    body: 'God has engraved your name on His hands. Read today\'s reflection.',
    target_segment: 'All Members',
    sent_at: '2026-09-02T04:00:00Z',
    read_count: 1890
  }
];
