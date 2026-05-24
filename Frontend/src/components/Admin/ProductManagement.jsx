import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiPlus, FiSearch } from "react-icons/fi";
import { deleteProduct, fetchAdminProducts } from "../../redux/slices/adminProductSlice";
import AdminPagination from "./AdminPagination";

const ITEMS_PER_PAGE = 15;

const ProductManagement = () => {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.adminProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchAdminProducts());
  }, [dispatch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      dispatch(deleteProduct(id));
    }
  };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;

    return products.filter((product) => {
      const productName = (product.name || "").toLowerCase();
      const sku = (product.sku || "").toLowerCase();
      const brand = (product.brand || "").toLowerCase();

      return productName.includes(q) || sku.includes(q) || brand.includes(q);
    });
  }, [products, searchQuery]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredProducts.length, currentPage]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const featuredCount = products.filter((product) => product.isFeatured).length;
  const publishedCount = products.filter((product) => product.isPublished).length;

  const formatCurrency = (value) => `₹${Number(value || 0).toFixed(2)}`;

  if (loading) {
    return (
      <div className="flex h-[55vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1450px] rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1450px] space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Product Management</h2>
            <p className="mt-1 text-sm text-slate-600">Maintain catalog details, pricing, and product visibility.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
              Total: {products.length}
            </span>
            <span className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700">
              Featured: {featuredCount}
            </span>
            <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
              Published: {publishedCount}
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
              placeholder="Search by name, SKU, or brand"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-3">
            <Link
              to="/admin/products/bulk"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
               Bulk Options
            </Link>
            <Link
              to="/admin/add-product"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-sky-600 bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700"
            >
              <FiPlus className="text-base" />
              Add Product
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto px-5 py-5">
          <table className="min-w-full divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Selling Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">SKU</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredProducts.length > 0 ? (
                paginatedProducts.map((product) => (
                  <tr key={product._id} className="transition-colors duration-200 hover:bg-sky-50/40">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-14 w-14 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                        <img
                          src={product.images?.[0]?.url || "/placeholder.jpg"}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                      {product.discountPrice ? formatCurrency(product.discountPrice) : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {product.sku || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/products/${product._id}/edit`}
                          className="inline-flex items-center rounded-md border border-sky-600 bg-sky-600 px-3 py-1.5 text-white transition-colors duration-200 hover:bg-sky-700"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-rose-700 transition-colors duration-200 hover:bg-rose-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <p className="text-sm font-medium text-slate-700">No products found for this query.</p>
                    <Link
                      to="/admin/add-product"
                      className="mt-3 inline-flex items-center rounded-md border border-sky-600 bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700"
                    >
                      Create Product
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 pb-5">
          <AdminPagination
            currentPage={currentPage}
            totalItems={filteredProducts.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      </section>
    </div>
  );
};

export default ProductManagement;
