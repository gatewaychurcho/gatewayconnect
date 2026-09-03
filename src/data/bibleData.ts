import { BibleBook, BibleVerse, ReadingPlan } from '../types';

export const BIBLE_BOOKS: BibleBook[] = [
  // Hebrew-Aramaic Scriptures (Old Testament - 39 Books)
  // Pentateuch (Law)
  { name: 'Genesis', abbreviation: 'Ge', testament: 'OT', chaptersCount: 50, category: 'Law' },
  { name: 'Exodus', abbreviation: 'Ex', testament: 'OT', chaptersCount: 40, category: 'Law' },
  { name: 'Leviticus', abbreviation: 'Le', testament: 'OT', chaptersCount: 27, category: 'Law' },
  { name: 'Numbers', abbreviation: 'Nu', testament: 'OT', chaptersCount: 36, category: 'Law' },
  { name: 'Deuteronomy', abbreviation: 'De', testament: 'OT', chaptersCount: 34, category: 'Law' },
  // Historical
  { name: 'Joshua', abbreviation: 'Jos', testament: 'OT', chaptersCount: 24, category: 'History' },
  { name: 'Judges', abbreviation: 'Jg', testament: 'OT', chaptersCount: 21, category: 'History' },
  { name: 'Ruth', abbreviation: 'Ru', testament: 'OT', chaptersCount: 4, category: 'History' },
  { name: '1 Samuel', abbreviation: '1Sa', testament: 'OT', chaptersCount: 31, category: 'History' },
  { name: '2 Samuel', abbreviation: '2Sa', testament: 'OT', chaptersCount: 24, category: 'History' },
  { name: '1 Kings', abbreviation: '1Ki', testament: 'OT', chaptersCount: 22, category: 'History' },
  { name: '2 Kings', abbreviation: '2Ki', testament: 'OT', chaptersCount: 25, category: 'History' },
  { name: '1 Chronicles', abbreviation: '1Ch', testament: 'OT', chaptersCount: 29, category: 'History' },
  { name: '2 Chronicles', abbreviation: '2Ch', testament: 'OT', chaptersCount: 36, category: 'History' },
  { name: 'Ezra', abbreviation: 'Ezr', testament: 'OT', chaptersCount: 10, category: 'History' },
  { name: 'Nehemiah', abbreviation: 'Ne', testament: 'OT', chaptersCount: 13, category: 'History' },
  { name: 'Esther', abbreviation: 'Es', testament: 'OT', chaptersCount: 10, category: 'History' },
  // Poetic
  { name: 'Job', abbreviation: 'Job', testament: 'OT', chaptersCount: 42, category: 'Poetry' },
  { name: 'Psalms', abbreviation: 'Ps', testament: 'OT', chaptersCount: 150, category: 'Poetry' },
  { name: 'Proverbs', abbreviation: 'Pr', testament: 'OT', chaptersCount: 31, category: 'Poetry' },
  { name: 'Ecclesiastes', abbreviation: 'Ec', testament: 'OT', chaptersCount: 12, category: 'Poetry' },
  { name: 'Song of Solomon', abbreviation: 'Ca', testament: 'OT', chaptersCount: 8, category: 'Poetry' },
  // Prophetic
  { name: 'Isaiah', abbreviation: 'Isa', testament: 'OT', chaptersCount: 66, category: 'Prophets' },
  { name: 'Jeremiah', abbreviation: 'Jer', testament: 'OT', chaptersCount: 52, category: 'Prophets' },
  { name: 'Lamentations', abbreviation: 'La', testament: 'OT', chaptersCount: 5, category: 'Prophets' },
  { name: 'Ezekiel', abbreviation: 'Eze', testament: 'OT', chaptersCount: 48, category: 'Prophets' },
  { name: 'Daniel', abbreviation: 'Da', testament: 'OT', chaptersCount: 12, category: 'Prophets' },
  { name: 'Hosea', abbreviation: 'Ho', testament: 'OT', chaptersCount: 14, category: 'Prophets' },
  { name: 'Joel', abbreviation: 'Joe', testament: 'OT', chaptersCount: 3, category: 'Prophets' },
  { name: 'Amos', abbreviation: 'Am', testament: 'OT', chaptersCount: 9, category: 'Prophets' },
  { name: 'Obadiah', abbreviation: 'Ob', testament: 'OT', chaptersCount: 1, category: 'Prophets' },
  { name: 'Jonah', abbreviation: 'Jon', testament: 'OT', chaptersCount: 4, category: 'Prophets' },
  { name: 'Micah', abbreviation: 'Mic', testament: 'OT', chaptersCount: 7, category: 'Prophets' },
  { name: 'Nahum', abbreviation: 'Na', testament: 'OT', chaptersCount: 3, category: 'Prophets' },
  { name: 'Habakkuk', abbreviation: 'Hab', testament: 'OT', chaptersCount: 3, category: 'Prophets' },
  { name: 'Zephaniah', abbreviation: 'Zep', testament: 'OT', chaptersCount: 3, category: 'Prophets' },
  { name: 'Haggai', abbreviation: 'Hag', testament: 'OT', chaptersCount: 2, category: 'Prophets' },
  { name: 'Zechariah', abbreviation: 'Zec', testament: 'OT', chaptersCount: 14, category: 'Prophets' },
  { name: 'Malachi', abbreviation: 'Mal', testament: 'OT', chaptersCount: 4, category: 'Prophets' },

  // Christian Greek Scriptures (New Testament - 27 Books)
  // Gospels & Acts
  { name: 'Matthew', abbreviation: 'Mt', testament: 'NT', chaptersCount: 28, category: 'Gospels' },
  { name: 'Mark', abbreviation: 'Mr', testament: 'NT', chaptersCount: 16, category: 'Gospels' },
  { name: 'Luke', abbreviation: 'Lu', testament: 'NT', chaptersCount: 24, category: 'Gospels' },
  { name: 'John', abbreviation: 'Joh', testament: 'NT', chaptersCount: 21, category: 'Gospels' },
  { name: 'Acts', abbreviation: 'Ac', testament: 'NT', chaptersCount: 28, category: 'History' },
  // Epistles / Letters
  { name: 'Romans', abbreviation: 'Ro', testament: 'NT', chaptersCount: 16, category: 'Epistles' },
  { name: '1 Corinthians', abbreviation: '1Co', testament: 'NT', chaptersCount: 16, category: 'Epistles' },
  { name: '2 Corinthians', abbreviation: '2Co', testament: 'NT', chaptersCount: 13, category: 'Epistles' },
  { name: 'Galatians', abbreviation: 'Ga', testament: 'NT', chaptersCount: 6, category: 'Epistles' },
  { name: 'Ephesians', abbreviation: 'Eph', testament: 'NT', chaptersCount: 6, category: 'Epistles' },
  { name: 'Philippians', abbreviation: 'Php', testament: 'NT', chaptersCount: 4, category: 'Epistles' },
  { name: 'Colossians', abbreviation: 'Col', testament: 'NT', chaptersCount: 4, category: 'Epistles' },
  { name: '1 Thessalonians', abbreviation: '1Th', testament: 'NT', chaptersCount: 5, category: 'Epistles' },
  { name: '2 Thessalonians', abbreviation: '2Th', testament: 'NT', chaptersCount: 3, category: 'Epistles' },
  { name: '1 Timothy', abbreviation: '1Ti', testament: 'NT', chaptersCount: 6, category: 'Epistles' },
  { name: '2 Timothy', abbreviation: '2Ti', testament: 'NT', chaptersCount: 4, category: 'Epistles' },
  { name: 'Titus', abbreviation: 'Tit', testament: 'NT', chaptersCount: 3, category: 'Epistles' },
  { name: 'Philemon', abbreviation: 'Phm', testament: 'NT', chaptersCount: 1, category: 'Epistles' },
  { name: 'Hebrews', abbreviation: 'Heb', testament: 'NT', chaptersCount: 13, category: 'Epistles' },
  { name: 'James', abbreviation: 'Jas', testament: 'NT', chaptersCount: 5, category: 'Epistles' },
  { name: '1 Peter', abbreviation: '1Pe', testament: 'NT', chaptersCount: 5, category: 'Epistles' },
  { name: '2 Peter', abbreviation: '2Pe', testament: 'NT', chaptersCount: 3, category: 'Epistles' },
  { name: '1 John', abbreviation: '1Jo', testament: 'NT', chaptersCount: 5, category: 'Epistles' },
  { name: '2 John', abbreviation: '2Jo', testament: 'NT', chaptersCount: 1, category: 'Epistles' },
  { name: '3 John', abbreviation: '3Jo', testament: 'NT', chaptersCount: 1, category: 'Epistles' },
  { name: 'Jude', abbreviation: 'Jude', testament: 'NT', chaptersCount: 1, category: 'Epistles' },
  // Prophecy
  { name: 'Revelation', abbreviation: 'Re', testament: 'NT', chaptersCount: 22, category: 'Prophecy' },
];

