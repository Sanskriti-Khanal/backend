/**
 * Professional Vedic Astrology Engine - Sector-wise Analysis
 * Following exact structure:
 * 1. समग्र सिफारिस (Overall + 1st house)
 * 2. स्वास्थ्य र व्यक्तित्व (1st house)
 * 3. शिक्षा (5th house)
 * 4. प्रेम सम्बन्ध (5th house)
 * 5. भाग्य र अवसर (9th house)
 */

// ============================================================
// COMPLETE PLANETARY DATABASE WITH NATURES
// ============================================================

const PLANET_MASTER_DATA = {
  'सूर्य': {
      nature: 'आत्माको प्रतिनिधि, पितृ कारक, राजसी ग्रह',
      friendly: ['चन्द्र', 'मंगल', 'गुरु'],
      enemy: ['शुक्र', 'शनि'],
      neutral: ['बुध', 'राहु', 'केतु'],
      exaltation: 'मेष',
      debilitation: 'तुला',
      mooltrikon: 'सिंह',
      gender: 'पुरुष',
      color: 'रातो, तामा',
      gemstone: 'माणिक्य (Ruby)',
      gem_reason_short: 'सूर्यको तेजस्वी ऊर्जा बोकेको माणिक्यले आत्मविश्वास, नेतृत्व र आँखाको रोग निवारण गर्छ।',
      positive: 'आत्मविश्वास, नेतृत्व, प्रतिष्ठा, साहस',
      negative: 'अहंकार, क्रोध, अत्यधिक गर्मी, पित्त दोष',
      body_parts: ['हृदय', 'आँखा', 'हड्डी', 'पित्त']
  },
  'चन्द्र': {
      nature: 'मनको अधिपति, मातृ कारक, जल तत्व',
      friendly: ['सूर्य', 'बुध'],
      enemy: ['राहु', 'केतु'],
      neutral: ['मंगल', 'गुरु', 'शुक्र', 'शनि'],
      exaltation: 'वृषभ',
      debilitation: 'वृश्चिक',
      mooltrikon: 'कर्क',
      gender: 'स्त्री',
      color: 'सेतो, चाँदी',
      gemstone: 'मोती (Pearl)',
      gem_reason_short: 'जल तत्वको प्रतिनिधि मोतीले मनलाई शान्त, स्थिर र भावनात्मक सन्तुलन दिन्छ।',
      positive: 'शान्ति, सृजनशीलता, करुणा, अनुकूलनशीलता',
      negative: 'अस्थिरता, अत्यधिक भावुकता, चिन्ता, अनिद्रा',
      body_parts: ['मन', 'रक्त', 'स्तन', 'तरल पदार्थ']
  },
  'मंगल': {
      nature: 'शक्ति, साहस, क्रोधको कारक, पृथ्वी पुत्र',
      friendly: ['सूर्य', 'चन्द्र', 'गुरु'],
      enemy: ['बुध', 'राहु', 'केतु'],
      neutral: ['शुक्र', 'शनि'],
      exaltation: 'मकर',
      debilitation: 'कर्क',
      mooltrikon: 'मेष, वृश्चिक',
      gender: 'पुरुष',
      color: 'रातो, गुलाबी',
      gemstone: 'मूंगा (Red Coral)',
      gem_reason_short: 'मंगलको तेजोमय ऊर्जा बोकेको मूंगाले रक्तअल्पता, चोटपटक र शत्रुबाट रक्षा गर्छ।',
      positive: 'साहस, ऊर्जा, प्रतिस्पर्धा, नेतृत्व',
      negative: 'क्रोध, अकर्मण्यता, दुर्घटना, रक्त समस्या',
      body_parts: ['रगत', 'मांसपेशी', 'जननेंद्रिय', 'गुदा']
  },
  'बुध': {
      nature: 'बुद्धि, वाणी, व्यापारको कारक, कुमार ग्रह',
      friendly: ['सूर्य', 'शुक्र', 'राहु', 'केतु'],
      enemy: ['चन्द्र'],
      neutral: ['मंगल', 'गुरु', 'शनि'],
      exaltation: 'कन्या',
      debilitation: 'मीन',
      mooltrikon: 'कन्या, मिथुन',
      gender: 'नपुंसक',
      color: 'हरियो',
      gemstone: 'पन्ना (Emerald)',
      gem_reason_short: 'बुधको हरियो पन्नाले स्मरणशक्ति, वाणी, व्यापार र स्नायुमण्डललाई बल दिन्छ।',
      positive: 'बुद्धि, वाकपटुता, विश्लेषण, चतुराई',
      negative: 'चिन्ता, अत्यधिक विश्लेषण, घबराहट, छल',
      body_parts: ['स्नायु', 'छाला', 'कान', 'मुख']
  },
  'गुरु': {
      nature: 'ज्ञान, भाग्य, पुत्रको कारक, देवगुरु',
      friendly: ['सूर्य', 'चन्द्र', 'मंगल'],
      enemy: ['शुक्र'],
      neutral: ['बुध', 'शनि', 'राहु', 'केतु'],
      exaltation: 'कर्क',
      debilitation: 'मकर',
      mooltrikon: 'धनु',
      gender: 'पुरुष',
      color: 'पहेँलो, सुनौलो',
      gemstone: 'पुखराज (Yellow Sapphire)',
      gem_reason_short: 'गुरुको पहेँलो पुखराजले बुद्धि, धन, सन्तान, विवाह र आध्यात्मिक उन्नति दिन्छ।',
      positive: 'ज्ञान, उदारता, आशावाद, न्यायप्रियता',
      negative: 'अत्यधिक आशावाद, मधुमेह, तौल, आलस्य',
      body_parts: ['कलेजो', 'तौल', 'जांघ', 'मधुमेह']
  },
  'शुक्र': {
      nature: 'सौन्दर्य, विवाह, सुखको कारक, भृगुपुत्र',
      friendly: ['बुध', 'शनि', 'राहु', 'केतु'],
      enemy: ['सूर्य', 'चन्द्र'],
      neutral: ['मंगल', 'गुरु'],
      exaltation: 'मीन',
      debilitation: 'कन्या',
      mooltrikon: 'तुला, वृषभ',
      gender: 'स्त्री',
      color: 'सेतो, चम्किलो',
      gemstone: 'हीरा (Diamond) / ओपल',
      gem_reason_short: 'शुक्रको हीराले वैवाहिक सुख, सौन्दर्य, कलात्मक प्रतिभा र ऐश्वर्य बढाउँछ।',
      positive: 'प्रेम, सौन्दर्य, कला, विलासिता, सन्तुलन',
      negative: 'अत्यधिक भोगविलास, आलस्य, मोह, व्यसन',
      body_parts: ['मुख', 'गाला', 'प्रजनन प्रणाली', 'गिर्जा']
  },
  'शनि': {
      nature: 'कर्म, रोग, दीर्घायुको कारक, न्यायाधीश',
      friendly: ['बुध', 'शुक्र', 'राहु', 'केतु'],
      enemy: ['सूर्य', 'चन्द्र', 'मंगल'],
      neutral: ['गुरु'],
      exaltation: 'तुला',
      debilitation: 'मेष',
      mooltrikon: 'कुम्भ, मकर',
      gender: 'नपुंसक',
      color: 'नीलो, कालो',
      gemstone: 'नीलम (Blue Sapphire)',
      gem_reason_short: 'शनिको नीलमले कर्मबाट मुक्ति, दीर्घायु, व्यवसायमा स्थिरता र अप्रत्याशित लाभ दिन्छ।',
      positive: 'अनुशासन, धैर्य, परिश्रम, स्थिरता',
      negative: 'ढिलाइ, अवसाद, एक्लोपन, गरिबी, रोग',
      body_parts: ['हड्डी', 'जोर्नी', 'दाँत', 'घुँडा']
  },
  'राहु': {
      nature: 'भ्रम, विदेश, प्रविधिको कारक, छाया ग्रह',
      friendly: ['शनि', 'बुध', 'शुक्र', 'केतु'],
      enemy: ['सूर्य', 'चन्द्र', 'मंगल'],
      neutral: ['गुरु'],
      exaltation: 'वृषभ',
      debilitation: 'वृश्चिक',
      mooltrikon: 'कन्या',
      gender: 'स्त्री',
      color: 'धुवाँ, कालो',
      gemstone: 'गोमेद (Hessonite)',
      gem_reason_short: 'राहुको गोमेदले सर्पदोष, अचानक भय, विदेश यात्रा र प्रविधिमा सफलता दिन्छ।',
      positive: 'विदेश यात्रा, प्रविधि ज्ञान, अप्रत्याशित लाभ',
      negative: 'भ्रम, विषाक्तता, अस्पष्ट रोग, झुठो आरोप',
      body_parts: ['पाचन प्रणाली', 'बिषाक्तता', 'छाला रोग']
  },
  'केतु': {
      nature: 'मोक्ष, आध्यात्मिकता, विचित्रताको कारक',
      friendly: ['शनि', 'बुध', 'शुक्र', 'राहु'],
      enemy: ['सूर्य', 'चन्द्र', 'मंगल'],
      neutral: ['गुरु'],
      exaltation: 'वृश्चिक',
      debilitation: 'वृषभ',
      mooltrikon: 'मीन',
      gender: 'स्त्री',
      color: 'धुवाँ, मट्टियाम',
      gemstone: 'लेहसुनिया (Cat\'s Eye)',
      gem_reason_short: 'केतुको लेहसुनियाले आकस्मिक दुर्घटना, शत्रुबाट रक्षा र आध्यात्मिक शक्ति दिन्छ।',
      positive: 'आध्यात्मिकता, वैराग्य, रहस्यवादी शक्ति',
      negative: 'अलगाव, अनिद्रा, असाध्य रोग, आत्महत्याको विचार',
      body_parts: ['स्नायु', 'गुप्त रोग', 'पाचन समस्या']
  }
};

