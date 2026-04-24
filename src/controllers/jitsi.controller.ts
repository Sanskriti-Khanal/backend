import { Response, NextFunction } from 'express';
import { AuthRequest } from '@middleware/auth.middleware';
import { UnauthorizedError } from '@errors/AppError';
import { sendSuccess } from '@utils/response.util';
import { JitsiService } from '@services/jitsi.service';

export class JitsiController {
  private jitsiService: JitsiService;

  constructor() {
    this.jitsiService = new JitsiService();
  }

  createToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const result = this.jitsiService.generateMeetingToken({
        room: req.body.room,
        displayName: req.body.displayName,
        moderator: req.body.moderator,
        userId: req.user.id,
        role: req.user.role,
        phone: req.user.phone,
      });

      sendSuccess(res, result, 'Jitsi token generated');
    } catch (error) {
      next(error);
    }
  };
}
