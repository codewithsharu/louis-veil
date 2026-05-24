import { createSlice , createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "../../utils/config";

// async thunk to create a checkout session
export const createCheckout = createAsyncThunk("checkout/createCheckout",async (checkoutData, {rejectWithValue}) =>{
    try {
        const token = localStorage.getItem("userToken");
        if (!token) {
            return rejectWithValue({ message: "Session expired. Please login again." });
        }

        const response = await axios.post(`${API_BASE_URL}/api/checkout`,checkoutData,
            {
                headers:{
                    Authorization:`Bearer ${token}`
                }
            }
        );
        return response.data;
    } catch (error) {
        if (error.response?.status === 401) {
            return rejectWithValue({ message: "Session expired. Please login again." });
        }
        return rejectWithValue(error.response?.data || { message: error.message });
    }
});

const checkoutSlice = createSlice({
    name:"checkout",
    initialState:{
        checkout:null,
        loading:false,
        error:null,
    },
    reducers:{},
    extraReducers:(builder)=>{
        builder
        .addCase(createCheckout.pending, (state)=>{
            state.loading = true,
            state.error = null
        })
        .addCase(createCheckout.fulfilled, (state,action)=>{
            state.loading = false,
            state.checkout = action.payload; 
        })
        .addCase(createCheckout.rejected, (state, action)=>{
            state.loading = false,
            state.error = action.payload?.message || action.payload?.msg || "Checkout creation failed";
        });
    }
})

export default checkoutSlice.reducer;