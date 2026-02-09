/**
 * Ashtakoot (8 Koota) Milan data - aligned with Saravali/Maitreya standard.
 * Varna: from Moon sign (rasi) per Saravali. Yoni: from nakshatra per Saravali pairs.
 */

// Nakshatra index 0-26. Vashya/Gana/Nadi from standard; Yoni from Saravali (Aswini+Satabhisha=Horse, etc.)
// Varna is NOT from nakshatra here; use signToVarna(moonSign) for Varna koota (Saravali: Moon sign → Brahmin/Kshatriya/Vaishya/Shudra).
const NAKSHATRA_MILAN = [
  { vashya: 1, yoni: 1, gana: 1, nadi: 1 },   // 0 Aswini - Horse
  { vashya: 1, yoni: 2, gana: 2, nadi: 2 },   // 1 Bharani - Elephant
  { vashya: 1, yoni: 3, gana: 2, nadi: 3 },   // 2 Krittika - Goat (Mesha)
  { vashya: 1, yoni: 4, gana: 1, nadi: 1 },   // 3 Rohini - Serpent
  { vashya: 2, yoni: 4, gana: 1, nadi: 2 },   // 4 Mrigasira - Serpent
  { vashya: 1, yoni: 5, gana: 2, nadi: 3 },   // 5 Ardra - Dog
  { vashya: 2, yoni: 6, gana: 1, nadi: 1 },   // 6 Punarvasu - Cat
  { vashya: 1, yoni: 3, gana: 1, nadi: 2 },   // 7 Pushya - Goat
  { vashya: 2, yoni: 6, gana: 2, nadi: 3 },   // 8 Ashlesha - Cat
  { vashya: 1, yoni: 7, gana: 2, nadi: 1 },   // 9 Magha - Rat
  { vashya: 1, yoni: 7, gana: 2, nadi: 2 },   // 10 Purva Phalguni - Rat
  { vashya: 2, yoni: 8, gana: 1, nadi: 3 },   // 11 Uttara Phalguni - Cow (Gau)
  { vashya: 1, yoni: 9, gana: 1, nadi: 1 },   // 12 Hasta - Buffalo
  { vashya: 2, yoni: 10, gana: 2, nadi: 2 },  // 13 Chitra - Tiger
  { vashya: 1, yoni: 9, gana: 1, nadi: 3 },   // 14 Swati - Buffalo
  { vashya: 2, yoni: 10, gana: 2, nadi: 1 },  // 15 Vishakha - Tiger
  { vashya: 1, yoni: 11, gana: 1, nadi: 2 },  // 16 Anuradha - Deer
  { vashya: 1, yoni: 11, gana: 2, nadi: 3 },  // 17 Jyeshtha - Deer
  { vashya: 1, yoni: 5, gana: 2, nadi: 1 },   // 18 Mula - Dog
  { vashya: 1, yoni: 12, gana: 1, nadi: 2 },  // 19 Purva Ashadha - Monkey
  { vashya: 2, yoni: 13, gana: 2, nadi: 3 },  // 20 Uttara Ashadha - Mongoose
  { vashya: 1, yoni: 12, gana: 1, nadi: 1 },  // 21 Shravana - Monkey
  { vashya: 2, yoni: 14, gana: 2, nadi: 2 },  // 22 Dhanishta - Lion
  { vashya: 1, yoni: 1, gana: 2, nadi: 3 },   // 23 Satabhisha - Horse
  { vashya: 2, yoni: 14, gana: 1, nadi: 1 },  // 24 Purva Bhadrapada - Lion
  { vashya: 1, yoni: 8, gana: 1, nadi: 2 },   // 25 Uttara Bhadrapada - Cow (Gau)
  { vashya: 2, yoni: 2, gana: 1, nadi: 3 },   // 26 Revati - Elephant
];

// Varna: from Moon sign (rasi) per Saravali. 1=Brahmin(Water:4,8,12), 2=Kshatriya(Fire:1,5,9), 3=Vaishya(Air:3,7,11), 4=Shudra(Earth:2,6,10)
function signToVarna(sign) {
  const s = Number(sign);
  if (!s || s < 1 || s > 12) return 2; // fallback Kshatriya
  if (s === 4 || s === 8 || s === 12) return 1; // Brahmin - Water
  if (s === 1 || s === 5 || s === 9) return 2;   // Kshatriya - Fire
  if (s === 3 || s === 7 || s === 11) return 3;  // Vaishya - Air
  return 4; // Shudra - Earth (2,6,10)
}

