// Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyA5xJBzLCVPz3mJQcu3E_2KuCbkOUoBm3o",
  authDomain: "posse-dance-academy.firebaseapp.com",
  projectId: "posse-dance-academy",
  storageBucket: "posse-dance-academy.firebasestorage.app",
  messagingSenderId: "407454880498",
  appId: "1:407454880498:web:52cf04e4ddbdd73ded7a12"
};

// Pricing - EXACT values
export const pricing = {
  "4クラス": 18600, "４クラス": 18600,
  "3クラス": 14400, "３クラス": 14400,
  "2クラス": 10000, "２クラス": 10000,
  "1クラス": 6000, "１クラス": 6000,
  "1.5hクラス": 6600,
  "初回体験": 1000, "初回無料": 0,
  "ビジター（会員）": 2000, "ビジター（非会員）": 2300,
  "ビジター1.5h（会員）": 2200, "ビジター1.5h（非会員）": 2500,
  "月謝クラス振替": 1000, "練習会": 500
};

// Plan order for sorting
export const planOrder = {
  "４":1,"4":1,"３":2,"3":2,"２":3,"2":3,"１":4,"1":4,"ビジター":5,
  "4クラス":1,"４クラス":1,"3クラス":2,"３クラス":2,
  "2クラス":3,"２クラス":3,"1クラス":4,"１クラス":4,
  "1.5hクラス":5,"ビジター（会員）":6,"ビジター（非会員）":7,
  "ビジター（振替）":8,"初回体験":9,"初回無料":10
};

// Visitor revenue overrides - hardcoded monthly values for data protection
export const visitorRevenueOverrides = {
  '202511': { total: 43200, visitor: 41200, trial: 2000 },
  '202512': { total: 38400, visitor: 35400, trial: 3000 },
  '202601': { total: 42800, visitor: 39800, trial: 3000 },
  '202602': { total: 4000, visitor: 2000, trial: 2000 }
};

// Course prices for dashboard display (monthly tuition by class count)
export const coursePrices = {
  '1': 6000,
  '2': 10000,
  '3': 14400,
  '4': 18600,
  'visitor': 0
};

// Course colors for dashboard
export const courseColors = {
  '1': '#3B82F6',
  '2': '#8B5CF6',
  '3': '#F59E0B',
  '4': '#EF4444',
  'visitor': '#6B7280'
};