export const SAMPLE_VERSES_DATA: Record<string, Record<string, Record<number, { KJV: string; NIV: string; ESV: string; Shona: string; NWT?: string }>>> = {
  Genesis: {
    '1': {
      1: {
        KJV: 'In the beginning God created the heaven and the earth.',
        NIV: 'In the beginning God created the heavens and the earth.',
        ESV: 'In the beginning, God created the heavens and the earth.',
        NWT: 'In the beginning God created the heavens and the earth.',
        Shona: 'Pakutanga Mwari akasika denga nenyika.'
      },
      2: {
        KJV: 'And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.',
        NIV: 'Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.',
        ESV: 'The earth was without form and void, and darkness was over the face of the deep. And the Spirit of God was hovering over the face of the waters.',
        NWT: 'Now the earth was formless and desolate, and there was darkness upon the surface of the watery deep, and God’s active force was moving over the surface of the waters.',
        Shona: 'Nyika yakanga isina chimiro, isina chinhu; rima rakanga riri pamusoro pemvura yakadzika; Mweya waMwari wakafamba pamusoro pemvura.'
      },
      3: {
        KJV: 'And God said, Let there be light: and there was light.',
        NIV: 'And God said, "Let there be light," and there was light.',
        ESV: 'And God said, "Let there be light," and there was light.',
        NWT: 'And God said: “Let there be light.” Then there was light.',
        Shona: 'Ipapo Mwari akati, "Kuvheneke!" Chiedza chikavapo.'
      },
      4: {
        KJV: 'And God saw the light, that it was good: and God divided the light from the darkness.',
        NIV: 'God saw that the light was good, and he separated the light from the darkness.',
        ESV: 'And God saw that the light was good. And God separated the light from the darkness.',
        NWT: 'After that God saw that the light was good, and God began to divide the light from the darkness.',
        Shona: 'Mwari akaona chiedza kuti chakanaka; Mwari akaparadzanisa chiedza nerima.'
      },
      5: {
        KJV: 'And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.',
        NIV: 'God called the light "day," and the darkness he called "night." And there was evening, and there was morning—the first day.',
        ESV: 'God called the light Day, and the darkness he called Night. And there was evening and there was morning, the first day.',
        NWT: 'God called the light Day, but the darkness he called Night. And there was evening and there was morning, a first day.',
        Shona: 'Mwari akatumidza chiedza achiti Masikati, nerima akaritumidza achiti Usiku. Manheru akavapo namangwanani akavapo, zuva rokutanga.'
      },
      26: {
        KJV: 'And God said, Let us make man in our image, after our likeness: and let them have dominion over the fish of the sea, and over the fowl of the air, and over the cattle, and over all the earth, and over every creeping thing that creepeth upon the earth.',
        NIV: 'Then God said, "Let us make mankind in our image, in our likeness, so that they may rule over the fish in the sea and the birds in the sky, over the livestock and all the wild animals, and over all the creatures that move along the ground."',
        ESV: 'Then God said, "Let us make man in our image, after our likeness. And let them have dominion over the fish of the sea and over the birds of the heavens and over the livestock and over all the earth and over every creeping thing that creeps on the earth."',
        NWT: 'Then God said: “Let us make man in our image, according to our likeness, and let them have in subjection the fish of the sea and the flying creatures of the heavens and the domestic animals and all the earth and every creeping animal that is moving on the earth.”',
        Shona: 'Mwari akati, "Ngatiite munhu nomufananidzo wedu, akafanana nesu; vave nesimba pamusoro pehove dzegungwa, napamusoro peshiri dzokudenga, napamusoro pezvipfuwo."'
      },
      27: {
        KJV: 'So God created man in his own image, in the image of God created he him; male and female created he them.',
        NIV: 'So God created mankind in his own image, in the image of God he created them; male and female he created them.',
        ESV: 'So God created man in his own image, in the image of God he created him; male and female he created them.',
        NWT: 'And God went on to create the man in his image, in God’s image he created him; male and female he created them.',
        Shona: 'Mwari akasika munhu nomufananidzo wake, nomufananidzo waMwari akamusika; murume nomukadzi akavasika.'
      }
    }
  },
  Psalms: {
    '23': {
      1: {
        KJV: 'The LORD is my shepherd; I shall not want.',
        NIV: 'The LORD is my shepherd, I lack nothing.',
        ESV: 'The LORD is my shepherd; I shall not want.',
        NWT: 'Jehovah is my Shepherd. I will lack nothing.',
        Shona: 'Jehovha ndiye mufudzi wangu; handingashayiwi chinhu.'
      },
      2: {
        KJV: 'He maketh me to lie down in green pastures: he leadeth me beside the still waters.',
        NIV: 'He makes me lie down in green pastures, he leads me beside quiet waters,',
        ESV: 'He makes me lie down in green pastures. He leads me beside still waters.',
        NWT: 'In grassy pastures he makes me lie down; he leads me to well-watered resting-places.',
        Shona: 'Anondivatisa pasi pamafuro manyoro; anonditungamirira pamvura inozorodza.'
      },
      3: {
        KJV: 'He restoreth my soul: he leadeth me in the paths of righteousness for his name\'s sake.',
        NIV: 'he refreshes my soul. He guides me along the right paths for his name\'s sake.',
        ESV: 'He restores my soul. He leads me in paths of righteousness for his name\'s sake.',
        NWT: 'He refreshes me. He leads me in the tracks of righteousness for the sake of his name.',
        Shona: 'Anoporesa mweya wangu; anondiperekedza panzira dzokururama nokuda kwezita rake.'
      },
      4: {
        KJV: 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.',
        NIV: 'Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me.',
        ESV: 'Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me; your rod and your staff, they comfort me.',
        NWT: 'Even though I walk in the valley of deep shadow, I fear no harm, for you are with me; your rod and your staff reassure me.',
        Shona: 'Zvirokwazvo, kunyange ndichifamba mumupata womumvuri worufu, handingatyi zvakaipa; nokuti imi muneni; tsvimbo yenyu nomudonzvo wenyu zvinondinyaradza.'
      },
      5: {
        KJV: 'Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.',
        NIV: 'You prepare a table before me in the presence of my enemies. You anoint my head with oil; my cup overflows.',
        ESV: 'You prepare a table before me in the presence of my enemies; you anoint my head with oil; my cup overflows.',
        NWT: 'You spread a table before me in the presence of my enemies. You refresh my head with oil; my cup is well-filled.',
        Shona: 'Munondigadzirira tafura pamberi pavavengi vangu; munozodza musoro wangu namafuta; mukombe wangu unopfachuka.'
      },
      6: {
        KJV: 'Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.',
        NIV: 'Surely your goodness and love will follow me all the days of my life, and I will dwell in the house of the LORD forever.',
        ESV: 'Surely goodness and mercy shall follow me all the days of my life, and I shall dwell in the house of the LORD forever.',
        NWT: 'Surely goodness and loyal love will pursue me all the days of my life, and I will dwell in the house of Jehovah for all my days.',
        Shona: 'Zvirokwazvo kunaka netsitsi zvichanditevera mazuva ose oupenyu bwangu; ini ndichagara mumba maJehovha nokusingaperi.'
      }
    },
    '91': {
      1: {
        KJV: 'He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.',
        NIV: 'Whoever dwells in the shelter of the Most High will rest in the shadow of the Almighty.',
        ESV: 'He who dwells in the shelter of the Most High will abide in the shadow of the Almighty.',
        NWT: 'Anyone dwelling in the secret place of the Most High will lodge under the shadow of the Almighty One.',
        Shona: 'Uyo anogara pakavanda poWokumusorosoro, achagara mumumvuri woWemasimbaose.'
      },
      2: {
        KJV: 'I will say of the LORD, He is my refuge and my fortress: my God; in him will I trust.',
        NIV: 'I will say of the LORD, "He is my refuge and my fortress, my God, in whom I trust."',
        ESV: 'I will say to the LORD, "My refuge and my fortress, my God, in whom I trust."',
        NWT: 'I will say to Jehovah: “You are my refuge and my stronghold, my God, in whom I trust.”',
        Shona: 'Ndichati kuna Jehovha: Ndimi utiziro hwangu nenhare yangu; Mwari wangu wandinovimba naye.'
      }
    }
  },
  Isaiah: {
    '40': {
      31: {
        KJV: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.',
        NIV: 'but those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.',
        ESV: 'but they who wait for the LORD shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint.',
        NWT: 'But those hoping in Jehovah will regain power. They will soar on wings like eagles. They will run and not grow weary; they will walk and not tire out.',
        Shona: 'Asi vanovimba naJehovha vachawana simba idzva; vachabhururuka nemapapiro samakondo; vachamhanya vasinganeti; vachafamba vasingaziye.'
      }
    }
  },
  Matthew: {
    '5': {
      3: {
        KJV: 'Blessed are the poor in spirit: for theirs is the kingdom of heaven.',
        NIV: 'Blessed are the poor in spirit, for theirs is the kingdom of heaven.',
        ESV: 'Blessed are the poor in spirit, for theirs is the kingdom of heaven.',
        NWT: 'Happy are those conscious of their spiritual need, since the Kingdom of the heavens belongs to them.',
        Shona: 'Vakakomborerwa varombo mumweya; nokuti ushe hwokudenga ndohwavo.'
      },
      5: {
        KJV: 'Blessed are the meek: for they shall inherit the earth.',
        NIV: 'Blessed are the meek, for they will inherit the earth.',
        ESV: 'Blessed are the meek, for they shall inherit the earth.',
        NWT: 'Happy are the mild-tempered, since they will inherit the earth.',
        Shona: 'Vakakomborerwa vanyoro; nokuti vachagara nhaka yenyika.'
      },
      14: {
        KJV: 'Ye are the light of the world. A city that is set on an hill cannot be hid.',
        NIV: 'You are the light of the world. A town built on a hill cannot be hidden.',
        ESV: 'You are the light of the world. A city set on a hill cannot be hidden.',
        NWT: 'You are the light of the world. A city cannot be hidden when situated on a mountain.',
        Shona: 'Muri chiedza chenyika. Guta rakavakwa pagomo haringagoni kuvanzika.'
      }
    }
  },
  John: {
    '1': {
      1: {
        KJV: 'In the beginning was the Word, and the Word was with God, and the Word was God.',
        NIV: 'In the beginning was the Word, and the Word was with God, and the Word was God.',
        ESV: 'In the beginning was the Word, and the Word was with God, and the Word was God.',
        NWT: 'In the beginning was the Word, and the Word was with God, and the Word was a god.',
        Shona: 'Pakutanga Shoko rakanga riripo, Shoko rakanga riina Mwari, uye Shoko rakanga riri Mwari.'
      },
      2: {
        KJV: 'The same was in the beginning with God.',
        NIV: 'He was with God in the beginning.',
        ESV: 'He was in the beginning with God.',
        NWT: 'This one was in the beginning with God.',
        Shona: 'Iye wakanga ari pakutanga pamwe chete naMwari.'
      },
      3: {
        KJV: 'All things were made by him; and without him was not any thing made that was made.',
        NIV: 'Through him all things were made; without him nothing was made that has been made.',
        ESV: 'All things were made through him, and without him was not any thing made that was made.',
        NWT: 'All things came into existence through him, and apart from him not even one thing came into existence.',
        Shona: 'Zvinhu zvose zvakasikwa naye; kunze kwake hakuna chinhu chakasikwa chezvakasikwa.'
      },
      4: {
        KJV: 'In him was life; and the life was the light of men.',
        NIV: 'In him was life, and that life was the light of all mankind.',
        ESV: 'In him was life, and the life was the light of men.',
        NWT: 'What has come into existence by means of him was life, and the life was the light of men.',
        Shona: 'Maari makanga mune upenyu, uye upenyu hwakanga huri chiedza chavanhu.'
      },
      12: {
        KJV: 'But as many as received him, to them gave he power to become the sons of God, even to them that believe on his name:',
        NIV: 'Yet to all who did receive him, to those who believed in his name, he gave the right to become children of God—',
        ESV: 'But to all who did receive him, who believed in his name, he gave the right to become children of God,',
        NWT: 'However, to all who did receive him, he gave authority to become God’s children, because they were exercising faith in his name.',
        Shona: 'Asi vose vakamugamuchira, akavapa simba rokuva vana vaMwari, ivo vanotenda kuzita rake.'
      },
      14: {
        KJV: 'And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth.',
        NIV: 'The Word became flesh and made his dwelling among us. We have seen his glory, the glory of the one and only Son, who came from the Father, full of grace and truth.',
        ESV: 'And the Word became flesh and dwelt among us, and we have seen his glory, glory as of the only Son from the Father, full of grace and truth.',
        NWT: 'So the Word became flesh and resided among us, and we had a view of his glory, a glory such as belongs to an only-begotten son from a father; and he was full of divine favor and truth.',
        Shona: 'Shoko rakazova nyama, rikagara pakati pedu; tikaona kubwinya kwake, kubwinya kwoMwanakomana mumwe oga wakabva kuna Baba, azere nenyasha nezvokwadi.'
      }
    },
    '3': {
      16: {
        KJV: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
        NIV: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
        ESV: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.',
        NWT: 'For God loved the world so much that he gave his only-begotten Son, so that everyone exercising faith in him might not be destroyed but have everlasting life.',
        Shona: 'Nokuti Mwari akada nyika nokudaro, kuti akapa Mwanakomana wake mumwe oga, kuti anomutenda arege kufa, asi ave noupenyu husingaperi.'
      }
    }
  },
  Romans: {
    '8': {
      28: {
        KJV: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
        NIV: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
        ESV: 'And we know that for those who love God all things work together for good, for those who are called according to his purpose.',
        NWT: 'We know that God makes all his works cooperate together for the good of those who love God, those who are the ones called according to his purpose.',
        Shona: 'Uye tinoziva kuti zvinhu zvose zvinoshandira pamwe chete kuitira zvakanaka kune vanoda Mwari, kune vakadanwa maererano nechinangwa chake.'
      },
      31: {
        KJV: 'What shall we then say to these things? If God be for us, who can be against us?',
        NIV: 'What, then, shall we say in response to these things? If God is for us, who can be against us?',
        ESV: 'What then shall we say to these things? If God is for us, who can be against us?',
        NWT: 'What, then, will we say to these things? If God is for us, who will be against us?',
        Shona: 'Zvino tichatizvei pamusoro pezvinhu izvi? Kana Mwari ari kurutivi rwedu, ndiani angatishora?'
      },
      37: {
        KJV: 'Nay, in all these things we are more than conquerors through him that loved us.',
        NIV: 'No, in all these things we are more than conquerors through him who loved us.',
        ESV: 'No, in all these things we are more than conquerors through him who loved us.',
        NWT: 'On the contrary, in all these things we are coming off completely victorious through the one who loved us.',
        Shona: 'Kwete, muzvinhu izvi zvose tiri vakundi zvikuru kubudikidza naiye akatida.'
      }
    }
  },
  Habakkuk: {
    '2': {
      2: {
        KJV: 'And the LORD answered me, and said, Write the vision, and make it plain upon tables, that he may run that readeth it.',
        NIV: 'Then the LORD replied: "Write down the revelation and make it plain on tablets so that a herald may run with it."',
        ESV: 'And the LORD answered me: "Write the vision; make it plain on tablets, so he may run who reads it."',
        NWT: 'Jehovah then answered me: “Write down the vision, and inscribe it clearly on tablets, so that the one reading it aloud may do so easily.”',
        Shona: 'Ipapo Jehovha akandipindura akati, "Nyora chiratidzo pasi, uchiise pachena pamahwendefa, kuti anochiverenga agomhanya nacho."'
      },
      3: {
        KJV: 'For the vision is yet for an appointed time, but at the end it shall speak, and not lie: though it tarry, wait for it; because it will surely come, it will not tarry.',
        NIV: 'For the revelation awaits an appointed time; it speaks of the end and will not prove false. Though it linger, wait for it; it will certainly come and will not delay.',
        ESV: 'For still the vision awaits its appointed time; it hastens to the end—it will not lie. If it seems slow, wait for it; it will surely come; it will not delay.',
        NWT: 'For the vision is yet for its appointed time, and it is rushing toward its end, and it will not lie. Even if it should delay, keep in expectation of it! For it will without fail come true. It will not be late!',
        Shona: 'Nokuti chiratidzo chichiri chomwaka wakatarwa, chinokurumidzira kuguma kwacho, hachizorevi nhema; kunyange chichinonoka, chimirire; nokuti chichauya zvirokwazvo, hachizononoki."'
      }
    }
  }
};

