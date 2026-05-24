import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "../../utils/config";

const API_URL = API_BASE_URL; 
const getAuthHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem("userToken")}`,
});

//to fetch admin products
export const fetchAdminProducts = createAsyncThunk("adminProducts/fetchProducts",async()=>{
    const response = await axios.get(`${API_URL}/api/admin/products`,{
        headers: getAuthHeader(),
    })
    return response.data;
})

// create a new products
export const createProduct = createAsyncThunk("adminProducts/createProducts",async(productData)=>{
    const response = await axios.post(`${API_URL}/api/products`,productData,{
        headers: getAuthHeader(),
    })
    return response.data;
})

// upadte a products
export const upadateProduct = createAsyncThunk("adminProducts/updateProduct", async ({ id, productData }) => {
    const response = await axios.put(`${API_URL}/api/products/${id}`, productData, {
        headers: getAuthHeader(),
    });
    return response.data;
}); 

// delete a product
export const deleteProduct = createAsyncThunk("adminProducts/deleteProduct",async(id)=>{
    const response = await axios.delete(`${API_URL}/api/products/${id}`,{
        headers: getAuthHeader(),
    })
    return id;
})

const adminProductSlice = createSlice({
    name:"adminProducts",
    initialState:{
        products:[],
        loading:false,
        error:null
    },
    reducers:{},
    extraReducers:(builder)=>{
        builder
        .addCase(fetchAdminProducts.pending,(state)=>{
            state.loading = true;
        })
        .addCase(fetchAdminProducts.fulfilled,(state,action)=>{
            state.loading = false;
            state.products = action.payload;
        })
        .addCase(fetchAdminProducts.rejected,(state,action)=>{
            state.loading = false;
            state.error = action.error.message;
        })
        // Create product
        .addCase(createProduct.fulfilled,(state,action)=>{
            state.products.push(action.payload);
        })
        // update products
        .addCase(upadateProduct.fulfilled, (state, action) => {
            const index = state.products.findIndex((product) => product._id === action.payload._id);
            if (index !== -1) {
                state.products[index] = action.payload;
            }
        })
        // delete a product
        .addCase(deleteProduct.fulfilled,(state,action)=>{
            state.products = state.products.filter(
                (product) => product._id !== action.payload
            )
        })
    }
})

export default adminProductSlice.reducer;