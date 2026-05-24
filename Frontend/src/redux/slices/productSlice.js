import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "../../utils/config";

// Async thunk to fetch products by filters
export const fetchProductsByFilters = createAsyncThunk(
  "products/fetchByFilters",
  async ({ collection, size, color, gender, minPrice, maxPrice, sortBy, search, category, material, brand, limit }) => {
    const query = new URLSearchParams();
    if (collection) query.append("collection", collection);
    if (size) query.append("size", size);
    if (color) query.append("color", color);
    if (gender) query.append("gender", gender);
    if (minPrice) query.append("minPrice", minPrice);
    if (maxPrice) query.append("maxPrice", maxPrice);
    if (sortBy) query.append("sortBy", sortBy);
    if (search) query.append("search", search);
    if (category) query.append("category", category);
    if (material) query.append("material", material);
    if (brand) query.append("brand", brand);
    if (limit) query.append("limit", limit);

    const response = await axios.get(`${API_BASE_URL}/api/products?${query.toString()}`);
    return response.data;
  }
);

// Async thunk to fetch a single product by ID
export const fetchProductDetails = createAsyncThunk("products/fetchProductDetails", async (id) => {
  const response = await axios.get(`${API_BASE_URL}/api/products/${id}`);
  return response.data;
});

// Async thunk to update a product
export const updateProduct = createAsyncThunk("products/updateProduct", async ({ id, productData }) => {
  const response = await axios.put(`${API_BASE_URL}/api/products/${id}`, productData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("userToken")}`,
    },
  });
  return response.data;
});

// Async thunk to fetch similar products
export const fetchSimilarProduct = createAsyncThunk("products/fetchSimilarProducts", async ({ id }) => {
  const response = await axios.get(`${API_BASE_URL}/api/products/similar/${id}`);
  return response.data;
});

// Async thunk to fetch wishlist items
export const fetchWishlistItems = createAsyncThunk(
  "wishlist/fetchItems",
  async (userId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/wishlist/fetch/${userId}`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.msg || 'Failed to fetch wishlist');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      throw error;
    }
  }
);

// Async thunk to add item to wishlist
export const addToWishlist = createAsyncThunk(
  "wishlist/addItem",
  async ({ userId, productId }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/wishlist/${userId}/${productId}`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  }
);

// Async thunk to remove item from wishlist
export const removeFromWishlist = createAsyncThunk(
  "wishlist/removeItem",
  async ({ userId, productId }) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/wishlist/${userId}/${productId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  }
);

const productSlice = createSlice({
  name: "products",
  initialState: {
    products: [],
    selectedProduct: null,
    similarProducts: [],
    wishlistItems: [],
    loading: false,
    error: null,
    filters: {  
      category: "",
      size: "",
      color: "",
      gender: "",
      brand: "",
      minPrice: "",
      maxPrice: "",
      sortBy: "",
      search: "",
      material: "",
      collection: "",
    },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        category: "",
        size: "",
        color: "",
        gender: "",
        brand: "",
        minPrice: "",
        maxPrice: "",
        sortBy: "",
        search: "",
        material: "",
        collection: "",
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetching products with filters
      .addCase(fetchProductsByFilters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsByFilters.fulfilled, (state, action) => {
        state.loading = false;
        state.products = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchProductsByFilters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Handle fetching a single product
      .addCase(fetchProductDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Handle updating products
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const updatedProduct = action.payload;
        const index = state.products.findIndex((product) => product._id === updatedProduct._id);  
        if (index !== -1) {
          state.products[index] = updatedProduct;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Handle fetching similar products
      .addCase(fetchSimilarProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSimilarProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.similarProducts = action.payload;  
      })
      .addCase(fetchSimilarProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Handle wishlist operations
      .addCase(fetchWishlistItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlistItems.fulfilled, (state, action) => {
        state.loading = false;
        state.wishlistItems = action.payload?.items || [];
      })
      .addCase(fetchWishlistItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.wishlistItems = action.payload.items;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.wishlistItems = action.payload.items;
      });
  },
});

export const { setFilters, clearFilters } = productSlice.actions;
export default productSlice.reducer;
