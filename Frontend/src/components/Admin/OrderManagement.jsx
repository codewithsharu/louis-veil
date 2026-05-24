import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { fetchAllOrders, updateOrderStatus, clearError } from "../../redux/slices/adminOrderSlice";
import { FiCalendar, FiFilter, FiInfo, FiSearch } from "react-icons/fi";
import { BiSort } from "react-icons/bi";
import AdminPagination from "./AdminPagination";

const ITEMS_PER_PAGE = 15;

const OrderStatusOptions = {
  Processing: "Processing",
  Shipped: "Shipped",
  Delivered: "Delivered",
  Cancelled: "Cancelled",
};

const statusOrder = {
  Processing: 1,
  Shipped: 2,
  Delivered: 3,
  Cancelled: 3,
};

const CUSTOM_MEASUREMENT_FIELDS = [
  { key: "bustChest", label: "Bust/Chest" },
  { key: "waist", label: "Waist" },
  { key: "hips", label: "Hips" },
  { key: "shoulderWidth", label: "Shoulder" },
  { key: "sleeveLength", label: "Sleeve" },
  { key: "armhole", label: "Armhole" },
  { key: "bicepSize", label: "Bicep" },
];

const formatMeasurementValue = (value) => Number(value).toFixed(1).replace(".0", "");

const getOrderItems = (order) => order?.orderItems || order?.items || [];

const getSizeLabel = (size) => {
  if (!size) {
    return "";
  }

  return size === "CUSTOM" ? "Custom Size" : size;
};

const getCustomMeasurementSummary = (item) => {
  const measurements = item?.customMeasurements;

  if (!measurements || typeof measurements !== "object") {
    return [];
  }

  return CUSTOM_MEASUREMENT_FIELDS.map((field) => {
    const numericValue = Number(measurements[field.key]);

    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return null;
    }

    return `${field.label}: ${formatMeasurementValue(numericValue)} in`;
  }).filter(Boolean);
};

const OrderManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateSort, setDateSort] = useState("desc");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { user } = useSelector((state) => state.auth);
  const { orders, loading, error } = useSelector((state) => state.adminOrders);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (user.role !== "admin") {
      navigate("/unauthorized");
    } else {
      dispatch(fetchAllOrders());
    }
  }, [dispatch, user, navigate]);

  useEffect(() => {
    if (error) {
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleStatusChange = async (orderId, status) => {
    try {
      setStatusUpdating(orderId);
      await dispatch(updateOrderStatus({ id: String(orderId), status })).unwrap();
    } catch (updateError) {
      console.error(updateError.message || "Failed to update order status");
    } finally {
      setStatusUpdating(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Processing: "border-amber-200 bg-amber-50 text-amber-700",
      Shipped: "border-sky-200 bg-sky-50 text-sky-700",
      Delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
      Cancelled: "border-rose-200 bg-rose-50 text-rose-700",
    };
    return colors[status] || "border-slate-200 bg-slate-100 text-slate-700";
  };

  const toggleDateSort = () => {
    setDateSort(dateSort === "asc" ? "desc" : "asc");
  };

  const filteredOrders = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase();

    return [...orders]
      .filter((order) => {
        const itemMatch = getOrderItems(order).some((item) =>
          (item.name || "").toLowerCase().includes(searchLower)
        );

        const matchesSearch =
          !searchLower ||
          order._id.toLowerCase().includes(searchLower) ||
          (order.user?.name || "").toLowerCase().includes(searchLower) ||
          (order.user?.email || "").toLowerCase().includes(searchLower) ||
          itemMatch;

        const matchesStatus = statusFilter === "All" || order.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateSort === "asc" ? dateA - dateB : dateB - dateA;
      });
  }, [orders, searchTerm, statusFilter, dateSort]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateSort]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredOrders.length, currentPage]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const statusCounts = useMemo(
    () => ({
      total: orders.length,
      processing: orders.filter((order) => order.status === "Processing").length,
      shipped: orders.filter((order) => order.status === "Shipped").length,
      delivered: orders.filter((order) => order.status === "Delivered").length,
      cancelled: orders.filter((order) => order.status === "Cancelled").length,
    }),
    [orders]
  );

  const formatCurrency = (value) => `₹${Number(value || 0).toFixed(2)}`;
  const selectedOrderItems = getOrderItems(selectedOrder);

  if (loading) {
    return (
      <div className="flex h-[55vh] items-center justify-center">
        <div className="h-14 w-14 animate-spin rounded-full border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1450px] space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Order Management</h2>
            <p className="mt-1 text-sm text-slate-600">Monitor fulfillment, payments, and order progress from one view.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
              Total: {statusCounts.total}
            </span>
            <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
              Processing: {statusCounts.processing}
            </span>
            <span className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700">
              Shipped: {statusCounts.shipped}
            </span>
            <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
              Delivered: {statusCounts.delivered}
            </span>
            <span className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700">
              Cancelled: {statusCounts.cancelled}
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xl">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              placeholder="Search by order ID, customer, email, or product"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <FiFilter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-8 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                {Object.values(OrderStatusOptions).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={toggleDateSort}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-100"
              type="button"
            >
              <FiCalendar className="w-4 h-4" />
              {dateSort === "desc" ? "Newest" : "Oldest"}
              <BiSort className="w-4 h-4" />
            </button>
          </div>
        </div>

        {filteredOrders.length > 0 ? (
          <>
            <div className="overflow-x-auto px-5 py-5">
              <table className="min-w-full divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {paginatedOrders.map((order) => {
                    const currentStatus = order.status || OrderStatusOptions.Processing;
                    const isFinalStatus =
                      currentStatus === OrderStatusOptions.Delivered || currentStatus === OrderStatusOptions.Cancelled;

                    const orderDate = new Date(order.createdAt).toLocaleDateString();
                    const orderItems = getOrderItems(order);

                    return (
                      <tr key={order._id} className="transition-colors hover:bg-sky-50/40">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link to={`/admin/orders/${order._id}`} className="font-medium text-sky-700 hover:underline">
                            #{order._id.slice(-6)}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-slate-900">{order.user?.name || "Unknown"}</div>
                          <div className="text-xs text-slate-500">{order.user?.email || "No email"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{orderDate}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {orderItems.length > 0 ? (
                            <div>
                              {(() => {
                                const firstItem = orderItems[0];
                                const firstItemSizeLabel = getSizeLabel(firstItem?.size);
                                const firstItemCustomMeasurements = getCustomMeasurementSummary(firstItem);

                                return (
                                  <>
                                    <p className="font-medium text-slate-900">
                                      {firstItem?.name} {firstItem?.quantity > 1 && `(x${firstItem.quantity})`}
                                    </p>
                                    {(firstItemSizeLabel || firstItem?.color) && (
                                      <p className="mt-0.5 text-xs text-slate-500">
                                        {firstItemSizeLabel ? `Size: ${firstItemSizeLabel}` : ""}
                                        {firstItemSizeLabel && firstItem?.color ? " • " : ""}
                                        {firstItem?.color ? `Color: ${firstItem.color}` : ""}
                                      </p>
                                    )}
                                    {firstItemCustomMeasurements.length > 0 && (
                                      <p className="mt-0.5 text-[11px] font-medium text-indigo-600">Custom measurements added</p>
                                    )}
                                  </>
                                );
                              })()}
                              {orderItems.length > 1 && (
                                <p className="text-slate-500">+{orderItems.length - 1} more items</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500">No items</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                          {formatCurrency(order.totalPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">{order.paymentMethod || "N/A"}</div>
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                              order.paymentStatus === "paid"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            }`}
                          >
                            {(order.paymentStatus || "pending").toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusColor(currentStatus)}`}>
                            {currentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {!isFinalStatus ? (
                            <div className="relative">
                              <select
                                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                value={currentStatus}
                                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                disabled={statusUpdating === order._id}
                              >
                                {Object.values(OrderStatusOptions)
                                  .filter((status) => (statusOrder[status] || 0) >= (statusOrder[currentStatus] || 0))
                                  .map((status) => (
                                    <option key={status} value={status}>
                                      {status}
                                    </option>
                                  ))}
                              </select>

                              {statusUpdating === order._id && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/75">
                                  <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-slate-600"></div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="rounded-md border border-sky-200 bg-sky-50 p-2 text-sky-700 transition-colors hover:bg-sky-100"
                              type="button"
                            >
                              <FiInfo className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-5 pb-5">
              <AdminPagination
                currentPage={currentPage}
                totalItems={filteredOrders.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        ) : (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-slate-100">
              <FiFilter className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-base font-medium text-slate-900">No matching orders found</h3>
            <p className="mt-1 text-sm text-slate-500">Try adjusting filters or search terms.</p>
            <button
              className="mt-4 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("All");
              }}
              type="button"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-slate-900">Order #{selectedOrder._id.slice(-6)}</h3>
              <button
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                onClick={() => setSelectedOrder(null)}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Customer Information</h4>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="font-medium text-slate-900">{selectedOrder.user?.name || "Unknown Customer"}</p>
                <p className="text-slate-700">{selectedOrder.user?.email || "No email"}</p>
                <p className="text-slate-700">{selectedOrder.shippingAddress?.phone || "No phone"}</p>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Shipping Address</h4>
                {selectedOrder.shippingAddress ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <p>{selectedOrder.shippingAddress.street}</p>
                    <p>
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}
                    </p>
                    <p>{selectedOrder.shippingAddress.country}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No shipping address provided</p>
                )}
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Order Items</h4>
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Product</th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">Qty</th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">Price</th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {selectedOrderItems.map((item, index) => {
                        const itemSizeLabel = getSizeLabel(item?.size);
                        const itemCustomMeasurements = getCustomMeasurementSummary(item);

                        return (
                          <tr key={item._id || item.productId || index}>
                            <td className="px-4 py-3 text-sm">
                              <p className="font-medium text-slate-900">{item.name}</p>
                              {(itemSizeLabel || item.color) && (
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {itemSizeLabel ? `Size: ${itemSizeLabel}` : ""}
                                  {itemSizeLabel && item.color ? " • " : ""}
                                  {item.color ? `Color: ${item.color}` : ""}
                                </p>
                              )}
                              {itemCustomMeasurements.length > 0 && (
                                <p className="mt-0.5 text-[11px] text-indigo-600">{itemCustomMeasurements.join(" | ")}</p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-slate-600">{item.quantity}</td>
                            <td className="px-4 py-3 text-right text-sm text-slate-600">{formatCurrency(item.price)}</td>
                            <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                              {formatCurrency((Number(item.price) || 0) * (Number(item.quantity) || 0))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500" colSpan="3">
                          Total
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                          {formatCurrency(selectedOrder.totalPrice)}
                        </th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;