// Lagna lords and their traits
const LAGNA_DATA = {
  'मेष': { 
      lord: 'मंगल', 
      nature: 'साहसी, उत्साही, अग्रगामी',
      strength: 'नेतृत्व, साहस, उर्जा',
      weakness: 'अधैर्य, क्रोध, अहंकार',
      body_aspect: 'टाउको, अनुहार'
  },
  'वृषभ': { 
      lord: 'शुक्र', 
      nature: 'स्थिर, धैर्यशील, सौन्दर्यप्रिय',
      strength: 'स्थिरता, धन, कला प्रेम',
      weakness: 'जिद्दी, आलस्य, भोगविलास',
      body_aspect: 'अनुहार, गाला, घाँटी'
  },
  'मिथुन': { 
      lord: 'बुध', 
      nature: 'चतुर, जिज्ञासु, मिलनसार',
      strength: 'बुद्धि, सञ्चार, अनुकूलन',
      weakness: 'चंचलता, अस्थिरता, दोधारेपन',
      body_aspect: 'कान, नाक, हात'
  },
  'कर्क': { 
      lord: 'चन्द्र', 
      nature: 'भावनात्मक, परिवारप्रिय, सहज',
      strength: 'सहानुभूति, पोषण, सृजनशीलता',
      weakness: 'अत्यधिक भावुकता, आश्रितता',
      body_aspect: 'छाती, पेट'
  },
  'सिंह': { 
      lord: 'सूर्य', 
      nature: 'तेजस्वी, नेतृत्वकारी, स्वाभिमानी',
      strength: 'नेतृत्व, प्रतिभा, आत्मविश्वास',
      weakness: 'अहंकार, अत्यधिक गर्व',
      body_aspect: 'पीठ, मेरुदण्ड, हृदय'
  },
  'कन्या': { 
      lord: 'बुध', 
      nature: 'विश्लेषणात्मक, परिश्रमी, व्यवस्थित',
      strength: 'विश्लेषण, सेवा, व्यवस्थापन',
      weakness: 'चिन्ता, अत्यधिक आलोचना',
      body_aspect: 'पेट, आन्द्रा'
  },
  'तुला': { 
      lord: 'शुक्र', 
      nature: 'सन्तुलनप्रिय, न्यायप्रिय, मिलनसार',
      strength: 'सन्तुलन, कूटनीति, सहकार्य',
      weakness: 'अनिर्णय, निर्भरता',
      body_aspect: 'कम्मर, मिर्गौला'
  },
  'वृश्चिक': { 
      lord: 'मंगल', 
      nature: 'गहिरो, रहस्यमय, परिवर्तनकारी',
      strength: 'दृढता, अनुसन्धान, गोपनीयता',
      weakness: 'प्रतिशोध, अत्यधिक गोप्यता',
      body_aspect: 'जननेंद्रिय, गुदा'
  },
  'धनु': { 
      lord: 'गुरु', 
      nature: 'उत्साही, आदर्शवादी, स्वतन्त्र',
      strength: 'ज्ञान, आशावाद, सत्यनिष्ठा',
      weakness: 'अधिक आशावाद, अधैर्य',
      body_aspect: 'जांघ, नितम्ब'
  },
  'मकर': { 
      lord: 'शनि', 
      nature: 'महत्त्वाकांक्षी, अनुशासित, व्यावहारिक',
      strength: 'अनुशासन, धैर्य, महत्त्वाकांक्षा',
      weakness: 'निराशावाद, एक्लोपन',
      body_aspect: 'घुँडा, जोर्नी'
  },
  'कुम्भ': { 
      lord: 'शनि', 
      nature: 'नवीन विचार, मानवतावादी, स्वतन्त्र',
      strength: 'स्वतन्त्रता, मौलिकता, सामाजिकता',
      weakness: 'अलगाव, अप्रत्याशितता',
      body_aspect: 'खुट्टा, गोलीगाँठो'
  },
  'मीन': { 
      lord: 'गुरु', 
      nature: 'सहानुभूतिशील, सृजनशील, आध्यात्मिक',
      strength: 'करुणा, कल्पना, आध्यात्मिकता',
      weakness: 'भ्रम, असीमितता',
      body_aspect: 'खुट्टा, चिहान'
  }
};

// ============================================================
// ANALYSIS FUNCTIONS - SECTOR WISE
// ============================================================

/**
* 1. समग्र विश्लेषण र सिफारिस (Overall + 1st House Analysis)
*/
function analyzeOverall(lagna, planets1st, gender) {
  const lagnaData = LAGNA_DATA[lagna];
  const lagnaLord = lagnaData.lord;
  const lagnaLordData = PLANET_MASTER_DATA[lagnaLord];
  
  // Determine gender suffix
  const genderSuffix = gender === 'male' ? 'हुनुहुन्छ' : 'हुनुहुन्छ';
  
  // Opening based on lagna
  const opening = `जन्मकुण्डलीको विश्लेषण गर्दा तपाईँको लग्न ${lagna} रहेको छ। ${lagna} लग्नमा जन्मनुभएको व्यक्ति ${lagnaData.nature} स्वभावको हुन्छ। तपाईँमा ${lagnaData.strength} जस्ता गुणहरू स्वभाविक रूपमा विद्यमान छन्। ${lagnaData.weakness} भने तपाईँको कमजोरी हुन सक्छ।`;
  
  // First house analysis
  let firstHouseAnalysis = '';
  let firstHouseProblems = [];
  let firstHouseStrengths = [];
  
  if (!planets1st || planets1st.length === 0) {
      firstHouseAnalysis = `तपाईँको पहिलो भाव खाली छ। यसले प्रारम्भिक जीवनमा आत्मपहिचान, निर्णय क्षमतामा ढिलाइ र दिशाबोधको समस्या ल्याउन सक्छ। बाहिरी मार्गदर्शन नपाउँदा गलत व्यक्तिसँग प्रभावित हुने जोखिम पनि बढ्छ।`;
      firstHouseProblems.push('पहिलो भाव खाली हुँदा जीवनको सुरुवाती उमेरमा दिशाबोध, आत्मविश्वास र निर्णय स्थिरतामा समस्या देखिन सक्छ।');
  } else if (planets1st.length === 1) {
      const planet = planets1st[0];
      const planetData = PLANET_MASTER_DATA[planet];
      const relation = analyzePlanetWithLagna(planet, lagna);
      
      firstHouseAnalysis = `पहिलो भावमा ${planet} ग्रह बसेको छ। ${planet} ${planetData.nature} हो। यो ग्रह तपाईँको लग्नको स्वामी ${lagnaLord} सँग ${relation.relation} सम्बन्ध राख्छ। ${relation.effect}`;
      
      if (relation.relation === 'शत्रुतापूर्ण') {
          firstHouseProblems.push(`${planet} लग्नको स्वामीको शत्रु हो — यसले व्यक्तित्वमा अन्तरद्वन्द्व र निर्णयमा दोधार ल्याउँछ।`);
      } else {
          firstHouseStrengths.push(`${planet} ले तपाईँमा ${planetData.positive.split(',')[0]} को गुण बढाउँछ।`);
      }
  } else {
      const planetList = formatPlanetList(planets1st);
      firstHouseAnalysis = `पहिलो भावमा ${planetList} ग्रहहरूको समूह छ। धेरै ग्रह एउटै भावमा हुँदा 'ग्रहयुद्ध'को सम्भावना हुन्छ। तपाईँको व्यक्तित्व जटिल र बहुआयामिक छ।`;
      
      // Check for enemy planets together
      const enemies = findEnemyPairs(planets1st);
      if (enemies.length > 0) {
          firstHouseProblems.push(`${enemies.join(', ')} परस्पर शत्रु ग्रहहरू एउटै भावमा बसेका छन् — यसले निरन्तर मानसिक द्वन्द्व र अस्थिरता ल्याउँछ।`);
      }
      
      if (planets1st.length > 3) {
          firstHouseProblems.push(`${planets1st.length} ग्रहको भीडले व्यक्तित्वमा अराजकता र आत्म-पहिचानको समस्या ल्याउँछ।`);
      }
  }
  
  // Overall gemstone recommendation
  const overallGem = recommendGemstoneForOverall(lagna, planets1st, firstHouseProblems);
  
  const sector1 = `
╔══════════════════════════════════════════════════════════════════╗
║ १. समग्र विश्लेषण र सिफारिस                                      ║
╚══════════════════════════════════════════════════════════════════╝

${opening}

【प्रथम भाव विश्लेषण】
${firstHouseAnalysis}

${firstHouseStrengths.length > 0 ? '✅ बलियो पक्ष: ' + firstHouseStrengths.join(' ') : ''}
${firstHouseProblems.length > 0 ? '⚠️ प्रमुख समस्या: ' + firstHouseProblems.join(' ') : '⚠️ प्रमुख समस्या: पहिलो भावको बल न्यून हुँदा आत्मनिर्णय, स्थिरता र व्यक्तित्व निर्माणमा अवरोध रहन सक्छ।'}

【समग्र रत्न सिफारिस】
तपाईँको समग्र व्यक्तित्व, स्वभाव र जीवनयात्रालाई सन्तुलनमा राख्न:
➤ रत्न: ${overallGem.gemstone}
➤ किन? ${overallGem.reason}
${overallGem.alternative ? '➤ विकल्प: ' + overallGem.alternative : ''}

${firstHouseProblems.length > 0 ? '➤ विशेष निर्देशन: ' + firstHouseProblems[0] : ''}
`;

  return { text: sector1, problems: firstHouseProblems, strengths: firstHouseStrengths };
}

