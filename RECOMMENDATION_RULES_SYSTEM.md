# Recommendation Rules System Documentation

## Overview

The Recommendation Rules System is a database-driven, flexible architecture for generating astrology-based recommendations for Rudraksha and Gemstones. It replaces hardcoded logic with a dynamic rule evaluation engine.

## Architecture

### Components

1. **RecommendationRule Model** (`src/models/RecommendationRule.model.ts`)
   - Stores rules in MongoDB
   - Supports flexible JSON conditions and recommendations
   - Indexed for efficient querying

2. **Rule Evaluation Service** (`src/services/astrology/rule-evaluation.service.ts`)
   - Evaluates rule conditions against chart data
   - Supports complex condition matching (planets, doshas, yogas, houses, nakshatras, mahadasha)
   - Handles AND/OR logic operators

3. **Recommendation Service** (`src/services/astrology/recommendation.service.ts`)
   - Main service for getting recommendations
   - Uses rule engine with fallback to hardcoded logic
   - Fetches RudrakshaCategory and GemCategory details

## Database Schema

### RecommendationRule Collection

```typescript
{
  ruleType: 'planet_based' | 'dosha_based' | 'yoga_based' | 'house_based' | 'combination' | 'nakshatra_based' | 'mahadasha_based',
  category: 'overall' | 'wealth' | 'health' | 'mental_wellbeing' | 'relationship' | 'career' | 'spiritual' | 'study',
  conditions: {
    planets?: [{
      name: string,
      dignity?: PlanetaryDignity[],
      house?: number[],
      isCombust?: boolean,
      isRetrograde?: boolean,
      sign?: number[]
    }],
    doshas?: [{
      name: string,
      severity?: ('low' | 'medium' | 'high')[]
    }],
    yogas?: [{
      name: string,
      type?: ('benefic' | 'malefic' | 'neutral')[]
    }],
    houses?: number[],
    nakshatras?: string[],
    mahadasha?: string[],
    logic?: 'AND' | 'OR'
  },
  recommendations: {
    rudraksha?: [{
      mukhiCount: number,
      priority: number,
      reason: string,
      benefits?: string[],
      instructions?: string
    }],
    gemstones?: [{
      name: string,
      priority: number,
      reason: string,
      benefits?: string[],
      instructions?: string
    }],
    combinations?: [{
      items: [{ type: 'rudraksha' | 'gemstone', mukhiCount?: number, name?: string }],
      priority: number,
      reason: string,
      benefits?: string[],
      instructions?: string
    }]
  },
  priority: number, // 1-100
  isActive: boolean,
  description?: string
}
```

## Usage

### Getting Recommendations

```typescript
import { RecommendationService } from './services/astrology/recommendation.service';

const recommendationService = new RecommendationService();

const recommendations = await recommendationService.getRecommendations(
  planets,        // PlanetPosition[]
  doshas,        // Dosha[]
  yogas,         // Yoga[]
  category,      // RecommendationCategory
  dasha,         // CurrentDasha (optional but recommended)
  nakshatraName  // string (optional)
);
```

### Example: Career Recommendations

The system will:
1. Query all active rules for 'career' category
2. Evaluate each rule's conditions against the chart
3. For matched rules, generate recommendations
4. Return sorted recommendations

## Seeding Initial Rules

Run the seed script to populate initial rules:

```bash
# Set MongoDB URI
export MONGODB_URI="mongodb://localhost:27017/merosathi"

# Run seed script
npx ts-node scripts/seed-recommendation-rules.ts
```

The seed script includes rules for:
- Career (Jupiter, Sun, Mercury)
- Wealth (Jupiter, Venus)
- Health (Sun, Moon)
- Relationship (Mangal Dosha, Venus)
- Spiritual (Jupiter, Ketu)
- Mental Wellbeing (Moon)
- Overall (Sun, Kaal Sarp Dosha)

## Creating New Rules

