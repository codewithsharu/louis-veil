import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchAdminProducts } from "../redux/slices/adminProductSlice";
import { fetchAllOrders } from "../redux/slices/adminOrderSlice";
import {
    FaArrowRight,
    FaBoxOpen,
    FaClipboardList,
    FaDollarSign,
    FaTruck,
    FaUsers,
} from "react-icons/fa";

const AdminHomePage = () => {
    const dispatch = useDispatch();
    const { products, loading: productsLoading, error: productsError } = useSelector(state => state.adminProducts);
    const { orders, totalOrders, totalSales, loading: ordersLoading, error: ordersError } = useSelector(state => state.adminOrders);

    useEffect(() => {
        dispatch(fetchAdminProducts());
        dispatch(fetchAllOrders());
    }, [dispatch]);

    const sortedOrders = useMemo(
        () => [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        [orders]
    );

    const recentOrders = sortedOrders.slice(0, 8);
    const deliveredOrders = orders.filter((order) => order.status === "Delivered");
    const processingOrders = orders.filter((order) => order.status === "Processing");
    const shippedOrders = orders.filter((order) => order.status === "Shipped");
    const cancelledOrders = orders.filter((order) => order.status === "Cancelled");

    const deliveredRate = totalOrders > 0 ? ((deliveredOrders.length / totalOrders) * 100).toFixed(1) : "0.0";
    const avgDeliveredOrderValue =
        deliveredOrders.length > 0
            ? (totalSales / deliveredOrders.length).toFixed(2)
            : "0.00";

    const formatCurrency = (value) => {
        const numericValue = Number(value) || 0;
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(numericValue);
    };

    const getStatusBadgeClass = (status) => {
        const classes = {
            Delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
            Processing: "border-amber-200 bg-amber-50 text-amber-700",
            Shipped: "border-sky-200 bg-sky-50 text-sky-700",
            Cancelled: "border-rose-200 bg-rose-50 text-rose-700",
        };
        return classes[status] || "border-slate-200 bg-slate-100 text-slate-700";
    };

    if (productsLoading || ordersLoading) {
        return (
            <div className="flex h-[55vh] items-center justify-center">
                <div className="h-14 w-14 animate-spin rounded-full border-b-2 border-neutral-900"></div>
            </div>
        );
    }

    if (productsError || ordersError) {
        return (
            <div className="mx-auto max-w-7xl p-6">
                <div className="rounded-xl border border-neutral-300 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-neutral-800">Failed to load admin metrics.</p>
                    <p className="mt-1 text-sm text-neutral-600">{productsError || ordersError}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-[1450px] space-y-6 p-6">
            <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-sky-50/70 p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">Admin Dashboard</p>
                        <h1 className="mt-1 text-xl font-semibold text-slate-900">Operations Overview</h1>
                        <p className="mt-1 text-sm text-slate-600">
                            Live operational summary from users, products, and real order records.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Link
                            to="/admin/orders"
                            className="inline-flex items-center gap-2 rounded-lg border border-sky-600 bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700"
                        >
                            Manage Orders
                            <FaArrowRight className="text-xs" />
                        </Link>
                        <Link
                            to="/admin/products"
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100"
                        >
                            Manage Products
                            <FaArrowRight className="text-xs" />
                        </Link>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-white p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-medium text-emerald-700">Delivered Revenue</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(totalSales)}</p>
                            <p className="mt-1 text-xs text-slate-600">Based on delivered orders only</p>
                        </div>
                        <div className="rounded-lg border border-emerald-200 bg-emerald-100 p-2.5 text-emerald-700">
                            <FaDollarSign />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50/80 via-white to-white p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-medium text-sky-700">Total Orders</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-900">{totalOrders}</p>
                            <p className="mt-1 text-xs text-slate-600">Delivered rate {deliveredRate}%</p>
                        </div>
                        <div className="rounded-lg border border-sky-200 bg-sky-100 p-2.5 text-sky-700">
                            <FaClipboardList />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50/70 via-white to-white p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-medium text-violet-700">Catalog Size</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-900">{products.length}</p>
                            <p className="mt-1 text-xs text-slate-600">Products available in admin</p>
                        </div>
                        <div className="rounded-lg border border-violet-200 bg-violet-100 p-2.5 text-violet-700">
                            <FaBoxOpen />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/80 via-white to-white p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-medium text-amber-700">Operations Mix</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(avgDeliveredOrderValue)}</p>
                            <p className="mt-1 text-xs text-slate-600">Avg delivered order value</p>
                        </div>
                        <div className="rounded-lg border border-amber-200 bg-amber-100 p-2.5 text-amber-700">
                            <FaTruck />
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-amber-700">Processing: {processingOrders.length}</div>
                        <div className="rounded-md border border-sky-200 bg-sky-50 px-2.5 py-2 text-sky-700">Shipped: {shippedOrders.length}</div>
                        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-emerald-700">Delivered: {deliveredOrders.length}</div>
                        <div className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-2 text-rose-700">Cancelled: {cancelledOrders.length}</div>
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
                        <p className="text-sm text-slate-600">Latest live orders sorted by creation time</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                            Showing {recentOrders.length} of {totalOrders}
                        </span>
                        <Link
                            to="/admin/orders"
                            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100"
                        >
                            View all
                            <FaArrowRight className="text-[11px]" />
                        </Link>
                    </div>
                </div>

                {recentOrders.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Order</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Created</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Items</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {recentOrders.map(order => (
                                    <tr key={order._id} className="transition-colors duration-150 hover:bg-sky-50/40">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                            <Link to={`/admin/orders/${order._id}`} className="text-sky-700 hover:underline">
                                                #{order._id.slice(-6)}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                            <div className="font-medium text-slate-900">{order.user?.name || "Unknown"}</div>
                                            <div className="text-xs text-slate-500">{order.user?.email || "No email"}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {new Date(order.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                            {order.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                                            {formatCurrency(order.totalPrice)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                                                {order.status || "Unknown"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="px-6 py-12 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sky-600">
                            <FaUsers className="text-sm" />
                        </div>
                        <h3 className="mt-4 text-base font-medium text-slate-900">No recent orders yet</h3>
                        <p className="mt-1 text-sm text-slate-600">
                            Once orders are placed, this section will display the latest live transactions.
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default AdminHomePage;