/**
* 2. स्वास्थ्य र व्यक्तित्व विश्लेषण (1st House)
*/
function analyzeHealth(lagna, planets1st, gender) {
  const lagnaData = LAGNA_DATA[lagna];
  const lagnaLordData = PLANET_MASTER_DATA[lagnaData.lord];
  
  let analysis = '';
  let healthIssues = [];
  let healthStrengths = [];
  let recommendedGem = null;
  
  if (!planets1st || planets1st.length === 0) {
      analysis = `प्रथम भाव खाली हुँदा स्वास्थ्य सम्बन्धी स्पष्ट संकेत हुँदैन। तपाईँको स्वास्थ्य तपाईँको दिनचर्या, आहार र जीवनशैलीमा निर्भर रहन्छ। लग्नको स्वामी ${lagnaData.lord} को प्रभावले स्वास्थ्यको दिशा निर्धारण गर्छ।`;
      recommendedGem = {
          gemstone: lagnaLordData.gemstone,
          reason: `लग्नको स्वामी ${lagnaData.lord} को रत्न ${lagnaLordData.gemstone} ले शारीरिक र मानसिक सन्तुलन ल्याउँछ। ${lagnaLordData.gem_reason_short}`
      };
      healthStrengths.push('खाली प्रथम भाव हुँदा रोगहरू आफैं नियन्त्रण गर्न सकिन्छ।');
  } else {
      for (const planet of planets1st) {
          const planetData = PLANET_MASTER_DATA[planet];
          const relation = analyzePlanetWithLagna(planet, lagna);
          
          if (relation.relation === 'शत्रुतापूर्ण') {
              healthIssues.push(`${planetData.negative} को सम्भावना बढी हुन्छ। विशेषगरी ${planetData.body_parts.join(', ')} सम्बन्धी समस्याहरू देखिन सक्छन्।`);
          } else {
              healthStrengths.push(`${planet} को प्रभावले ${planetData.positive} को गुण प्रदान गर्छ।`);
          }
          
          // Check for debilitation
          if (planetData.debilitation === lagna) {
              healthIssues.push(`${planet} तपाईँको लग्नमा नीच अवस्थामा छ — यस ग्रहको शुभ प्रभाव न्यून हुन्छ र यसले ${planetData.body_parts[0]} सम्बन्धी समस्या ल्याउन सक्छ।`);
          }
      }
      
      recommendedGem = recommendGemstoneForHealth(planets1st, lagna, healthIssues);
  }
  
  const sector2 = `
╔══════════════════════════════════════════════════════════════════╗
║ २. स्वास्थ्य र व्यक्तित्व विश्लेषण (प्रथम भाव)                   ║
╚══════════════════════════════════════════════════════════════════╝

【स्वास्थ्य विश्लेषण】
${analysis}
${healthStrengths.length > 0 ? '✅ स्वास्थ्य बल: ' + healthStrengths.join(' ') : ''}
${healthIssues.length > 0 ? '⚠️ स्वास्थ्य चुनौती: ' + healthIssues.join(' ') : '⚠️ स्वास्थ्य चुनौती: प्रारम्भिक चरणमा लुकेका स्वास्थ्य समस्या ढिलो पत्ता लाग्न सक्छन्; नियमित परीक्षण आवश्यक छ।'}

【व्यक्तित्व विश्लेषण】
तपाईँको लग्न ${lagna} र प्रथम भावको ग्रह संयोजनले तपाईँलाई ${lagnaData.nature} बनाएको छ।
आफ्नो स्वभावमा ${lagnaData.strength} लाई उजागर गर्नुहोस् र ${lagnaData.weakness} लाई नियन्त्रण गर्नुहोस्।

【स्वास्थ्य सुधार रत्न】
➤ रत्न: ${recommendedGem.gemstone}
➤ किन? ${recommendedGem.reason}
${recommendedGem.timing ? '➤ धारण गर्ने उपयुक्त समय: ' + recommendedGem.timing : ''}
${recommendedGem.caution ? '➤ सावधानी: ' + recommendedGem.caution : ''}
`;

  return { text: sector2, issues: healthIssues };
}

/**
* 3. शिक्षा विश्लेषण (5th House)
*/
function analyzeEducation(planets5th, lagna) {
  let analysis = '';
  let educationStrengths = [];
  let educationChallenges = [];
  let recommendedFields = [];
  let recommendedGem = null;
  
  if (!planets5th || planets5th.length === 0) {
      analysis = `पाँचौं भाव शिक्षा, बुद्धि र प्रतिभाको भाव हो। यो भाव खाली हुनुको अर्थ तपाईँलाई शिक्षाको क्षेत्रमा बाह्य सहारा कम मिल्छ। तर यसको अर्थ तपाईँ अशिक्षित हुनुहुन्छ भन्ने होइन — बरु आफैंले मेहनत गरेर ज्ञान आर्जन गर्नुपर्छ।`;
      recommendedGem = {
          gemstone: 'पन्ना (Emerald)',
          reason: 'पाँचौं भाव खाली हुँदा बुधको रत्न पन्ना सबैभन्दा उपयुक्त हुन्छ। यसले एकाग्रता, स्मरणशक्ति र बौद्धिक क्षमता बढाउँछ।'
      };
      recommendedFields = ['व्यवस्थापन', 'प्रशासन', 'सेवा क्षेत्र'];
  } else {
      for (const planet of planets5th) {
          const planetData = PLANET_MASTER_DATA[planet];
          
          if (planet === 'बुध') {
              educationStrengths.push('बुध ग्रह शिक्षाको मुख्य कारक हो — यसले तीव्र बुद्धि, विश्लेषण क्षमता र वाकपटुता दिन्छ।');
              recommendedFields.push('विज्ञान, गणित, पत्रकारिता, प्रविधि');
          } else if (planet === 'गुरु') {
              educationStrengths.push('गुरु ग्रह ज्ञान र उच्च शिक्षाको कारक हो — यसले दार्शनिक सोच, अनुसन्धान र शिक्षण क्षमता बढाउँछ।');
              recommendedFields.push('दर्शन, कानुन, चिकित्सा, अध्यापन, अनुसन्धान');
          } else if (planet === 'शुक्र') {
              educationStrengths.push('शुक्र ग्रहले कलात्मक प्रतिभा, सिर्जनशीलता र सौन्दर्यशास्त्रमा रुचि दिन्छ।');
              recommendedFields.push('कला, संगीत, नृत्य, फेसन डिजाइन, साहित्य');
          } else if (planet === 'मंगल') {
              educationStrengths.push('मंगलले प्रतिस्पर्धात्मक क्षमता, साहस र प्राविधिक ज्ञान दिन्छ।');
              recommendedFields.push('इन्जिनियरिङ, सैन्य, शल्यचिकित्सा, खेलकुद');
          } else if (planet === 'सूर्य') {
              educationStrengths.push('सूर्यले नेतृत्व क्षमता, प्रशासनिक ज्ञान र चिकित्सा शास्त्रमा रुचि दिन्छ।');
              recommendedFields.push('प्रशासन, राजनीति, चिकित्सा, नेतृत्व');
          } else if (planet === 'चन्द्र') {
              educationStrengths.push('चन्द्रले भावनात्मक बुद्धिमत्ता, स्मरणशक्ति र मनोविज्ञानमा रुचि दिन्छ।');
              recommendedFields.push('मनोविज्ञान, साहित्य, परामर्श, शिक्षण');
          } else if (planet === 'शनि') {
              educationStrengths.push('शनिले गहिरो अध्ययन, अनुसन्धान र व्यावहारिक ज्ञान दिन्छ। तर परिणाम ढिलो आउन सक्छ।');
              recommendedFields.push('इन्जिनियरिङ, कानुन, प्रशासन, अनुसन्धान');
              educationChallenges.push('शनिको प्रभावले शिक्षामा ढिलाइ र अवरोध आउन सक्छ — धैर्य राख्नुहोस्।');
          } else if (planet === 'राहु') {
              educationStrengths.push('राहुले प्रविधि, विदेशी भाषा र अपरम्परागत विषयमा रुचि दिन्छ।');
              recommendedFields.push('प्रविधि, सफ्टवेयर, विदेश भाषा, अनुसन्धान');
              educationChallenges.push('राहुको प्रभावले शिक्षामा ध्यान भट्किन सक्छ — एकाग्रता बढाउनुहोस्।');
          } else if (planet === 'केतु') {
              educationStrengths.push('केतुले आध्यात्मिक ज्ञान, गुप्त विद्या र गहिरो अनुसन्धानमा रुचि दिन्छ।');
              recommendedFields.push('आध्यात्म, दर्शन, मनोविज्ञान, गुप्त विद्या');
              educationChallenges.push('केतुको प्रभावले परम्परागत शिक्षाप्रति वैराग्य हुन सक्छ।');
          }
      }
      
      // Check for enemy planets
      const enemies = findEnemyPairs(planets5th);
      if (enemies.length > 0) {
          educationChallenges.push(`${enemies.join(', ')} शत्रु ग्रहहरू पाँचौं भावमा बसेका छन् — यसले शिक्षामा दोधारेपन र असमझदारी ल्याउँछ।`);
      }
      
      recommendedGem = recommendGemstoneForEducation(planets5th, educationChallenges);
  }
  
  const sector3 = `
╔══════════════════════════════════════════════════════════════════╗
║ ३. शिक्षा विश्लेषण (पाँचौं भाव)                                 ║
╚══════════════════════════════════════════════════════════════════╝

【शिक्षा सम्भावना】
${analysis}
✅ शैक्षिक बल: ${educationStrengths.length > 0 ? educationStrengths.join(' ') : 'आफ्नै मेहनतले मात्र उन्नति सम्भव छ, बाह्य सहयोग सीमित रहन सक्छ।'}
${educationChallenges.length > 0 ? '⚠️ शैक्षिक चुनौती: ' + educationChallenges.join(' ') : ''}

【उपयुक्त शिक्षा क्षेत्र】
➤ ${recommendedFields.length > 0 ? recommendedFields.slice(0, 3).join(', ') : 'व्यवस्थापन, प्रशासन, सेवा क्षेत्र'}

【शिक्षा प्रगति रत्न】
➤ रत्न: ${recommendedGem.gemstone}
➤ किन? ${recommendedGem.reason}
${recommendedGem.method ? '➤ धारण विधि: ' + recommendedGem.method : ''}
`;

  return { text: sector3, strengths: educationStrengths, fields: recommendedFields };
}

