import { Response, NextFunction } from 'express';
import { AuthRequest } from '@middleware/auth.middleware';
import { UserRepository } from '@repositories/user.repository';
import { queryVedika, VedikaBirthDetails } from '@services/vedika.service';
import { sendSuccess } from '@utils/response.util';
import { NotFoundError, TooManyRequestsError } from '@errors/AppError';

function kathmanduDateKey(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kathmandu' });
}

function hasUsedDailyQuota(last?: Date | null): boolean {
  if (!last) return false;
  return kathmanduDateKey(last) === kathmanduDateKey(new Date());
}

export class VedikaController {
  private users: UserRepository;

  constructor() {
    this.users = new UserRepository();
  }

  status = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.users.findById(req.user!.id);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      const used = hasUsedDailyQuota(user.vedikaLastQueryAt);
      sendSuccess(res, {
        canAsk: !used,
        usedToday: used,
      });
    } catch (e) {
      next(e);
    }
  };

  query = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.users.findById(req.user!.id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (hasUsedDailyQuota(user.vedikaLastQueryAt)) {
        throw new TooManyRequestsError(
          'You have already used your question for today. Try again tomorrow (Nepal time).'
        );
      }

      const { question, birthDetails } = req.body as {
        question: string;
        birthDetails: VedikaBirthDetails;
      };

      const result = await queryVedika(question, birthDetails);

      await this.users.update(req.user!.id, { vedikaLastQueryAt: new Date() });

      sendSuccess(res, { result });
    } catch (e) {
      next(e);
    }
  };
}