// JW-Style Chapter Outlines of Contents
export const CHAPTER_OUTLINES: Record<string, Record<number, string>> = {
  Genesis: {
    1: 'Creation of heavens and earth (1, 2) • Six creative days (3-31) • Man created in God’s image (26-28)',
    2: 'God rests on seventh day (1-3) • Garden of Eden (8-17) • Creation of woman; first marriage (18-25)'
  },
  Psalms: {
    23: 'Jehovah is my Shepherd (1-4) • Overflowing table in presence of enemies (5) • Loyal love pursues forever (6)',
    91: 'Shelter of the Most High (1, 2) • Protection from deadly traps (3-8) • Angels charge over you (11-16)'
  },
  Matthew: {
    5: 'Sermon on the Mount begins (1, 2) • Happy are those conscious of spiritual need (3-12) • Salt and light of the world (13-16)'
  },
  John: {
    1: 'The Word was in the beginning (1-5) • True light coming into world (6-13) • Word became flesh (14-18) • John’s witness (19-34)',
    3: 'Nicodemus visits Jesus by night (1-15) • God so loved the world (16-21) • John the Baptist’s final testimony (22-36)'
  },
  Romans: {
    8: 'Life through God’s Spirit (1-17) • Creation eagerly waiting (18-27) • God makes all things cooperate for good (28-30) • More than conquerors through Christ’s love (31-39)'
  },
  Isaiah: {
    40: 'Comfort my people (1, 2) • Voice crying in the wilderness (3-5) • The Creator of stars (25, 26) • Power given to the weary (29-31)'
  },
  Habakkuk: {
    2: 'Watch tower of the prophet (1) • Write down the vision on tablets (2, 3) • The righteous by faith will live (4)'
  }
};

