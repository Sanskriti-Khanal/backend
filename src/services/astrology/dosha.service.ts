import type { Dosha, PlanetPosition } from '../../types/astrology.types';

/**
 * Dosha Service
 * Analyzes various Doshas (afflictions) in a chart
 */
export class DoshaService {
  /**
   * Analyze all doshas in a chart
   */
  analyzeDoshas(planets: PlanetPosition[]): Dosha[] {
    const doshas: Dosha[] = [];

    // Convert planets array to map for easier access
    const planetMap = new Map<string, PlanetPosition>();
    planets.forEach((p) => {
      planetMap.set(p.name.toLowerCase(), p);
    });

    // Detect various doshas
    doshas.push(...this.analyzeMangalDosha(planetMap));
    doshas.push(...this.analyzeKaalSarpDosha(planetMap));
    doshas.push(...this.analyzeNadiDosha(planetMap));

    return doshas;
  }

  /**
   * Mangal Dosha: Mars in 1st, 4th, 7th, 8th, or 12th house
   */
  private analyzeMangalDosha(
    planetMap: Map<string, PlanetPosition>
  ): Dosha[] {
    const doshas: Dosha[] = [];
    const mars = planetMap.get('mars');

    if (mars) {
      const mangalDoshaHouses = [1, 4, 7, 8, 12];
      if (mangalDoshaHouses.includes(mars.house)) {
        const severity =
          mars.house === 1 || mars.house === 7
            ? 'high'
            : mars.house === 4 || mars.house === 8
            ? 'medium'
            : 'low';

        doshas.push({
          name: 'Mangal Dosha',
          severity: severity as 'low' | 'medium' | 'high',
          meaning:
            'Mars placement causing potential marital and relationship issues',
          description:
            'Mars in 1st, 4th, 7th, 8th, or 12th house creates Mangal Dosha (Kuja Dosha), which may cause delays in marriage, marital discord, or health issues related to Mars.',
          affectedPlanets: ['Mars'],
          affectedHouses: [mars.house],
          remedies: [
            'Wear Red Coral (Moonga) gemstone',
            'Perform Mangal Dosha puja',
            'Chant Mars mantras',
            'Donate red items on Tuesdays',
            'Marry someone with matching Mangal Dosha',
          ],
        });
      }
    }

    return doshas;
  }

  /**
   * Kaal Sarp Dosha: All planets between Rahu and Ketu
   */
  private analyzeKaalSarpDosha(
    planetMap: Map<string, PlanetPosition>
  ): Dosha[] {
    const doshas: Dosha[] = [];
    const rahu = planetMap.get('rahu');
    const ketu = planetMap.get('ketu');

    if (rahu && ketu) {
      const rahuLongitude = rahu.longitude;
      const ketuLongitude = ketu.longitude;

      // Check if all planets are between Rahu and Ketu
      const planetsBetween: string[] = [];
      let allPlanetsBetween = true;

      planetMap.forEach((planet, name) => {
        if (name !== 'rahu' && name !== 'ketu') {
          const planetLongitude = planet.longitude;
          const isBetween = this.isBetween(
            planetLongitude,
            rahuLongitude,
            ketuLongitude
          );

          if (isBetween) {
            planetsBetween.push(planet.name);
          } else {
            allPlanetsBetween = false;
          }
        }
      });

      if (allPlanetsBetween && planetsBetween.length >= 5) {
        const severity =
          planetsBetween.length >= 7 ? 'high' : planetsBetween.length >= 5 ? 'medium' : 'low';

        doshas.push({
          name: 'Kaal Sarp Dosha',
          severity: severity as 'low' | 'medium' | 'high',
          meaning:
            'All planets between Rahu and Ketu causing obstacles and delays',
          description:
            'When all planets are positioned between Rahu and Ketu, it creates Kaal Sarp Dosha, causing obstacles, delays, and challenges in life. The severity depends on how many planets are affected.',
          affectedPlanets: ['Rahu', 'Ketu', ...planetsBetween],
          remedies: [
            'Perform Kaal Sarp Dosha puja',
            'Wear Gomed (Hessonite) gemstone',
            'Chant Rahu-Ketu mantras',
            'Donate black items on Saturdays',
            'Worship Lord Shiva',
          ],
        });
      }
    }

    return doshas;
  }

  /**
   * Nadi Dosha: Compatibility issue (for matching charts)
   * This is a simplified version - full Nadi matching requires two charts
   */
  private analyzeNadiDosha(
    planetMap: Map<string, PlanetPosition>
  ): Dosha[] {
    const doshas: Dosha[] = [];
    const moon = planetMap.get('moon');

    if (moon) {
      // Nadi is determined by nakshatra pada
      // This is a simplified check - full analysis requires partner's chart
      const nakshatraPada = moon.nakshatraPada;

      // If Moon is in certain padas, it may indicate potential Nadi issues
      // This is informational only - actual Nadi matching requires partner chart
      if (nakshatraPada === 1 || nakshatraPada === 3) {
        doshas.push({
          name: 'Potential Nadi Dosha',
          severity: 'low',
          meaning:
            'Nakshatra pada may indicate compatibility considerations',
          description:
            'Nadi Dosha is determined by comparing nakshatra padas of both partners. Same pada in both charts creates Nadi Dosha. This is an informational note - full analysis requires partner chart.',
          affectedPlanets: ['Moon'],
          remedies: [
            'Check Nadi matching with partner before marriage',
            'Perform Nadi Dosha remedies if confirmed',
            'Consult with astrologer for detailed analysis',
          ],
        });
      }
    }

    return doshas;
  }

  /**
   * Check if a longitude is between two other longitudes (handling 0-360 wrap)
   */
  private isBetween(
    value: number,
    start: number,
    end: number
  ): boolean {
    // Normalize to 0-360
    const normalize = (angle: number) => ((angle % 360) + 360) % 360;
    const v = normalize(value);
    const s = normalize(start);
    const e = normalize(end);

    if (s < e) {
      return v >= s && v <= e;
    } else {
      // Wrap around case
      return v >= s || v <= e;
    }
  }
}