// Varna matrix 4x4. [girl-1][boy-1]. Groom varna >= bride varna → 1 point.
const VARNA_MATRIX = [
  [1, 0, 0, 0],
  [1, 1, 0, 0],
  [1, 1, 1, 0],
  [1, 1, 1, 1],
];

// Vashya matrix 6x6 (Java f9419OoooOOo). OooO0OO(boyVashya, girlVashya) -> [boy-1][girl-1]
const VASHYA_MATRIX = [
  [2, 1, 1, 1, 1, 0],
  [1, 2, 2, 0.5, 0, 0],
  [1, 2, 2, 0.5, 0, 0],
  [1, 0.5, 0.5, 2, 1, 1],
  [1, 1, 1, 1, 2, 0],
  [0.5, 0, 0, 1, 0, 2],
];

// Tara matrix 9x9 (Java f9421OoooOoO). 27 nakshatras in 9 tara groups: tara = floor((nak1-based - 1) / 3) + 1
const TARA_MATRIX = [
  [3, 3, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 3],
  [3, 3, 3, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5],
  [1.5, 3, 3, 3, 1.5, 1.5, 1.5, 1.5, 1.5],
  [1.5, 1.5, 3, 3, 3, 1.5, 1.5, 1.5, 1.5],
  [1.5, 1.5, 1.5, 3, 3, 3, 1.5, 1.5, 1.5],
  [1.5, 1.5, 1.5, 1.5, 3, 3, 3, 1.5, 1.5],
  [1.5, 1.5, 1.5, 1.5, 1.5, 3, 3, 3, 1.5],
  [1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 3, 3, 3],
  [3, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 3, 3],
];

// Yoni matrix 14x14 (Java f9420OoooOo0). OooOo0(boyYoni, girlYoni) -> [girl-1][boy-1]
const YONI_MATRIX_14 = [
  [4, 2, 3, 2, 2, 3, 3, 3, 1, 1, 3, 2, 2, 1],
  [2, 4, 3, 2, 2, 3, 3, 3, 3, 2, 2, 2, 2, 0],
  [3, 3, 4, 3, 2, 3, 1, 3, 3, 1, 3, 0, 3, 1],
  [2, 2, 3, 4, 2, 2, 1, 1, 2, 2, 2, 2, 0, 2],
  [2, 2, 2, 2, 4, 1, 1, 2, 2, 1, 0, 2, 2, 1],
  [2, 2, 3, 2, 1, 4, 0, 2, 2, 1, 2, 2, 2, 2],
  [2, 2, 2, 1, 1, 0, 4, 2, 2, 2, 2, 2, 2, 1],
  [3, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 3, 1],
  [1, 3, 3, 2, 2, 2, 2, 3, 4, 1, 2, 2, 2, 3],
  [1, 2, 1, 2, 1, 1, 2, 0, 1, 4, 2, 1, 2, 2],
  [3, 2, 3, 2, 0, 2, 2, 3, 2, 1, 4, 2, 2, 2],
  [2, 3, 0, 2, 2, 2, 2, 2, 2, 1, 2, 4, 2, 3],
  [2, 2, 3, 0, 2, 2, 2, 3, 2, 2, 2, 2, 4, 2],
  [1, 0, 1, 2, 1, 2, 1, 1, 3, 2, 2, 2, 2, 4],
];

// Graha Maitri: sign (1-12) -> ruler index 1-7 (Java OooO0oO). Sun=1,Moon=2,Mars=3,Mercury=4,Jupiter=5,Venus=6,Saturn=7
function signToRuler(sign) {
  const s = Number(sign);
  if (s === 1 || s === 8) return 3; // Mars
  if (s === 2 || s === 7) return 6; // Venus
  if (s === 3 || s === 6) return 4; // Mercury
  if (s === 4) return 2;            // Moon
  if (s === 5) return 1;            // Sun
  if (s === 9 || s === 12) return 5; // Jupiter
  if (s === 10 || s === 11) return 7; // Saturn
  return 1;
}