// JW-Style Marginal Cross-References (Footnotes & Scripture Links)
export const MARGINAL_REFERENCES: Record<string, Array<{ symbol: string; ref: string; note: string }>> = {
  'Genesis 1:1': [
    { symbol: '*', ref: 'John 1:1', note: 'In the beginning was the Word; divine agency in creation.' },
    { symbol: '+', ref: 'Colossians 1:16', note: 'By means of him all other things were created in heaven and earth.' },
    { symbol: 'a', ref: 'Hebrews 11:3', note: 'By faith we perceive the universe fashioned by God’s utterance.' }
  ],
  'Genesis 1:3': [
    { symbol: '*', ref: '2 Corinthians 4:6', note: 'God who said, "Let light shine out of darkness," shone in our hearts.' }
  ],
  'Psalms 23:1': [
    { symbol: '*', ref: 'John 10:11', note: 'Jesus: "I am the fine shepherd; the fine shepherd surrenders his life."' },
    { symbol: '+', ref: 'Philippians 4:19', note: 'My God will supply all your needs according to his riches in glory.' }
  ],
  'Psalms 23:5': [
    { symbol: '*', ref: 'Psalms 92:10', note: 'You will increase my strength; I will moisten myself with fresh oil.' },
    { symbol: '+', ref: 'Luke 7:46', note: 'You did not pour oil on my head, but this woman poured perfumed oil.' }
  ],
  'John 1:1': [
    { symbol: '*', ref: 'Genesis 1:1', note: 'Parallel opening of Hebrew scriptures.' },
    { symbol: '+', ref: '1 John 1:1', note: 'That which was from the beginning, which we have heard and seen.' },
    { symbol: 'a', ref: 'Revelation 19:13', note: 'The name he is called is The Word of God.' }
  ],
  'Romans 8:28': [
    { symbol: '*', ref: 'Jeremiah 29:11', note: 'Thoughts of peace and not of calamity, to give you a future and hope.' },
    { symbol: '+', ref: 'Ephesians 1:11', note: 'Foreordained according to the purpose of the one who accomplishes all.' }
  ],
  'Habakkuk 2:2': [
    { symbol: '*', ref: 'Isaiah 30:8', note: 'Write it before them on a tablet, inscribe it in a book.' }
  ]
};