/**
* 4. प्रेम सम्बन्ध विश्लेषण (5th House)
*/
function analyzeLove(planets5th, lagna, gender) {
  let analysis = '';
  let loveStrengths = [];
  let loveChallenges = [];
  let relationshipAdvice = [];
  let recommendedGem = null;
  
  if (!planets5th || planets5th.length === 0) {
      analysis = `पाँचौं भाव प्रेम र रोमान्सको भाव हो। यो भाव खाली हुँदा प्रेम सम्बन्धमा स्वाभाविक रूपमा नआउन सक्छ। तर यसको अर्थ प्रेम हुँदैन भन्ने होइन — बरु तपाईँले प्रेमको लागि पहल गर्नुपर्छ। सम्बन्धमा सजगता र प्रयास बढी चाहिन्छ।`;
      relationshipAdvice.push('प्रेमको अभिव्यक्ति खुला रूपमा नगर्ने प्रवृत्ति हुन्छ — आफ्नो भावना व्यक्त गर्न सिक्नुहोस्।');
      recommendedGem = {
          gemstone: 'गुलाबी पन्ना (Rose Quartz)',
          reason: 'पाँचौं भाव खाली हुँदा प्रेमको ऊर्जा बढाउन गुलाबी पन्ना उपयुक्त हुन्छ। यसले हृदय चक्र खोलेर प्रेम गर्ने र पाउने क्षमता बढाउँछ।'
      };
  } else {
      for (const planet of planets5th) {
          const planetData = PLANET_MASTER_DATA[planet];
          
          if (planet === 'शुक्र') {
              loveStrengths.push('शुक्र प्रेमको मुख्य कारक हो — यसले रोमान्टिक प्रवृत्ति, आकर्षण र सम्बन्धमा सुमधुरता दिन्छ।');
              relationshipAdvice.push('सम्बन्धमा सौन्दर्य र कलाको महत्त्व बुझ्नुहोस्।');
          } else if (planet === 'चन्द्र') {
              loveStrengths.push('चन्द्रले प्रेममा कोमलता, भावनात्मक गहिराई र सहानुभूति दिन्छ।');
              relationshipAdvice.push('भावनात्मक सुरक्षा प्रदान गर्ने साथी रोज्नुहोस्।');
          } else if (planet === 'मंगल') {
              loveStrengths.push('मंगलले प्रेममा जोश, उत्साह र साहसिकता दिन्छ। तर झगडाको प्रवृत्ति पनि हुन्छ।');
              loveChallenges.push('मंगलको प्रभावले प्रेममा अधिकार जमाउने प्रवृत्ति हुन्छ — सम्बन्धमा सम्मान र सन्तुलन राख्नुहोस्।');
              relationshipAdvice.push('रिसलाई प्रेममा परिणत गर्न सिक्नुहोस्।');
          } else if (planet === 'बुध') {
              loveStrengths.push('बुधले प्रेममा बौद्धिक आकर्षण, संवाद र मित्रता दिन्छ।');
              relationshipAdvice.push('बौद्धिक रूपमा मेल खाने साथी रोज्नुहोस्।');
          } else if (planet === 'गुरु') {
              loveStrengths.push('गुरुले प्रेममा आदर्श, विश्वास र गहिरो बन्धन दिन्छ। विवाह योग्य साथीको संकेत हो।');
              relationshipAdvice.push('आध्यात्मिक र नैतिक मूल्य मिल्ने साथी रोज्नुहोस्।');
          } else if (planet === 'सूर्य') {
              loveStrengths.push('सूर्यले प्रेममा सम्मान, स्वाभिमान र स्पष्टता दिन्छ।');
              loveChallenges.push('सूर्यको प्रभावले प्रेममा अहंकार आउन सक्छ — सम्बन्धमा नम्रता राख्नुहोस्।');
          } else if (planet === 'शनि') {
              loveStrengths.push('शनिले प्रेममा प्रतिबद्धता, जिम्मेवारी र स्थिरता दिन्छ। तर प्रेम ढिलो आउँछ।');
              loveChallenges.push('शनिको प्रभावले प्रेम सम्बन्धमा ढिलाइ, दूरी र उदासी आउन सक्छ। धैर्य राख्नुहोस्।');
              relationshipAdvice.push('उमेरले ठुलो वा परिपक्व साथी उपयुक्त हुन्छ।');
          } else if (planet === 'राहु') {
              loveStrengths.push('राहुले प्रेममा रहस्यमयता, विदेशी आकर्षण र तीव्रता दिन्छ।');
              loveChallenges.push('राहुको प्रभावले प्रेममा भ्रम, धोखा र अनिश्चितता ल्याउन सक्छ। सतर्क रहनुहोस्।');
              relationshipAdvice.push('सम्बन्धमा पारदर्शिता र सत्यता नै आधार बनाउनुहोस्।');
          } else if (planet === 'केतु') {
              loveStrengths.push('केतुले प्रेममा आत्मिक बन्धन, वैराग्य र गहिरो जोडाइ दिन्छ।');
              loveChallenges.push('केतुको प्रभावले प्रेम सम्बन्धमा टाढिने प्रवृत्ति, अलगाव र उदासीनता आउन सक्छ।');
              relationshipAdvice.push('भौतिक भन्दा आत्मिक सम्बन्ध खोज्नुहोस्।');
          }
      }
      
      const enemies = findEnemyPairs(planets5th);
      if (enemies.length > 0) {
          loveChallenges.push(`${enemies.join(', ')} शत्रु ग्रहहरू पाँचौं भावमा बसेका छन् — प्रेम सम्बन्धमा उतारचढाव, झगडा र गलतफहमी बढी हुन्छ।`);
      }
      
      recommendedGem = recommendGemstoneForLove(planets5th, loveChallenges, gender);
  }
  
  const sector4 = `
╔══════════════════════════════════════════════════════════════════╗
║ ४. प्रेम सम्बन्ध विश्लेषण (पाँचौं भाव)                         ║
╚══════════════════════════════════════════════════════════════════╝

【प्रेम सम्भावना】
${analysis}
✅ प्रेम बल: ${loveStrengths.length > 0 ? loveStrengths.join(' ') : 'भावनात्मक खुलापन कम हुँदा सम्बन्ध सुरु गर्न ढिलाइ हुन सक्छ।'}
${loveChallenges.length > 0 ? '⚠️ प्रेम चुनौती: ' + loveChallenges.join(' ') : ''}

【सम्बन्ध सुझाव】
➤ ${relationshipAdvice.slice(0, 2).join('\n➤ ')}

【प्रेम सुमधुरता रत्न】
➤ रत्न: ${recommendedGem.gemstone}
➤ किन? ${recommendedGem.reason}
${recommendedGem.method ? '➤ धारण विधि: ' + recommendedGem.method : ''}
${recommendedGem.ritual ? '➤ विशेष विधि: ' + recommendedGem.ritual : ''}
`;

  return { text: sector4, strengths: loveStrengths, challenges: loveChallenges };
}

