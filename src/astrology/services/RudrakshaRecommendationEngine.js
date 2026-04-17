/**
 * Rudraksha Recommendation Engine
 * Kept in a separate file so Gem and Rudraksha logic stay isolated.
 */

const RASHI_RUDRAKSHA_DATA = {
  'मेष': {
    male: {
      personality:
        'साहसी, ऊर्जावान, अग्रगामी, आत्मविश्वासी, नेतृत्व क्षमता भएको, कहिलेकाहीँ आवेगी र अधैर्य।',
      emotional_behavior:
        'तीव्र भावनात्मक प्रतिक्रिया, सजिलै उत्तेजित हुने, तर छिट्टै शान्त हुने। मानसिक रूपमा सक्रिय, जोखिम लिन तयार।',
      strengths: ['नेतृत्व क्षमता', 'साहस र आत्मविश्वास', 'उच्च ऊर्जा स्तर'],
      problems: ['क्रोध र आवेग नियन्त्रण', 'अधैर्यको समस्या', 'चोटपटकको जोखिम'],
      intensity: 'high',
      recommended: [
        {
          type: '1 मुखी',
          reason:
            'परमात्माको प्रतिनिधि, अहंकार र क्रोध नियन्त्रण गर्दै आत्मिक शान्ति प्रदान गर्छ।',
        },
      ],
      special: [
        {
          type: 'गौरी शंकर',
          reason:
            'पति-पत्नीको मिलनको प्रतीक, मेष राशिको एकल प्रवृत्तिलाई सन्तुलन गर्दै सम्बन्धमा सामंजस्य ल्याउँछ।',
        },
      ],
    },
    female: {
      personality:
        'स्वतन्त्र, साहसी, आत्मविश्वासी, प्रतिस्पर्धी, अग्रगामी, पारिवारिक जिम्मेवारीप्रति सजग।',
      emotional_behavior:
        'भावनात्मक रूपमा बलियो तर कहिलेकाहीँ आवेगी। मानसिक रूपमा तीक्ष्ण, निर्णय आफैं लिन रुचाउने।',
      strengths: ['आत्मनिर्भरता', 'नेतृत्व क्षमता', 'साहसिक निर्णय'],
      problems: ['क्रोध व्यवस्थापन', 'अधिक जिम्मेवारीको तनाव', 'आवेगी खर्च'],
      intensity: 'moderate',
      recommended: [
        {
          type: '1 मुखी',
          reason: 'आत्मिक शान्ति र अहंकार नियन्त्रणका लागि उपयोगी।',
        },
      ],
      special: [
        {
          type: 'गर्भ गौरी',
          reason:
            'महिला विशेष रुद्राक्ष, प्रजनन स्वास्थ्य, मातृत्व र परिवारिक सुखका लागि सहयोगी।',
        },
      ],
    },
  },
};

const KNOWN_RASHIS = [
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

function normalizeGender(gender) {
  const g = String(gender || '').trim().toLowerCase();
  if (g === 'female' || g === 'महिला') return 'female';
  return 'male';
}

function normalizeRashi(rashi) {
  const r = String(rashi || '').trim();
  if (!r) return null;
  return KNOWN_RASHIS.includes(r) ? r : null;
}

function capitalizeAsciiLabel(value) {
  if (value == null || typeof value !== 'string') return value;
  const t = value.trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

function buildFallback(rashi, gender) {
  const genderText = gender === 'female' ? 'महिला' : 'पुरुष';
  return {
    rashii: rashi,
    gender: genderText,
    inner_personality: `${rashi} राशिका व्यक्तिहरूमा सकारात्मक क्षमता र आत्मविकासको सम्भावना प्रबल हुन्छ।`,
    emotional_mental_behavior:
      'मानसिक सन्तुलन र भावनात्मक स्थिरता राख्न ध्यान, अनुशासन र नियमित साधना उपयोगी हुन्छ।',
    strengths: ['अनुकूलन क्षमता', 'आत्मविकास क्षमता', 'जीवन अनुभवबाट सिक्ने शक्ति'],
    predicted_problems: ['मानसिक तनाव', 'निर्णयमा दोधार', 'भावनात्मक उतारचढाव'],
    intensity: capitalizeAsciiLabel('moderate'),
    recommended_rudraksha: [
      {
        type: '5 मुखी',
        why: 'सामान्य सन्तुलन, मानसिक शान्ति र दैनिक आध्यात्मिक अभ्यासका लागि उपयोगी।',
      },
    ],
    special_recommendation: [
      {
        type: 'गणेश',
        why: 'बाधा निवारण र कार्यमा स्पष्टता ल्याउन सहयोगी।',
      },
    ],
  };
}

function getRudrakshaRecommendation(rashi, gender) {
  const normalizedRashi = normalizeRashi(rashi);
  if (!normalizedRashi) return null;

  const normalizedGender = normalizeGender(gender);
  const genderText = normalizedGender === 'female' ? 'महिला' : 'पुरुष';

  const rashiData = RASHI_RUDRAKSHA_DATA[normalizedRashi];
  if (!rashiData || !rashiData[normalizedGender]) {
    return buildFallback(normalizedRashi, normalizedGender);
  }

  const data = rashiData[normalizedGender];
  return {
    rashii: normalizedRashi,
    gender: genderText,
    inner_personality: data.personality,
    emotional_mental_behavior: data.emotional_behavior,
    strengths: data.strengths,
    predicted_problems: data.problems,
    intensity: capitalizeAsciiLabel(data.intensity),
    recommended_rudraksha: data.recommended.map((r) => ({
      type: r.type,
      why: r.reason,
    })),
    special_recommendation: data.special.map((s) => ({
      type: s.type,
      why: s.reason,
    })),
  };
}

module.exports = {
  getRudrakshaRecommendation,
  RASHI_RUDRAKSHA_DATA,
};
