import { RudrakshaCategoryModel, IRudrakshaCategory } from '@models/RudrakshaCategory.model';

export class RudrakshaCategoryRepository {
  async create(categoryData: Partial<IRudrakshaCategory>): Promise<IRudrakshaCategory> {
    return RudrakshaCategoryModel.create(categoryData);
  }

  async findById(id: string): Promise<IRudrakshaCategory | null> {
    return RudrakshaCategoryModel.findById(id);
  }

  async findBySlug(slug: string): Promise<IRudrakshaCategory | null> {
    return RudrakshaCategoryModel.findOne({ slug });
  }

  async findAll(filter: any = {}): Promise<IRudrakshaCategory[]> {
    return RudrakshaCategoryModel.find(filter).sort({ displayOrder: 1, mukhiCount: 1 });
  }

  async findActive(filter: any = {}): Promise<IRudrakshaCategory[]> {
    return RudrakshaCategoryModel.find({ ...filter, isActive: true }).sort({
      displayOrder: 1,
      mukhiCount: 1,
    });
  }

  async findByType(categoryType: 'mukhi' | 'special'): Promise<IRudrakshaCategory[]> {
    return RudrakshaCategoryModel.find({ categoryType, isActive: true }).sort({
      displayOrder: 1,
      mukhiCount: 1,
    });
  }

  async findByMukhiCount(mukhiCount: number): Promise<IRudrakshaCategory | null> {
    return RudrakshaCategoryModel.findOne({ mukhiCount, isActive: true });
  }

  async update(
    id: string,
    data: Partial<IRudrakshaCategory>
  ): Promise<IRudrakshaCategory | null> {
    return RudrakshaCategoryModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await RudrakshaCategoryModel.findByIdAndDelete(id);
    return !!result;
  }

  async bulkCreate(categories: Partial<IRudrakshaCategory>[]): Promise<IRudrakshaCategory[]> {
    return (await RudrakshaCategoryModel.insertMany(categories)) as IRudrakshaCategory[];
  }
}

