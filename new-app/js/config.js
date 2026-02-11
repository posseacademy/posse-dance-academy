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
  "4ã¯ã©ã¹": 18600, "ï¼ã¯ã©ã¹": 18600,
  "3ã¯ã©ã¹": 14400, "ï¼ã¯ã©ã¹": 14400,
  "2ã¯ã©ã¹": 10000, "ï¼ã¯ã©ã¹": 10000,
  "1ã¯ã©ã¹": 6000, "ï¼ã¯ã©ã¹": 6000,
  "1.5hã¯ã©ã¹": 6600,
  "ååä½é¨": 1000, "ååç¡æ": 0,
  "ãã¸ã¿ã¼ï¼ä¼å¡ï¼": 2000, "ãã¸ã¿ã¼ï¼éä¼å¡ï¼": 2300,
  "ãã¸ã¿ã¼1.5hï¼ä¼å¡ï¼": 2200, "ãã¸ã¿ã¼1.5hï¼éä¼å¡ï¼": 2500,
  "æè¬ã¯ã©ã¹æ¯æ¿": 1000, "ç·´ç¿ä¼": 500
};

// Plan order for sorting
export const planOrder = {
  "4ã¯ã©ã¹":1,"ï¼ã¯ã©ã¹":1,"3ã¯ã©ã¹":2,"ï¼ã¯ã©ã¹":2,
  "2ã¯ã©ã¹":3,"ï¼ã¯ã©ã¹":3,"1ã¯ã©ã¹":4,"ï¼ã¯ã©ã¹":4,
  "1.5hã¯ã©ã¹":5,"ãã¸ã¿ã¼ï¼ä¼å¡ï¼":6,"ãã¸ã¿ã¼ï¼éä¼å¡ï¼":7,
  "ãã¸ã¿ã¼ï¼æ¯æ¿ï¼":8,"ååä½é¨":9,"ååç¡æ":10
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
  'ï¼': 6000, 'ï¼': 10000, 'ï¼': 14400, 'ï¼': 18600
};

// Course colors for dashboard
export const courseColors = {
  'ï¼': '#3B82F6', 'ï¼': '#8B5CF6', 'ï¼': '#F59E0B', 'ï¼': '#EF4444'
};

