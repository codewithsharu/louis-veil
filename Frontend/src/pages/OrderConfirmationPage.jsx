import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearCart } from "../redux/slices/cartSlice";
import ReactPixel from "react-facebook-pixel";

const OrderConfirmationPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { checkout } = useSelector((state) => state.checkout);
  const hasTrackedPurchaseRef = useRef(false);

  useEffect(() => {
    if (checkout && checkout._id) {
      dispatch(clearCart());
      localStorage.removeItem("cart");
    }
  }, [checkout, dispatch]);

  useEffect(() => {
    if (!checkout || !checkout._id || hasTrackedPurchaseRef.current) {
      return;
    }

    const pixelId = import.meta.env.VITE_META_PIXEL_ID;
    if (!pixelId) {
      return;
    }

    const items = Array.isArray(checkout.checkoutItems) ? checkout.checkoutItems : [];
    if (items.length === 0) {
      return;
    }

    const productUrls = items
      .map((item) => item?.productId)
      .filter(Boolean)
      .map((productId) => `${window.location.origin}/product/${productId}`);

    const totalValue = Number.isFinite(Number(checkout.totalPrice))
      ? Number(checkout.totalPrice)
      : items.reduce(
          (sum, item) => sum + Number(item?.price || 0) * Number(item?.quantity || 0),
          0
        );

    ReactPixel.track("Purchase", {
      value: totalValue,
      currency: "INR",
      content_type: "product",
      content_ids: items.map((item) => item.productId).filter(Boolean),
      contents: items.map((item) => ({
        id: item.productId,
        quantity: Number(item.quantity || 1),
        item_price: Number(item.price || 0),
      })),
      num_items: items.reduce((sum, item) => sum + Number(item?.quantity || 0), 0),
      order_id: checkout._id,
      payment_method: checkout.paymentMethod || "",
      customer_mobile: checkout?.shippingAddress?.phone || "",
      product_urls: productUrls,
    });

    hasTrackedPurchaseRef.current = true;
  }, [checkout]);

  const calculateEstimatedDelivery = (createdAt) => {
    const orderDate = new Date(createdAt);
    orderDate.setDate(orderDate.getDate() + 10);
    return orderDate.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-lv-cream py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto oc-page-enter">
        {/* Header Section */}
        <div className="text-center mb-8 oc-rise-up" style={{ animationDelay: "40ms" }}>
          <div className="mx-auto h-16 w-16 text-lv-gold oc-success-badge">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="oc-checkmark"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="mt-3 font-serif text-2xl md:text-3xl text-lv-dark tracking-wide">
            Order Confirmed
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Thank you for your purchase. We've sent a confirmation email with
            your order details.
          </p>
        </div>

        {/* Order Summary Card */}
        {checkout ? (
          <div className="bg-white shadow-lg overflow-hidden oc-rise-up" style={{ animationDelay: "140ms" }}>
            {/* Order Meta Section */}
            <div className="p-8 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Order Number
                  </h3>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {checkout._id}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Order Date
                  </h3>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {new Date(checkout.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-medium text-gray-500">
                    Est. Delivery
                  </h3>
                  <p className="mt-1 text-lg font-semibold text-lv-gold">
                    {calculateEstimatedDelivery(checkout.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="p-8 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Order Items
              </h2>
              <div className="space-y-6">
                {checkout.checkoutItems.map((item) => (
                  <div key={item.productId} className="flex items-start">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    />
                    <div className="ml-4 flex-1">
                      <h3 className="text-base font-medium text-gray-900">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.color} / {item.size}
                      </p>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span>Qty: {item.quantity}</span>
                        <span className="mx-2">•</span>
                        <span>₹{item.price}</span> 
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-medium text-gray-900">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info Grid */}
            <div className="p-8 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Payment Info */}
                <div className="bg-white p-6 rounded-lg shadow-sm oc-rise-up" style={{ animationDelay: "220ms" }}>
                  <div className="flex items-center mb-4">
                    <div className="h-6 w-6 text-gray-500 mr-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Payment Information
                    </h3>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-medium text-gray-900">
                      {checkout.paymentMethod || "Not Available"}
                    </p>
                  </div>
                </div>

                {/* Shipping Info */}
                <div className="bg-white p-6 shadow-sm oc-rise-up" style={{ animationDelay: "280ms" }}>
                  <div className="flex items-center mb-4">
                    <div className="h-6 w-6 text-gray-500 mr-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM3 16a4 4 0 018 0v4H3v-4zm12-4a4 4 0 014 4v4h-4v-4z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8h18M3 8v10h18V8m-18 0l3-4h12l3 4"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Shipping Address
                    </h3>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Delivery Address</p>
                    <p className="font-medium text-gray-900">
                      {checkout.shippingAddress.address},<br />
                      {checkout.shippingAddress.city},{" "}
                      {checkout.shippingAddress.country}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-lg p-8 text-center space-y-4 oc-rise-up" style={{ animationDelay: "140ms" }}>
            <h2 className="font-serif text-2xl text-lv-dark">Order Saved</h2>
            <p className="text-gray-600">
              We could not load checkout details in this session. You can view your latest order in My Orders.
            </p>
            <button
              type="button"
              onClick={() => navigate("/my-orders")}
              className="inline-block px-6 py-3 bg-lv-dark text-white font-medium tracking-[0.15em] uppercase text-sm hover:bg-lv-dark/90 transition-colors"
            >
              Go To My Orders
            </button>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-12 text-center oc-rise-up" style={{ animationDelay: "340ms" }}>
          <button
            onClick={() => navigate("/")}
            className="inline-block px-8 py-3 bg-lv-dark text-white font-medium tracking-[0.15em] uppercase text-sm hover:bg-lv-dark/90 transition-colors oc-cta-pulse"
          >
            Continue Shopping
          </button>
          <p className="mt-4 text-sm text-gray-600">
            Need help?{" "}
            <a href="/contact" className="text-lv-gold hover:underline">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
