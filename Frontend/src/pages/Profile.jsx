import React, { useEffect, useState } from "react";
import axios from "axios";
import MyOrdersPage from "./MyOrdersPage";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiCamera, FiChevronRight, FiLogOut, FiMapPin, FiPackage, FiUser } from "react-icons/fi";
import { logout, setUserInfo } from "../redux/slices/authSlice";
import { clearCart } from "../redux/slices/cartSlice";
import { API_BASE_URL } from "../utils/config";
import { getValidToken } from "../utils/auth";

const initialAddressForm = {
  label: "Home",
  firstName: "",
  lastName: "",
  address: "",
  city: "",
  postalCode: "",
  country: "India",
  phone: "",
  isDefault: false,
};

const PROFILE_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const PROFILE_MAX_SIZE_BYTES = 2 * 1024 * 1024;

const profileSections = [
  {
    key: "account",
    label: "Account Overview",
    subtitle: "Profile and quick actions",
    icon: FiUser,
  },
  {
    key: "addresses",
    label: "Manage Addresses",
    subtitle: "Shipping and billing details",
    icon: FiMapPin,
  },
  {
    key: "orders",
    label: "Order History",
    subtitle: "Track and review your orders",
    icon: FiPackage,
  },
];

const isValidProfileSection = (section) => {
  return profileSections.some((item) => item.key === section);
};

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const { section } = useParams();
  const activeSection = isValidProfileSection(section) ? section : "account";
  const dispatch = useDispatch();
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressActionLoadingId, setAddressActionLoadingId] = useState(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState(initialAddressForm);
  const [addressFeedback, setAddressFeedback] = useState({ type: "", message: "" });
  const [profileForm, setProfileForm] = useState({ name: user?.name || "" });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState({ type: "", message: "" });

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCart());
    navigate("/");
  };

  const getAuthHeaders = () => {
    const token = getValidToken();
    if (!token) {
      setAddressFeedback({ type: "error", message: "Session expired. Please login again." });
      handleLogout();
      return null;
    }
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchSavedAddresses = async () => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      setLoadingAddresses(true);
      const { data } = await axios.get(`${API_BASE_URL}/api/users/addresses`, { headers });
      setSavedAddresses(Array.isArray(data?.addresses) ? data.addresses : []);
    } catch (error) {
      setAddressFeedback({
        type: "error",
        message: error?.response?.data?.msg || "Could not load saved addresses.",
      });
    } finally {
      setLoadingAddresses(false);
    }
  };

  const resetAddressForm = () => {
    setAddressForm(initialAddressForm);
    setEditingAddressId(null);
  };

  const validateAddressForm = () => {
    const requiredFields = [
      "firstName",
      "lastName",
      "address",
      "city",
      "postalCode",
      "country",
      "phone",
    ];

    for (const field of requiredFields) {
      if (!String(addressForm[field] || "").trim()) {
        setAddressFeedback({
          type: "error",
          message: `Please fill ${field} before saving address.`,
        });
        return false;
      }
    }

    return true;
  };

  const buildAddressPayload = () => {
    return {
      label: addressForm.label || "Home",
      setAsDefault: Boolean(addressForm.isDefault),
      address: {
        firstName: addressForm.firstName,
        lastName: addressForm.lastName,
        address: addressForm.address,
        city: addressForm.city,
        postalCode: addressForm.postalCode,
        country: addressForm.country,
        phone: addressForm.phone,
      },
    };
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!validateAddressForm()) return;

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      setSavingAddress(true);
      const payload = buildAddressPayload();
      const response = editingAddressId
        ? await axios.put(`${API_BASE_URL}/api/users/addresses/${editingAddressId}`, payload, { headers })
        : await axios.post(`${API_BASE_URL}/api/users/addresses`, payload, { headers });

      setSavedAddresses(Array.isArray(response?.data?.addresses) ? response.data.addresses : []);
      setAddressFeedback({
        type: "success",
        message: editingAddressId ? "Address updated successfully." : "Address saved successfully.",
      });
      resetAddressForm();
    } catch (error) {
      setAddressFeedback({
        type: "error",
        message: error?.response?.data?.msg || "Could not save address.",
      });
    } finally {
      setSavingAddress(false);
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddressId(address._id);
    setAddressForm({
      label: address.label || "Home",
      firstName: address.firstName || "",
      lastName: address.lastName || "",
      address: address.address || "",
      city: address.city || "",
      postalCode: address.postalCode || "",
      country: address.country || "India",
      phone: address.phone || "",
      isDefault: Boolean(address.isDefault),
    });
    setAddressFeedback({ type: "", message: "" });
  };

  const handleSetDefaultAddress = async (addressId) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      setAddressActionLoadingId(addressId);
      const { data } = await axios.patch(
        `${API_BASE_URL}/api/users/addresses/${addressId}/default`,
        {},
        { headers }
      );
      setSavedAddresses(Array.isArray(data?.addresses) ? data.addresses : []);
      setAddressFeedback({ type: "success", message: "Default address updated." });
    } catch (error) {
      setAddressFeedback({
        type: "error",
        message: error?.response?.data?.msg || "Could not set default address.",
      });
    } finally {
      setAddressActionLoadingId(null);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      setAddressActionLoadingId(addressId);
      const { data } = await axios.delete(`${API_BASE_URL}/api/users/addresses/${addressId}`, { headers });
      setSavedAddresses(Array.isArray(data?.addresses) ? data.addresses : []);
      if (editingAddressId === addressId) {
        resetAddressForm();
      }
      setAddressFeedback({ type: "success", message: "Address deleted." });
    } catch (error) {
      setAddressFeedback({
        type: "error",
        message: error?.response?.data?.msg || "Could not delete address.",
      });
    } finally {
      setAddressActionLoadingId(null);
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!PROFILE_ALLOWED_TYPES.includes(file.type)) {
      setProfileFeedback({
        type: "error",
        message: "Only JPEG, PNG, WebP, and AVIF images are allowed.",
      });
      e.target.value = "";
      return;
    }

    if (file.size > PROFILE_MAX_SIZE_BYTES) {
      setProfileFeedback({
        type: "error",
        message: "Profile image is too large. Maximum size is 2MB.",
      });
      e.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setProfileImageFile(file);
    setProfileImagePreview((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }
      return previewUrl;
    });
    setProfileFeedback({ type: "", message: "" });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    const cleanName = String(profileForm.name || "").trim();
    if (!cleanName) {
      setProfileFeedback({ type: "error", message: "Name is required." });
      return;
    }

    if (cleanName.length > 50) {
      setProfileFeedback({ type: "error", message: "Name must be 50 characters or less." });
      return;
    }

    if (cleanName === user?.name && !profileImageFile) {
      setProfileFeedback({ type: "success", message: "No profile changes to update." });
      return;
    }

    const token = getValidToken();
    if (!token) {
      setProfileFeedback({ type: "error", message: "Session expired. Please login again." });
      handleLogout();
      return;
    }

    try {
      setSavingProfile(true);
      const formData = new FormData();
      formData.append("name", cleanName);
      if (profileImageFile) {
        formData.append("profileImage", profileImageFile);
      }

      const { data } = await axios.patch(`${API_BASE_URL}/api/users/profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data?.user) {
        dispatch(setUserInfo(data.user));
        setProfileForm({ name: data.user.name || "" });
      }

      setProfileImageFile(null);
      setProfileImagePreview((previous) => {
        if (previous) {
          URL.revokeObjectURL(previous);
        }
        return "";
      });

      setProfileFeedback({ type: "success", message: data?.msg || "Profile updated successfully." });
    } catch (error) {
      setProfileFeedback({
        type: "error",
        message: error?.response?.data?.msg || "Could not update profile.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    setProfileForm({ name: user?.name || "" });
  }, [user?.name]);

  useEffect(() => {
    return () => {
      if (profileImagePreview) {
        URL.revokeObjectURL(profileImagePreview);
      }
    };
  }, [profileImagePreview]);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    if (!section || !isValidProfileSection(section)) {
      navigate("/profile/account", { replace: true });
      return;
    }

    if (activeSection === "addresses") {
      fetchSavedAddresses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate, section, activeSection]);

  const sectionLinkClass = (key) => {
    const isActive = key === activeSection;
    return `group flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${
      isActive
        ? "border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-sm"
        : "border-gray-200 bg-white text-[#212121] hover:border-[#1A1A1A]/40"
    }`;
  };

  const userInitial = String(user?.name || "U").trim().charAt(0).toUpperCase();
  const displayedProfileImage = profileImagePreview || user?.profileImage || "";

  return (
    <div className="flex-grow bg-[#f1f3f6]">
      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr] lg:gap-6">
          <aside className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1A1A1A] text-sm font-bold text-white">
                  {displayedProfileImage ? (
                    <img
                      src={displayedProfileImage}
                      alt="Profile"
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    userInitial
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#878787]">Hello</p>
                  <h1 className="truncate text-base font-semibold text-[#212121]">{user?.name}</h1>
                  <p className="truncate text-xs text-[#878787]">{user?.email}</p>
                </div>
              </div>
            </div>

            <nav className="p-3 sm:p-4">
              <div className="flex flex-col gap-2">
                {profileSections.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.key === activeSection;

                  return (
                    <Link
                      key={item.key}
                      to={`/profile/${item.key}`}
                      className={sectionLinkClass(item.key)}
                    >
                      <span
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${
                          isActive ? "bg-white/20" : "bg-[#f5f7fa] text-[#1A1A1A]"
                        }`}
                      >
                        <Icon className="text-[15px]" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block truncate text-xs font-semibold uppercase tracking-[0.08em]">
                          {item.label}
                        </span>
                        <span
                          className={`block truncate text-[11px] ${
                            isActive ? "text-white/80" : "text-[#878787]"
                          }`}
                        >
                          {item.subtitle}
                        </span>
                      </span>
                      <FiChevronRight className={`${isActive ? "text-white/80" : "text-[#b0b0b0]"}`} />
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="border-t border-gray-100 p-3 sm:p-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-[#212121] bg-[#212121] px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-black"
              >
                <FiLogOut className="text-sm" />
                Logout
              </button>
            </div>
          </aside>

          <section className="space-y-4">
          {activeSection === "account" && (
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1A1A1A]">Account Overview</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#212121]">Welcome back, {user?.name}</h2>
              <p className="mt-1 text-sm text-[#878787]">Everything important is now split into clean sections for faster access.</p>

              <form onSubmit={handleSaveProfile} className="mt-5 rounded-lg border border-gray-200 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-[#f5f7fa] text-lg font-semibold text-[#1A1A1A]">
                      {displayedProfileImage ? (
                        <img src={displayedProfileImage} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        userInitial
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="profile-image-upload"
                        className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#212121] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
                      >
                        <FiCamera className="text-sm" />
                        Upload Photo
                      </label>
                      <input
                        id="profile-image-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        className="hidden"
                        onChange={handleProfileImageChange}
                      />
                      <p className="mt-1 text-[11px] text-[#878787]">JPEG, PNG, WebP, AVIF • Max 2MB</p>
                    </div>
                  </div>

                  <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#878787]">Name</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ name: e.target.value })}
                        placeholder="Enter your name"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-[#212121] focus:outline-none focus:border-[#1A1A1A]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#878787]">Phone</label>
                      <input
                        type="text"
                        value={user?.phone || user?.mobileNumber || ""}
                        readOnly
                        className="w-full rounded-md border border-gray-200 bg-[#f7f7f7] px-3 py-2 text-sm text-[#636363]"
                      />
                    </div>
                  </div>
                </div>

                {profileFeedback.message && (
                  <div
                    className={`mt-3 rounded-md border px-3 py-2 text-sm ${
                      profileFeedback.type === "error"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {profileFeedback.message}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="rounded-md bg-[#1A1A1A] px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white hover:bg-[#333333] disabled:opacity-60"
                  >
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Link
                  to="/profile/addresses"
                  className="group rounded-lg border border-gray-200 p-4 transition-colors hover:border-[#1A1A1A]/40"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#f5f7fa] text-[#1A1A1A]">
                        <FiMapPin />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[#212121]">Manage Addresses</p>
                        <p className="text-xs text-[#878787]">Add, edit, and choose default address</p>
                      </div>
                    </div>
                    <FiChevronRight className="text-[#b0b0b0] transition-colors group-hover:text-[#1A1A1A]" />
                  </div>
                </Link>
                <Link
                  to="/profile/orders"
                  className="group rounded-lg border border-gray-200 p-4 transition-colors hover:border-[#1A1A1A]/40"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#f5f7fa] text-[#1A1A1A]">
                        <FiPackage />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[#212121]">Order History</p>
                        <p className="text-xs text-[#878787]">Track deliveries and check past orders</p>
                      </div>
                    </div>
                    <FiChevronRight className="text-[#b0b0b0] transition-colors group-hover:text-[#1A1A1A]" />
                  </div>
                </Link>
              </div>
            </div>
          )}

          {activeSection === "addresses" && (
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1A1A1A]">Address Book</p>
                  <h2 className="text-xl font-semibold text-[#212121] mt-1">Manage Addresses</h2>
                  <p className="text-sm text-[#878787] mt-1">
                    {savedAddresses.length} saved {savedAddresses.length === 1 ? "address" : "addresses"}. Edit, delete, or mark default.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchSavedAddresses}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-[#4d4d4d] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
                >
                  Refresh
                </button>
              </div>

              {addressFeedback.message && (
                <div
                  className={`mb-4 rounded-md border px-3 py-2 text-sm ${
                    addressFeedback.type === "error"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {addressFeedback.message}
                </div>
              )}

              {loadingAddresses ? (
                <p className="text-sm text-[#878787]">Loading saved addresses...</p>
              ) : savedAddresses.length > 0 ? (
                <div className="space-y-3 mb-5">
                  {savedAddresses.map((address) => (
                    <div key={address._id} className="rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-[#1A1A1A]/40">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[#212121]">
                          {(address.firstName || "").trim()} {(address.lastName || "").trim()}
                        </p>
                        <span className="rounded-full border border-[#1A1A1A]/20 bg-[#f5f5f5] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#1A1A1A]">
                          {address.label || "Saved"}
                        </span>
                      </div>
                      {address.isDefault && (
                        <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-emerald-700">
                          Default Address
                        </p>
                      )}
                      <p className="mt-2 text-sm text-[#555]">
                        {address.address}, {address.city}, {address.postalCode}, {address.country}
                      </p>
                      <p className="mt-1 text-sm text-[#555]">Phone: {address.phone}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {!address.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultAddress(address._id)}
                            disabled={addressActionLoadingId === address._id}
                            className="rounded-md border border-[#1A1A1A] bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-[#1A1A1A] hover:bg-[#f5f5f5] disabled:opacity-60"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleEditAddress(address)}
                          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-gray-700 hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(address._id)}
                          disabled={addressActionLoadingId === address._id}
                          className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-red-700 hover:bg-red-50 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#878787] mb-5">No address saved yet. Add one below to speed up checkout.</p>
              )}

              <div className="border-t border-gray-200 pt-5">
                <h3 className="text-base font-semibold text-[#212121] mb-3">
                  {editingAddressId ? "Edit Address" : "Add New Address"}
                </h3>
                <form onSubmit={handleSaveAddress} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={addressForm.label}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, label: e.target.value }))}
                      placeholder="Label (Home, Work)"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#1A1A1A]"
                    />
                    <input
                      type="text"
                      value={addressForm.firstName}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, firstName: e.target.value }))}
                      placeholder="First Name"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#1A1A1A]"
                    />
                    <input
                      type="text"
                      value={addressForm.lastName}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Last Name"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#1A1A1A]"
                    />
                  </div>
                  <input
                    type="text"
                    value={addressForm.address}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Address"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#1A1A1A]"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                      placeholder="City"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#1A1A1A]"
                    />
                    <input
                      type="text"
                      value={addressForm.postalCode}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, postalCode: e.target.value }))}
                      placeholder="Postal Code"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#1A1A1A]"
                    />
                    <input
                      type="text"
                      value={addressForm.country}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, country: e.target.value }))}
                      placeholder="Country"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#1A1A1A]"
                    />
                    <input
                      type="text"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Phone"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#1A1A1A]"
                    />
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                      className="h-4 w-4 accent-[#1A1A1A]"
                    />
                    Set as default address
                  </label>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={savingAddress}
                      className="rounded-md bg-[#fb641b] px-5 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white hover:bg-[#f45b0f] disabled:opacity-60"
                    >
                      {savingAddress ? "Saving..." : editingAddressId ? "Update Address" : "Save Address"}
                    </button>
                    {editingAddressId && (
                      <button
                        type="button"
                        onClick={resetAddressForm}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-gray-700 hover:border-gray-400"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeSection === "orders" && <MyOrdersPage embedded />}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;