/**
* 5. भाग्य र अवसर विश्लेषण (9th House)
*/
function analyzeLuck(planets9th, lagna) {
  let analysis = '';
  let luckStrengths = [];
  let luckChallenges = [];
  let opportunities = [];
  let recommendedGem = null;
  
  if (!planets9th || planets9th.length === 0) {
      analysis = `नवौं भाग्य, धर्म, गुरु र पिताको भाव हो। यो भाव खाली हुँदा भाग्यमा बाह्य सहारा कम मिल्छ। तर यसको अर्थ तपाईँ अभागी हुनुहुन्छ भन्ने होइन — बरु तपाईँले आफ्नै कर्मले भाग्य निर्माण गर्नुपर्छ। 'भाग्य खोज्न जानुभन्दा आफैं भाग्य बन्नुहोस्' यो तपाईँको मन्त्र हो।`;
      opportunities = ['विदेश यात्रा', 'उच्च शिक्षा', 'गुरुजनको संगत'];
      recommendedGem = {
          gemstone: 'पुखराज (Yellow Sapphire)',
          reason: 'नवौं भाव खाली हुँदा भाग्यको ढोका खोल्न गुरुको रत्न पुखराज उपयुक्त हुन्छ। यसले ज्ञान, अवसर र गुरुजनको आशीर्वाद ल्याउँछ।'
      };
  } else {
      for (const planet of planets9th) {
          const planetData = PLANET_MASTER_DATA[planet];
          
          if (planet === 'गुरु') {
              luckStrengths.push('गुरु नवौं भावको स्वामी हो — यसले असाधारण भाग्य, ज्ञान, गुरुजनको कृपा र उच्च शिक्षा दिन्छ। यो राजयोगको संकेत हो।');
              opportunities.push('विदेश यात्रा', 'उच्च शिक्षा', 'गुरुजनको सहयोग', 'धार्मिक क्षेत्र');
          } else if (planet === 'सूर्य') {
              luckStrengths.push('सूर्य नवौं भावमा हुँदा पिताको सहयोग, सरकारी अवसर, प्रशासनिक पद र प्रतिष्ठा प्राप्त हुन्छ।');
              opportunities.push('सरकारी सेवा', 'प्रशासनिक पद', 'पिताको सम्पत्ति');
          } else if (planet === 'चन्द्र') {
              luckStrengths.push('चन्द्र नवौं भावमा हुँदा माताको आशीर्वाद, जनसम्पर्क, पर्यटन र सेवा क्षेत्रमा अवसर पाइन्छ।');
              opportunities.push('पर्यटन', 'सेवा क्षेत्र', 'जनसम्पर्क');
          } else if (planet === 'मंगल') {
              luckStrengths.push('मंगल नवौं भावमा हुँदा साहसले भाग्य खुल्छ — सैन्य, प्रहरी, खेलकुद, इन्जिनियरिङमा सफलता मिल्छ।');
              luckChallenges.push('मंगलको प्रभावले भाग्यमा अचानक उतारचढाव, संघर्ष र प्रतिस्पर्धा बढी हुन्छ।');
              opportunities.push('सैन्य सेवा', 'प्रहरी', 'खेलकुद', 'इन्जिनियरिङ');
          } else if (planet === 'बुध') {
              luckStrengths.push('बुध नवौं भावमा हुँदा व्यापार, मिडिया, प्रविधि, लेखनमा भाग्य खुल्छ। विदेश व्यापारमा सफलता मिल्छ।');
              opportunities.push('व्यापार', 'मिडिया', 'प्रविधि', 'विदेश व्यापार');
          } else if (planet === 'शुक्र') {
              luckStrengths.push('शुक्र नवौं भावमा हुँदा कला, फेसन, विलासिताका सामान, कूटनीतिमा भाग्य खुल्छ।');
              opportunities.push('कला क्षेत्र', 'फेसन', 'कूटनीति', 'विलासिताको व्यापार');
          } else if (planet === 'शनि') {
              luckStrengths.push('शनि नवौं भावमा हुँदा मेहनतले भाग्य खुल्छ — परिणाम ढिलो तर स्थायी हुन्छ। कानुन, प्रशासन, इन्जिनियरिङमा सफलता मिल्छ।');
              luckChallenges.push('शनिको प्रभावले भाग्य ढिलो खुल्छ — धैर्य र निरन्तर परिश्रम चाहिन्छ।');
              opportunities.push('कानुन', 'प्रशासन', 'इन्जिनियरिङ');
          } else if (planet === 'राहु') {
              luckStrengths.push('राहु नवौं भावमा हुँदा विदेशमा भाग्य खुल्छ, प्रविधि र विदेशी सम्बन्धमा अप्रत्याशित अवसर आउँछन्।');
              luckChallenges.push('राहुको प्रभावले भाग्यमा धोखा, भ्रम र अप्रत्याशित परिवर्तन आउन सक्छ। सतर्क रहनुहोस्।');
              opportunities.push('विदेश यात्रा', 'प्रविधि क्षेत्र', 'अप्रत्याशित अवसर');
          } else if (planet === 'केतु') {
              luckStrengths.push('केतु नवौं भावमा हुँदा आध्यात्मिक क्षेत्र, धार्मिक स्थल, गुप्त विद्यामा भाग्य खुल्छ। मोक्षको प्रबल संकेत।');
              luckChallenges.push('केतुको प्रभावले सांसारिक सुखभन्दा आध्यात्मिकतातर्फ ध्यान जान्छ — भौतिक लाभ कम हुन सक्छ।');
              opportunities.push('आध्यात्मिक क्षेत्र', 'धार्मिक पर्यटन', 'गुरुजनको आशीर्वाद');
          }
      }
      
      const enemies = findEnemyPairs(planets9th);
      if (enemies.length > 0) {
          luckChallenges.push(`${enemies.join(', ')} शत्रु ग्रहहरू नवौं भावमा बसेका छन् — भाग्यको पथमा अवरोध, गुरुजनसँग द्वन्द्व र धार्मिक विवाद हुन सक्छ।`);
      }
      
      recommendedGem = recommendGemstoneForLuck(planets9th, luckChallenges);
  }
  
  const sector5 = `
╔══════════════════════════════════════════════════════════════════╗
║ ५. भाग्य र अवसर विश्लेषण (नवौं भाव)                            ║
╚══════════════════════════════════════════════════════════════════╝

【भाग्य विश्लेषण】
${analysis}
✅ भाग्य बल: ${luckStrengths.length > 0 ? luckStrengths.join(' ') : 'भाग्य स्वतः सक्रिय नहुन सक्छ; कठोर कर्म, गुरुसेवा र अनुशासन अनिवार्य हुन्छ।'}
${luckChallenges.length > 0 ? '⚠️ भाग्य चुनौती: ' + luckChallenges.join(' ') : ''}

【अवसरका क्षेत्रहरू】
➤ ${opportunities.slice(0, 4).join('\n➤ ')}

【भाग्योन्नति रत्न】
➤ रत्न: ${recommendedGem.gemstone}
➤ किन? ${recommendedGem.reason}
${recommendedGem.timing ? '➤ धारण गर्ने उपयुक्त समय: ' + recommendedGem.timing : ''}
${recommendedGem.mantra ? '➤ सहयोगी मन्त्र: ' + recommendedGem.mantra : ''}
`;

  return { text: sector5, strengths: luckStrengths, opportunities: opportunities };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function formatPlanetList(planets) {
  if (!planets || planets.length === 0) return '';
  if (planets.length === 1) return planets[0];
  if (planets.length === 2) return `${planets[0]} र ${planets[1]}`;
  return `${planets.slice(0, -1).join(', ')} र ${planets[planets.length - 1]}`;
}

function analyzePlanetWithLagna(planet, lagna) {
  const lagnaLord = LAGNA_DATA[lagna].lord;
  const planetData = PLANET_MASTER_DATA[planet];
  
  if (planet === lagnaLord) {
      return { relation: 'स्वगृही', effect: 'यो ग्रह आफ्नै घरमा बसेकोले पूर्ण शक्तिमा छ। यसले तपाईँको व्यक्तित्वलाई अभिभूत गर्छ।' };
  }
  if (planetData.exaltation === lagna) {
      return { relation: 'उच्च', effect: 'यो ग्रह उच्चको स्थितिमा छ — अत्यन्त शुभ संकेत। तर अत्यधिक राम्रो पनि हानिकारक हुन सक्छ।' };
  }
  if (planetData.debilitation === lagna) {
      return { relation: 'नीच', effect: 'यो ग्रह नीच अवस्थामा छ — कठिनाइ आउन सक्छ, तर संघर्षले नै बलियो बनाउँछ।' };
  }
  if (planetData.friendly.includes(lagnaLord)) {
      return { relation: 'मैत्रीपूर्ण', effect: `यो ग्रह लग्नको स्वामीको मित्र हो — सहयोगी र शुभ प्रभाव दिन्छ।` };
  }
  if (planetData.enemy.includes(lagnaLord)) {
      return { relation: 'शत्रुतापूर्ण', effect: `यो ग्रह लग्नको स्वामीको शत्रु हो — यसले व्यक्तित्वमा अन्तरद्वन्द्व र अस्थिरता ल्याउँछ।` };
  }
  return { relation: 'तटस्थ', effect: 'यो ग्रहको प्रभाव तटस्थ छ — अरू ग्रहको संगतले फल निर्धारण हुन्छ।' };
}

function findEnemyPairs(planets) {
  const enemies = [];
  for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
          const planetData = PLANET_MASTER_DATA[planets[i]];
          if (planetData.enemy.includes(planets[j])) {
              enemies.push(`${planets[i]} र ${planets[j]}`);
          }
      }
  }
  return enemies;
}

function recommendGemstoneForOverall(lagna, planets1st, problems) {
  if (problems.length > 0) {
      return {
          gemstone: 'पुखराज (Yellow Sapphire)',
          reason: 'तपाईँको कुण्डलीमा विरोधाभासी संकेतहरू भएकाले सन्तुलित रत्न पुखराज सबैभन्दा उपयुक्त छ। गुरुले शत्रु ग्रहलाई समेत मित्र बनाउने क्षमता राख्छ।',
          alternative: 'पुखराज नपाएमा गोमेद पनि प्रयोग गर्न सकिन्छ।'
      };
  }
  
  if (planets1st.length === 0) {
      const lagnaLord = LAGNA_DATA[lagna].lord;
      const lordData = PLANET_MASTER_DATA[lagnaLord];
      return {
          gemstone: lordData.gemstone,
          reason: `प्रथम भाव खाली भएकोले लग्नको स्वामी ${lagnaLord} को रत्न ${lordData.gemstone} धारण गर्नु लाभदायक छ। ${lordData.gem_reason_short}`,
          alternative: 'यदि यो रत्न धारण गर्न मिलेन भने पुखराज विकल्प हो।'
      };
  }
  
  const primaryPlanet = planets1st[0];
  const planetData = PLANET_MASTER_DATA[primaryPlanet];
  return {
      gemstone: planetData.gemstone,
      reason: `प्रथम भावमा ${primaryPlanet} प्रबल भएकोले यसको रत्न ${planetData.gemstone} समग्र सन्तुलनका लागि उपयुक्त छ। ${planetData.gem_reason_short}`,
      alternative: planetData.enemy.includes(planets1st[1]) ? 'शत्रु ग्रहसँग बसेकोले दुई रत्न एकसाथ धारण नगर्नुहोस्।' : ''
  };
}

function recommendGemstoneForHealth(planets1st, lagna, healthIssues) {
  if (healthIssues.length > 0) {
      return {
          gemstone: 'मोती (Pearl)',
          reason: 'स्वास्थ्य चुनौतीहरू कम गर्न चन्द्रको रत्न मोती शान्तिदायक हुन्छ। यसले मानसिक तनाव, अनिद्रा र भावनात्मक अस्थिरता हटाउँछ।',
          timing: 'सोमवार, शुक्ल पक्षको पूर्णिमा तिथि',
          caution: 'पहिलो भावमा शनि वा मंगल बलियो छ भने मोती धारण गर्नुअघि विशेषज्ञको सल्लाह लिनुहोस्।'
      };
  }
  
  if (planets1st.length === 0) {
      return {
          gemstone: PLANET_MASTER_DATA[LAGNA_DATA[lagna].lord].gemstone,
          reason: `प्रथम भाव खाली हुँदा लग्नको स्वामीको रत्न स्वास्थ्य सन्तुलनका लागि उत्तम हुन्छ।`,
          timing: 'आफ्नो लग्न अनुसारको दिन (उदाहरण: सिंहको लागि आइतवार)'
      };
  }
  
  const primary = planets1st[0];
  const planetData = PLANET_MASTER_DATA[primary];
  return {
      gemstone: planetData.gemstone,
      reason: `${primary} प्रथम भावमा रहेकोले यसको रत्न ${planetData.gemstone} ले शारीरिक र मानसिक स्वास्थ्य सन्तुलनमा राख्छ। ${planetData.gem_reason_short}`,
      timing: `${primary === 'सूर्य' ? 'आइतवार' : primary === 'चन्द्र' ? 'सोमवार' : primary === 'मंगल' ? 'मंगलवार' : 'शुभ दिनमा'} धारण गर्नुहोस्।`
  };
}

function recommendGemstoneForEducation(planets5th, challenges) {
  if (challenges.length > 0) {
      return {
          gemstone: 'पन्ना (Emerald)',
          reason: 'शिक्षामा आएका अवरोध हटाउन बुधको रत्न पन्ना अत्यन्त प्रभावकारी छ। यसले एकाग्रता, स्मरणशक्ति र बौद्धिक क्षमता बढाउँछ।',
          method: 'बुधवारको दिन, बिहान स्नानपछि हरियो वस्त्रमा राखेर धारण गर्नुहोस्।'
      };
  }
  
  if (planets5th.length === 0) {
      return {
          gemstone: 'पन्ना (Emerald)',
          reason: 'पाँचौं भाव खाली हुँदा शिक्षामा एकाग्रता बढाउन पन्ना उपयुक्त हुन्छ।',
          method: 'परीक्षा अघि १५ दिनसम्म बुधवार पन्ना धारण गर्नुहोस्।'
      };
  }
  
  // Find education-friendly planet
  const eduPlanets = planets5th.filter(p => ['बुध', 'गुरु', 'शुक्र', 'सूर्य'].includes(p));
  if (eduPlanets.length > 0) {
      const planetData = PLANET_MASTER_DATA[eduPlanets[0]];
      return {
          gemstone: planetData.gemstone,
          reason: `${eduPlanets[0]} पाँचौं भावमा रहेकोले यसको रत्न ${planetData.gemstone} ले शैक्षिक प्रगिमा सहयोग गर्छ। ${planetData.gem_reason_short}`,
          method: `शिक्षा क्षेत्र अनुसार ${eduPlanets[0] === 'बुध' ? 'बुधवार' : eduPlanets[0] === 'गुरु' ? 'बिहीवार' : 'शुभ दिन'} धारण गर्नुहोस्।`
      };
  }
  
  return {
      gemstone: 'पन्ना (Emerald)',
      reason: 'बुद्धिको रत्न पन्ना सबैभन्दा सुरक्षित र प्रभावकारी विकल्प हो।',
      method: 'बुधवार विद्यारम्भ गर्नुअघि धारण गर्नुहोस्।'
  };
}

