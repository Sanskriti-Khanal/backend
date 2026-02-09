import { GemCategoryRepository } from '@repositories/gem-category.repository';
import { IGemCategory } from '@models/GemCategory.model';
import { NotFoundError, ConflictError, BadRequestError } from '@errors/AppError';

export class GemCategoryService {
  private gemCategoryRepository: GemCategoryRepository;

  constructor() {
    this.gemCategoryRepository = new GemCategoryRepository();
  }

  async createCategory(data: Partial<IGemCategory>): Promise<IGemCategory> {
    // Check if slug already exists
    if (data.slug) {
      const existingCategory = await this.gemCategoryRepository.findBySlug(data.slug);
      if (existingCategory) {
        throw new ConflictError('Category with this slug already exists');
      }
    }

    // Check if name already exists
    if (data.name) {
      const existingCategory = await this.gemCategoryRepository.findAll({ name: data.name });
      if (existingCategory.length > 0) {
        throw new ConflictError('Category with this name already exists');
      }
    }

    return this.gemCategoryRepository.create(data);
  }

  async getCategoryById(id: string): Promise<IGemCategory> {
    const category = await this.gemCategoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Gem category not found');
    }
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<IGemCategory> {
    const category = await this.gemCategoryRepository.findBySlug(slug);
    if (!category || !category.isActive) {
      throw new NotFoundError('Gem category not found');
    }
    return category;
  }

  async getAllCategories(includeInactive: boolean = false): Promise<IGemCategory[]> {
    if (includeInactive) {
      return this.gemCategoryRepository.findAll();
    }
    return this.gemCategoryRepository.findActive();
  }

  async getCategoriesByType(
    categoryType: 'precious' | 'semi-precious' | 'other',
    includeInactive: boolean = false
  ): Promise<IGemCategory[]> {
    if (includeInactive) {
      return this.gemCategoryRepository.findAll({ categoryType });
    }
    return this.gemCategoryRepository.findByType(categoryType);
  }

  async updateCategory(
    id: string,
    data: Partial<IGemCategory>
  ): Promise<IGemCategory> {
    const category = await this.gemCategoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Gem category not found');
    }

    // Check if slug is being updated and if it conflicts
    if (data.slug && data.slug !== category.slug) {
      const existingCategory = await this.gemCategoryRepository.findBySlug(data.slug);
      if (existingCategory) {
        throw new ConflictError('Category with this slug already exists');
      }
    }

    const updatedCategory = await this.gemCategoryRepository.update(id, data);
    if (!updatedCategory) {
      throw new NotFoundError('Gem category not found');
    }

    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.gemCategoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Gem category not found');
    }

    const deleted = await this.gemCategoryRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Gem category not found');
    }
  }

}









