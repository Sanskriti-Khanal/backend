import { ProductEnquiryModel, IProductEnquiry, EnquiryStatus } from '@models/ProductEnquiry.model';

export class ProductEnquiryRepository {
  async create(enquiryData: Partial<IProductEnquiry>): Promise<IProductEnquiry> {
    return ProductEnquiryModel.create(enquiryData);
  }

  async findById(id: string): Promise<IProductEnquiry | null> {
    return ProductEnquiryModel.findById(id).populate('product');
  }

  async findAll(filter: any = {}): Promise<IProductEnquiry[]> {
    return ProductEnquiryModel.find(filter)
      .populate('product', 'name type category')
      .sort({ createdAt: -1 });
  }

  async findByProduct(productId: string): Promise<IProductEnquiry[]> {
    return ProductEnquiryModel.find({ product: productId })
      .sort({ createdAt: -1 });
  }

  async findByStatus(status: EnquiryStatus): Promise<IProductEnquiry[]> {
    return ProductEnquiryModel.find({ status })
      .populate('product', 'name type category')
      .sort({ createdAt: -1 });
  }

  async update(id: string, data: Partial<IProductEnquiry>): Promise<IProductEnquiry | null> {
    return ProductEnquiryModel.findByIdAndUpdate(id, data, { new: true }).populate('product');
  }

  async delete(id: string): Promise<boolean> {
    const result = await ProductEnquiryModel.findByIdAndDelete(id);
    return !!result;
  }

  async count(filter: any = {}): Promise<number> {
    return ProductEnquiryModel.countDocuments(filter);
  }
}