function recommendGemstoneForLove(planets5th, challenges, gender) {
  if (challenges.length > 0) {
      return {
          gemstone: 'गुलाबी पन्ना (Rose Quartz)',
          reason: 'प्रेम सम्बन्धमा आएका तिक्तता, गलतफहमी र द्वन्द्व हटाउन गुलाबी पन्ना सबैभन्दा उत्तम छ। यसले हृदय चक्र खोलेर प्रेमको प्रवाहलाई सहज बनाउँछ।',
          method: 'शुक्रवारको दिन, मीठो पदार्थ चढाएर रातो कपडामा राख्नुहोस्।',
          ritual: 'धारण गर्दा "ॐ शुक्राय नमः" मन्त्र १०८ पटक जप्नुहोस्।'
      };
  }
  
  if (planets5th.includes('शुक्र')) {
      return {
          gemstone: 'हीरा (Diamond) वा ओपल',
          reason: 'शुक्र प्रेमको मुख्य कारक हो — शुक्रको रत्न हीरा वा ओपलले प्रेम सम्बन्धलाई सुमधुर, रोमान्टिक र स्थिर बनाउँछ। विवाहको अवसर बढाउँछ।',
          method: 'शुक्रवारको दिन, सेतो वस्त्रमा राखेर धारण गर्नुहोस्।',
          ritual: 'गुलाबको पाँच पाती चढाएर "ॐ शुक्राय नमः" मन्त्र जप्नुहोस्।'
      };
  }
  
  if (planets5th.includes('चन्द्र')) {
      return {
          gemstone: 'मोती (Pearl)',
          reason: 'चन्द्रको मोतीले प्रेममा कोमलता, भावनात्मक सुरक्षा र मधुरता ल्याउँछ। भावुक स्वभावको साथीका लागि यो सर्वश्रेष्ठ छ।',
          method: 'सोमवार, शुक्ल पक्षमा धारण गर्नुहोस्।'
      };
  }
  
  return {
      gemstone: 'गुलाबी पन्ना (Rose Quartz)',
      reason: 'प्रेमको सार्वभौम रत्न गुलाबी पन्नाले कुनै पनि कुण्डलीमा प्रेमको ऊर्जा जागृत गर्छ।',
      method: 'हृदयको नजिक पहिरनुहोस्।'
  };
}

function recommendGemstoneForLuck(planets9th, challenges) {
  if (challenges.length > 0) {
      return {
          gemstone: 'पुखराज (Yellow Sapphire)',
          reason: 'भाग्यको मार्गमा आएका अवरोध हटाउन गुरुको रत्न पुखराज सर्वश्रेष्ठ छ। यसले गुरुजनको कृपा, सकारात्मक ऊर्जा र अवसरहरू ल्याउँछ।',
          timing: 'बिहीवार, पूर्णिमा वा एकादशी तिथि',
          mantra: '"ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः"'
      };
  }
  
  if (planets9th.includes('गुरु')) {
      return {
          gemstone: 'पुखराज (Yellow Sapphire)',
          reason: 'गुरु नवौं भावमा हुँदा पुखराज धारण गर्नाले भाग्यको ढोका खुल्छ। यसले ज्ञान, प्रतिष्ठा, सन्तान सुख र अप्रत्याशित लाभ दिन्छ।',
          timing: 'बिहीवार, शुक्ल पक्षको पूर्णिमा',
          mantra: '"ॐ गुरवे नमः" को १०८ जप'
      };
  }
  
  if (planets9th.includes('सूर्य')) {
      return {
          gemstone: 'माणिक्य (Ruby)',
          reason: 'सूर्य नवौं भावमा हुँदा माणिक्यले पिताको कृपा, सरकारी सेवा र प्रशासनिक पद प्राप्त गराउँछ।',
          timing: 'आइतवार, उदयकालमा',
          mantra: '"ॐ सूर्याय नमः"'
      };
  }
  
  if (planets9th.length === 0) {
      return {
          gemstone: 'पुखराज (Yellow Sapphire)',
          reason: 'नवौं भाव खाली हुँदा भाग्य सुधार्न पुखराज सबैभन्दा सुरक्षित र प्रभावकारी रत्न हो।',
          timing: 'बिहीवार, बिहान सूर्योदयपछि'
      };
  }
  
  const primary = planets9th[0];
  const planetData = PLANET_MASTER_DATA[primary];
  return {
      gemstone: planetData.gemstone,
      reason: `${primary} नवौं भावमा रहेकोले यसको रत्न ${planetData.gemstone} ले भाग्योन्नति र अवसरहरू ल्याउँछ। ${planetData.gem_reason_short}`,
      timing: `${primary === 'गुरु' ? 'बिहीवार' : primary === 'सूर्य' ? 'आइतवार' : primary === 'शुक्र' ? 'शुक्रवार' : 'शुभ दिन'} धारण गर्नुहोस्।`
  };
}

// ============================================================
// MAIN API FUNCTION - SECTOR WISE COMPLETE PREDICTION
// ============================================================

function getCompleteVedicPrediction(lagna, planets1st = [], planets5th = [], planets9th = [], gender = 'male') {
  // Validate inputs
  if (!LAGNA_DATA[lagna]) {
      throw new Error(`अमान्य लग्न: ${lagna}. मान्य लग्नहरू: ${Object.keys(LAGNA_DATA).join(', ')}`);
  }
  
  const validPlanets = Object.keys(PLANET_MASTER_DATA);
  for (const planet of [...planets1st, ...planets5th, ...planets9th]) {
      if (!validPlanets.includes(planet)) {
          throw new Error(`अमान्य ग्रह: ${planet}. मान्य ग्रहहरू: ${validPlanets.join(', ')}`);
      }
  }
  
  // Generate all sectors
  const overall = analyzeOverall(lagna, planets1st, gender);
  const health = analyzeHealth(lagna, planets1st, gender);
  const education = analyzeEducation(planets5th, lagna);
  const love = analyzeLove(planets5th, lagna, gender);
  const luck = analyzeLuck(planets9th, lagna);
  
  // Combine all sectors
  const completePrediction = `
╔══════════════════════════════════════════════════════════════════════════════════════════╗
║                        वैदिक ज्योतिषीय कुण्डली विश्लेषण तथा रत्न सिफारिस                  ║
║                                   ${lagna} लग्न - ${gender === 'male' ? 'पुरुष' : 'स्त्री'} कुण्डली                          ║
╚══════════════════════════════════════════════════════════════════════════════════════════╝

${overall.text}

${health.text}

${education.text}

${love.text}

${luck.text}

╔══════════════════════════════════════════════════════════════════════════════════════════╗
║                                     समग्र निष्कर्ष                                         ║
╚══════════════════════════════════════════════════════════════════════════════════════════╝

तपाईँको जन्मकुण्डलीको विश्लेषण गर्दा निम्न मुख्य बुँदाहरूमा विशेष ध्यान दिनु आवश्यक छ:

${overall.problems?.length > 0 ? '⚠️ ' + overall.problems[0] : '⚠️ समग्र रूपमा व्यक्तित्व-निर्णय र जीवनदिशामा अस्थिरता देखिन सक्छ; अनुशासन र गुरु-मार्गदर्शन अनिवार्य छ।'}
${health.issues?.length > 0 ? '⚠️ ' + health.issues[0] : '⚠️ स्वास्थ्यमा लुकेका जोखिम (तनाव, निद्रा, पाचन) नियमित निगरानी नगरे जटिल हुन सक्छ।'}
${education.strengths?.length > 0 ? '✓ ' + education.strengths[0] : ''}
${love.challenges?.length > 0 ? '⚠️ ' + love.challenges[0] : '⚠️ प्रेम सम्बन्धमा गलतफहमी, दूरी वा भावनात्मक असन्तुलनको जोखिम रहन्छ।'}
${luck.strengths?.length > 0 ? '✓ ' + luck.strengths[0] : '⚠️ भाग्य स्वतः नखुल्न सक्छ; कर्म, संयम र उचित रत्न-साधना बिना अवसर छुट्न सक्छ।'}

═══════════════════════════════════════════════════════════════════════════════════════════════

नोट: यो विश्लेषण सामान्य मार्गदर्शनको लागि हो। ग्रहहरूको सही डिग्री, नक्षत्र, दशा, र अन्तर्दशा
हेरी मात्र अन्तिम निर्णय लिनुपर्छ। रत्न धारण गर्नुअघि अनुभवी ज्योतिषीको सल्लाह अवश्य लिनुहोस्।

शुभमस्तु !
`;

  return completePrediction;
}

// ============================================================
// API COMPATIBILITY LAYER (used by controller)
// ============================================================

const gemsDb = require('../database/gems-recommendation');
const {
  getRudrakshaRecommendation,
} = require('./RudrakshaRecommendationEngine');

