import { Router } from 'express';
import { AstrologyController } from '@controllers/astrology.controller';
import { SavedAstrologyController } from '@controllers/saved-astrology.controller';
import { authenticate } from '@middleware/auth.middleware';
import { validate } from '@middleware/validation.middleware';
import { astrologyAnalyzeSchema } from '@validators/astrology.validator';
import {
  savedAstrologyCreateSchema,
  savedAstrologyIdParamSchema,
  savedAstrologyListSchema,
} from '@validators/saved-astrology.validator';
import { VedikaController } from '@controllers/vedika.controller';
import { vedikaQuerySchema } from '@validators/vedika.validator';

// Kundali module (JS) - loaded from src/astrology/controllers (copied at build to dist/astrology)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const KundaliController = require('../astrology/controllers/KundaliController');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EnhancedKundaliController = require('../astrology/controllers/EnhancedKundaliController');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const BarshafalController = require('../astrology/controllers/BarshafalController');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const GocharController = require('../astrology/controllers/GocharController');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MilanController = require('../astrology/controllers/MilanController');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const LocationController = require('../astrology/controllers/LocationController');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const VedicAstrologyController = require('../astrology/controllers/VedicAstrologyController');

const router = Router();
const astrologyController = new AstrologyController();
const kundaliController = new KundaliController();
const enhancedKundaliController = new EnhancedKundaliController();
const barshafalController = new BarshafalController();
const gocharController = new GocharController();
const milanController = new MilanController();
const locationController = new LocationController();
const savedAstrologyController = new SavedAstrologyController();
const vedikaController = new VedikaController();

/**
 * Existing: POST /api/v1/astrology/analyze
 */
router.post(
  '/analyze',
  validate(astrologyAnalyzeSchema),
  astrologyController.analyzeChart
);

/**
 * Kundali: POST /api/v1/astrology/kundali
 */
router.post('/kundali', (req, res) => kundaliController.calculateKundali(req, res));

/**
 * Enhanced Kundali: POST /api/v1/astrology/enhanced-kundali
 */
router.post('/enhanced-kundali', (req, res) =>
  enhancedKundaliController.calculateCompleteKundali(req, res)
);
router.post('/enhanced-kundali/divisional/:chartType', (req, res) =>
  enhancedKundaliController.getDivisionalChart(req, res)
);
router.post('/enhanced-kundali/dasha/:dashaType', (req, res) =>
  enhancedKundaliController.getDasha(req, res)
);
router.post('/enhanced-kundali/jaatak-details', (req, res) =>
  enhancedKundaliController.getJaatakDetails(req, res)
);
router.post('/enhanced-kundali/graha-sthiti-analysis', (req, res) =>
  enhancedKundaliController.getGrahaSthitiAnalysis(req, res)
);
router.post('/enhanced-kundali/categorized-recommendations', (req, res) =>
  enhancedKundaliController.getCategorizedRecommendations(req, res)
);
router.post('/enhanced-kundali/gem-rudraksha-recommendations', (req, res) =>
  enhancedKundaliController.getGemRudrakshaRecommendations(req, res)
);
router.post('/enhanced-kundali/predictions', (req, res) =>
  enhancedKundaliController.getPredictions(req, res)
);

/**
 * Barshafal: POST /api/v1/astrology/barshafal
 */
router.post('/barshafal', (req, res) => barshafalController.calculateBarshafal(req, res));

/**
 * Gochar: POST /api/v1/astrology/gochar
 */
router.post('/gochar', (req, res) => gocharController.calculateGochar(req, res));

/**
 * Milan: POST /api/v1/astrology/milan
 */
router.post('/milan', (req, res) => milanController.calculateMilan(req, res));

/**
 * Saved kundali / milan (auth): POST/GET/DELETE /api/v1/astrology/saved
 */
router.post(
  '/saved',
  authenticate,
  validate(savedAstrologyCreateSchema),
  savedAstrologyController.create
);
router.get(
  '/saved',
  authenticate,
  validate(savedAstrologyListSchema),
  savedAstrologyController.list
);
router.get(
  '/saved/:id',
  authenticate,
  validate(savedAstrologyIdParamSchema),
  savedAstrologyController.getOne
);
router.delete(
  '/saved/:id',
  authenticate,
  validate(savedAstrologyIdParamSchema),
  savedAstrologyController.remove
);

/**
 * Vedika AI (auth): one question per calendar day (Asia/Kathmandu)
 */
router.get('/vedika/status', authenticate, vedikaController.status);
router.post(
  '/vedika/query',
  authenticate,
  validate(vedikaQuerySchema),
  vedikaController.query
);

/**
 * Locations (ThauHaru): GET /api/v1/astrology/locations/countries, /cities
 */
router.get('/locations/countries', (req, res) => locationController.getCountries(req, res));
router.get('/locations/cities', (req, res) => locationController.getCities(req, res));

/**
 * Vedic Astro: POST /api/v1/astrology/vedic-astro/chart, /recommendations, /predictions/:area
 */
router.post('/vedic-astro/chart', (req, res) =>
  VedicAstrologyController.calculateChart(req, res)
);
router.post('/vedic-astro/recommendations', (req, res) =>
  VedicAstrologyController.getRecommendations(req, res)
);
router.post('/vedic-astro/predictions/:area', (req, res) =>
  VedicAstrologyController.getPredictions(req, res)
);

export default router;