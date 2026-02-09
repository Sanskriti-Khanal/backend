import { GemCategoryModel, IGemCategory } from '@models/GemCategory.model';

export class GemCategoryRepository {
  async create(categoryData: Partial<IGemCategory>): Promise<IGemCategory> {
    return GemCategoryModel.create(categoryData);
  }

  async findById(id: string): Promise<IGemCategory | null> {
    return GemCategoryModel.findById(id);
  }

  async findBySlug(slug: string): Promise<IGemCategory | null> {
    return GemCategoryModel.findOne({ slug });
  }

  async findAll(filter: any = {}): Promise<IGemCategory[]> {
    return GemCategoryModel.find(filter).sort({ displayOrder: 1, name: 1 });
  }

  async findActive(filter: any = {}): Promise<IGemCategory[]> {
    return GemCategoryModel.find({ ...filter, isActive: true }).sort({
      displayOrder: 1,
      name: 1,
    });
  }

  async findByType(categoryType: 'precious' | 'semi-precious' | 'other'): Promise<IGemCategory[]> {
    return GemCategoryModel.find({ categoryType, isActive: true }).sort({
      displayOrder: 1,
      name: 1,
    });
  }

  async update(
    id: string,
    data: Partial<IGemCategory>
  ): Promise<IGemCategory | null> {
    return GemCategoryModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await GemCategoryModel.findByIdAndDelete(id);
    return !!result;
  }

  async bulkCreate(categories: Partial<IGemCategory>[]): Promise<IGemCategory[]> {
    return (await GemCategoryModel.insertMany(categories)) as IGemCategory[];
  }
}









