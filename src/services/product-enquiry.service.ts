import { ProductEnquiryRepository } from '@repositories/product-enquiry.repository';
import { ProductRepository } from '@repositories/product.repository';
import { IProductEnquiry, EnquiryStatus } from '@models/ProductEnquiry.model';
import { NotFoundError } from '@errors/AppError';

export class ProductEnquiryService {
  private enquiryRepository: ProductEnquiryRepository;
  private productRepository: ProductRepository;

  constructor() {
    this.enquiryRepository = new ProductEnquiryRepository();
    this.productRepository = new ProductRepository();
  }

  async createEnquiry(data: {
    productId: string;
    mobile: string;
    email: string;
    message?: string;
  }): Promise<IProductEnquiry> {
    // Verify product exists
    const product = await this.productRepository.findById(data.productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return this.enquiryRepository.create({
      product: data.productId as any,
      mobile: data.mobile,
      email: data.email,
      message: data.message,
      status: EnquiryStatus.PENDING,
    });
  }

  async getAllEnquiries(filter?: { status?: EnquiryStatus }): Promise<IProductEnquiry[]> {
    if (filter?.status) {
      return this.enquiryRepository.findByStatus(filter.status);
    }
    return this.enquiryRepository.findAll();
  }

  async getEnquiryById(id: string): Promise<IProductEnquiry> {
    const enquiry = await this.enquiryRepository.findById(id);
    if (!enquiry) {
      throw new NotFoundError('Enquiry not found');
    }
    return enquiry;
  }

  async getEnquiriesByProduct(productId: string): Promise<IProductEnquiry[]> {
    return this.enquiryRepository.findByProduct(productId);
  }

  async updateEnquiryStatus(
    id: string,
    status: EnquiryStatus
  ): Promise<IProductEnquiry> {
    const enquiry = await this.enquiryRepository.update(id, { status });
    if (!enquiry) {
      throw new NotFoundError('Enquiry not found');
    }
    return enquiry;
  }

  async deleteEnquiry(id: string): Promise<void> {
    const deleted = await this.enquiryRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Enquiry not found');
    }
  }

  async getEnquiryStats(): Promise<{
    total: number;
    pending: number;
    contacted: number;
    resolved: number;
  }> {
    const [total, pending, contacted, resolved] = await Promise.all([
      this.enquiryRepository.count(),
      this.enquiryRepository.count({ status: EnquiryStatus.PENDING }),
      this.enquiryRepository.count({ status: EnquiryStatus.CONTACTED }),
      this.enquiryRepository.count({ status: EnquiryStatus.RESOLVED }),
    ]);

    return {
      total,
      pending,
      contacted,
      resolved,
    };
  }
}
