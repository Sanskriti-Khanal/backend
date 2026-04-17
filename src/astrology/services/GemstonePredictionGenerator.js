/**
 * Complete Gemstone Prediction Generator for Node.js
 * Generates predictions for combinations of grahas in houses 1, 5, 9 (template-based).
 * Pattern aligned with legacy gemstone_predictions copy; used on-demand by the API.
 */

// ============================================================
// CONSTANTS & MAPPINGS
// ============================================================

const LAGNA_LIST = [
  'मेष',
  'वृषभ',
  'मिथुन',
  'कर्क',
  'सिंह',
  'कन्या',
  'तुला',
  'वृश्चिक',
  'धनु',
  'मकर',
  'कुम्भ',
  'मीन',
];

const PLANETS = [
  'सूर्य',
  'चन्द्र',
  'मंगल',
  'बुध',
  'गुरु',
  'शुक्र',
  'शनि',
  'राहु',
  'केतु',
];

const LAGNA_PERSONALITY = {
  मेष: 'एक जोशिलो र साहसी व्यक्तित्व',
  वृषभ: 'स्थिर, धैर्यशील र सौन्दर्यप्रिय स्वभाव',
  मिथुन: 'चतुर, जिज्ञासु र बहुमुखी प्रतिभाका धनी',
  कर्क: 'भावनात्मक गहिराई, पारिवारिक प्रेम र सहजताका धनी',
  सिंह: 'तेजस्वी, नेतृत्वकारी र स्वाभिमानी व्यक्तित्व',
  कन्या: 'विश्लेषणात्मक, परिश्रमी र व्यवस्थाप्रिय स्वभाव',
  तुला: 'सन्तुलनप्रिय, न्यायप्रिय र सौन्दर्यशास्त्रका प्रेमी',
  वृश्चिक: 'गहिरो, रहस्यमय र परिवर्तनकारी स्वभाव',
  धनु: 'उत्साही, आदर्शवादी र स्वतन्त्रताप्रिय स्वभाव',
  मकर: 'महत्त्वाकांक्षी, अनुशासित र व्यावहारिक स्वभाव',
  कुम्भ: 'नवीन विचार, मानवतावादी दृष्टि र स्वतन्त्र सोचका धनी',
  मीन: 'सहानुभूतिशील, सिर्जनशील र आध्यात्मिक स्वभाव',
};

/** Feminine phrasing for opening clause (parallel to dataset style). */
const LAGNA_PERSONALITY_FEMALE = {
  मेष: 'एक जोशिली र साहसी स्वभावकी',
  वृषभ: 'स्थिर, धैर्यशील र सौन्दर्यप्रिय स्वभावकी',
  मिथुन: 'चतुर, जिज्ञासु र बहुमुखी प्रतिभाकी',
  कर्क: 'भावनात्मक गहिराई, पारिवारिक प्रेम र सहजताकी',
  सिंह: 'तेजस्वी, नेतृत्वकारी र स्वाभिमानी स्वभावकी',
  कन्या: 'विश्लेषणात्मक, परिश्रमी र व्यवस्थाप्रिय स्वभावकी',
  तुला: 'सन्तुलनप्रिय, न्यायप्रिय र सौन्दर्यशास्त्रकी प्रेमी',
  वृश्चिक: 'गहिरो, रहस्यमय र परिवर्तनकारी स्वभावकी',
  धनु: 'उत्साही, आदर्शवादी र स्वतन्त्रताप्रिय स्वभावकी',
  मकर: 'महत्त्वाकांक्षी, अनुशासित र व्यावहारिक स्वभावकी',
  कुम्भ: 'नवीन विचार, मानवतावादी दृष्टि र स्वतन्त्र सोचकी',
  मीन: 'सहानुभूतिशील, सिर्जनशील र आध्यात्मिक स्वभावकी',
};

