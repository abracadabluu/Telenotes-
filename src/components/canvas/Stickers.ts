export interface StickerDefinition {
  id: string;
  name: string;
  category: 'telegram' | 'mood' | 'writer' | 'reactions' | 'custom';
  svgDataUri: string;
}

// Crisp Telegram-style vector stickers encoded as clean SVGs
export const PRESET_STICKERS: StickerDefinition[] = [
  {
    id: 'tg-duck-quill',
    name: 'Quill Duck',
    category: 'writer',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23FFD13B"/><ellipse cx="50" cy="62" rx="28" ry="22" fill="%23F6BE22"/><circle cx="38" cy="42" r="6" fill="%23222"/><circle cx="62" cy="42" r="6" fill="%23222"/><circle cx="40" cy="40" r="2" fill="%23fff"/><circle cx="64" cy="40" r="2" fill="%23fff"/><polygon points="44,52 56,52 50,62" fill="%23FF7A00"/><path d="M68,30 Q85,15 88,38 Q82,34 76,38 Z" fill="%230284C7"/><path d="M72,32 L84,20" stroke="%23fff" stroke-width="2"/></svg>`,
  },
  {
    id: 'tg-starry-fire',
    name: 'Inspiration Fire',
    category: 'reactions',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,10 Q65,35 60,50 Q75,45 70,68 Q65,88 50,90 Q35,88 30,68 Q25,45 40,50 Q35,35 50,10 Z" fill="%23FF4500"/><path d="M50,30 Q60,45 56,58 Q66,55 62,72 Q58,82 50,83 Q42,82 38,72 Q34,55 44,58 Q40,45 50,30 Z" fill="%23FFD700"/><circle cx="50" cy="65" r="8" fill="%23FFFFFF"/></svg>`,
  },
  {
    id: 'tg-sparkle-heart',
    name: 'Glowing Heart',
    category: 'mood',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,85 C20,60 10,40 10,25 C10,12 22,5 35,5 C42,5 47,9 50,14 C53,9 58,5 65,5 C78,5 90,12 90,25 C90,40 80,60 50,85 Z" fill="%23E11D48"/><circle cx="32" cy="22" r="5" fill="%23fff" opacity="0.6"/><polygon points="75,20 78,25 84,26 80,30 81,36 75,33 70,36 71,30 67,26 72,25" fill="%23FFD700"/></svg>`,
  },
  {
    id: 'tg-cat-thinking',
    name: 'Curious Cat',
    category: 'telegram',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="55" r="35" fill="%2394A3B8"/><polygon points="22,30 30,5 42,28" fill="%2394A3B8"/><polygon points="26,27 31,12 39,26" fill="%23FDA4AF"/><polygon points="78,30 70,5 58,28" fill="%2394A3B8"/><polygon points="74,27 69,12 61,26" fill="%23FDA4AF"/><circle cx="38" cy="50" r="5" fill="%231E293B"/><circle cx="62" cy="50" r="5" fill="%231E293B"/><polygon points="46,60 54,60 50,65" fill="%23F43F5E"/><path d="M42,68 Q50,73 58,68" stroke="%23334155" stroke-width="2" fill="none"/></svg>`,
  },
  {
    id: 'tg-coffee-cup',
    name: 'Night Owl Coffee',
    category: 'writer',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="25" y="35" width="45" height="45" rx="10" fill="%23854D0E"/><path d="M70,45 C82,45 85,65 70,68" stroke="%23854D0E" stroke-width="6" fill="none" stroke-linecap="round"/><ellipse cx="47" cy="85" rx="35" ry="6" fill="%23CBD5E1"/><path d="M35,28 Q40,15 45,28" stroke="%2394A3B8" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M50,25 Q55,10 60,25" stroke="%2394A3B8" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'tg-rocket-launch',
    name: 'Goal Rocket',
    category: 'reactions',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,10 C65,25 70,60 65,75 L35,75 C30,60 35,25 50,10 Z" fill="%2338BDF8"/><circle cx="50" cy="40" r="10" fill="%23fff"/><circle cx="50" cy="40" r="7" fill="%230284C7"/><path d="M35,60 L20,75 L35,75 Z" fill="%23EF4444"/><path d="M65,60 L80,75 L65,75 Z" fill="%23EF4444"/><polygon points="42,75 58,75 50,95" fill="%23F97316"/></svg>`,
  },
  {
    id: 'tg-secret-lock',
    name: 'Encrypted Vault',
    category: 'mood',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="25" y="45" width="50" height="42" rx="10" fill="%230284C7"/><path d="M35,45 L35,30 C35,20 65,20 65,30 L65,45" stroke="%230284C7" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="50" cy="62" r="6" fill="%23fff"/><rect x="48" y="62" width="4" height="12" fill="%23fff"/></svg>`,
  },
  {
    id: 'tg-zen-lotus',
    name: 'Mindful Zen',
    category: 'mood',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,20 C60,45 80,60 50,85 C20,60 40,45 50,20 Z" fill="%2310B981"/><path d="M50,35 C65,55 90,65 65,85 C45,75 42,55 50,35 Z" fill="%2334D399" opacity="0.8"/><path d="M50,35 C35,55 10,65 35,85 C55,75 58,55 50,35 Z" fill="%2334D399" opacity="0.8"/></svg>`,
  },
  {
    id: 'tg-music-vibes',
    name: 'Deep Focus',
    category: 'reactions',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="%238B5CF6"/><rect x="30" y="45" width="10" height="25" rx="4" fill="%23fff"/><rect x="60" y="45" width="10" height="25" rx="4" fill="%23fff"/><path d="M35,48 C35,25 65,25 65,48" stroke="%23fff" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="50" cy="65" r="4" fill="%23A78BFA"/></svg>`,
  },
  {
    id: 'tg-book-open',
    name: 'Open Manuscript',
    category: 'writer',
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M15,25 C30,22 45,28 50,35 C55,28 70,22 85,25 L85,75 C70,72 55,78 50,85 C45,78 30,72 15,75 Z" fill="%23F8FAFC" stroke="%23334155" stroke-width="4"/><line x1="50" y1="35" x2="50" y2="85" stroke="%23334155" stroke-width="4"/><line x1="25" y1="42" x2="42" y2="40" stroke="%2394A3B8" stroke-width="2"/><line x1="25" y1="52" x2="42" y2="50" stroke="%2394A3B8" stroke-width="2"/><line x1="58" y1="40" x2="75" y2="42" stroke="%2394A3B8" stroke-width="2"/><line x1="58" y1="50" x2="75" y2="52" stroke="%2394A3B8" stroke-width="2"/></svg>`,
  },
];
