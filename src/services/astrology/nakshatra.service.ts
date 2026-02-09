import type { NakshatraDetails } from '../../types/astrology.types';

/**
 * Nakshatra Service
 * Provides nakshatra details, meanings, and characteristics
 */
export class NakshatraService {
  private static readonly NAKSHATRAS: NakshatraDetails[] = [
    {
      index: 0,
      name: 'Ashwini',
      deity: 'Ashwini Kumaras',
      symbol: 'Horse Head',
      meaning: 'The Horsemen - Quick action, healing abilities',
      characteristics: 'Quick, energetic, healing nature, good at starting things',
      rulingPlanet: 'Ketu',
      padaMeanings: [
        'Quick action and initiative',
        'Healing and medicine',
        'Speed and movement',
        'New beginnings',
      ],
    },
    {
      index: 1,
      name: 'Bharani',
      deity: 'Yama',
      symbol: 'Vulva',
      meaning: 'The Bearer - Transformation, death and rebirth',
      characteristics: 'Intense, transformative, sexual energy, creative',
      rulingPlanet: 'Venus',
      padaMeanings: [
        'Transformation and change',
        'Creative expression',
        'Sexual energy',
        'Death and rebirth cycles',
      ],
    },
    {
      index: 2,
      name: 'Krittika',
      deity: 'Agni',
      symbol: 'Razor or Flame',
      meaning: 'The Cutter - Sharp, cutting, purifying',
      characteristics: 'Sharp intellect, cutting through obstacles, purification',
      rulingPlanet: 'Sun',
      padaMeanings: [
        'Sharp intellect and clarity',
        'Cutting through obstacles',
        'Purification and cleansing',
        'Leadership qualities',
      ],
    },
    {
      index: 3,
      name: 'Rohini',
      deity: 'Brahma',
      symbol: 'Cart or Chariot',
      meaning: 'The Red One - Growth, fertility, material abundance',
      characteristics: 'Material abundance, growth, fertility, beauty',
      rulingPlanet: 'Moon',
      padaMeanings: [
        'Material abundance and wealth',
        'Growth and fertility',
        'Beauty and aesthetics',
        'Pleasure and enjoyment',
      ],
    },
    {
      index: 4,
      name: 'Mrigashira',
      deity: 'Soma',
      symbol: 'Deer Head',
      meaning: 'The Deer Head - Searching, wandering, curiosity',
      characteristics: 'Curious, searching, wandering, artistic',
      rulingPlanet: 'Mars',
      padaMeanings: [
        'Curiosity and exploration',
        'Searching for truth',
        'Artistic expression',
        'Wandering and travel',
      ],
    },
    {
      index: 5,
      name: 'Ardra',
      deity: 'Rudra',
      symbol: 'Teardrop',
      meaning: 'The Moist One - Destruction, transformation through pain',
      characteristics: 'Destructive, transformative, emotional intensity',
      rulingPlanet: 'Rahu',
      padaMeanings: [
        'Destruction and transformation',
        'Emotional intensity',
        'Overcoming obstacles',
        'Renewal after destruction',
      ],
    },
    {
      index: 6,
      name: 'Punarvasu',
      deity: 'Aditi',
      symbol: 'Bow and Quiver',
      meaning: 'The Return of Light - Renewal, restoration',
      characteristics: 'Renewal, restoration, optimism, healing',
      rulingPlanet: 'Jupiter',
      padaMeanings: [
        'Renewal and restoration',
        'Optimism and hope',
        'Return of good fortune',
        'Spiritual growth',
      ],
    },
    {
      index: 7,
      name: 'Pushya',
      deity: 'Brihaspati',
      symbol: 'Cow Udder',
      meaning: 'The Nourisher - Nourishment, protection, growth',
      characteristics: 'Nourishing, protective, supportive, spiritual',
      rulingPlanet: 'Saturn',
      padaMeanings: [
        'Nourishment and care',
        'Protection and support',
        'Spiritual growth',
        'Material prosperity',
      ],
    },
    {
      index: 8,
      name: 'Ashlesha',
      deity: 'Nagas',
      symbol: 'Coiled Serpent',
      meaning: 'The Entwiner - Cunning, manipulation, healing',
      characteristics: 'Cunning, manipulative, healing, transformative',
      rulingPlanet: 'Mercury',
      padaMeanings: [
        'Cunning and intelligence',
        'Healing abilities',
        'Transformation',
        'Deep understanding',
      ],
    },
    {
      index: 9,
      name: 'Magha',
      deity: 'Pitris',
      symbol: 'Throne',
      meaning: 'The Mighty - Royalty, ancestors, power',
      characteristics: 'Royal, powerful, connected to ancestors, leadership',
      rulingPlanet: 'Ketu',
      padaMeanings: [
        'Royalty and power',
        'Connection to ancestors',
        'Leadership qualities',
        'Material success',
      ],
    },
    {
      index: 10,
      name: 'Purva Phalguni',
      deity: 'Bhaga',
      symbol: 'Hammock or Swing',
      meaning: 'The Former Red One - Pleasure, enjoyment, creativity',
      characteristics: 'Pleasure-seeking, creative, romantic, artistic',
      rulingPlanet: 'Venus',
      padaMeanings: [
        'Pleasure and enjoyment',
        'Creative expression',
        'Romance and relationships',
        'Artistic pursuits',
      ],
    },
    {
      index: 11,
      name: 'Uttara Phalguni',
      deity: 'Aryaman',
      symbol: 'Fig Tree',
      meaning: 'The Latter Red One - Partnership, marriage, balance',
      characteristics: 'Partnership, marriage, balance, harmony',
      rulingPlanet: 'Sun',
      padaMeanings: [
        'Partnership and marriage',
        'Balance and harmony',
        'Social connections',
        'Mutual support',
      ],
    },
    {
      index: 12,
      name: 'Hasta',
      deity: 'Savitar',
      symbol: 'Hand',
      meaning: 'The Hand - Skill, dexterity, craftsmanship',
      characteristics: 'Skilled, dexterous, crafty, healing hands',
      rulingPlanet: 'Moon',
      padaMeanings: [
        'Skill and dexterity',
        'Craftsmanship',
        'Healing abilities',
        'Practical skills',
      ],
    },
    {
      index: 13,
      name: 'Chitra',
      deity: 'Vishwakarma',
      symbol: 'Pearl or Gem',
      meaning: 'The Bright One - Artistry, beauty, creativity',
      characteristics: 'Artistic, beautiful, creative, well-crafted',
      rulingPlanet: 'Mars',
      padaMeanings: [
        'Artistry and creativity',
        'Beauty and aesthetics',
        'Well-crafted work',
        'Attention to detail',
      ],
    },
    {
      index: 14,
      name: 'Swati',
      deity: 'Vayu',
      symbol: 'Sword or Coral',
      meaning: 'The Independent - Independence, movement, change',
      characteristics: 'Independent, free-spirited, adaptable, changeable',
      rulingPlanet: 'Rahu',
      padaMeanings: [
        'Independence and freedom',
        'Adaptability',
        'Change and movement',
        'Self-reliance',
      ],
    },
    {
      index: 15,
      name: 'Vishakha',
      deity: 'Indra and Agni',
      symbol: 'Archway or Pottery Wheel',
      meaning: 'The Forked - Purpose, determination, achievement',
      characteristics: 'Purposeful, determined, achievement-oriented, competitive',
      rulingPlanet: 'Jupiter',
      padaMeanings: [
        'Purpose and determination',
        'Achievement and success',
        'Competitive spirit',
        'Goal-oriented',
      ],
    },
    {
      index: 16,
      name: 'Anuradha',
      deity: 'Mitra',
      symbol: 'Lotus',
      meaning: 'The Following Radha - Success through cooperation',
      characteristics: 'Cooperative, successful, balanced, harmonious',
      rulingPlanet: 'Saturn',
      padaMeanings: [
        'Cooperation and teamwork',
        'Success through collaboration',
        'Balance and harmony',
        'Mutual support',
      ],
    },
    {
      index: 17,
      name: 'Jyeshtha',
      deity: 'Indra',
      symbol: 'Earring or Umbrella',
      meaning: 'The Elder - Seniority, protection, authority',
      characteristics: 'Senior, protective, authoritative, powerful',
      rulingPlanet: 'Mercury',
      padaMeanings: [
        'Seniority and authority',
        'Protection and care',
        'Power and influence',
        'Leadership',
      ],
    },
    {
      index: 18,
      name: 'Mula',
      deity: 'Nirriti',
      symbol: 'Roots',
      meaning: 'The Root - Destruction, endings, new beginnings',
      characteristics: 'Destructive, transformative, root cause, deep',
      rulingPlanet: 'Ketu',
      padaMeanings: [
        'Destruction and endings',
        'Root cause analysis',
        'Transformation',
        'Deep understanding',
      ],
    },
    {
      index: 19,
      name: 'Purva Ashadha',
      deity: 'Apas',
      symbol: 'Fan or Winnowing Basket',
      meaning: 'The Former Unconquered - Invincibility, victory',
      characteristics: 'Invincible, victorious, determined, successful',
      rulingPlanet: 'Venus',
      padaMeanings: [
        'Invincibility and victory',
        'Determination',
        'Success and achievement',
        'Overcoming obstacles',
      ],
    },
    {
      index: 20,
      name: 'Uttara Ashadha',
      deity: 'Vishvedevas',
      symbol: 'Elephant Tusk',
      meaning: 'The Latter Unconquered - Universal victory, persistence',
      characteristics: 'Universal victory, persistent, patient, enduring',
      rulingPlanet: 'Sun',
      padaMeanings: [
        'Universal victory',
        'Persistence and patience',
        'Endurance',
        'Long-term success',
      ],
    },
    {
      index: 21,
      name: 'Shravana',
      deity: 'Vishnu',
      symbol: 'Ear',
      meaning: 'The Hearing - Learning, knowledge, listening',
      characteristics: 'Learning, knowledge-seeking, listening, wise',
      rulingPlanet: 'Moon',
      padaMeanings: [
        'Learning and knowledge',
        'Listening skills',
        'Wisdom and understanding',
        'Education',
      ],
    },
    {
      index: 22,
      name: 'Dhanishta',
      deity: 'Vasus',
      symbol: 'Drum',
      meaning: 'The Most Famous - Wealth, fame, music',
      characteristics: 'Wealthy, famous, musical, rhythmic',
      rulingPlanet: 'Mars',
      padaMeanings: [
        'Wealth and prosperity',
        'Fame and recognition',
        'Musical abilities',
        'Rhythm and harmony',
      ],
    },
    {
      index: 23,
      name: 'Shatabhisha',
      deity: 'Varuna',
      symbol: 'Hundred Stars or Empty Circle',
      meaning: 'The Hundred Healers - Healing, medicine, mysticism',
      characteristics: 'Healing, mystical, secretive, transformative',
      rulingPlanet: 'Rahu',
      padaMeanings: [
        'Healing and medicine',
        'Mysticism and secrets',
        'Transformation',
        'Hidden knowledge',
      ],
    },
    {
      index: 24,
      name: 'Purva Bhadrapada',
      deity: 'Aja Ekapada',
      symbol: 'Sword or Two-Faced Man',
      meaning: 'The Former Blessed Feet - Spiritual fire, purification',
      characteristics: 'Spiritual, purifying, transformative, intense',
      rulingPlanet: 'Jupiter',
      padaMeanings: [
        'Spiritual fire',
        'Purification',
        'Transformation',
        'Intense spiritual practice',
      ],
    },
    {
      index: 25,
      name: 'Uttara Bhadrapada',
      deity: 'Ahir Budhnya',
      symbol: 'Snake in Water',
      meaning: 'The Latter Blessed Feet - Spiritual growth, completion',
      characteristics: 'Spiritual growth, completion, wisdom, transformation',
      rulingPlanet: 'Saturn',
      padaMeanings: [
        'Spiritual growth',
        'Completion and fulfillment',
        'Wisdom',
        'Final transformation',
      ],
    },
    {
      index: 26,
      name: 'Revati',
      deity: 'Pushan',
      symbol: 'Fish or Drum',
      meaning: 'The Wealthy - Wealth, abundance, protection',
      characteristics: 'Wealthy, abundant, protective, nurturing',
      rulingPlanet: 'Mercury',
      padaMeanings: [
        'Wealth and abundance',
        'Protection and care',
        'Nurturing',
        'Final fulfillment',
      ],
    },
  ];

