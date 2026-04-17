import { FilterQuery } from 'mongoose';
import { SavedAstrologyModel, ISavedAstrology, SavedAstrologyKind } from '@models/SavedAstrology.model';

export class SavedAstrologyRepository {
  async create(data: {
    userId: string;
    kind: SavedAstrologyKind;
    title?: string;
    requestPayload: Record<string, unknown>;
    resultSnapshot: Record<string, unknown>;
  }): Promise<ISavedAstrology> {
    return SavedAstrologyModel.create({
      user: data.userId,
      kind: data.kind,
      title: data.title,
      requestPayload: data.requestPayload,
      resultSnapshot: data.resultSnapshot,
    });
  }

  async findByUser(
    userId: string,
    kind?: SavedAstrologyKind
  ): Promise<ISavedAstrology[]> {
    const q: { user: string; kind?: SavedAstrologyKind } = { user: userId };
    if (kind) q.kind = kind;
    return SavedAstrologyModel.find(q).sort({ createdAt: -1 }).exec();
  }

  async findByIdAndUser(
    id: string,
    userId: string
  ): Promise<ISavedAstrology | null> {
    return SavedAstrologyModel.findOne({ _id: id, user: userId }).exec();
  }

  async deleteByIdAndUser(id: string, userId: string): Promise<boolean> {
    const r = await SavedAstrologyModel.deleteOne({ _id: id, user: userId });
    return r.deletedCount === 1;
  }

  /** Admin: all saved rows, optional kind filter, newest first. */
  async findAllForAdmin(options: {
    kind?: SavedAstrologyKind;
    limit?: number;
  }): Promise<Record<string, unknown>[]> {
    const q: FilterQuery<ISavedAstrology> = {};
    if (options.kind) q.kind = options.kind;
    const lim = Math.min(Math.max(options.limit ?? 400, 1), 500);
    const rows = await SavedAstrologyModel.find(q)
      .populate('user', 'fullName phone username role')
      .sort({ createdAt: -1 })
      .limit(lim)
      .lean()
      .exec();
    return rows as Record<string, unknown>[];
  }
}