class GemRudrakshaRecommendationService {
  getRecommendations({ planets = [], houses = [], gender = 'male', ascendantSign = null }) {
    const relevantPlanets = this._extractPlanetsFromTargetHouses({
      planets,
      houses,
      targetHouses: new Set([1, 5, 9]),
    });
    const lagnaSign = this._getLagnaSignFromHouses(houses, ascendantSign);
    const lagna = this._lagnaNameDevanagari(lagnaSign);
    const byHouse = this._planetsByHouseDevanagari(relevantPlanets);
    const genderLabel = (gender || '').toLowerCase() === 'महिला' || (gender || '').toLowerCase() === 'female'
      ? 'female'
      : 'male';

    const grouped = [];
    const moonRashi = this._getMoonRashiFromChart({ planets, houses });
    const rudrakshaRecommendation = getRudrakshaRecommendation(
      moonRashi,
      genderLabel,
    );
    if (lagna && LAGNA_DATA[lagna]) {
      const overall = analyzeOverall(lagna, byHouse[1], genderLabel);
      const health = analyzeHealth(lagna, byHouse[1], genderLabel);
      const education = analyzeEducation(byHouse[5], lagna);
      const love = analyzeLove(byHouse[5], lagna, genderLabel);
      const luck = analyzeLuck(byHouse[9], lagna);

      const overallGem = recommendGemstoneForOverall(lagna, byHouse[1], overall.problems || []);
      const healthGem = recommendGemstoneForHealth(byHouse[1], lagna, health.issues || []);
      const eduGem = recommendGemstoneForEducation(byHouse[5], []);
      const loveGem = recommendGemstoneForLove(byHouse[5], love.challenges || [], genderLabel);
      const luckGem = recommendGemstoneForLuck(byHouse[9], []);

      const overallText = this._toParagraphNepali(overall.text || '');
      const healthText = this._toParagraphNepali(health.text || '');
      const educationText = this._toParagraphNepali(education.text || '');
      const loveText = this._toParagraphNepali(love.text || '');
      const luckText = this._toParagraphNepali(luck.text || '');

      grouped.push({
        house: { id: 1, name: 'प्रथम, पाँचौं र नवौं भाव' },
        planet: `${formatPlanetList(byHouse[1]) || '—'} | ${formatPlanetList(byHouse[5]) || '—'} | ${formatPlanetList(byHouse[9]) || '—'}`,
        matchedPlanetsByHouse: {
          1: formatPlanetList(byHouse[1]) || '',
          5: formatPlanetList(byHouse[5]) || '',
          9: formatPlanetList(byHouse[9]) || '',
        },
        actualPlanetsByHouse: {
          1: formatPlanetList(byHouse[1]) || '',
          5: formatPlanetList(byHouse[5]) || '',
          9: formatPlanetList(byHouse[9]) || '',
        },
        prediction: overallText,
        categoryPredictions: {
          overall: overallText,
          health: healthText,
          education: educationText,
          love: loveText,
          luck: luckText,
        },
        categoryGemstones: {
          overall: overallGem.gemstone || '',
          health: healthGem.gemstone || '',
          education: eduGem.gemstone || '',
          love: loveGem.gemstone || '',
          luck: luckGem.gemstone || '',
        },
      });
    }

    return {
      source: 'GemRudrakshaRecommendationService.js',
      sqliteRelativePath: null,
      housesAnalyzed: [1, 5, 9],
      matchFound: grouped.length > 0,
      exactDbMatch: grouped.length > 0,
      dbMatchQuality: grouped.length > 0 ? 'engine' : null,
      planetsConsidered: relevantPlanets.map((p) => ({
        name: this._displayPlanetNameForApi(p.name || p.id),
        house: Number(p.house),
      })),
      recommendations: grouped,
      moonRashi,
      rudraksha_recommendations: rudrakshaRecommendation
        ? [rudrakshaRecommendation]
        : [],
    };
  }

  getFormattedLine({ planets = [], houses = [], ascendantSign = null }) {
    const relevantPlanets = this._extractPlanetsFromTargetHouses({
      planets,
      houses,
      targetHouses: new Set([1, 5, 9]),
    });
    const lagnaSign = this._getLagnaSignFromHouses(houses, ascendantSign);
    const lagna = this._lagnaNameDevanagari(lagnaSign);
    if (!lagna || !LAGNA_DATA[lagna]) return '1;;1,5,9;;';

    const byHouse = this._planetsByHouseDevanagari(relevantPlanets);
    const maleOverall = analyzeOverall(lagna, byHouse[1], 'male').text || '';
    const femaleOverall = analyzeOverall(lagna, byHouse[1], 'female').text || '';
    const housePlanets = this._planetsByHouse(relevantPlanets);
    const idMap = { Sun: 1, Moon: 2, Mars: 3, Mercury: 4, Jupiter: 5, Venus: 6, Saturn: 7, Rahu: 8, Ketu: 9 };
    const ids = []
      .concat(housePlanets[1], housePlanets[5], housePlanets[9])
      .map((name) => idMap[String(name || '').trim()] || null)
      .filter((id) => id != null);
    const uniqueIds = [...new Set(ids)].sort((a, b) => a - b);
    return `1;${uniqueIds.join(',')};1,5,9;${maleOverall.trim()};${femaleOverall.trim()}`;
  }

  _extractPlanetsFromTargetHouses({ planets, houses, targetHouses }) {
    const byPlanetHouse = planets.filter((p) => targetHouses.has(Number(p && p.house)));
    const houseBuckets = Array.isArray(houses) ? houses : [];
    if (!houseBuckets.length) return byPlanetHouse;

    const wanted = houseBuckets.filter((h) => {
      const houseNo = Number(h && (h.house || h.id || h.number || h.house_number || h.houseNo));
      return targetHouses.has(houseNo);
    });
    if (!wanted.length) return byPlanetHouse;

    const planetIds = new Set();
    for (const h of wanted) {
      const ids = Array.isArray(h.planets) ? h.planets : [];
      for (const id of ids) {
        const keys = this._houseBucketLabelToMatchKeys(id);
        for (const k of keys) planetIds.add(k);
      }
    }

    const strict = planets.filter((p) => {
      const pid = String((p && (p.id || p.name || ''))).toLowerCase();
      return planetIds.has(pid) && targetHouses.has(Number(p.house));
    });
    return strict.length ? strict : byPlanetHouse;
  }

  _houseBucketLabelToMatchKeys(raw) {
    if (raw == null) return [];
    const label = String(raw).trim();
    if (!label || label === 'ल') return [];
    const glyphToId = {
      सू: 'sun',
      च: 'moon',
      मं: 'mars',
      बु: 'mercury',
      गु: 'jupiter',
      शु: 'venus',
      श: 'saturn',
      रा: 'rahu',
      के: 'ketu',
    };
    if (glyphToId[label]) return [glyphToId[label]];
    return [label.toLowerCase().replace(/\s+/g, '')];
  }

  _normalizePlanetName(name) {
    if (!name) return null;
    const raw = String(name).trim().normalize('NFC');
    const devanagariPlanet = {
      सूर्य: 'Sun', मंगल: 'Mars', बृहस्पति: 'Jupiter', गुरु: 'Jupiter', शुक्र: 'Venus',
      बुध: 'Mercury', शनि: 'Saturn', चन्द्र: 'Moon', राहु: 'Rahu', रा: 'Rahu', केतु: 'Ketu', के: 'Ketu',
    };
    if (devanagariPlanet[raw]) return devanagariPlanet[raw];
    const n = raw.toLowerCase();
    const map = { sun: 'Sun', moon: 'Moon', mars: 'Mars', mercury: 'Mercury', jupiter: 'Jupiter', venus: 'Venus', saturn: 'Saturn', rahu: 'Rahu', ketu: 'Ketu' };
    return map[n] || null;
  }

  /** English display name for API/clients (e.g. planetsConsidered): Title case for known grahas. */
  _displayPlanetNameForApi(raw) {
    const normalized = this._normalizePlanetName(raw);
    if (normalized) return normalized;
    const s = String(raw ?? '').trim();
    if (!s) return null;
    const c0 = s.charAt(0);
    if (/[a-z]/.test(c0)) return c0.toUpperCase() + s.slice(1);
    return s;
  }

  _getMoonRashiFromChart({ planets, houses }) {
    const list = Array.isArray(planets) ? planets : [];
    const moon = list.find((p) => {
      const n = this._normalizePlanetName(p && (p.name || p.id));
      return n === 'Moon';
    });
    if (!moon) return null;

    const moonHouse = Number(moon.house);
    if (!Number.isFinite(moonHouse)) return null;

    const houseRows = Array.isArray(houses) ? houses : [];
    const houseData = houseRows.find(
      (h) =>
        Number(
          h &&
            (h.number ||
              h.house ||
              h.id ||
              h.house_number ||
              h.houseNo),
        ) === moonHouse,
    );
    if (!houseData) return null;

    const sign = Number(
      houseData.sign ||
        houseData.signNumber ||
        houseData.rashi ||
        houseData.rashiNumber,
    );
    if (!Number.isFinite(sign)) return null;
    return this._lagnaNameDevanagari(sign);
  }

  _toDevanagariPlanet(name) {
    if (!name) return null;
    const raw = String(name).trim().normalize('NFC');
    const map = {
      सूर्य: 'सूर्य', Sun: 'सूर्य', sun: 'सूर्य', सू: 'सूर्य',
      चन्द्र: 'चन्द्र', Moon: 'चन्द्र', moon: 'चन्द्र', च: 'चन्द्र',
      मंगल: 'मंगल', Mars: 'मंगल', mars: 'मंगल', मं: 'मंगल',
      बुध: 'बुध', Mercury: 'बुध', mercury: 'बुध', बु: 'बुध',
      बृहस्पति: 'गुरु', गुरु: 'गुरु', Jupiter: 'गुरु', jupiter: 'गुरु', गु: 'गुरु',
      शुक्र: 'शुक्र', Venus: 'शुक्र', venus: 'शुक्र', शु: 'शुक्र',
      शनि: 'शनि', Saturn: 'शनि', saturn: 'शनि', श: 'शनि',
      राहु: 'राहु', Rahu: 'राहु', rahu: 'राहु', रा: 'राहु',
      केतु: 'केतु', Ketu: 'केतु', ketu: 'केतु', के: 'केतु',
    };
    return map[raw] || null;
  }

  _planetsByHouse(planets) {
    const out = { 1: [], 5: [], 9: [] };
    for (const p of planets) {
      const house = Number(p.house);
      if (![1, 5, 9].includes(house)) continue;
      const normalized = this._normalizePlanetName(p.name || p.id);
      if (!normalized) continue;
      if (!out[house].includes(normalized)) out[house].push(normalized);
    }
    return out;
  }

  _planetsByHouseDevanagari(planets) {
    const out = { 1: [], 5: [], 9: [] };
    for (const p of planets) {
      const house = Number(p.house);
      if (![1, 5, 9].includes(house)) continue;
      const np = this._toDevanagariPlanet(p.name || p.id);
      if (!np) continue;
      if (!out[house].includes(np)) out[house].push(np);
    }
    return out;
  }

