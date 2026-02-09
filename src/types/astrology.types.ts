// Astrology Types and Interfaces

export interface BirthDetails {
  date: string; // ISO date string
  time: string; // HH:mm format
  latitude: number;
  longitude: number;
  timezone: string; // e.g., "Asia/Kathmandu"
  place?: string; // Optional place name
}

export interface PlanetPosition {
  name: string;
  longitude: number;
  latitude: number;
  sign: number; // 0-11 (Aries to Pisces)
  signName: string;
  house: number; // 1-12
  degree: number; // 0-30 within sign
  nakshatra: number; // 0-26
  nakshatraName: string;
  nakshatraPada: number; // 1-4
  isRetrograde: boolean;
  dignity: PlanetaryDignity;
  isCombust: boolean;
}

export enum PlanetaryDignity {
  EXALTED = 'exalted',
  DEBILITATED = 'debilitated',
  OWN_SIGN = 'own_sign',
  MOOLA_TRIKONA = 'moola_trikona',
  FRIEND_SIGN = 'friend_sign',
  NEUTRAL_SIGN = 'neutral_sign',
  ENEMY_SIGN = 'enemy_sign',
}

export interface NakshatraDetails {
  index: number;
  name: string;
  deity: string;
  symbol: string;
  meaning: string;
  characteristics: string;
  rulingPlanet: string;
  padaMeanings: string[];
}

export interface DashaPeriod {
  lord: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  duration: string; // e.g., "16 years"
  durationYears: number;
  meaning: string;
  isCurrent: boolean;
}

export interface CurrentDasha {
  mahadasha: DashaPeriod;
  antardasha: DashaPeriod;
  pratyantardasha?: DashaPeriod;
}

export interface Yoga {
  name: string;
  type: 'benefic' | 'malefic' | 'neutral';
  meaning: string;
  description: string;
  planets: string[];
  houses?: number[];
  significance: string;
}

export interface Dosha {
  name: string;
  severity: 'low' | 'medium' | 'high';
  meaning: string;
  description: string;
  affectedPlanets?: string[];
  affectedHouses?: number[];
  remedies: string[];
}

export interface Recommendation {
  type: 'rudraksha' | 'gemstone' | 'remedy';
  name: string;
  reason: string;
  benefits: string[];
  category: RecommendationCategory;
  planet?: string;
  instructions?: string;
}

export type RecommendationCategory =
  | 'overall'
  | 'wealth'
  | 'health'
  | 'mental_wellbeing'
  | 'relationship'
  | 'career'
  | 'spiritual'
  | 'study';

// Rule-related types
export type RuleType = 'planet_based' | 'dosha_based' | 'yoga_based' | 'house_based' | 'combination' | 'nakshatra_based' | 'mahadasha_based';

export interface RuleCondition {
  planets?: Array<{
    name: string;
    dignity?: PlanetaryDignity[];
    house?: number[];
    isCombust?: boolean;
    isRetrograde?: boolean;
    sign?: number[];
  }>;
  doshas?: Array<{
    name: string;
    severity?: ('low' | 'medium' | 'high')[];
  }>;
  yogas?: Array<{
    name: string;
    type?: ('benefic' | 'malefic' | 'neutral')[];
  }>;
  houses?: number[];
  nakshatras?: string[];
  mahadasha?: string[];
  logic?: 'AND' | 'OR'; // Logic operator for condition groups
}

export interface RuleRecommendation {
  rudraksha?: Array<{
    mukhiCount: number;
    priority: number;
    reason: string;
    benefits?: string[];
    instructions?: string;
  }>;
  gemstones?: Array<{
    name: string;
    priority: number;
    reason: string;
    benefits?: string[];
    instructions?: string;
  }>;
  combinations?: Array<{
    items: Array<{
      type: 'rudraksha' | 'gemstone';
      mukhiCount?: number;
      name?: string;
    }>;
    priority: number;
    reason: string;
    benefits?: string[];
    instructions?: string;
  }>;
}

export interface AstrologyAnalysisRequest {
  birthDetails: BirthDetails;
  category: RecommendationCategory;
}

export interface AstrologyAnalysisResponse {
  nakshatra: NakshatraDetails;
  planets: {
    all: PlanetPosition[];
    exalted: PlanetPosition[];
    debilitated: PlanetPosition[];
    combust: PlanetPosition[];
    retrograde: PlanetPosition[];
    meanings: Record<string, string>;
  };
  dasha: CurrentDasha;
  yogas: Yoga[];
  doshas: Dosha[];
  recommendations: Recommendation[];
  chart: {
    ascendant: number;
    ascendantSign: string;
    houses: number[]; // House cusps
  };
}