// Default schedule - 完成版 (2026-02-14確定)
// ※参照用のみ。このデータはコードから使用されません。
// 実際のデータはFirestoreに保存されています。
export const defaultSchedule = {
  'イベント': [],
  '月曜日': [
    { location: '天神', name: 'アクロバット SOYA', color: 'red', students: [
      { lastName: '中島', firstName: '竜吾', plan: '３クラス' },
      { lastName: '四井', firstName: '陽音', plan: '３クラス' },
      { lastName: '三重野', firstName: '琉生', plan: '３クラス' },
      { lastName: '嶋川', firstName: '陽大', plan: '３クラス' },
      { lastName: '上田', firstName: '大空', plan: '２クラス' },
      { lastName: '津留', firstName: '創真', plan: '２クラス' },
      { lastName: 'ひわたし', firstName: 'こうた', plan: '２クラス' },
      { lastName: '伊藤', firstName: '和馬', plan: '1クラス' },
      { lastName: '豊福', firstName: '悠成', plan: '４クラス' },
      { lastName: '堤', firstName: '勇仁', plan: '３クラス' },
      { lastName: '森田', firstName: '翔真', plan: '３クラス' },
      { lastName: '樋渡', firstName: '皓太', plan: '３クラス' }
    ]},
    { location: '天神', name: 'ブレイキン入門 SOYA', color: 'orange', students: [
      { lastName: '津留', firstName: '創真', plan: '２クラス' },
      { lastName: '榊', firstName: '花梨', plan: '２クラス' },
      { lastName: '樋渡', firstName: '皓太', plan: '３クラス' }
    ]},
    { location: '天神', name: 'トップロック フットワーク DAZ', color: 'blue', students: [
      { lastName: '中島', firstName: '竜吾', plan: '３クラス' },
      { lastName: '四井', firstName: '陽音', plan: '３クラス' },
      { lastName: '三重野', firstName: '琉生', plan: '３クラス' },
      { lastName: '上田', firstName: '大空', plan: '２クラス' },
      { lastName: '伊藤', firstName: '和馬', plan: '1クラス' },
      { lastName: '戸田', firstName: '唯斗', plan: '1クラス' },
      { lastName: '森脇', firstName: '鳳仁', plan: '1クラス' },
      { lastName: '豊福', firstName: '悠成', plan: '４クラス' },
      { lastName: '堤', firstName: '勇仁', plan: '３クラス' }
    ]},
    { location: '天神', name: 'K-POP AI', color: 'green', students: [
      { lastName: '石原', firstName: '美黎', plan: '２クラス' },
      { lastName: '平嶋', firstName: '彩佳', plan: '1クラス' },
      { lastName: '杉村', firstName: '早紀', plan: '1クラス' },
      { lastName: '田代', firstName: '杏奈', plan: '1クラス' },
      { lastName: '唯野', firstName: '萌維', plan: '1クラス' }
    ]},
    { location: '天神', name: 'hiphop HIMEKA', color: 'purple', students: [
      { lastName: '中川', firstName: '凛音', plan: '２クラス' },
      { lastName: '石原', firstName: '美黎', plan: '1クラス' }
    ]},
    { location: '大橋', name: 'hiphop HIMEKA', color: 'purple', students: [
      { lastName: '清水', firstName: 'くるみ', plan: '1クラス' }
    ]}
  ],
  '火曜日': [
    { location: '大橋', name: 'キッズダンス AYANO', color: 'red', students: [
      { lastName: '古賀', firstName: '文人', plan: '1クラス' },
      { lastName: '古賀', firstName: '卯月妃', plan: '1クラス' },
      { lastName: '原口', firstName: '省吾', plan: '1クラス' },
      { lastName: 'わたなべ', firstName: 'いとし', plan: '1クラス' },
      { lastName: '富井', firstName: '藍', plan: '1クラス' }
    ]},
    { location: '大橋', name: 'Bgirlクラス AYANO HARUHIKO', color: 'orange', students: [
      { lastName: '愛甲', firstName: '大輪', plan: '1クラス' }
    ]},
    { location: '照葉', name: 'ブレイキン入門 SOYA', color: 'blue', students: [
      { lastName: '榊', firstName: '花梨', plan: '２クラス' },
      { lastName: '西園', firstName: '千晃', plan: '1クラス' }
    ]},
    { location: '照葉', name: 'アクロ＆パワー SOYA', color: 'green', students: [
      { lastName: '吉武', firstName: '凛保', plan: '３クラス' },
      { lastName: '堤', firstName: '勇仁', plan: '1クラス' }
    ]}
  ],
  '水曜日': [
    { location: '天神', name: 'ブレイキン初級 HARUHIKO', color: 'red', students: [
      { lastName: '田島', firstName: '渚', plan: '1クラス' },
      { lastName: '吉田', firstName: '智幸', plan: '1クラス' },
      { lastName: '本橋', firstName: '廉士', plan: '1クラス' },
      { lastName: '酒井', firstName: '天優', plan: '1クラス' },
      { lastName: '新藤', firstName: '大希', plan: '1クラス' },
      { lastName: '荒巻', firstName: '大和', plan: '1クラス' },
      { lastName: 'しん', firstName: 'よしと', plan: '1クラス' },
      { lastName: '藤野', firstName: '蒼士', plan: '1クラス' }
    ]},
    { location: '天神', name: 'ブレイキン中上級 HARUHIKO', color: 'orange', students: [
      { lastName: '', firstName: '大空', plan: '３クラス' },
      { lastName: '森田', firstName: '翔真', plan: '1クラス' },
      { lastName: '中山', firstName: '結愛', plan: '1クラス' },
      { lastName: '迫田', firstName: 'りりあ', plan: '1クラス' }
    ]}
  ],
  '木曜日': [
    { location: '大橋', name: 'ブレイキン入門 SOYA', color: 'red', students: [
      { lastName: '吉村', firstName: '太壱', plan: '２クラス' },
      { lastName: '原口', firstName: '賢伸', plan: '２クラス' },
      { lastName: '渡邉', firstName: '創太', plan: '２クラス' },
      { lastName: '藤田', firstName: '将舞', plan: '２クラス' },
      { lastName: '藤田', firstName: '凌羽', plan: '２クラス' },
      { lastName: '小柳', firstName: '友陽', plan: '２クラス' },
      { lastName: '豊福', firstName: '悠成', plan: '1クラス' },
      { lastName: '池田', firstName: '全', plan: '1クラス' },
      { lastName: '澤江', firstName: '悠', plan: '1クラス' },
      { lastName: '山下', firstName: '幸四郎', plan: '1クラス' }
    ]},
    { location: '大橋', name: 'アクロ＆パワー SOYA', color: 'orange', students: [
      { lastName: '中山', firstName: '結愛', plan: '２クラス' },
      { lastName: '豊福', firstName: '悠成', plan: '２クラス' },
      { lastName: '吉村', firstName: '太壱', plan: '２クラス' },
      { lastName: '原口', firstName: '賢伸', plan: '２クラス' },
      { lastName: '四井', firstName: '陽音', plan: '２クラス' },
      { lastName: '渡邉', firstName: '創太', plan: '２クラス' },
      { lastName: '小柳', firstName: '友陽', plan: '２クラス' },
      { lastName: '萩原', firstName: '聖香', plan: '1クラス' },
      { lastName: '澤江', firstName: '悠', plan: '1クラス' }
    ]},
    { location: '照葉', name: 'ブレイキン入門 リュウセイ', color: 'blue', students: [
      { lastName: '楊', firstName: 'ビンチェンエイデン', plan: '２クラス' },
      { lastName: '楊', firstName: 'エクソ', plan: '２クラス' },
      { lastName: '梅野', firstName: '壮大', plan: '２クラス' },
      { lastName: '梅野', firstName: '絢音', plan: '２クラス' },
      { lastName: '長谷川', firstName: '丈', plan: '２クラス' },
      { lastName: 'しぎょう', firstName: 'とうま', plan: '1クラス' },
      { lastName: 'しぎょう', firstName: 'ゆうま', plan: '1クラス' }
    ]},
    { location: '照葉', name: 'アクロ＆パワー リュウセイ', color: 'green', students: [
      { lastName: '吉武', firstName: '凛保', plan: '２クラス' },
      { lastName: '楊', firstName: 'ビンチェンエイデン', plan: '２クラス' },
      { lastName: '楊', firstName: 'エクソ', plan: '２クラス' },
      { lastName: '工藤', firstName: '大地', plan: '２クラス' },
      { lastName: '長谷川', firstName: '丈', plan: '２クラス' },
      { lastName: '梅野', firstName: '壮大', plan: '２クラス' },
      { lastName: '梅野', firstName: '絢音', plan: '２クラス' }
    ]}
  ],
  '金曜日': [
    { location: '天神', name: 'アクロ＆パワー SOYA', color: 'red', students: [
      { lastName: '中島', firstName: '竜吾', plan: '３クラス' },
      { lastName: '伊藤', firstName: '和馬', plan: '３クラス' },
      { lastName: '三重野', firstName: '琉生', plan: '３クラス' },
      { lastName: 'よこやま', firstName: 'ゆめ', plan: '２クラス' },
      { lastName: '藤野', firstName: '蒼士', plan: '1クラス' },
      { lastName: '中山', firstName: '隼', plan: '1クラス' }
    ]},
    { location: '天神', name: 'ブレイキン初中級 HARUHIKO', color: 'orange', students: [
      { lastName: '中島', firstName: '竜吾', plan: '３クラス' },
      { lastName: '三重野', firstName: '琉生', plan: '３クラス' },
      { lastName: '伊藤', firstName: '和馬', plan: '３クラス' },
      { lastName: 'よこやま', firstName: 'ゆめ', plan: '２クラス' }
    ]},
    { location: '大橋', name: 'ブレイキン入門 HARUHIKO', color: 'blue', students: [
      { lastName: '萩尾', firstName: '郁海', plan: '２クラス' },
      { lastName: '藤川', firstName: '悠利', plan: '２クラス' },
      { lastName: '藤川', firstName: '柊利', plan: '２クラス' },
      { lastName: '三重野', firstName: 'かな', plan: '２クラス' },
      { lastName: '矢野', firstName: '新', plan: '1クラス' },
      { lastName: '伊豆永', firstName: '晄逢', plan: '1クラス' },
      { lastName: '久保田', firstName: '朱里', plan: '1クラス' },
      { lastName: '古賀', firstName: '心太郎', plan: '1クラス' }
    ]},
    { location: '大橋', name: 'アクロ＆パワー ryusei', color: 'green', students: [
      { lastName: '萩尾', firstName: '郁海', plan: '２クラス' },
      { lastName: '藤川', firstName: '悠利', plan: '２クラス' },
      { lastName: '藤川', firstName: '柊利', plan: '２クラス' },
      { lastName: '三重野', firstName: 'かな', plan: '２クラス' },
      { lastName: '児玉', firstName: '蛍斗', plan: '1クラス' }
    ]}
  ]
};

