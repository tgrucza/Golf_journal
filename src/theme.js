export const C = {
  bg: '#F4F6F0',
  card: '#FFFFFF',
  pine: '#1F4B3F',
  pineDark: '#153229',
  navy: '#1B3A6B',
  navyShadow: 'rgba(27,58,107,0.28)',
  hit: '#3F8E5C',
  hitBg: '#E7F2EA',
  miss: '#C1443A',
  missBg: '#FBEAE8',
  water: '#2F6E8C',
  waterBg: '#E5EFF2',
  neutral: '#C9962E',
  neutralBg: '#FBF1DD',
  ink: '#1A2B22',
  inkSoft: '#5B6B62',
  line: '#E1E5DC',
};


export const TEE_OPTIONS = [
  { key: 'left', label: 'Miss Left', color: C.miss },
  { key: 'fairway', label: 'Fairway', color: C.hit },
  { key: 'right', label: 'Miss Right', color: C.miss },
];
export const APPROACH_OPTIONS = [
  { key: 'green', label: 'Hit Green', color: C.hit },
  { key: 'short', label: 'Short', color: C.miss },
  { key: 'long', label: 'Long', color: C.miss },
  { key: 'left', label: 'Left', color: C.miss },
  { key: 'right', label: 'Right', color: C.miss },
];
export const SHORT_GAME_OPTIONS = [
  { key: 'short', label: 'Short of Pin', color: C.miss },
  { key: 'pinhigh', label: 'Pin High', color: C.hit },
  { key: 'long', label: 'Long of Pin', color: C.miss },
  { key: 'holed', label: 'Holed It', color: C.hit },
];
export const FIRST_PUTT_OPTIONS = [
  { key: 'short', label: 'Short', color: C.miss },
  { key: 'holed', label: 'Holed', color: C.hit },
  { key: 'long', label: 'Long', color: C.miss },
];
export const TROUBLE_OPTIONS = [
  { key: 'bunker', label: 'Bunker', color: C.neutral },
  { key: 'water', label: 'Water', color: C.water },
  { key: 'ob', label: 'O.B.', color: C.miss },
];
export const BREAK_OPTIONS = [
  { key: 'high', label: 'Missed High Side', color: C.neutral },
  { key: 'low', label: 'Missed Low Side', color: C.neutral },
];


export const SECTION_TITLE_STYLE = { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, color: C.inkSoft, textTransform: 'uppercase', marginBottom: 5 };