  /**
   * Get nakshatra details by index (0-26)
   */
  getNakshatraByIndex(index: number): NakshatraDetails | null {
    if (index < 0 || index > 26) {
      return null;
    }
    return NakshatraService.NAKSHATRAS[index];
  }

  /**
   * Get nakshatra details by name
   */
  getNakshatraByName(name: string): NakshatraDetails | null {
    const nakshatra = NakshatraService.NAKSHATRAS.find(
      (n: NakshatraDetails) => n.name.toLowerCase() === name.toLowerCase()
    );
    return nakshatra || null;
  }

  /**
   * Calculate nakshatra from longitude (0-360 degrees)
   */
  calculateNakshatra(longitude: number): {
    index: number;
    pada: number;
  } {
    // Each nakshatra is 13.333... degrees (360/27)
    const nakshatraSize = 360 / 27;
    const index = Math.floor(longitude / nakshatraSize) % 27;
    const positionInNakshatra = longitude % nakshatraSize;
    const pada = Math.floor(positionInNakshatra / (nakshatraSize / 4)) + 1;

    return {
      index,
      pada: Math.min(pada, 4), // Ensure pada is 1-4
    };
  }

  /**
   * Get all nakshatras
   */
  getAllNakshatras(): NakshatraDetails[] {
    return NakshatraService.NAKSHATRAS;
  }
}