// Time schedule data
export const timeSchedule = {
  '月曜日': [
    { time: '18:00-19:00', venue: '天神校', name: 'アクロバット SOYA', color: '#DC2626' },
    { time: '18:00-19:00', venue: '天神校', name: 'ブレイキン入門 SOYA', color: '#EA580C' },
    { time: '19:00-20:00', venue: '天神校', name: 'hiphop HIMEKA', color: '#9333EA' },
    { time: '20:00-21:00', venue: '天神校', name: 'K-POP AI', color: '#16A34A' },
    { time: '19:00-20:00', venue: '大橋校', name: 'hiphop HIMEKA', color: '#9333EA' },
    { time: '20:00-21:00', venue: '大橋校', name: 'トップロック フットワーク DAZ', color: '#2563EB' },
    { time: '21:00-22:00', venue: '大橋校', name: '練習会', color: '#F59E0B' }
  ],
  '火曜日': [
    { time: '16:50-17:50', venue: '大橋校', name: 'HIPHOP ヒメカ', color: '#DC2626' },
    { time: '17:30-18:30', venue: '大橋校', name: 'キッズダンス AYANO', color: '#EA580C' },
    { time: '18:40-19:40', venue: '大橋校', name: 'Bgirlクラス AYANO HARUHIKO', color: '#EA580C' },
    { time: '19:00-20:00', venue: '照葉校', name: 'ブレイキン入門 SOYA', color: '#2563EB' },
    { time: '20:00-21:00', venue: '照葉校', name: 'アクロ＆パワー SOYA', color: '#16A34A' }
  ],
  '水曜日': [
    { time: '18:30-19:30', venue: '天神校', name: 'ブレイキン初級 HARUHIKO', color: '#DC2626' },
    { time: '19:30-21:00', venue: '天神校', name: 'ブレイキン中上級 HARUHIKO', color: '#EA580C' }
  ],
  '木曜日': [
    { time: '18:30-19:30', venue: '大橋校', name: 'ブレイキン入門 SOYA', color: '#DC2626' },
    { time: '19:20-20:20', venue: '大橋校', name: 'アクロ＆パワー SOYA', color: '#EA580C' },
    { time: '20:30-21:30', venue: '大橋校', name: 'パワームーブ＆アクロ SOYA', color: '#2563EB' },
    { time: '18:30-19:30', venue: '照葉校', name: 'ブレイキン入門 リュウセイ', color: '#DC2626' },
    { time: '19:30-20:30', venue: '照葉校', name: 'パワーアクロ リュウセイ', color: '#EA580C' },
    { time: '21:30-23:10', venue: '照葉校', name: '練習会', color: '#F59E0B' }
  ],
  '金曜日': [
    { time: '17:50-18:50', venue: '大橋校', name: 'ブレイキン入門 HARUHIKO', color: '#2563EB' },
    { time: '19:00-20:00', venue: '天神校', name: 'アクロ＆パワー SOYA', color: '#DC2626' },
    { time: '19:00-20:00', venue: '大橋校', name: 'パワーアクロ リュウセイ', color: '#EA580C' },
    { time: '20:00-21:00', venue: '天神校', name: 'ブレイキン初中級 HARUHIKO', color: '#EA580C' },
    { time: '20:00-21:00', venue: '大橋校', name: 'アクロ＆パワー ryusei', color: '#16A34A' }
  ]
};