// JW-Style "Examining the Scriptures Daily" (Daily Text)
export const DAILY_SCRIPTURE_TEXT = {
  date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
  reference: 'Habakkuk 2:3',
  text: 'For the vision is yet for its appointed time... Even if it should delay, keep in expectation of it! For it will without fail come true. It will not be late!',
  theme: 'Keep In Expectation of Your Prophetic Turnaround',
  commentary: 'When God gives an apostolic promise, natural circumstances may tempt human impatience. But heaven operates on prophetic precision. The vision is speeding towards fulfillment. Stand firm in prayer, maintain praise, and run with the revelation on your tablets today!',
  pastorNote: 'Apostle Joe Daniels • Gateway Cathedral Word of the Day'
};

export const READING_PLANS: ReadingPlan[] = [
  {
    id: 'plan_acceleration',
    title: 'Supernatural Acceleration (21-Day Prophetic Walk)',
    daysTotal: 21,
    currentDay: 7,
    description: 'Scriptures on speed, divine favor, covenant wealth, and open heavens curated by Apostle Joe Daniels.',
    todaysReading: '1 Kings 18:41-46 & Amos 9:11-15',
    category: 'Prophetic'
  },
  {
    id: 'plan_gospels',
    title: 'Walk with Jesus (30-Day Gospel Deep Dive)',
    daysTotal: 30,
    currentDay: 12,
    description: 'Experience the miracles, parables, and power of Christ in the four gospels.',
    todaysReading: 'John 3 & John 4',
    category: 'Spiritual Growth'
  },
  {
    id: 'plan_shona',
    title: 'Shona Devotional: Rutendo neKukunda (Faith & Victory)',
    daysTotal: 14,
    currentDay: 4,
    description: 'Bhaibheri Dzvene verses for daily meditation, prayer, and family blessing.',
    todaysReading: 'Mapisarema 23 & Varoma 8:28-39',
    category: 'Bhaibheri Dzvene'
  }
];

export const PASTOR_FOLLOW_SCRIPTURE = {
  active: true,
  sermonTitle: 'Supernatural Acceleration',
  reference: '1 Kings 18:46 (KJV)',
  text: 'And the hand of the LORD was on Elijah; and he girded up his loins, and ran before Ahab to the entrance of Jezreel.',
  shonaText: 'Ruoko rwaJehovha rwakanga rwuri pamusoro paEriya; akasunga chiuno chake, akamhanya pamberi paAhabi kusvikira pasuo reJezreeri.',
  commentary: 'Apostle Joe Daniels: "Notice that divine speed is not human stamina, but the tangible resting hand of God!"'
};
