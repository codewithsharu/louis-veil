import { createSlice , createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "../../utils/config";

// helper function to load cart from localstorage
const loadCartFromStorage =()=>{
    const storedCart = localStorage.getItem("cart");
    return storedCart ? JSON.parse(storedCart) : {products: []};
};

// helper function to save cart to localstorage
const saveCartToStorage =(cart)=>{
    localStorage.setItem("cart",JSON.stringify(cart))
};

// Get auth headers if token exists
const getAuthHeaders = () => {
    const token = localStorage.getItem("userToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// fetch cart for a user or guest
export const fetchCart = createAsyncThunk("cart/fetchCart",async({userId, guestId},{rejectWithValue})=>{
    try {
        const response = await axios.get(`${API_BASE_URL}/api/cart`,{
            params:{ guestId },
            headers: getAuthHeaders(),
        })
        return response.data;
    } catch (error) {
        console.error(error);
        return rejectWithValue(error.response?.data)
    }
})

// add items to the cart
export const addToCart = createAsyncThunk("cart/addToCart",async({productId,quantity,size,color,customMeasurements,customMeasurementKey,guestId,userId},{rejectWithValue})=>{
    try {
        const response = await axios.post(`${API_BASE_URL}/api/cart`,{
            productId,
            quantity,
            size,
            color,
            customMeasurements,
            customMeasurementKey,
            guestId
        }, {
            headers: getAuthHeaders(),
        });
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data);
    }
});

// update the quantity of an item in the cart
export const updateCartItemQuantity = createAsyncThunk(
    "cart/updateCartItemQuantity",async({productId,quantity,guestId,userId,size,color,customMeasurementKey},{rejectWithValue})=>{
        try {
            const response = await axios.put(`${API_BASE_URL}/api/cart`,{
                productId,
                quantity,
                guestId,
                size,
                color,
                customMeasurementKey,
            }, {
                headers: getAuthHeaders(),
            })
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data)
        }
    }
)

// remove items from a cart
export const removeFromCart = createAsyncThunk("cart/removeFromCart",async({productId, guestId, userId, size, color, customMeasurementKey},{rejectWithValue})=>{
    try {
        const response = await axios({
            method: "DELETE",
            url:`${API_BASE_URL}/api/cart`,
            data: {productId, guestId, size, color, customMeasurementKey},
            headers: getAuthHeaders(),
        })
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data)
    }
});

// merge guest cart into user cart
export const mergeCart = createAsyncThunk("cart/mergeCart",async({guestId,userId},{rejectWithValue})=>{
    try {
        const response = await axios.post(`${API_BASE_URL}/api/cart/merge`,{guestId},{
            headers:{
                Authorization:`Bearer ${localStorage.getItem("userToken")}`,
            }
        });
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data)
    }
});

const cartSlice = createSlice({
    name: "cart",
    initialState:{
        cart: loadCartFromStorage(),
        loading:false,
        error:null,
    },
    reducers:{
        clearCart :(state)=>{
            state.cart = {products: []};
            localStorage.removeItem("cart");
        },
        clearCartError: (state) => {
            state.error = null;
        },
    },
    extraReducers:(builder)=>{
        builder
        .addCase(fetchCart.pending,(state)=>{
            state.loading = true;
            state.error = null;
        })
        .addCase(fetchCart.fulfilled,(state,action)=>{
            state.loading = false;
            state.cart = action.payload;
            saveCartToStorage(action.payload);
        })
        .addCase(fetchCart.rejected,(state,action)=>{
            state.loading = false;
            state.error = action.payload?.message || action.payload?.msg || action.error.message || "Failed to fetch cart"
        })
        // add to carr
        .addCase(addToCart.pending,(state)=>{
            state.loading = true;
            state.error = null;
        })
        .addCase(addToCart.fulfilled,(state,action)=>{
            state.loading = false;
            state.cart = action.payload;
            saveCartToStorage(action.payload);
        })
        .addCase(addToCart.rejected,(state,action)=>{
            state.loading = false;
            state.error = action.payload?.message || action.payload?.msg || "Failed to add to cart"
        })
        // upadtecart
        .addCase(updateCartItemQuantity.pending,(state)=>{
            state.loading = true;
            state.error = null;
        })
        .addCase(updateCartItemQuantity.fulfilled,(state,action)=>{
            state.loading = false;
            state.cart = action.payload;
            saveCartToStorage(action.payload);
        })
        .addCase(updateCartItemQuantity.rejected,(state,action)=>{
            state.loading = false;
            state.error = action.payload?.message || action.payload?.msg || "Failed to update qnt"
        })
        // remove from cart
        .addCase(removeFromCart.pending,(state)=>{
            state.loading = true;
            state.error = null;
        })
        .addCase(removeFromCart.fulfilled,(state,action)=>{
            state.loading = false;
            state.cart = action.payload;
            saveCartToStorage(action.payload);
        })
        .addCase(removeFromCart.rejected,(state,action)=>{
            state.loading = false;
            state.error = action.payload?.message || action.payload?.msg || "Failed to remove items from cart"
        })
        // merge cart
        .addCase(mergeCart.pending,(state)=>{
            state.loading = true;
            state.error = null;
        })
        .addCase(mergeCart.fulfilled,(state,action)=>{
            state.loading = false;
            state.cart = action.payload;
            saveCartToStorage(action.payload);
        })
        .addCase(mergeCart.rejected,(state,action)=>{
            state.loading = false;
            state.error = action.payload?.message || action.payload?.msg || "Failed to merge cart"
        })
    }
}) 

export const {clearCart, clearCartError} = cartSlice.actions;
export default cartSlice.reducer;