// Default schedule - EXACT student names from the live system
export const defaultSchedule = {
  'ã¤ãã³ã': [],
  'æææ¥': [
    { location: 'å¤©ç¥', name: 'ã¢ã¯ã­ããã SOYA', color: 'red', students: [
      { lastName: 'ä¸­å³¶', firstName: 'ç«å¾', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'åäº', firstName: 'é½é³', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'ä¸éé', firstName: 'çç', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'å¶å·', firstName: 'é½å¤§', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: '', firstName: 'å¤§ç©º', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'æ´¥ç', firstName: 'åµç', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'ã²ããã', firstName: 'ããã', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'ä¼è¤', firstName: 'åé¦¬', plan: '1ã¯ã©ã¹' }
    ]},
    { location: 'å¤©ç¥', name: 'ãã¬ã¤ã­ã³å¥é SOYA', color: 'orange', students: [
      { lastName: 'æ´¥ç', firstName: 'åµç', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'æ¦', firstName: 'è±æ¢¨', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'ã²ããã', firstName: 'ããã', plan: 'ï¼ã¯ã©ã¹' }
    ]},
    { location: 'å¤©ç¥', name: 'ãããã­ãã¯ ãããã¯ã¼ã¯ DAZ', color: 'blue', students: [
      { lastName: 'ä¸­å³¶', firstName: 'ç«å¾', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'åäº', firstName: 'é½é³', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'ä¸éé', firstName: 'çç', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: '', firstName: 'å¤§ç©º', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'å¶å·', firstName: 'é½å¤§', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'ä¼è¤', firstName: 'åé¦¬', plan: '1ã¯ã©ã¹' },
      { lastName: 'æ¸ç°', firstName: 'å¯æ', plan: '1ã¯ã©ã¹' },
      { lastName: 'æ£®è', firstName: 'é³³ä»', plan: '1ã¯ã©ã¹' }
    ]},
    { location: 'å¤©ç¥', name: 'K-POP AI', color: 'green', students: [
      { lastName: 'ç³å', firstName: 'ç¾é»', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'å¹³å¶', firstName: 'å½©ä½³', plan: '1ã¯ã©ã¹' },
      { lastName: 'ææ', firstName: 'æ©ç´', plan: '1ã¯ã©ã¹' },
      { lastName: 'ç°ä»£', firstName: 'æå¥', plan: '1ã¯ã©ã¹' },
      { lastName: 'å¯é', firstName: 'èç¶­', plan: '1ã¯ã©ã¹' }
    ]},
    { location: 'å¤©ç¥', name: 'hiphop HIMEKA', color: 'purple', students: [
      { lastName: 'ä¸­å·', firstName: 'åé³', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'ç³å', firstName: 'ç¾é»', plan: '1ã¯ã©ã¹' }
    ]},
    { location: 'å¤§æ©', name: 'hiphop HIMEKA', color: 'purple', students: [
      { lastName: 'æ¸æ°´', firstName: 'ããã¿', plan: '1ã¯ã©ã¹' }
    ]}
  ],
  'ç«ææ¥': [
    { location: 'å¤§æ©', name: 'ã­ããºãã³ã¹ AYANO', color: 'red', students: [
      { lastName: 'å¤è³', firstName: 'æäºº', plan: '1ã¯ã©ã¹' },
      { lastName: 'å¤è³', firstName: 'å¯æå¦', plan: '1ã¯ã©ã¹' },
      { lastName: 'åå£', firstName: 'çå¾', plan: '1ã¯ã©ã¹' },
      { lastName: 'ãããªã¹', firstName: 'ãã¨ã', plan: '1ã¯ã©ã¹' },
      { lastName: 'å¯äº', firstName: 'è', plan: '1ã¯ã©ã¹' }
    ]},
    { location: 'å¤§æ©', name: 'Bgirlã¯ã©ã¹ AYANO HARUHIKO', color: 'orange', students: [
      { lastName: 'æç²', firstName: 'å¤§è¼ª', plan: '1ã¯ã©ã¹' }
    ]},
    { location: 'ç§è', name: 'ãã¬ã¤ã­ã³å¥é SOYA', color: 'blue', students: [
      { lastName: 'æ¦', firstName: 'è±æ¢¨', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'è¥¿å', firstName: 'åæ', plan: '1ã¯ã©ã¹' }
    ]},
    { location: 'ç§è', name: 'ã¢ã¯ã­ï¼ãã¯ã¼ SOYA', color: 'green', students: [
      { lastName: 'åæ­¦', firstName: 'åä¿', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'å ¤', firstName: 'åä»', plan: '1ã¯ã©ã¹' }
    ]}
  ],
  'æ°´ææ¥': [
    { location: 'å¤©ç¥', name: 'ãã¬ã¤ã­ã³åç´ HARUHIKO', color: 'red', students: [
      { lastName: 'ç°å³¶', firstName: 'æ¸', plan: '1ã¯ã©ã¹' },
      { lastName: 'åç°', firstName: 'æºå¹¸', plan: '1ã¯ã©ã¹' },
      { lastName: 'æ¬æ©', firstName: 'å»å£«', plan: '1ã¯ã©ã¹' },
      { lastName: 'éäº', firstName: 'å¤©åª', plan: '1ã¯ã©ã¹' },
      { lastName: 'æ°è¤', firstName: 'å¤§å¸', plan: '1ã¯ã©ã¹' },
      { lastName: 'èå·»', firstName: 'å¤§å', plan: '1ã¯ã©ã¹' },
      { lastName: 'ãã', firstName: 'ããã¨', plan: '1ã¯ã©ã¹' },
      { lastName: 'è¤é', firstName: 'è¼é£«', plan: '1ã¯ã©ã¹' }
    ]},
    { location: 'å¤©ç¥', name: 'ãã¬ã¤ã­ã³ä¸­ä¸ç´ HARUHIKO', color: 'orange', students: [
      { lastName: '', firstName: 'å¤§ç©º', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'æ£®ç°', firstName: 'ç¿ç', plan: '1ã¯ã©ã¹' },
      { lastName: 'ä¸­å±±', firstName: 'çµæ', plan: '1ã¯ã©ã¹' },
      { lastName: 'è¿«ç°', firstName: 'ããã', plan: '1ã¯ã©ã¹' }
    ]}
  ],
  'æ¨ææ¥': [
    { location: 'å¤§æ©', name: 'ãã¬ã¤ã­ã³å¥é SOYA', color: 'red', students: [
      { lastName: 'åæ', firstName: 'å¤ªå£±', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'åå£', firstName: 'è³¢ä¼¸', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'æ¸¡é', firstName: 'åµå¤ª', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'è¤ç°', firstName: 'å°è', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'è¤ç°', firstName: 'åç¾½', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'å°æ³', firstName: 'åé½', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'è±ç£', firstName: 'æ æ', plan: '1ã¯ã©ã¹' },
      { lastName: 'æ± ç°', firstName: 'å¨', plan: '1ã¯ã©ã¹' },
      { lastName: 'æ¾¤æ±', firstName: 'æ ', plan: '1ã¯ã©ã¹' },
      { lastName: 'å±±ä¸', firstName: 'å¹¸åé', plan: '1ã¯ã©ã¹' }
    ]},
    { location: 'å¤§æ©', name: 'ã¢ã¯ã­ï¼ãã¯ã¼ SOYA', color: 'orange', students: [
      { lastName: 'ä¸­å±±', firstName: 'çµæ', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'è±ç¦', firstName: 'æ æ', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'åæ', firstName: 'å¤ªå£±', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'åå£', firstName: 'è³¢ä¼¸', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'åäº', firstName: 'é½é³', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'æ¸¡é', firstName: 'åµå¤ª', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'å°æ³', firstName: 'åé½', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'è©å', firstName: 'èé¦', plan: '1ã¯ã©ã¹' },
      { lastName: 'æ¾¤æ±', firstName: 'æ ', plan: '1ã¯ã©ã¹' }
    ]},
    { location: 'ç§è', name: 'ãã¬ã¤ã­ã³å¥é ãªã¥ã¦ã»ã¤', color: 'blue', students: [
      { lastName: 'æ¥', firstName: 'ãã³ãã§ã³ã¨ã¤ãã³', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'æ¥', firstName: 'ã¨ã¯ã½', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'æ¢é', firstName: 'å£®å¤§', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'æ¢é', firstName: 'çµ¢é³', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'é·è°·å·', firstName: 'ä¸', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'ãããã', firstName: 'ã¨ãã¾', plan: '1ã¯ã©ã¹' },
      { lastName: 'ãããã', firstName: 'ããã¾', plan: '1ã¯ã©ã¹' }
    ]},
    { location: 'ç§è', name: 'ã¢ã¯ã­ï¼ãã¯ã¼ ãªã¥ã¦ã»ã¤', color: 'green', students: [
      { lastName: 'åæ­¦', firstName: 'åä¿', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'æ¥', firstName: 'ãã³ãã§ã³ã¨ã¤ãã³', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'æ¥', firstName: 'ã¨ã¯ã½', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'å·¥è¤', firstName: 'å¤§å°', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'é·è°·å·', firstName: 'ä¸', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'æ¢é', firstName: 'å£®å¤§', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'æ¢é', firstName: 'çµ¢é³', plan: 'ï¼ã¯ã©ã¹' }
    ]}
  ],
  'éææ¥': [
    { location: 'å¤©ç¥', name: 'ã¢ã¯ã­ï¼ãã¯ã¼ SOYA', color: 'red', students: [
      { lastName: 'ä¸­å³¶', firstName: 'ç«å¾', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'ä¼è¤', firstName: 'åé¦¬', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'ä¸éé', firstName: 'çç', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'ãããã¾', firstName: 'ãã', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'è¤é', firstName: 'è¼å£«', plan: '1ã¯ã©ã¹' },
      { lastName: 'ä¸­å±±', firstName: 'é¼', plan: '1ã¯ã©ã¹' }
    ]},
    { location: 'å¤©ç¥', name: 'ãã¬ã¤ã­ã³åä¸­ç´ HARUHIKO', color: 'orange', students: [
      { lastName: 'ä¸­å³¶', firstName: 'ç«å¾', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'ä¸éé', firstName: 'çç', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'ä¼è¤', firstName: 'åé¦¬', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'ãããã¾', firstName: 'ãã', plan: 'ï¼ã¯ã©ã¹' }
    ]},
    { location: 'å¤§æ©', name: 'ãã¬ã¤ã­ã³å¥é HARUHIKO', color: 'blue', students: [
      { lastName: 'è©å°¾', firstName: 'éæµ·', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'è¤å·', firstName: 'æ å©', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'è¤å·', firstName: 'æå©', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'ä¸éé', firstName: 'ããª', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'ç¢é', firstName: 'æ°', plan: '1ã¯ã©ã¹' },
      { lastName: 'ä¼è°¦æ°¸', firstName: 'æé¢', plan: '1ã¯ã©ã¹' },
      { lastName: 'ä¹ä¿ç°', firstName: 'æ±é', plan: '1ã¯ã©ã¹' },
      { lastName: 'å¤è³', firstName: 'å¿å¤ªé', plan: '1ã¯ã©ã¹' }
    ]},
    { location: 'å¤§æ©', name: 'ã¢ã¯ã­ï¼ãã¯ã¼ ryusei', color: 'green', students: [
      { lastName: 'è©å°¾', firstName: 'éæµ·', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'è¤å·', firstName: 'æ å©', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'è¤å·', firstName: 'æå©', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'ä¸éé', firstName: 'ããª', plan: 'ï¼ã¯ã©ã¹' },
      { lastName: 'åç', firstName: 'èæ', plan: '1ã¯ã©ã¹' }
    ]}
  ]
};