const PLANET_EFFECTS = {
  '1st': {
    सूर्य: 'तपाईँमा आत्मविश्वास र नेतृत्व गुण भरिपूर्ण छ',
    चन्द्र: 'तपाईँलाई भावनात्मक रूपमा समृद्ध बनाउँछ',
    मंगल: 'तपाईँमा असाधारण ऊर्जा र निर्भीकता देखिन्छ',
    बुध: 'तपाईँलाई असाधारण सञ्चारकला र तीव्र बुद्धि दिन्छ',
    गुरु: 'तपाईँलाई ज्ञानी, उदार र जीवनप्रति आशावादी बनाउँछ',
    शुक्र: 'तपाईँलाई स्वाभाविक सौन्दर्य र माया गर्ने क्षमता छ',
    शनि: 'तपाईँलाई अनुशासित, धैर्यशील र दूरदर्शी बनाउँछ',
    राहु: 'तपाईँलाई अनौठो, आकर्षक र नवीन विचारका धनी बनाउँछ',
    केतु: 'तपाईँलाई वैरागी, गहिरो विचारक र आत्मखोजी बनाउँछ',
  },
  '5th': {
    सूर्य: 'तपाईँलाई पढाइ र सिर्जनामा आत्मविश्वास र चमक ल्याउँछ',
    चन्द्र: 'तपाईँलाई कल्पनाशीलता र भावनात्मक बुद्धिमत्ता दिन्छ',
    मंगल: 'तपाईँलाई पढाइ र सिर्जनामा विशेष ऊर्जा र साहस ल्याउँछ',
    बुध: 'तपाईँलाई बौद्धिक तीक्ष्णता र सञ्चारकला दिन्छ',
    गुरु: 'तपाईँलाई शिक्षा र सिर्जनामा ज्ञान र आदर्शता ल्याउँछ',
    शुक्र: 'तपाईँलाई कलात्मक संवेदनशीलता र प्रेममा कोमलता ल्याउँछ',
    शनि: 'तपाईँलाई पढाइ र सम्बन्धमा धैर्य र अनुशासन सिकाउँछ',
    राहु: 'तपाईँको पढाइ र सिर्जनामा अनौठो र अप्रत्याशित ऊर्जा ल्याउँछ',
    केतु: 'तपाईँको पढाइ र सिर्जनामा आत्मिक गहिराई र अनौठो दृष्टिकोण दिन्छ',
  },
  '9th': {
    सूर्य: 'तपाईँको जीवनमा आत्मविश्वास र भाग्यको प्रकाश दिन्छ',
    चन्द्र: 'तपाईँको भाग्यमा भावनात्मक समृद्धि र अन्तर्ज्ञान दिन्छ',
    मंगल: 'तपाईँको भाग्यमा साहस र उत्साहले भरिएका अवसरहरू ल्याउँछ',
    बुध: 'तपाईँको भाग्यमा बुद्धि र सञ्चारको माध्यमबाट अवसर ल्याउँछ',
    गुरु: 'तपाईँको भाग्य र आध्यात्मिक यात्रालाई सहारा दिन्छ',
    शुक्र: 'तपाईँको जीवनमा सुन्दरता, कला र सुखको अनुभव ल्याउँछ',
    शनि: 'तपाईँको जीवनमा मेहनत र अनुशासनबाट भाग्य खुल्ने संकेत दिन्छ',
    राहु: 'तपाईँको जीवनमा अनपेक्षित र अप्रचलित बाटोबाट भाग्य आउन सक्छ',
    केतु: 'तपाईँको भाग्यमा आध्यात्मिक गहिराई र कर्मको महत्त्व देखाउँछ',
  },
};

const GEMSTONE_BY_PLANET = {
  सूर्य: 'Burmese Ruby',
  चन्द्र: 'Keshi Pearl',
  मंगल: 'Red Coral',
  बुध: 'Colombian Emerald',
  गुरु: 'Yellow Sapphire',
  शुक्र: 'Opal Stone',
  शनि: 'Blue Sapphire',
  राहु: 'Hessonite',
  केतु: 'Cats Eye',
};

const DEFAULT_GEMSTONES = {
  overall: 'Yellow Sapphire',
  health: 'Pearl',
  education: 'Emerald',
  love: 'Rose Quartz',
  luck: 'Yellow Sapphire',
};

const PLANET_ORDER_INDEX = Object.fromEntries(PLANETS.map((p, i) => [p, i]));

// ============================================================
// HELPERS
// ============================================================

function sortPlanetsDevanagari(list) {
  return [...list].sort((a, b) => (PLANET_ORDER_INDEX[a] ?? 99) - (PLANET_ORDER_INDEX[b] ?? 99));
}