// Graha Maitri matrix 7x7 (Java f9425OooooO0). OooO0oo(rulerBoy, rulerGirl) -> [rulerGirl-1][rulerBoy-1]
const GRAHA_MAITRI_MATRIX = [
  [5, 5, 5, 4, 5, 0, 0],
  [5, 5, 4, 1, 4, 0.5, 0.5],
  [5, 4, 5, 0.5, 5, 3, 0.5],
  [4, 1, 0.5, 5, 0.5, 5, 4],
  [5, 4, 5, 0.5, 5, 0.5, 3],
  [0, 0.5, 3, 5, 0.5, 5, 5],
  [0, 0.5, 0.5, 4, 3, 5, 5],
];

// Gana matrix 3x3 (Java f9424Ooooo0o). OooOO0(boyGana, girlGana) -> [girl-1][boy-1]. Deva=1,Rakshasa=2,Manav=3
const GANA_MATRIX = [
  [6, 1, 5],
  [0, 6, 0],
  [6, 0, 6],
];

// Bhakoot matrix 12x12 (Java f9423Ooooo00). Moon sign 1-12. OooO0o0(boySign, girlSign) -> [girl-1][boy-1]
const BHAKOOT_MATRIX = [
  [7, 0, 7, 7, 0, 0, 7, 0, 0, 7, 7, 0],
  [0, 7, 0, 7, 7, 0, 0, 7, 0, 0, 7, 7],
  [7, 0, 7, 0, 7, 7, 0, 0, 7, 0, 0, 7],
  [7, 7, 0, 7, 0, 7, 7, 0, 0, 7, 0, 0],
  [0, 7, 7, 0, 7, 0, 7, 7, 0, 0, 7, 0],
  [0, 0, 7, 7, 0, 7, 0, 7, 7, 0, 0, 7],
  [7, 0, 0, 7, 7, 0, 7, 0, 7, 7, 0, 0],
  [0, 7, 0, 0, 7, 7, 0, 7, 0, 7, 7, 0],
  [0, 0, 7, 0, 0, 7, 7, 0, 7, 0, 7, 7],
  [7, 0, 0, 7, 0, 0, 7, 7, 0, 7, 0, 7],
  [7, 7, 0, 0, 7, 0, 0, 7, 7, 0, 7, 0],
  [0, 7, 7, 0, 0, 7, 0, 0, 7, 7, 0, 7],
];

// Nadi matrix 3x3 (Java f9422OoooOoo). OooOO0o(boyNadi, girlNadi) -> [girl-1][boy-1]. 0 or 8 points
const NADI_MATRIX = [
  [0, 8, 8],
  [8, 0, 8],
  [8, 8, 0],
];

// Max points per koota (Java OooO0O0(), OooO0Oo(), etc.)
const MAX_POINTS = {
  varna: 1,
  vashya: 2,
  tara: 3,
  yoni: 4,
  grahaMaitri: 5,
  gana: 6,
  bhakoot: 7,
  nadi: 8,
  total: 36,
};

function getNakshatraMilan(nakshatraIndex0Based) {
  const i = Math.max(0, Math.min(26, Math.floor(nakshatraIndex0Based)));
  return NAKSHATRA_MILAN[i];
}

function getTaraGroup(nakshatraIndex1Based) {
  return Math.floor((nakshatraIndex1Based - 1) / 3) + 1;
}

function safeMatrixGet(matrix, row, col, defaultVal = 0) {
  const r = Math.max(0, Math.min(matrix.length - 1, row));
  const c = Math.max(0, Math.min((matrix[r] || []).length - 1, col));
  const val = matrix[r] && matrix[r][c];
  return typeof val === 'number' ? val : defaultVal;
}

module.exports = {
  NAKSHATRA_MILAN,
  VARNA_MATRIX,
  VASHYA_MATRIX,
  TARA_MATRIX,
  YONI_MATRIX_14,
  GRAHA_MAITRI_MATRIX,
  GANA_MATRIX,
  BHAKOOT_MATRIX,
  NADI_MATRIX,
  MAX_POINTS,
  getNakshatraMilan,
  getTaraGroup,
  signToRuler,
  signToVarna,
  safeMatrixGet,
};
