import { Order } from "./order.model";

interface OrderListQuery {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  status?: string;
  paymentStatus?: string;
  userId?: string;
}

// Create order
const createOrder = async (data: any) => {
  return Order.create(data);
};

// Get orders by tenant
const buildOrderFilter = (tenantId: string, query: OrderListQuery) => {
  const filter: any = { tenantId };

  if (query.userId) {
    filter.userId = query.userId;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.paymentStatus) {
    filter.paymentStatus = query.paymentStatus;
  }

  if (query.search) {
    filter.$or = [
      { productName: { $regex: query.search, $options: "i" } },
      { orderNumber: { $regex: query.search, $options: "i" } },
    ];
  }

  return filter;
};

const getOrdersByTenant = async (tenantId: string, query: OrderListQuery) => {
  const filter = buildOrderFilter(tenantId, query);

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(query.skip).limit(query.limit),
    Order.countDocuments(filter),
  ]);

  return { orders, total };
};
const getOrderById = async (orderId: string) => {
  return Order.findById(orderId);
};

const deleteOrderById = async (orderId: string) => {
  return Order.findByIdAndDelete(orderId);
};

// 🔥 ADD THIS FUNCTION
const updateOrderStatus = async (orderId: string, status: string) => {
  return Order.findByIdAndUpdate(
    orderId,
    { status },
    { returnDocument: "after" }, // 🔥 modern way
  );
};

const updateOrderInvoicePdf = async (
  orderId: string,
  invoicePdf: {
    url: string;
    publicId: string;
    originalName: string;
    uploadedAt: Date;
  },
) => {
  return Order.findByIdAndUpdate(
    orderId,
    { invoicePdf },
    { returnDocument: "after" },
  );
};

const addOrderAttachments = async (
  orderId: string,
  attachments: Array<{
    url: string;
    publicId: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedAt: Date;
  }>,
) => {
  return Order.findByIdAndUpdate(
    orderId,
    { $push: { attachments: { $each: attachments } } },
    { returnDocument: "after" },
  );
};

export {
  createOrder,
  getOrdersByTenant,
  updateOrderStatus,
  getOrderById,
  deleteOrderById,
  updateOrderInvoicePdf,
  addOrderAttachments,
};
