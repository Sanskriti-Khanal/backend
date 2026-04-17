import { Response, NextFunction } from 'express';
import { AuthRequest } from '@middleware/auth.middleware';
import { SavedAstrologyService } from '@services/saved-astrology.service';
import { sendSuccess } from '@utils/response.util';
import { SavedAstrologyKind } from '@models/SavedAstrology.model';

export class SavedAstrologyController {
  private service: SavedAstrologyService;

  constructor() {
    this.service = new SavedAstrologyService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { kind, title, requestPayload, resultSnapshot } = req.body as {
        kind: SavedAstrologyKind;
        title?: string;
        requestPayload: Record<string, unknown>;
        resultSnapshot: Record<string, unknown>;
      };
      const created = await this.service.create(req.user!.id, {
        kind,
        title,
        requestPayload,
        resultSnapshot,
      });
      sendSuccess(res, created, 'Saved successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const kind = req.query.kind as SavedAstrologyKind | undefined;
      const rows = await this.service.list(req.user!.id, kind);
      sendSuccess(res, rows);
    } catch (error) {
      next(error);
    }
  };

  getOne = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const row = await this.service.getById(req.user!.id, req.params.id);
      sendSuccess(res, row);
    } catch (error) {
      next(error);
    }
  };

  remove = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.delete(req.user!.id, req.params.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}