// Time schedule data
export const timeSchedule = {
  'æææ¥': [
    { time: '18:00-19:00', venue: 'å¤§ç¥æ ¡', name: 'ã¢ã¯ã­ããã SOYA', color: '#DC2626' },
    { time: '18:00-19:00', venue: 'å¤©ç¥æ ¡', name: 'ãã¬ã¤ã­ã³å¥é SOYA', color: '#EA580C' },
    { time: '19:00-20:00', venue: 'å¤©ç¥æ ¡', name: 'hiphop HIMEKA', color: '#9333EA' },
    { time: '20:00-21:00', venue: 'å¤©ç¥æ ¡', name: 'K-POP AI', color: '#16A34A' },
    { time: '19:00-20:00', venue: 'å¤§æ©æ ¡', name: 'hiphop HIMEKA', color: '#9333EA' },
    { time: '20:00-21:00', venue: 'å¤§æ©æ ¡', name: 'ãããã­ãã¯ ãããã¯ã¼ã¯ DAZ', color: '#2563EB' },
    { time: '21:00-22:00', venue: 'å¤§æ©æ ¡', name: 'ç·´ç¿ä¼', color: '#F59E0B' }
  ],
  'ç«ææ¥': [
    { time: '16:50-17:50', venue: 'å¤§æ©æ ¡', name: 'HIPHOP ãã¡ã«', color: '#DC2626' },
    { time: '17:30-18:30', venue: 'å¤§æ©æ ¡', name: 'ã­ããºãã³ã¹ AYANO', color: '#EA580C' },
    { time: '18:40-19:40', venue: 'å¤§æ©æ ¡', name: 'Bgirlã¯ã©ã¹ AYANO HARUHIKO', color: '#EA580C' },
    { time: '19:00-20:00', venue: 'ç§èæ ¡', name: 'ãã¬ã¤ã­ã³å¥é SOYA', color: '#2563EB' },
    { time: '20:00-21:00', venue: 'ç§èæ ¡', name: 'ã¢ã¯ã­ï¼ãã¯ã¼ SOYA', color: '#16A34A' }
  ],
  'æ°´ææ¥': [
    { time: '18:30-19:30', venue: 'å¤©ç¥æ ¡', name: 'ãã¬ã¤ã­ã³åç´ HARUHIKO', color: '#DC2626' },
    { time: '19:30-21:00', venue: 'å¤©ç¥æ ¡', name: 'ãã¬ã¤ã­ã³ä¸­ä¸ç´ HARUHIKO', color: '#EA580C' }
  ],
  'æ¨ææ¥': [
    { time: '18:30-19:30', venue: 'å¤§æ©æ ¡', name: 'ãã¬ã¤ã­ã³å¥é SOYA', color: '#DC2626' },
    { time: '19:20-20:20', venue: 'å¤§æ©æ ¡', name: 'ã¢ã¯ã­ï¼ãã¯ã¼ SOYA', color: '#EA580C' },
    { time: '20:30-21:30', venue: 'å¤§æ©æ ¡', name: 'ãã¯ã¼ã ã¼ãï¼ã¢ã¯ã­ SOYA', color: '#2563EB' },
    { time: '18:30-19:30', venue: 'ç§èæ ¡', name: 'ãã¬ã¤ã­ã³å¥é ãªã¥ã¦ã»ã¤', color: '#DC2626' },
    { time: '19:30-20:30', venue: 'ç§èæ ¡', name: 'ãã¯ã¼ã¢ã¯ã­ ãªã¥ã¦ã»ã¤', color: '#EA580C' },
    { time: '21:30-23:10', venue: 'ç§èæ ¡', name: 'ç·´ç¿ä¼', color: '#F59E0B' }
  ],
  'éææ¥': [
    { time: '17:50-18:50', venue: 'å¤§æ©æ ¡', name: 'ãã¬ã¤ã­ã³å¥é HARUHIKO', color: '#2563EB' },
    { time: '19:00-20:00', venue: 'å¤©ç¥æ ¡', name: 'ã¢ã¯ã­ï¼ãã¯ã¼ SOYA', color: '#DC2626' },
    { time: '19:00-20:00', venue: 'å¤§æ©æ ¡', name: 'ãã¯ã¼ã¢ã¯ã­ ãªã¥ã¦ã»ã¤', color: '#EA580C' },
    { time: '20:00-21:00', venue: 'å¤©ç¥æ ¡', name: 'ãã¬ã¤ã­ã³åä¸­ç´ HARUHIKO', color: '#EA580C' },
    { time: '20:00-21:00', venue: 'å¤§æ©æ ¡', name: 'ã¢ã¯ã­ï¼ãã¯ã¼ ryusei', color: '#16A34A' }
  ]
};

