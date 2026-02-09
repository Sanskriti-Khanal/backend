import type { DashaPeriod, CurrentDasha } from '../../types/astrology.types';

/**
 * Dasha Service
 * Calculates Vimshottari Dasha periods
 * Vimshottari Dasha: 120 years total, based on Moon's nakshatra at birth
 */
export class DashaService {
  // Vimshottari Dasha sequence and years
  private static readonly DASHA_SEQUENCE = [
    { lord: 'Ketu', years: 7 },
    { lord: 'Venus', years: 20 },
    { lord: 'Sun', years: 6 },
    { lord: 'Moon', years: 10 },
    { lord: 'Mars', years: 7 },
    { lord: 'Rahu', years: 18 },
    { lord: 'Jupiter', years: 16 },
    { lord: 'Saturn', years: 19 },
    { lord: 'Mercury', years: 17 },
  ];

  // Starting nakshatra for each dasha lord
  private static readonly DASHA_START_NAKSHATRA: Record<string, number> = {
    Ketu: 0, // Ashwini
    Venus: 1, // Bharani
    Sun: 2, // Krittika
    Moon: 3, // Rohini
    Mars: 4, // Mrigashira
    Rahu: 5, // Ardra
    Jupiter: 6, // Punarvasu
    Saturn: 7, // Pushya
    Mercury: 8, // Ashlesha
  };

  // Dasha meanings
  private static readonly DASHA_MEANINGS: Record<string, string> = {
    Ketu: 'Ketu Mahadasha brings spiritual growth, detachment, and transformation. It may cause confusion but leads to enlightenment.',
    Venus: 'Venus Mahadasha brings material comforts, relationships, arts, and luxury. It is favorable for love, marriage, and wealth.',
    Sun: 'Sun Mahadasha brings authority, leadership, recognition, and fame. It enhances self-confidence and government connections.',
    Moon: 'Moon Mahadasha brings emotional growth, popularity, travel, and maternal influences. It is favorable for mental peace.',
    Mars: 'Mars Mahadasha brings energy, courage, conflicts, and achievements. It may cause disputes but leads to victory.',
    Rahu: 'Rahu Mahadasha brings material desires, foreign connections, and sudden changes. It may cause confusion but brings opportunities.',
    Jupiter: 'Jupiter Mahadasha brings wisdom, spirituality, knowledge, and prosperity. It is highly favorable for growth and expansion.',
    Saturn: 'Saturn Mahadasha brings discipline, hard work, delays, and maturity. It teaches patience and brings long-term gains.',
    Mercury: 'Mercury Mahadasha brings intelligence, communication, business, and learning. It is favorable for education and trade.',
  };

  /**
   * Calculate Vimshottari Dasha periods
   * @param moonNakshatraIndex Moon's nakshatra index (0-26)
   * @param birthDate Birth date
   * @returns Current dasha periods
   */
  calculateVimshottariDasha(
    moonNakshatraIndex: number,
    birthDate: Date
  ): CurrentDasha {
    // Find which dasha lord rules the birth nakshatra
    const dashaLord = this.getDashaLordForNakshatra(moonNakshatraIndex);
    const dashaStartIndex = DashaService.DASHA_START_NAKSHATRA[dashaLord];

    // Calculate how many nakshatras into the dasha period
    const nakshatrasIntoDasha = moonNakshatraIndex - dashaStartIndex;
    if (nakshatrasIntoDasha < 0) {
      // Handle wrap-around
      const adjustedNakshatras = 27 + nakshatrasIntoDasha;
      return this.calculateDashaPeriods(dashaLord, adjustedNakshatras, birthDate);
    }

    return this.calculateDashaPeriods(dashaLord, nakshatrasIntoDasha, birthDate);
  }

  /**
   * Get dasha lord for a given nakshatra
   */
  private getDashaLordForNakshatra(nakshatraIndex: number): string {
    // Each dasha lord rules 3 nakshatras
    const lords = [
      'Ketu', // 0-2
      'Venus', // 3-5
      'Sun', // 6-8
      'Moon', // 9-11
      'Mars', // 12-14
      'Rahu', // 15-17
      'Jupiter', // 18-20
      'Saturn', // 21-23
      'Mercury', // 24-26
    ];

    return lords[Math.floor(nakshatraIndex / 3)];
  }