function lagnaPersonality(lagna, gender) {
  const g = String(gender || 'male').toLowerCase();
  if (g === 'female' || g === 'महिला') {
    return LAGNA_PERSONALITY_FEMALE[lagna] || LAGNA_PERSONALITY[lagna];
  }
  return LAGNA_PERSONALITY[lagna];
}

function getConclusion(totalPlanets) {
  if (totalPlanets >= 5) return 'तपाईँको जीवन असाधारण, समृद्ध र अर्थपूर्ण देखिन्छ';
  if (totalPlanets >= 3) return 'तपाईँको जीवन सुन्दर, सफल र प्रेरणादायी देखिन्छ';
  return 'तपाईँको जीवनयात्रा उज्यालो र अर्थपूर्ण देखिन्छ';
}

function formatPlanetList(planets) {
  if (!planets || planets.length === 0) return '';
  if (planets.length === 1) return planets[0];
  if (planets.length === 2) return `${planets[0]} र ${planets[1]}`;
  return `${planets.slice(0, -1).join(', ')} र ${planets[planets.length - 1]}`;
}

function getCombinedEffect(planets, house) {
  if (!planets || planets.length === 0) {
    return 'अरु ग्रह नभए पनि';
  }
  const key = house;
  const effects = planets.map((p) => PLANET_EFFECTS[key][p]).filter(Boolean);
  const planetNames = formatPlanetList(planets);
  if (planets.length === 1) {
    return `${planets[0]}को उपस्थितिले ${effects[0]}`;
  }
  return `${planetNames}को संयोगले ${effects.join(' र ')}`;
}

function getGemstoneForCombination(planets, category) {
  const sorted = sortPlanetsDevanagari(planets || []);
  if (sorted.length === 0) {
    return DEFAULT_GEMSTONES[category] || DEFAULT_GEMSTONES.overall;
  }
  const primary = sorted[0];
  return GEMSTONE_BY_PLANET[primary] || DEFAULT_GEMSTONES.overall;
}

function generatePredictionText(lagna, planets1st, planets5th, planets9th, gender = 'male') {
  const personality = lagnaPersonality(lagna, gender);
  const effect1st = getCombinedEffect(planets1st, '1st');
  const effect5th = getCombinedEffect(planets5th, '5th');
  const effect9th = getCombinedEffect(planets9th, '9th');
  const totalPlanets =
    (planets1st?.length || 0) + (planets5th?.length || 0) + (planets9th?.length || 0);
  const conclusion = getConclusion(totalPlanets);
  const all = [...(planets1st || []), ...(planets5th || []), ...(planets9th || [])];
  const overallGem = getGemstoneForCombination(all, 'overall');
  return `तपाईँको ${lagna} लग्नको राशिको हुनुहुन्छ — ${personality}। पहिलो भावमा ${effect1st}। पाँचौं भावमा ${effect5th}। नवौं भावमा ${effect9th}। यी तीनै भावको संयुक्त प्रभाव हेर्दा ${conclusion}। तपाईँको जीवनमा सन्तुलन ल्याउन तपाईँले ${overallGem} धारण गर्नु लाभदायक हुनेछ।`;
}

function generateGemstoneRemedy(planets1st, planets5th, planets9th) {
  const allPlanets = [...(planets1st || []), ...(planets5th || []), ...(planets9th || [])];
  return {
    overall_gemstone: getGemstoneForCombination(allPlanets, 'overall'),
    health_gemstone: getGemstoneForCombination(planets1st, 'health'),
    education_gemstone: getGemstoneForCombination(planets5th, 'education'),
    love_gemstone: getGemstoneForCombination(planets5th, 'love'),
    luck_gemstone: getGemstoneForCombination(planets9th, 'luck'),
  };
}

/**
 * @param {string} lagna - Devanagari
 * @param {string[]} planets1st
 * @param {string[]} planets5th
 * @param {string[]} planets9th
 * @param {string} gender - 'male' | 'female' | 'महिला'
 */
