import { OrderStatus, OrderType, IOrder } from '@models/Order.model';
import { BadRequestError } from '@errors/AppError';

/** Product orders that use the commerce lifecycle (draft → … → completed). */
export function isProductCommerceLifecycle(order: IOrder): boolean {
  return (
    order.orderType === OrderType.PRODUCT &&
    COMMERCE_ORDER_STATUSES.has(order.status as OrderStatus)
  );
}

const COMMERCE_ORDER_STATUSES = new Set<string>([
  OrderStatus.DRAFT,
  OrderStatus.PAYMENT_PENDING,
  OrderStatus.PAID,
  OrderStatus.FULFILLMENT_PENDING,
  OrderStatus.COMPLETED,
  OrderStatus.FAILED,
]);

const PRODUCT_ALLOWED: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.DRAFT]: [OrderStatus.PAYMENT_PENDING, OrderStatus.CANCELLED],
  [OrderStatus.PAYMENT_PENDING]: [
    OrderStatus.PAID,
    OrderStatus.CANCELLED,
    OrderStatus.FAILED,
  ],
  [OrderStatus.PAID]: [OrderStatus.FULFILLMENT_PENDING, OrderStatus.FAILED],
  [OrderStatus.FULFILLMENT_PENDING]: [OrderStatus.COMPLETED, OrderStatus.FAILED],
  /** Admin / worker retry after fulfillment error */
  [OrderStatus.FAILED]: [OrderStatus.FULFILLMENT_PENDING, OrderStatus.CANCELLED],
};

/**
 * Enforces allowed transitions for commerce product orders.
 * Legacy product rows (`pending`, `confirmed`, …) skip strict checks.
 */
export function assertProductCommerceTransition(
  order: IOrder,
  next: OrderStatus,
  options?: { adminOverride?: boolean }
): void {
  if (!isProductCommerceLifecycle(order) && !COMMERCE_ORDER_STATUSES.has(next)) {
    return;
  }
  if (options?.adminOverride) {
    return;
  }
  const current = order.status as OrderStatus;
  if (!isProductCommerceLifecycle(order)) {
    return;
  }
  const allowed = PRODUCT_ALLOWED[current];
  if (!allowed?.includes(next)) {
    throw new BadRequestError(`Invalid order status transition: ${current} → ${next}`);
  }
}