  /**
   * Calculate dasha periods from a starting point
   */
  private calculateDashaPeriods(
    startLord: string,
    nakshatrasIntoDasha: number,
    birthDate: Date
  ): CurrentDasha {
    // Find starting index in sequence
    const startIndex = DashaService.DASHA_SEQUENCE.findIndex(
      (d: { lord: string; years: number }) => d.lord === startLord
    );

    // Calculate elapsed time in current mahadasha
    // Each nakshatra = 13.333 degrees, each pada = 3.333 degrees
    // For simplicity, we'll use proportional calculation
    const totalNakshatras = 3; // Each lord rules 3 nakshatras
    const elapsedRatio = nakshatrasIntoDasha / totalNakshatras;
    const mahadashaYears = DashaService.DASHA_SEQUENCE[startIndex].years;
    const elapsedYears = mahadashaYears * elapsedRatio;

    // Calculate mahadasha start and end
    const mahadashaStart = new Date(birthDate);
    mahadashaStart.setFullYear(
      mahadashaStart.getFullYear() - elapsedYears
    );
    const mahadashaEnd = new Date(mahadashaStart);
    mahadashaEnd.setFullYear(
      mahadashaEnd.getFullYear() + mahadashaYears
    );

    // Calculate current antardasha
    const currentDate = new Date();
    const timeSinceMahadashaStart =
      (currentDate.getTime() - mahadashaStart.getTime()) /
      (1000 * 60 * 60 * 24 * 365.25);
    const antardashaRatio = timeSinceMahadashaStart / mahadashaYears;

    // Find which antardasha we're in
    let cumulativeRatio = 0;
    let antardashaLord = startLord;
    let antardashaIndex = startIndex;

    for (let i = 0; i < 9; i++) {
      const currentIndex = (startIndex + i) % 9;
      const antardashaYears =
        (DashaService.DASHA_SEQUENCE[currentIndex].years / 120) * mahadashaYears;
      const antardashaRatio = antardashaYears / mahadashaYears;

      if (cumulativeRatio + antardashaRatio >= antardashaRatio) {
        antardashaLord = DashaService.DASHA_SEQUENCE[currentIndex].lord;
        antardashaIndex = currentIndex;
        break;
      }
      cumulativeRatio += antardashaRatio;
    }

    // Calculate antardasha period
    const antardashaStartRatio = cumulativeRatio;
    const antardashaYears =
      (DashaService.DASHA_SEQUENCE[antardashaIndex].years / 120) * mahadashaYears;
    const antardashaStart = new Date(mahadashaStart);
    antardashaStart.setFullYear(
      antardashaStart.getFullYear() + mahadashaYears * antardashaStartRatio
    );
    const antardashaEnd = new Date(antardashaStart);
    antardashaEnd.setFullYear(
      antardashaEnd.getFullYear() + antardashaYears
    );

    return {
      mahadasha: {
        lord: startLord,
        startDate: mahadashaStart.toISOString(),
        endDate: mahadashaEnd.toISOString(),
        duration: `${mahadashaYears} years`,
        durationYears: mahadashaYears,
        meaning: DashaService.DASHA_MEANINGS[startLord] || '',
        isCurrent: true,
      },
      antardasha: {
        lord: antardashaLord,
        startDate: antardashaStart.toISOString(),
        endDate: antardashaEnd.toISOString(),
        duration: `${antardashaYears.toFixed(2)} years`,
        durationYears: antardashaYears,
        meaning: this.getAntardashaMeaning(startLord, antardashaLord),
        isCurrent: true,
      },
    };
  }

  /**
   * Get antardasha meaning
   */
  private getAntardashaMeaning(
    mahadashaLord: string,
    antardashaLord: string
  ): string {
    const mahadashaMeaning = DashaService.DASHA_MEANINGS[mahadashaLord] || '';
    const antardashaMeaning = DashaService.DASHA_MEANINGS[antardashaLord] || '';

    return `${antardashaLord} Antardasha in ${mahadashaLord} Mahadasha: ${antardashaMeaning} The effects are modified by the mahadasha lord.`;
  }

  /**
   * Get dasha meaning for a planet
   */
  getDashaLordMeaning(lord: string): string {
    return DashaService.DASHA_MEANINGS[lord] || '';
  }
}



