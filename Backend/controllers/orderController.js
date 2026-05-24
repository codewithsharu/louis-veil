const Order = require('../models/Order');

const getInvoiceByOrderId = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const subtotal = order.orderItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    const invoice = {
      invoiceNumber: 'INV-' + order._id.toString().toUpperCase(),
      orderId: order._id,
      date: order.createdAt,
      customer: {
        name: order.user.name,
        email: order.user.email,
      },
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      paymentId: order.paymentId || null,
      paymentStatus: order.paymentStatus,
      isPaid: order.isPaid,
      paidAt: order.paidAt,
      status: order.status,
      items: order.orderItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
        color: item.color,
        size: item.size,
        image: item.image,
      })),
      subtotal,
      promoCode: order.promoCode || null,
      promoCodeDiscount: order.promoCodeDiscount || 0,
      totalAmount: order.totalPrice,
    };

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch invoice', error: err.message });
  }
};

module.exports = { getInvoiceByOrderId };
