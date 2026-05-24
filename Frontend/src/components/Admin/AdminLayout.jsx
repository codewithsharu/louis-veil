import React, { useEffect, useRef, useState } from 'react'
import { FaBars } from 'react-icons/fa'
import AdminSidebar from './AdminSidebar'
import { Outlet, useLocation } from 'react-router-dom'

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const { pathname, search } = useLocation()
    const mainContentRef = useRef(null)

    const getSectionMeta = () => {
        if (pathname === '/admin') {
            return { title: 'Dashboard', subtitle: 'Business summary and recent activity' }
        }
        if (pathname.startsWith('/admin/users')) {
            return { title: 'User Management', subtitle: 'Control access, roles, and accounts' }
        }
        if (pathname.startsWith('/admin/add-product')) {
            return { title: 'Add Product', subtitle: 'Create and publish a new catalog entry' }
        }
        if (pathname.startsWith('/admin/products')) {
            return { title: 'Product Management', subtitle: 'Catalog, pricing, and stock control' }
        }
        if (pathname.startsWith('/admin/orders/')) {
            return { title: 'Order Details', subtitle: 'Detailed view of a single order' }
        }
        if (pathname.startsWith('/admin/orders')) {
            return { title: 'Order Management', subtitle: 'Track fulfillment and payment status' }
        }

        return { title: 'Admin Workspace', subtitle: 'Centralized operations and controls' }
    }

    const sectionMeta = getSectionMeta()

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen)
    }

    useEffect(() => {
        if (mainContentRef.current) {
            mainContentRef.current.scrollTo({ top: 0, left: 0, behavior: 'auto' })
        }

        setIsSidebarOpen(false)
    }, [pathname, search])

    return (
        <div className='relative min-h-screen bg-slate-100 md:h-screen md:overflow-hidden'>
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3 text-white">
                <div className="flex items-center gap-3">
                <button className="md:hidden" onClick={toggleSidebar}>
                    <FaBars size={24} />
                </button>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300">Admin Workspace</p>
                        <h1 className='text-lg font-semibold md:text-xl'>{sectionMeta.title}</h1>
                    </div>
                </div>
                <p className="hidden text-sm text-slate-300 md:block">{sectionMeta.subtitle}</p>
            </div>

            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <button
                    aria-label="Close admin sidebar"
                    className="fixed inset-0 z-20 bg-black/50 md:hidden"
                    onClick={toggleSidebar}
                    type="button"
                ></button>
            )}

            {/* Sidebar */}
            <div className={`fixed top-0 left-0 z-30 h-screen w-72 text-white transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 md:translate-x-0`}>
                    <AdminSidebar />
            </div>

            {/* Main content */}
            <div ref={mainContentRef} data-scroll-container="true" className="min-h-[calc(100vh-64px)] overflow-auto bg-slate-100 px-6 pt-6 pb-12 md:ml-72 md:h-screen md:min-h-0 md:pb-14">
                <Outlet/>
            </div>
        </div>
    )
}

export default AdminLayout
