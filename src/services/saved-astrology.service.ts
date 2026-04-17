import { SavedAstrologyRepository } from '@repositories/saved-astrology.repository';
import { NotFoundError } from '@errors/AppError';
import { SavedAstrologyKind } from '@models/SavedAstrology.model';

export class SavedAstrologyService {
  private repository: SavedAstrologyRepository;

  constructor() {
    this.repository = new SavedAstrologyRepository();
  }

  async create(
    userId: string,
    body: {
      kind: SavedAstrologyKind;
      title?: string;
      requestPayload: Record<string, unknown>;
      resultSnapshot: Record<string, unknown>;
    }
  ) {
    const doc = await this.repository.create({
      userId,
      kind: body.kind,
      title: body.title,
      requestPayload: body.requestPayload,
      resultSnapshot: body.resultSnapshot,
    });
    return doc.toObject();
  }

  async list(userId: string, kind?: SavedAstrologyKind) {
    const rows = await this.repository.findByUser(userId, kind);
    return rows.map((d) => d.toObject());
  }

  async getById(userId: string, id: string) {
    const doc = await this.repository.findByIdAndUser(id, userId);
    if (!doc) {
      throw new NotFoundError('Saved record not found');
    }
    return doc.toObject();
  }

  async delete(userId: string, id: string) {
    const ok = await this.repository.deleteByIdAndUser(id, userId);
    if (!ok) {
      throw new NotFoundError('Saved record not found');
    }
    return { deleted: true };
  }
}