// Instructor data - use EXACT data
export const instructors = [
  {
    name: '邑本 康祐',
    stageName: 'Mottchmen',
    genre: "BREAKIN'",
    birthDate: '1975/3/31',
    careerStart: '1997年よりブレイクダンスを中心にダンスを始める',
    profile: '',
    message: '',
    awards: [
      '2013年 UK bboy championships 九州予選 準優勝',
      '2014年 UK bboy championships 九州予選 準優勝',
      '2015年 WDC 九州大会 best4',
      '2016年 UK bboy championships japan final best8',
      '2017年 WDC 九州大会 best4',
      '2018年 UK bboy championships japan final best4',
      '2018年 Superman grand championships 準優勝',
      '2019,2020年 PARTY×LINE crewbattle 優勝'
    ],
    otherExperience: [
      'SUNSET LIVE 2017,2018,2019',
      'RHYMESTER BBOYイズム バックダンサーとして出演'
    ],
    lessons: [
      'K2JAM ダンススタジオ 2010年〜',
      'スターリー69 ダンススタジオ 2021年9月〜'
    ]
  },
  {
    name: '中島 春彦',
    stageName: 'HARUHIKO aka WATCHM3N',
    genre: "BREAKIN'",
    birthDate: '1982/03/10',
    careerStart: '1999年よりダンス（ブレイキング）のキャリアスタート',
    profile: '2000年からブレイキンのオリジナリティスタートし、ダンスバトルやショウケース、審査員などで九州内外で活動しています。',
    message: 'ブレイキンは非常に運動量の多いダンスです。子供たちの身体能力、柔軟性、体幹を無理なく鍛え、挫折なく効率的に上達できるようなカリキュラムを組んでいます。',
    awards: [
      '2005年 UK B-BOY CHAMPIONSHIPS JAPAN ELIMINATION 準優勝',
      '2006年 UK B-BOY CHAMPIONSHIPS JAPAN ELIMINATION BEST4',
      '2012年 Red Bull BC One japanfinal best4',
      '2015年 World Dance Colosseum ワールドファイナル世界大会審査員',
      '2018年 Red Bull BC One japanfinal best16',
      '2020年 SUPER BREAK 世界大会審査員'
    ],
    otherExperience: [
      'JAPAN DANCE DELIGHT ファイナリスト',
      'GARAND CHAMPION CARNIVAL ファイナリスト複数回',
      'SUNSET LIVE 2017,2018,2019',
      'RHYMESTER BBOYイズム バックダンサー',
      'RHYMESTER 全国ツアー 福岡バックダンサー'
    ],
    lessons: [
      'FEELダンススタジオ 指導歴10年以上',
      'スタジオMJ（世界No.1ブレイクダンサーISSEIを輩出したスタジオ）'
    ]
  },
  {
    name: '甲斐 僧耶',
    stageName: 'SOYA',
    genre: 'アクロバット・ブレイキン',
    birthDate: '1995/11/22',
    careerStart: '2012年よりブレイクダンスを中心にキャリアスタート',
    profile: '小学生の頃、テレビ番組「スーパーチャンプル」を見てダンスに興味を持ち、高2年の冬に本格的にブレイクダンスを始めました。',
    message: 'パワームーブやフリーズ、アクロバットも得意としています。生徒一人ひとりに合わせて指導し、楽しみながら本人の目標に向けてレベルアップしていくことを大切にしています。',
    awards: [
      '2017年 SASEBO DANCE FES 特別賞STEEZ PRIZE',
      '2018年 Kirafes Cup Battle Jam Vol.12 Breakin Side 優勝',
      '2018年 GABANERO Vol.19 優勝',
      '2019年 GABANEROVol.20 準優勝',
      '2019年 UK九州予選 Best 4',
      '2019年 GRAND CHAMPION CARNIVAL Free Style ファイナリスト',
      '2020年 GABANERO Vol.22 優勝'
    ],
    otherExperience: [
      'TBS系列ナイナイお見合い大作戦in八女出演',
      'Emotion rise kyushu支部 フラッシュモブ 元キャスト',
      'RKBTV【チャギハ】Xperia商品PR ダンサー出演'
    ],
    lessons: [
      'TUDIO COLOR 2015〜2020',
      'STUDIO TRAX 2015〜2018',
      'FUNKFUNDANCECOMPANY 2015〜2022',
      'SPROUT production 2019〜現在'
    ]
  },
  {
    name: '伊藤 厚史',
    stageName: 'Ryce',
    genre: "BREAKIN'",
    birthDate: '1986/10/18',
    careerStart: '2004年より中学の頃にブレイクダンスを始める',
    profile: '福岡を拠点に九州をレベれして活動しているBboy。',
    message: '楽しみながら未人の目標に向けてレベルアップしていくことを大切にしています。',
    awards: [
      '2007年 BIG WAX',
      '2009年 Buzz Style',
      '2011年 R-16 世界大会',
      '2013年 UK bboy'
    ],
    otherExperience: [
      'オーストラリア・タイ・その他多数の海外経験'
    ],
    lessons: [
      '指導歴8年近く。福岡以外にも佐賀や犊本でもレッスン経験あり'
    ]
  }
];

// Navigation items
export const navItems = [
  { id: 'home', label: 'HOME', icon: '🏠' },
  { id: 'customers', label: '顧客一覧', icon: '👥' },
  { id: 'attendance', label: '出席名簿', icon: '📋' },
  { id: 'schedule', label: 'スケジュール', icon: '📅' },
  { id: 'instructors', label: '講師プロフィール', icon: '👤' }
];

// Day order for consistent display
export const dayOrder = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日'];