// Instructor data - use EXACT data
export const instructors = [
  {
    name: 'é¶æ¬ åº·ç¥',
    stageName: 'Mottchmen',
    genre: "BREAKIN'",
    birthDate: '1975/3/31',
    careerStart: '1997å¹´ãããã¬ã¤ã¯ãã³ã¹ãä¸­å¿ã«ãã³ã¹ãå§ãã',
    profile: '',
    message: '',
    awards: [
      '2013å¹´ UK bboy championships ä¹å·äºé¸ æºåªå',
      '2014å¹´ UK bboy championships ä¹å·äºé¸ æºåªå',
      '2015å¹´ WDC ä¹å·å¤§ä¼ best4',
      '2016å¹´ UK bboy championships japan final best8',
      '2017å¹´ WDC ä¹å·å¤§ä¼ best4',
      '2018å¹´ UK bboy championships japan final best4',
      '2018å¹´ Superman grand championships æºåªå',
      '2019,2020å¹´ PARTYÃLINE crewbattle åªå'
    ],
    otherExperience: [
      'SUNSET LIVE 2017,2018,2019',
      'RHYMESTER BBOYã¤ãºã  ããã¯ãã³ãµã¼ã¨ãã¦åºæ¼'
    ],
    lessons: [
      'K2JAM ãã³ã¹ã¹ã¿ã¸ãª 2010å¹´ã',
      'ã¹ã¿ã¼ãªã¼69 ãã³ã¹ã¹ã¿ã¸ãª 2021å¹´9æã'
    ]
  },
  {
    name: 'ä¸­å³¶ æ¥å½¦',
    stageName: 'HARUHIKO aka WATCHM3N',
    genre: "BREAKIN'",
    birthDate: '1982/03/10',
    careerStart: '1999å¹´ãããã³ã¹ï¼ãã¬ã¤ã­ã³ã°ï¼ã®ã­ã£ãªã¢ã¹ã¿ã¼ã',
    profile: '2000å¹´ãããã¬ã¤ã­ã³ã®ãªãªã¸ããªãã£ã¹ã¿ã¼ããããã³ã¹ããã«ãã·ã§ã¦ã±ã¼ã¹ãå¯©æ»å¡ãªã©ã§ä¹å·åå¤ã§æ´»åãã¦ãã¾ãã',
    message: 'ãã¬ã¤ã­ã³ã¯éå¸¸ã«éåéã®å¤ããã³ã¹ã§ããå­ä¾ãã¡ã®èº«ä½è½åãæè»æ§ãä½å¹¹ãç¡çãªãéããæ«æãªãå¹ççã«ä¸éã§ãããããªã«ãªã­ã¥ã©ã ãçµãã§ãã¾ãã',
    awards: [
      '2005å¹´ UK B-BOY CHAMPIONSHIPS JAPAN ELIMINATION æºåªå',
      '2006å¹´ UK B-BOY CHAMPIONSHIPS JAPAN ELIMINATION BEST4',
      '2012å¹´ Red Bull BC One japanfinal best4',
      '2015å¹´ World Dance Colosseum ã¯ã¼ã«ããã¡ã¤ãã«ä¸çå¤§ä¼å¯©æ»å¡',
      '2018å¹´ Red Bull BC One japanfinal best16',
      '2020å¹´ SUPER BREAK ä¸çå¤§ä¼å¯©æ»å¡'
    ],
    otherExperience: [
      'JAPAN DANCE DELIGHT ãã¡ã¤ããªã¹ã',
      'GARAND CHAMPION CARNIVAL ãã¡ã¤ããªã¹ãè¤æ°å',
      'SUNSET LIVE 2017,2018,2019',
      'RHYMESTER BBOYã¤ãºã  ããã¯ãã³ãµã¼',
      'RHYMESTER å¨å½ãã¢ã¼ ç¦å²¡ããã¯ãã³ãµã¼'
    ],
    lessons: [
      'FEELãã³ã¹ã¹ã¿ã¸ãª æå°æ­´10å¹´ä»¥ä¸',
      'ã¹ã¿ã¸ãªMJï¼ä¸çNo.1ãã¬ã¤ã¯ãã³ãµã¼ISSEIãè¼©åºããã¹ã¿ã¸ãªï¼'
    ]
  },
  {
    name: 'ç²æ å§è¶',
    stageName: 'SOYA',
    genre: 'ã¢ã¯ã­ãããã»ãã¬ã¤ã­ã³',
    birthDate: '1995/11/22',
    careerStart: '2012å¹´ãããã¬ã¤ã¯ãã³ã¹ãä¸­å¿ã«ã­ã£ãªã¢ã¹ã¿ã¼ã',
    profile: 'å°å­¦çã®é ããã¬ãçªçµãã¹ã¼ãã¼ãã£ã³ãã«ããè¦ã¦ãã³ã¹ã«èå³ãæã¡ãé«2å¹´ã®å¬ã«æ¬æ ¼çã«ãã¬ã¤ã¯ãã³ã¹ãå§ãã¾ããã',
    message: 'ãã¯ã¼ã ã¼ããããªã¼ãºãã¢ã¯ã­ããããå¾æã¨ãã¦ãã¾ããçå¾ä¸äººã²ã¨ãã«åããã¦æå°ããæ¥½ãã¿ãªããæ¬äººã®ç®æ¨ã«åãã¦ã¬ãã«ã¢ãããã¦ãããã¨ãå¤§åã«ãã¦ãã¾ãã',
    awards: [
      '2017å¹´ SASEBO DANCE FES ç¹å¥è³STEEZ PRIZE',
      '2018å¹´ Kirafes Cup Battle Jam Vol.12 Breakin Side åªå',
      '2018å¹´ GABANERO Vol.19 åªå',
      '2019å¹´ GABANEROVol.20 æºåªå',
      '2019å¹´ UKä¹å·äºé¸ Best 4',
      '2019å¹´ GRAND CHAMPION CARNIVAL Free Style ãã¡ã¤ããªã¹ã',
      '2020å¹´ GABANERO Vol.22 åªå'
    ],
    otherExperience: [
      'TBSç³»åãã¤ãã¤ãè¦åãå¤§ä½æ¦inå«å¥³åºæ¼',
      'Emotion rise kyushuæ¯é¨ ãã©ãã·ã¥ã¢ã åã­ã£ã¹ã',
      'RKBTVããã£ã®ããXperiaååPR ãã³ãµã¼åºæ¼'
    ],
    lessons: [
      'TUDIO COLOR 2015ã2020',
      'STUDIO TRAX 2015ã2018',
      'FUNKFUNDANCECOMPANY 2015ã2022',
      'SPROUT production 2019ãç¾å¨'
    ]
  },
  {
    name: 'ä¼è¤ åå²',
    stageName: 'Ryce',
    genre: "BREAKIN'",
    birthDate: '1986/10/18',
    careerStart: '2004å¹´ããä¸­å­¦ã®é ã«ãã¬ã¤ã¯ãã³ã¹ãå§ãã',
    profile: 'ç¦å²¡ãæ ç¹ã«ä¹å·ãã¬ãã¼ãã¦ã¬»åãã¦ããBboyã',
    message: 'æ¥½ãã¿ãªããæ¬äººã®ç®æ¨ã«åãã¦ã¬ãã«ã¢ãããã¦ãããã¨ãå¤§åã«ãã¦ãã¾ãã',
    awards: [
      '2007å¹´ BIG WAX',
      '2009å¹´ Buzz Style',
      '2011å¹´ R-16 ä¸çå¤§ä¼',
      '2013å¹´ UK bboy'
    ],
    otherExperience: [
      'ãªã¼ã¹ãã©ãªã¢ã»ã¿ã¤ã»ãã®ä»å¤æ°ã®æµ·å¤çµé¨'
    ],
    lessons: [
      'æå°æ­´8å¹´è¿ããç¦å²¡ä»¥å¤ã«ãä½è³ãçæ¬ã§ãã¬ãã¹ã³çµé¨ãã'
    ]
  }
];

// Navigation items
export const navItems = [
  { id: 'home', label: 'HOME', icon: 'ð ' },
  { id: 'customers', label: 'é¡§å®¢ä¸è¦§', icon: 'ð¥' },
  { id: 'attendance', label: 'åºå¸­åç°¿', icon: 'ð' },
  { id: 'schedule', label: 'ã¹ã±ã¸ã¥ã¼ã«', icon: 'ð' },
  { id: 'instructors', label: 'è¬å¸«ãã­ãã£ã¼ã«', icon: 'ð¤' }
];

// Day order for consistent display
export const dayOrder = ['æææ¥', 'ç«ææ¥', 'æ°´ææ¥', 'æ¨ææ¥', 'éææ¥'];