function getPrediction(lagna, planets1st = [], planets5th = [], planets9th = [], gender = 'male') {
  if (!LAGNA_PERSONALITY[lagna]) {
    throw new Error(`Invalid lagna: ${lagna}. Valid values: ${LAGNA_LIST.join(', ')}`);
  }
  const p1 = sortPlanetsDevanagari(planets1st || []);
  const p5 = sortPlanetsDevanagari(planets5th || []);
  const p9 = sortPlanetsDevanagari(planets9th || []);
  const allPlanets = [...p1, ...p5, ...p9];
  for (const planet of allPlanets) {
    if (!PLANETS.includes(planet)) {
      throw new Error(`Invalid planet: ${planet}. Valid: ${PLANETS.join(', ')}`);
    }
  }
  const gems = generateGemstoneRemedy(p1, p5, p9);
  return {
    overall_prediction: generatePredictionText(lagna, p1, p5, p9, gender),
    health_prediction: generatePredictionText(lagna, p1, [], [], gender),
    education_prediction: generatePredictionText(lagna, [], p5, [], gender),
    love_prediction: generatePredictionText(lagna, [], p5, [], gender),
    luck_prediction: generatePredictionText(lagna, [], [], p9, gender),
    gemstones: gems,
  };
}

function escapeSqlLiteral(text) {
  return String(text ?? '').replace(/'/g, "''");
}

/**
 * Optional: bulk SQL (can explode in size). Prefer getPrediction() in production.
 * @param {number} maxPlanetsPerHouse - 1 or 2
 */
function generateSQLForAllCombinations(maxPlanetsPerHouse = 2) {
  const getHouseOptions = (maxPlanets) => {
    const options = [[]];
    for (const p of PLANETS) {
      options.push([p]);
    }
    if (maxPlanets >= 2) {
      for (let i = 0; i < PLANETS.length; i++) {
        for (let j = i + 1; j < PLANETS.length; j++) {
          options.push(sortPlanetsDevanagari([PLANETS[i], PLANETS[j]]));
        }
      }
    }
    return options;
  };

  const houseOptions = getHouseOptions(maxPlanetsPerHouse);
  const sqlStatements = [];

  for (const lagna of LAGNA_LIST) {
    for (const p1 of houseOptions) {
      for (const p2 of houseOptions) {
        for (const p3 of houseOptions) {
          const predMale = getPrediction(lagna, p1, p2, p3, 'male').overall_prediction;
          const predFemale = getPrediction(lagna, p1, p2, p3, 'female').overall_prediction;
          const gems = generateGemstoneRemedy(p1, p2, p3);
          const p1Str = p1.join(', ');
          const p2Str = p2.join(', ');
          const p3Str = p3.join(', ');
          const row = `('${lagna}', '${escapeSqlLiteral(p1Str)}', '${escapeSqlLiteral(p2Str)}', '${escapeSqlLiteral(p3Str)}', '${escapeSqlLiteral(predMale)}', '${escapeSqlLiteral(predFemale)}', '${escapeSqlLiteral(predMale)}', '${escapeSqlLiteral(predFemale)}', '${escapeSqlLiteral(predMale)}', '${escapeSqlLiteral(predFemale)}', '${escapeSqlLiteral(predMale)}', '${escapeSqlLiteral(predFemale)}', '${escapeSqlLiteral(predMale)}', '${escapeSqlLiteral(predFemale)}', '${escapeSqlLiteral(gems.overall_gemstone)}', '${escapeSqlLiteral(gems.health_gemstone)}', '${escapeSqlLiteral(gems.education_gemstone)}', '${escapeSqlLiteral(gems.love_gemstone)}', '${escapeSqlLiteral(gems.luck_gemstone)}')`;
          sqlStatements.push(row);
        }
      }
    }
  }

  const header = `INSERT INTO gemstone_predictions (lagna, planets_in_1st, planets_in_5th, planets_in_9th, overall_prediction_male, overall_prediction_female, health_prediction_male, health_prediction_female, education_prediction_male, education_prediction_female, love_prediction_male, love_prediction_female, luck_prediction_male, luck_prediction_female, overall_gemstone, health_gemstone, education_gemstone, love_gemstone, luck_gemstone) VALUES\n`;
  return header + sqlStatements.join(',\n') + ';';
}

module.exports = {
  getPrediction,
  generatePredictionText,
  generateGemstoneRemedy,
  generateSQLForAllCombinations,
  LAGNA_LIST,
  PLANETS,
  LAGNA_PERSONALITY,
  LAGNA_PERSONALITY_FEMALE,
  PLANET_EFFECTS,
  GEMSTONE_BY_PLANET,
  sortPlanetsDevanagari,
};
