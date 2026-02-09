import { Request, Response, NextFunction } from 'express';
import { AstrologyService } from '@services/astrology/astrology.service';
import { sendSuccess, sendError } from '@utils/response.util';
import { BadRequestError } from '@errors/AppError';

export class AstrologyController {
  private astrologyService: AstrologyService;

  constructor() {
    this.astrologyService = new AstrologyService();
  }

  /**
   * Analyze astrology chart
   * POST /api/v1/astrology/analyze
   */
  analyzeChart = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const {
        birthDetails,
        category = 'overall',
      } = req.body;

      // Validate birth details
      if (!birthDetails) {
        throw new BadRequestError('Birth details are required');
      }

      if (!birthDetails.date || !birthDetails.time) {
        throw new BadRequestError('Birth date and time are required');
      }

      if (
        birthDetails.latitude === undefined ||
        birthDetails.longitude === undefined
      ) {
        throw new BadRequestError('Birth location (latitude, longitude) is required');
      }

      // Validate category
      const validCategories = [
        'overall',
        'wealth',
        'health',
        'mental_wellbeing',
        'relationship',
        'career',
        'spiritual',
      ];
      if (!validCategories.includes(category)) {
        throw new BadRequestError(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
      }

      // Perform analysis
      const analysis = await this.astrologyService.analyzeChart({
        birthDetails: {
          date: birthDetails.date,
          time: birthDetails.time,
          latitude: birthDetails.latitude,
          longitude: birthDetails.longitude,
          timezone: birthDetails.timezone || 'Asia/Kathmandu',
          place: birthDetails.place,
        },
        category: category as any,
      });

      sendSuccess(res, analysis, 'Astrology analysis completed successfully');
    } catch (error) {
      next(error);
    }
  };
}


