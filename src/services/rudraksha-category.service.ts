import { RudrakshaCategoryRepository } from '@repositories/rudraksha-category.repository';
import { IRudrakshaCategory } from '@models/RudrakshaCategory.model';
import { NotFoundError, ConflictError, BadRequestError } from '@errors/AppError';

export class RudrakshaCategoryService {
  private rudrakshaCategoryRepository: RudrakshaCategoryRepository;

  constructor() {
    this.rudrakshaCategoryRepository = new RudrakshaCategoryRepository();
  }

  async createCategory(data: Partial<IRudrakshaCategory>): Promise<IRudrakshaCategory> {
    // Check if slug already exists
    if (data.slug) {
      const existingCategory = await this.rudrakshaCategoryRepository.findBySlug(data.slug);
      if (existingCategory) {
        throw new ConflictError('Category with this slug already exists');
      }
    }

    // Check if name already exists
    if (data.name) {
      const existingCategory = await this.rudrakshaCategoryRepository.findAll({ name: data.name });
      if (existingCategory.length > 0) {
        throw new ConflictError('Category with this name already exists');
      }
    }

    // Validate mukhi count for mukhi categories
    if (data.categoryType === 'mukhi') {
      if (data.mukhiCount === undefined || data.mukhiCount < 0 || data.mukhiCount > 26) {
        throw new BadRequestError('Mukhi count must be between 0 and 26 for mukhi categories');
      }
    }

    return this.rudrakshaCategoryRepository.create(data);
  }

  async getCategoryById(id: string): Promise<IRudrakshaCategory> {
    const category = await this.rudrakshaCategoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Rudraksha category not found');
    }
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<IRudrakshaCategory> {
    const category = await this.rudrakshaCategoryRepository.findBySlug(slug);
    if (!category || !category.isActive) {
      throw new NotFoundError('Rudraksha category not found');
    }
    return category;
  }

  async getAllCategories(includeInactive: boolean = false): Promise<IRudrakshaCategory[]> {
    if (includeInactive) {
      return this.rudrakshaCategoryRepository.findAll();
    }
    return this.rudrakshaCategoryRepository.findActive();
  }

  async getCategoriesByType(
    categoryType: 'mukhi' | 'special',
    includeInactive: boolean = false
  ): Promise<IRudrakshaCategory[]> {
    if (includeInactive) {
      return this.rudrakshaCategoryRepository.findAll({ categoryType });
    }
    return this.rudrakshaCategoryRepository.findByType(categoryType);
  }

  async getCategoryByMukhiCount(mukhiCount: number): Promise<IRudrakshaCategory> {
    const category = await this.rudrakshaCategoryRepository.findByMukhiCount(mukhiCount);
    if (!category) {
      throw new NotFoundError(`Rudraksha category with ${mukhiCount} mukhi not found`);
    }
    return category;
  }

  async updateCategory(
    id: string,
    data: Partial<IRudrakshaCategory>
  ): Promise<IRudrakshaCategory> {
    const category = await this.rudrakshaCategoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Rudraksha category not found');
    }

    // Check if slug is being updated and if it conflicts
    if (data.slug && data.slug !== category.slug) {
      const existingCategory = await this.rudrakshaCategoryRepository.findBySlug(data.slug);
      if (existingCategory) {
        throw new ConflictError('Category with this slug already exists');
      }
    }

    // Validate mukhi count for mukhi categories
    if (data.categoryType === 'mukhi' || category.categoryType === 'mukhi') {
      const finalMukhiCount = data.mukhiCount ?? category.mukhiCount;
      if (finalMukhiCount === undefined || finalMukhiCount < 0 || finalMukhiCount > 26) {
        throw new BadRequestError('Mukhi count must be between 0 and 26 for mukhi categories');
      }
    }

    const updatedCategory = await this.rudrakshaCategoryRepository.update(id, data);
    if (!updatedCategory) {
      throw new NotFoundError('Rudraksha category not found');
    }

    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.rudrakshaCategoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Rudraksha category not found');
    }

    const deleted = await this.rudrakshaCategoryRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Rudraksha category not found');
    }
  }

}

