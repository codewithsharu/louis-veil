import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchUserOrders } from "../redux/slices/orderSlice";

const MyOrdersPage = ({ embedded = false }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector((state) => state.orders);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4); // Number of orders per page

  useEffect(() => {
    dispatch(fetchUserOrders());
  }, [dispatch]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(orders.length / itemsPerPage));
  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Change page
  const paginate = (pageNumber) => {
    const targetPage = Math.min(Math.max(pageNumber, 1), totalPages);
    setCurrentPage(targetPage);
  };

  const handleOrderClick = (orderId) => {
    navigate(`/order/${orderId}`);
  };

  const formatPrice = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  if (loading)
    return (
      <div
        className={`flex justify-center items-center ${
          embedded ? "h-40 bg-white border border-gray-100 shadow-sm" : "h-screen"
        }`}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );

  if (error)
    return (
      <div className={embedded ? "rounded-lg border border-gray-200 bg-white shadow-sm p-5 sm:p-6" : "max-w-7xl mx-auto p-6"}>
        <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-red-600 font-medium">Error: {error}</p>
        </div>
      </div>
    );

  return (
    <div
      className={
        embedded
          ? "rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
          : "max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 bg-lv-cream min-h-screen"
      }
    >
      <div className={embedded ? "mb-5" : "mb-8"}>
        <p className={`text-xs mb-2 ${embedded ? "font-semibold text-[#2874f0] uppercase tracking-[0.12em]" : "tracking-[0.3em] uppercase text-lv-gold"}`}>My Account</p>
        <h1 className={`${embedded ? "text-2xl font-semibold text-[#212121]" : "font-serif text-2xl sm:text-3xl text-lv-dark tracking-wide"}`}>
          Order History
        </h1>
        {embedded ? (
          <p className="mt-1 text-sm text-[#878787]">Tap any order to view full details and invoice.</p>
        ) : (
          <div className="w-10 h-[1px] bg-lv-gold mt-3" />
        )}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-24 w-24 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No orders found
          </h3>
        </div>
      ) : (
        <>
          <div className={`grid grid-cols-1 ${embedded ? "gap-3" : "gap-6"}`}>
            {currentOrders.map((order) => (
              <div
                key={order._id}
                onClick={() => handleOrderClick(order._id)}
                className={`cursor-pointer border border-gray-200 bg-white transition-shadow ${
                  embedded ? "rounded-lg p-4 hover:border-[#2874f0]/40" : "shadow-sm hover:shadow-md"
                }`}
              >
                {embedded ? (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.08em] text-[#878787]">Order #{order._id.slice(-8)}</p>
                        <p className="mt-1 text-sm font-medium text-[#212121]">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                          order.isPaid
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {order.isPaid ? "Paid" : "Pending"}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <img
                        src={order.orderItems?.[0]?.image}
                        alt={order.orderItems?.[0]?.name || "Order item"}
                        className="h-16 w-16 rounded-md border border-gray-200 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#212121]">
                          {order.orderItems?.[0]?.name || "Order Item"}
                        </p>
                        <p className="mt-1 text-xs text-[#878787]">
                          {order.orderItems.length} item{order.orderItems.length > 1 ? "s" : ""} • {order.shippingAddress?.city}, {order.shippingAddress?.country}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#212121]">{formatPrice(order.totalPrice)}</p>
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#2874f0]">View Details</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-6">
                    {/* Order Header */}
                    <div className="flex flex-col sm:flex-row justify-between gap-4 pb-4 border-b border-gray-100">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Order #{order._id.slice(-8)}
                        </p>
                        <p className="text-lg font-semibold text-gray-900 mt-1">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-lg font-semibold text-gray-900">
                        {formatPrice(order.totalPrice)}
                        </p>
                        <span
                          className={`px-3 py-1 text-sm font-medium tracking-wide ${
                            order.isPaid
                              ? "bg-lv-gold/10 text-lv-gold"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {order.isPaid ? "Paid" : "Pending"}
                        </span>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="py-4 border-b border-gray-100">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                          />
                        </svg>
                        {order.orderItems.length} Item
                        {order.orderItems.length > 1 ? "s" : ""}
                      </h4>

                      <div className="space-y-4">
                        {order.orderItems.map((item, index) => (
                          <div key={index} className="flex gap-4">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-20 h-20 object-cover rounded-md border"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {item.name}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                                {item.color && (
                                  <div className="flex items-center gap-2">
                                    <span>Color:</span>
                                    <div/>
                                    <span>{item.color}</span>
                                  </div>
                                )}
                                {item.size && (
                                  <div className="flex items-center gap-2">
                                    <span>Size:</span>
                                    <span className="font-medium">{item.size}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <span>Qty:</span>
                                  <span className="font-medium">
                                    {item.quantity}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span>Price:</span>
                                  <span className="font-medium">{formatPrice(item.price)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Footer */}
                    <div className="pt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                            <svg
                              className="w-5 h-5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            Shipping Details
                          </h4>
                          <p className="text-sm text-gray-600">
                            {order.shippingAddress.address}
                            <br />
                            {order.shippingAddress.city},{" "}
                            {order.shippingAddress.country}
                            <br />
                            {order.shippingAddress.postalCode}
                          </p>
                        </div>
                        <div>
                          <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                            <svg
                              className="w-5 h-5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                              />
                            </svg>
                            Payment Method
                          </h4>
                          <p className="text-sm text-gray-600">
                            {order.paymentMethod}
                            {order.isPaid &&
                              ` • Paid on ${new Date(
                                order.paidAt
                              ).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8">
              {/* Mobile compact pagination */}
              <div className="flex items-center justify-center gap-2 sm:hidden">
                <button
                  type="button"
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="min-w-[72px] text-center text-xs font-semibold text-gray-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>

              {/* Desktop/tablet full pagination */}
              <div className="hidden justify-center sm:flex">
                <nav className="flex flex-wrap items-center justify-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      type="button"
                      onClick={() => paginate(i + 1)}
                      className={`min-w-[40px] px-3 py-2 text-sm font-medium ${
                        currentPage === i + 1
                          ? "bg-lv-dark text-white"
                          : "bg-white text-gray-700 hover:bg-lv-cream"
                      } border border-gray-200`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyOrdersPage;