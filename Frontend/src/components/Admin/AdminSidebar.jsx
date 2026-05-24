import React from "react";
import {
    FaBoxOpen,
    FaChevronRight,
    FaClipboardList,
    FaRegAddressCard,
    FaShieldAlt,
    FaSignOutAlt,
    FaUser,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { logout } from "../../redux/slices/authSlice";
import { clearCart } from "../../redux/slices/cartSlice";

const AdminSidebar = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const navSections = [
        {
            title: "Overview",
            items: [
                {
                    to: "/admin",
                    icon: FaRegAddressCard,
                    label: "Dashboard",
                    description: "Store pulse and quick actions",
                    end: true,
                },
            ],
        },
        {
            title: "Management",
            items: [
                {
                    to: "/admin/users",
                    icon: FaUser,
                    label: "Users",
                    description: "Customers and access control",
                },
                {
                    to: "/admin/add-product",
                    icon: FaBoxOpen,
                    label: "Add Product",
                    description: "Create and publish listings",
                },
                {
                    to: "/admin/products",
                    icon: FaBoxOpen,
                    label: "Manage Products",
                    description: "Edit catalog, stock, and pricing",
                },
                {
                    to: "/admin/orders",
                    icon: FaClipboardList,
                    label: "Orders",
                    description: "Fulfillment and payment tracking",
                },
                {
                    to: "/admin/promocodes",
                    icon: FaBoxOpen,
                    label: "Promo Codes",
                    description: "Manage discount codes and claims",
                },
            ],
        },
    ];

    const handleLogout = () => {
        dispatch(logout());
        dispatch(clearCart());
        navigate("/");
    };

    return (
        <div className="flex h-full flex-col border-r border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
            <div className="px-4 pt-5 pb-4">
                <Link
                    to="/admin"
                    className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-slate-700/90 bg-slate-900/95 px-3.5 py-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.45)]"
                >
                    <div className="grid h-11 w-11 place-items-center rounded-xl border border-slate-600 bg-gradient-to-br from-slate-700 to-slate-900 text-lg text-white transition-transform duration-300 group-hover:scale-105">
                        <FaShieldAlt />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                            Control Center
                        </p>
                        <h2 className="mt-0.5 whitespace-nowrap text-[1.25rem] font-semibold leading-tight text-white">
                            Admin Console
                        </h2>
                    </div>
                </Link>

                <div className="mt-3 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2.5 text-xs text-slate-300">
                    <p className="font-medium text-slate-100">Operations Workspace</p>
                    <p className="mt-0.5">Monitor users, products, and orders from one place.</p>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 pb-5">
                {navSections.map((section) => (
                    <div key={section.title} className="mb-5">
                        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            {section.title}
                        </p>
                        <div className="space-y-1.5">
                            {section.items.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        end={item.end}
                                        className="block"
                                    >
                                        {({ isActive }) => (
                                            <div
                                                className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-200 ${
                                                    isActive
                                                        ? "border-slate-200 bg-slate-100 text-slate-900 shadow-[0_10px_20px_rgba(0,0,0,0.35)]"
                                                        : "border-transparent text-slate-200 hover:border-slate-700 hover:bg-slate-800/90 hover:text-white"
                                                }`}
                                            >
                                                <div
                                                    className={`grid h-9 w-9 place-items-center rounded-lg text-sm ${
                                                        isActive
                                                            ? "bg-slate-900 text-white"
                                                            : "bg-slate-900 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-100"
                                                    }`}
                                                >
                                                    <Icon />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold">{item.label}</p>
                                                    <p
                                                        className={`truncate text-xs ${
                                                            isActive
                                                                ? "text-slate-600"
                                                                : "text-slate-400 group-hover:text-slate-200"
                                                        }`}
                                                    >
                                                        {item.description}
                                                    </p>
                                                </div>
                                                <FaChevronRight
                                                    className={`text-[11px] transition-transform duration-200 group-hover:translate-x-0.5 ${
                                                        isActive ? "text-slate-600" : "text-slate-400"
                                                    }`}
                                                />
                                            </div>
                                        )}
                                    </NavLink>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="mt-auto border-t border-slate-700 p-4">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-900 py-3 text-sm font-semibold text-slate-200 transition-all duration-200 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
                >
                    <FaSignOutAlt className="text-lg" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default AdminSidebar;