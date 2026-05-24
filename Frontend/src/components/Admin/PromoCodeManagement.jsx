import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { API_BASE_URL } from "../../utils/config";

const PromoCodeManagement = () => {
  const [promoCodes, setPromoCodes] = useState([]);
  const [claims, setClaims] = useState([]);
  const [activeTab, setActiveTab] = useState("list"); // list, create, claims
  const { user } = useSelector((state) => state.auth);

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    type: "public",
    discountType: "amount",
    discountValue: 0,
    usageLimit: 0,
    expiry: "",
    assignedMobile: "",
    isActive: true,
  });

  const getHeaders = () => {
    return {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("userToken")}`,
      },
    };
  };

  const fetchPromoCodes = async () => {
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/api/promocode/list`,
        getHeaders()
      );
      setPromoCodes(data);
    } catch (error) {
      toast.error("Failed to fetch promo codes");
    }
  };

  const fetchClaims = async () => {
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/api/promocode/claims`,
        getHeaders()
      );
      setClaims(data);
    } catch (error) {
      toast.error("Failed to fetch promo code claims");
    }
  };

  useEffect(() => {
    if (activeTab === "list") fetchPromoCodes();
    if (activeTab === "claims") fetchClaims();
  }, [activeTab]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_BASE_URL}/api/promocode/create`,
        formData,
        getHeaders()
      );
      toast.success("Promo code created successfully!");
      setFormData({
        code: "",
        type: "public",
        discountType: "amount",
        discountValue: 0,
        usageLimit: 0,
        expiry: "",
        assignedMobile: "",
        isActive: true,
      });
      setActiveTab("list");
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to create promo code");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Promo Code Management</h1>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-4 py-2 rounded ${activeTab === "list" ? "bg-black text-white" : "bg-gray-200"}`}
        >
          Promo Codes
        </button>
        <button
          onClick={() => setActiveTab("create")}
          className={`px-4 py-2 rounded ${activeTab === "create" ? "bg-black text-white" : "bg-gray-200"}`}
        >
          Create New
        </button>
        <button
          onClick={() => setActiveTab("claims")}
          className={`px-4 py-2 rounded ${activeTab === "claims" ? "bg-black text-white" : "bg-gray-200"}`}
        >
          Usage Claims
        </button>
      </div>

      {activeTab === "create" && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md max-w-2xl">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Code</label>
              <input type="text" name="code" value={formData.code} onChange={handleInputChange} className="w-full border p-2 rounded uppercase" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select name="type" value={formData.type} onChange={handleInputChange} className="w-full border p-2 rounded">
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Discount Type</label>
              <select name="discountType" value={formData.discountType} onChange={handleInputChange} className="w-full border p-2 rounded">
                <option value="amount">Amount (Flat)</option>
                <option value="percent">Percent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Discount Value</label>
              <input type="number" name="discountValue" value={formData.discountValue} onChange={handleInputChange} className="w-full border p-2 rounded" min="0" required />
            </div>
          </div>

          {formData.type === "private" && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Assigned Mobile Number (E164 format, e.g. +919876543210)</label>
              <input type="text" name="assignedMobile" value={formData.assignedMobile} onChange={handleInputChange} className="w-full border p-2 rounded" required />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Usage Limit (0 for unlimited)</label>
              <input type="number" name="usageLimit" value={formData.usageLimit} onChange={handleInputChange} className="w-full border p-2 rounded" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expiry Date</label>
              <input type="date" name="expiry" value={formData.expiry} onChange={handleInputChange} className="w-full border p-2 rounded" required />
            </div>
          </div>

          <div className="mb-6 flex items-center">
            <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="mr-2" />
            <label className="text-sm font-medium">Is Active</label>
          </div>

          <button type="submit" className="w-full bg-black text-white p-3 rounded font-medium hover:bg-gray-800">
            Create Promo Code
          </button>
        </form>
      )}

      {activeTab === "list" && (
        <div className="bg-white overflow-hidden shadow-md rounded">
          <table className="min-w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Uses</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {promoCodes.map((promo) => (
                <tr key={promo._id} className="border-t">
                  <td className="px-4 py-3 font-semibold">{promo.code}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${promo.type === 'private' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {promo.type}
                    </span>
                    {promo.type === 'private' && <div className="text-xs text-gray-500 mt-1">{promo.assignedMobile}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {promo.discountType === 'amount' ? `₹${promo.discountValue}` : `${promo.discountValue}%`}
                  </td>
                  <td className="px-4 py-3">{promo.usageCount} / {promo.usageLimit || '∞'}</td>
                  <td className="px-4 py-3">{new Date(promo.expiry).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {promo.isActive ? (
                      <span className="text-green-600 font-medium">Active</span>
                    ) : (
                      <span className="text-red-600 font-medium">Inactive</span>
                    )}
                  </td>
                </tr>
              ))}
              {promoCodes.length === 0 && (
                <tr><td colSpan="6" className="text-center py-4 text-gray-500">No promo codes found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "claims" && (
        <div className="bg-white overflow-hidden shadow-md rounded">
          <table className="min-w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Discount Saved</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => (
                <tr key={claim._id} className="border-t">
                  <td className="px-4 py-3 font-semibold">{claim.code}</td>
                  <td className="px-4 py-3">
                    {claim.user?.name || "Unknown"}
                    <div className="text-xs text-gray-500">{claim.user?.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">{claim.mobile}</td>
                  <td className="px-4 py-3 text-green-600 font-medium">₹{claim.discountApplied.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm capitalize">{claim.status}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(claim.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {claims.length === 0 && (
                <tr><td colSpan="6" className="text-center py-4 text-gray-500">No claims found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PromoCodeManagement;
