import { ServiceAccessModel, IServiceAccess } from '@models/ServiceAccess.model';

export class ServiceAccessRepository {
  async create(data: {
    user: string;
    serviceProvider: string;
    serviceType: 'chat' | 'call';
    orderId: string;
    paymentId: string;
  }): Promise<IServiceAccess> {
    return ServiceAccessModel.create({
      user: data.user,
      serviceProvider: data.serviceProvider,
      serviceType: data.serviceType,
      orderId: data.orderId,
      paymentId: data.paymentId,
    });
  }

  async hasAccess(
    userId: string,
    serviceProviderId: string,
    serviceType: 'chat' | 'call'
  ): Promise<boolean> {
    const count = await ServiceAccessModel.countDocuments({
      user: userId,
      serviceProvider: serviceProviderId,
      serviceType,
    });
    return count > 0;
  }

  async findByUser(userId: string): Promise<IServiceAccess[]> {
    return ServiceAccessModel.find({ user: userId })
      .populate('serviceProvider', 'fullName')
      .sort({ createdAt: -1 });
  }

  async findByUserAndExpert(
    userId: string,
    serviceProviderId: string
  ): Promise<IServiceAccess[]> {
    return ServiceAccessModel.find({
      user: userId,
      serviceProvider: serviceProviderId,
    }).sort({ createdAt: -1 });
  }
}