### Example: Add a new rule for Study category

```typescript
await RecommendationRuleModel.create({
  ruleType: 'planet_based',
  category: 'study',
  conditions: {
    planets: [{
      name: 'Mercury',
      dignity: ['debilitated', 'enemy_sign'],
      house: [6, 8, 12]
    }],
    logic: 'AND'
  },
  recommendations: {
    gemstones: [{
      name: 'Emerald',
      priority: 90,
      reason: 'Mercury rules intelligence and learning',
      benefits: ['Better memory', 'Improved concentration', 'Academic success'],
      instructions: 'Wear Emerald in little finger on Wednesday.'
    }],
    rudraksha: [{
      mukhiCount: 4,
      priority: 85,
      reason: '4 Mukhi Rudraksha enhances learning',
      benefits: ['Intelligence', 'Memory', 'Focus'],
      instructions: 'Wear 4 Mukhi Rudraksha while studying.'
    }]
  },
  priority: 90,
  isActive: true,
  description: 'Mercury weak - Study and learning strengthening'
});
```

## Rule Evaluation Logic

### Condition Matching

- **Planet Conditions**: Checks name, dignity, house, combust status, retrograde status, sign
- **Dosha Conditions**: Checks name and severity level
- **Yoga Conditions**: Checks name and type (benefic/malefic/neutral)
- **House Conditions**: Checks if any planet is in specified houses
- **Nakshatra Conditions**: Checks if Moon's nakshatra matches
- **Mahadasha Conditions**: Checks if current mahadasha lord matches

### Logic Operators

- **AND**: All condition groups must match
- **OR**: At least one condition group must match

### Example Rule Evaluation

```typescript
// Rule condition
{
  planets: [{
    name: 'Jupiter',
    dignity: ['debilitated'],
    house: [6, 8, 12]
  }],
  logic: 'AND'
}

// Chart data
planets: [{
  name: 'Jupiter',
  dignity: 'debilitated',
  house: 8
}]

// Result: MATCH ✓ (Jupiter is debilitated AND in house 8)
```

## Performance Considerations

### Indexes

The following indexes are created automatically:
- `{ category: 1, isActive: 1, priority: -1 }` - For category queries
- `{ ruleType: 1, isActive: 1 }` - For rule type queries
- `{ isActive: 1, priority: -1 }` - For general queries

### Caching (Future Enhancement)

For high-traffic scenarios, consider caching:
- Frequently matched rules
- Rule evaluation results
- Category-specific rule sets

## Fallback Behavior

If no rules match or database query fails, the system falls back to hardcoded logic in `getHardcodedRecommendations()`. This ensures the system always returns recommendations.

## Best Practices

1. **Rule Priority**: Use priority 1-100, higher = more important
2. **Rule Descriptions**: Always add descriptions for easier management
3. **Testing**: Test rules with various chart configurations
4. **Versioning**: Consider adding version field for rule updates
5. **Deactivation**: Set `isActive: false` instead of deleting rules

## Admin Interface (Future)

Consider building an admin interface for:
- Creating/editing rules
- Testing rules against sample charts
- Viewing rule match statistics
- A/B testing different rule sets

## Troubleshooting

### No recommendations returned

1. Check if rules exist: `db.recommendationrules.find({ category: 'career', isActive: true })`
2. Verify rule conditions match chart data
3. Check rule evaluation logs
4. Verify RudrakshaCategory and GemCategory exist in database

### Rules not matching

1. Verify condition logic (AND vs OR)
2. Check planet name casing (should match exactly)
3. Verify dignity values match enum values
4. Check house numbers (1-12, not 0-11)

## Migration from Hardcoded Logic

The system maintains backward compatibility. Existing code will continue to work, but will use rule engine when available. To fully migrate:

1. Seed initial rules using seed script
2. Test recommendations match expected results
3. Gradually disable hardcoded fallback
4. Monitor rule performance and adjust priorities
