import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  addUser,
  deleteUser,
  fetchUsers,
  updateUser,
} from "../../redux/slices/adminSlice";
import AdminPagination from "./AdminPagination";

const ITEMS_PER_PAGE = 15;

const UserManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const { users = [], loading, error } = useSelector((state) => state.admin);

  // Redirect non-admin users
  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/");
    }
  }, [user?.role, navigate]);

  // Fetch users if admin is logged in
  useEffect(() => {
    if (user?.role === "admin") {
      dispatch(fetchUsers());
    }
  }, [dispatch, user?.role]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
  });

  const [isAddingUser, setIsAddingUser] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(users.length / ITEMS_PER_PAGE));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [users.length, currentPage]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(addUser(formData)).unwrap();
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "customer",
      });
      setIsAddingUser(false);
    } catch (error) {
      alert("Failed to add user: " + error.message);
    }
  };

  const handleRoleChange = (userId, newRole) => {
    dispatch(updateUser({ id: userId, role: newRole }));
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      dispatch(deleteUser(userId));
    }
  };

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = users.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const adminCount = users.filter((item) => item.role === "admin").length;
  const customerCount = users.length - adminCount;

  return (
    <div className="mx-auto w-full max-w-[1450px] space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Users Directory</h2>
            <p className="mt-1 text-sm text-slate-600">Manage admin/customer roles and account access.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
              Total: {users.length}
            </span>
            <span className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700">
              Admins: {adminCount}
            </span>
            <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
              Customers: {customerCount}
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-slate-700">All users</p>
          <button
            onClick={() => setIsAddingUser(!isAddingUser)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-sky-600 bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700"
          >
            <span>{isAddingUser ? "×" : "+"}</span>
            <span>{isAddingUser ? "Close Form" : "Add New User"}</span>
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-6">
            <div className="h-9 w-9 animate-spin rounded-full border-b-2 border-sky-600"></div>
          </div>
        )}

        {error && (
          <div className="mx-5 mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {isAddingUser && (
          <div className="mx-5 mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-base font-semibold text-slate-800">Create User</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
                  <input
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    type="text"
                    name="name"
                    value={formData.name}
                    required
                    onChange={handleChange}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                  <input
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    type="email"
                    name="email"
                    value={formData.email}
                    required
                    onChange={handleChange}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                  <input
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    type="password"
                    name="password"
                    value={formData.password}
                    required
                    onChange={handleChange}
                    placeholder="Enter password"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto px-5 py-5">
          <table className="min-w-full divide-y divide-slate-200 rounded-lg border border-slate-200 overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {users.length > 0 ? (
                paginatedUsers.map((managedUser) => (
                  <tr key={managedUser._id} className="transition-colors hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{managedUser.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {managedUser.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={managedUser.role}
                        onChange={(e) => handleRoleChange(managedUser._id, e.target.value)}
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteUser(managedUser._id)}
                        className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-rose-700 transition-colors hover:bg-rose-100"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-7 text-center text-sm text-slate-500">
                    {loading ? "Loading users..." : "No users found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 pb-5">
          <AdminPagination
            currentPage={currentPage}
            totalItems={users.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      </section>
    </div>
  );
};

export default UserManagement;