  _resolveDbMatch({ planets, houses, ascendantSign = null }) {
    const exact = this._findExactPredictionMatch({ planets, houses, ascendantSign });
    if (exact) return { match: exact, dbMatchQuality: 'exact' };

    const lagnaSign = this._getLagnaSignFromHouses(houses, ascendantSign);
    const lagnaName = this._rashiName(lagnaSign);
    if (!lagnaName) return { match: null, dbMatchQuality: null };

    const byHouse = this._planetsByHouse(planets);
    const all = gemsDb.getAllGemstonePredictions();
    const lagnaRows = all.filter((row) => this._normalizeLagnaName(row.lagna) === this._normalizeLagnaName(lagnaName));
    if (!lagnaRows.length) return { match: null, dbMatchQuality: null };

    let bestRow = null;
    let bestScore = -1;
    for (const row of lagnaRows) {
      const score = this._rowOverlapScore(row, byHouse);
      if (score > bestScore) {
        bestScore = score;
        bestRow = row;
      }
    }
    if (bestScore >= 1) return { match: this._dbRowToMatch(bestRow), dbMatchQuality: 'partial' };
    lagnaRows.sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
    return { match: this._dbRowToMatch(lagnaRows[0]), dbMatchQuality: 'lagna_only' };
  }

  _findExactPredictionMatch({ planets, houses, ascendantSign = null }) {
    const lagnaSign = this._getLagnaSignFromHouses(houses, ascendantSign);
    const lagnaName = this._rashiName(lagnaSign);
    const byHouse = this._planetsByHouse(planets);
    const all = gemsDb.getAllGemstonePredictions();
    for (const row of all) {
      if (this._normalizeLagnaName(row.lagna) !== this._normalizeLagnaName(lagnaName)) continue;
      const exact1 = this._isExactHouseMatch(row.planets_in_1st, byHouse[1]);
      const exact5 = this._isExactHouseMatch(row.planets_in_5th, byHouse[5]);
      const exact9 = this._isExactHouseMatch(row.planets_in_9th, byHouse[9]);
      if (exact1 && exact5 && exact9) return this._dbRowToMatch(row);
    }
    return null;
  }

  _dbRowToMatch(row) {
    return {
      lagna: row.lagna,
      predictionMale: row.overall_prediction_male,
      predictionFemale: row.overall_prediction_female,
      healthPredictionMale: row.health_prediction_male,
      healthPredictionFemale: row.health_prediction_female,
      educationPredictionMale: row.education_prediction_male,
      educationPredictionFemale: row.education_prediction_female,
      lovePredictionMale: row.love_prediction_male,
      lovePredictionFemale: row.love_prediction_female,
      luckPredictionMale: row.luck_prediction_male,
      luckPredictionFemale: row.luck_prediction_female,
      suggestedGemstone: row.overall_gemstone,
      healthGemstone: row.health_gemstone,
      educationGemstone: row.education_gemstone,
      loveGemstone: row.love_gemstone,
      luckGemstone: row.luck_gemstone,
      planetsIn1st: row.planets_in_1st || '',
      planetsIn5th: row.planets_in_5th || '',
      planetsIn9th: row.planets_in_9th || '',
    };
  }

  _rowOverlapScore(row, byHouse) {
    return this._houseOverlapScore(row.planets_in_1st, byHouse[1]) +
      this._houseOverlapScore(row.planets_in_5th, byHouse[5]) +
      this._houseOverlapScore(row.planets_in_9th, byHouse[9]);
  }

  _houseOverlapScore(dbValue, chartPlanets) {
    const dbList = (dbValue || '').split(',').map((v) => this._normalizePlanetName(v)).filter(Boolean);
    const chartList = (chartPlanets || []).map((v) => this._normalizePlanetName(v)).filter(Boolean);
    if (dbList.length === 0 && chartList.length === 0) return 1;
    let inter = 0;
    const setDb = new Set(dbList);
    for (const p of chartList) if (setDb.has(p)) inter += 1;
    return inter * 2;
  }

  _getLagnaSignFromHouses(houses, ascendantSignFallback = null) {
    const list = Array.isArray(houses) ? houses : [];
    const h1 = list.find((h) => Number(h && (h.number || h.house || h.id || h.house_number || h.houseNo)) === 1);
    if (h1) {
      const s = Number(h1.sign || h1.signNumber || h1.rashi || h1.rashiNumber);
      if (Number.isFinite(s)) return s;
    }
    if (list[0]) {
      const s = Number(list[0].sign || list[0].signNumber || list[0].rashi || list[0].rashiNumber);
      if (Number.isFinite(s)) return s;
    }
    const fb = Number(ascendantSignFallback);
    return Number.isFinite(fb) ? fb : null;
  }

  _isExactHouseMatch(dbValue, planetsInHouse) {
    const dbList = (dbValue || '').split(',').map((v) => this._normalizePlanetName(v)).filter(Boolean).sort();
    const chartList = (planetsInHouse || []).map((v) => this._normalizePlanetName(v)).filter(Boolean).sort();
    if (dbList.length !== chartList.length) return false;
    for (let i = 0; i < dbList.length; i++) if (dbList[i] !== chartList[i]) return false;
    return true;
  }

  _rashiName(signNumber) {
    const map = { 1: 'Mesh', 2: 'Vrishabha', 3: 'Mithun', 4: 'Karkat', 5: 'Simha', 6: 'Kanya', 7: 'Tula', 8: 'Vrishchik', 9: 'Dhanu', 10: 'Makar', 11: 'Kumbha', 12: 'Meen' };
    return map[signNumber] || null;
  }

  _lagnaNameDevanagari(signNumber) {
    const map = {
      1: 'मेष',
      2: 'वृषभ',
      3: 'मिथुन',
      4: 'कर्क',
      5: 'सिंह',
      6: 'कन्या',
      7: 'तुला',
      8: 'वृश्चिक',
      9: 'धनु',
      10: 'मकर',
      11: 'कुम्भ',
      12: 'मीन',
    };
    return map[Number(signNumber)] || null;
  }

  _toParagraphNepali(rawText) {
    const text = String(rawText || '');
    if (!text.trim()) return '';
    const dropLine = (line) => {
      const t = line.trim();
      if (!t) return true;
      if (/^[╔╗║╚╝═]+$/.test(t)) return true;
      if (/^[✅⚠️➤•\-]/.test(t)) return true;
      if (/^【.*】$/.test(t)) return true;
      if (/^१\.\s*समग्र/.test(t)) return true;
      if (/^२\.\s*स्वास्थ्य/.test(t)) return true;
      if (/^३\.\s*शिक्षा/.test(t)) return true;
      if (/^४\.\s*प्रेम/.test(t)) return true;
      if (/^५\.\s*भाग्य/.test(t)) return true;
      if (/समग्र विश्लेषण र सिफारिस/.test(t)) return true;
      if (/स्वास्थ्य र व्यक्तित्व विश्लेषण/.test(t)) return true;
      if (/शिक्षा विश्लेषण/.test(t)) return true;
      if (/प्रेम सम्बन्ध विश्लेषण/.test(t)) return true;
      if (/भाग्य र अवसर विश्लेषण/.test(t)) return true;
      return false;
    };

    const cleaned = text
      .split('\n')
      .map((l) => l.replace(/[✅⚠️➤]/g, '').trim())
      .filter((l) => !dropLine(l));

    return cleaned
      .join(' ')
      .replace(/\s+/g, ' ')
      .replace(/\s([।,])/g, '$1')
      .trim();
  }

  _normalizeLagnaName(name) {
    const raw = String(name || '').trim().normalize('NFC');
    const devanagariLagna = {
      मेष: 'mesh', वृष: 'vrishabha', वृषभ: 'vrishabha', मिथुन: 'mithun', कर्क: 'karkat', कर्कट: 'karkat',
      सिंह: 'simha', कन्या: 'kanya', तुला: 'tula', वृश्चिक: 'vrishchik', धनु: 'dhanu', मकर: 'makar', कुम्भ: 'kumbha', मीन: 'meen',
    };
    if (devanagariLagna[raw]) return devanagariLagna[raw];
    const n = raw.toLowerCase();
    const aliases = {
      aries: 'mesh', mesha: 'mesh', mesh: 'mesh',
      taurus: 'vrishabha', vrishabha: 'vrishabha',
      gemini: 'mithun', mithuna: 'mithun', mithun: 'mithun',
      cancer: 'karkat', karka: 'karkat', karkat: 'karkat',
      leo: 'simha', simha: 'simha',
      virgo: 'kanya', kanya: 'kanya',
      libra: 'tula', tula: 'tula',
      scorpio: 'vrishchik', vrishchika: 'vrishchik', vrishchik: 'vrishchik',
      sagittarius: 'dhanu', dhanu: 'dhanu', dhanus: 'dhanu',
      capricorn: 'makar', makara: 'makar', makar: 'makar',
      aquarius: 'kumbha', kumbha: 'kumbha',
      pisces: 'meen', meena: 'meen', meen: 'meen',
    };
    return aliases[n] || n;
  }
}

const service = new GemRudrakshaRecommendationService();
service.getCompleteVedicPrediction = getCompleteVedicPrediction;
service.PLANET_MASTER_DATA = PLANET_MASTER_DATA;
service.LAGNA_DATA = LAGNA_DATA;
service.analyzeOverall = analyzeOverall;
service.analyzeHealth = analyzeHealth;
service.analyzeEducation = analyzeEducation;
service.analyzeLove = analyzeLove;
service.analyzeLuck = analyzeLuck;

module.exports = service;

// ============================================================
// EXAMPLE USAGE
// ============================================================

if (require.main === module) {
  console.log('\n');
  
  // Example 1: Complex combination
  console.log('📊 उदाहरण १: मेष लग्न - पहिलो भावमा मंगल र सूर्य, पाँचौंमा बुध, नवौंमा गुरु');
  console.log('=' .repeat(100));
  
  const result1 = getCompleteVedicPrediction(
      'मेष',
      ['मंगल', 'सूर्य'],
      ['बुध'],
      ['गुरु'],
      'male'
  );
  console.log(result1);
  
  console.log('\n\n');
  console.log('=' .repeat(100));
  console.log('📊 उदाहरण २: मिथुन लग्न - पहिलो भाव खाली, पाँचौंमा शुक्र, नवौं खाली');
  console.log('=' .repeat(100));
  
  const result2 = getCompleteVedicPrediction(
      'मिथुन',
      [],
      ['शुक्र'],
      [],
      'female'
  );
  console.log(result2);
  
  console.log('\n\n');
  console.log('=' .repeat(100));
  console.log('📊 उदाहरण ३: सिंह लग्न - शत्रु ग्रहको संयोजन');
  console.log('=' .repeat(100));
  
  const result3 = getCompleteVedicPrediction(
      'सिंह',
      ['सूर्य', 'शनि'],
      ['चन्द्र', 'राहु'],
      ['शुक्र'],
      'male'
  );
  console.log(result3);
}