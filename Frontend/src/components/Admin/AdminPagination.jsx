import React from "react";

const buildPageItems = (currentPage, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    pages.push("...");
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < totalPages - 1) {
    pages.push("...");
  }

  pages.push(totalPages);
  return pages;
};

const AdminPagination = ({ currentPage, totalItems, itemsPerPage = 15, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (!totalPages || totalPages <= 1) {
    return null;
  }

  const firstItem = (currentPage - 1) * itemsPerPage + 1;
  const lastItem = Math.min(currentPage * itemsPerPage, totalItems);
  const pageItems = buildPageItems(currentPage, totalPages);

  const goToPage = (page) => {
    if (typeof page !== "number") return;
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600">
        Showing <span className="font-medium text-slate-900">{firstItem}</span> to{" "}
        <span className="font-medium text-slate-900">{lastItem}</span> of{" "}
        <span className="font-medium text-slate-900">{totalItems}</span>
      </p>

      <div className="flex items-center gap-1.5">
        <button
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={currentPage === 1}
          onClick={() => goToPage(currentPage - 1)}
          type="button"
        >
          Prev
        </button>

        {pageItems.map((page, index) => {
          if (page === "...") {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
                ...
              </span>
            );
          }

          return (
            <button
              key={page}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                page === currentPage
                  ? "border-sky-600 bg-sky-600 text-white"
                  : "border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
              onClick={() => goToPage(page)}
              type="button"
            >
              {page}
            </button>
          );
        })}

        <button
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={currentPage === totalPages}
          onClick={() => goToPage(currentPage + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AdminPagination;
