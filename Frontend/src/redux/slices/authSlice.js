import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "../../utils/config";
import { clearAuthStorage, isTokenValid } from "../../utils/auth";

// Retrieve user info and token from localStorage if available
const storedToken = localStorage.getItem("userToken");
const hasValidStoredToken = isTokenValid(storedToken);
const userFromStorage = hasValidStoredToken && localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null;

if (!hasValidStoredToken) {
    clearAuthStorage();
}

// Check for an existing guest ID in localStorage or generate a new one
const initialGuestId = localStorage.getItem("guestId") || `guest_${new Date().getTime()}`;
localStorage.setItem("guestId", initialGuestId);

const saveAuthSession = (data) => {
    localStorage.setItem("userInfo", JSON.stringify(data.user));
    localStorage.setItem("userToken", data.token);
};

// Initial state
const initialState = {
    user: userFromStorage,
    guestId: initialGuestId,
    loading: false,
    error: null,
    pendingVerification: false,
    pendingEmail: null,
    phoneOtpSent: false,
    pendingPhone: null,
    isAuthModalOpen: false,
    authModalRedirect: "/",
};

// Async Thunk for User Login
export const loginUser = createAsyncThunk("auth/loginUser", async (userData, { rejectWithValue }) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/users/login`, userData);
        saveAuthSession(response.data);

        return response.data.user;
    } catch (error) {
        return rejectWithValue(error.response?.data || { message: error.message });
    }
});

// Async Thunk for User Register (keeping for compatibility)
export const registerUser = createAsyncThunk("auth/registerUser", async (userData, { rejectWithValue }) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/users/register`, userData);
        saveAuthSession(response.data);

        return response.data.user;
    } catch (error) {
        return rejectWithValue(error.response?.data || { message: error.message });
    }
});

// Async Thunk for OTP Request
export const registerRequestOTP = createAsyncThunk(
    "auth/registerRequestOTP", 
    async ({ email }, { rejectWithValue }) => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/users/register/request-otp`, 
                { email }
            );
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);

// Async Thunk for OTP Verification and Registration
export const registerVerifyOTP = createAsyncThunk(
    "auth/registerVerifyOTP",
    async ({ email, otp, name, password }, { rejectWithValue }) => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/users/register/verify`,
                { email, otp, name, password }
            );
            saveAuthSession(response.data);
            
            return response.data.user;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);

// Google OAuth login
export const googleLogin = createAsyncThunk(
    "auth/googleLogin",
    async ({ credential }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/users/google-login`, {
                credential,
            });
            saveAuthSession(response.data);
            return response.data.user;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);

// Phone OTP initiate
export const initiatePhoneLogin = createAsyncThunk(
    "auth/initiatePhoneLogin",
    async ({ mobileNumber }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/users/phone-login/initiate`, {
                mobileNumber,
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);

// Phone OTP verify + login
export const verifyPhoneLogin = createAsyncThunk(
    "auth/verifyPhoneLogin",
    async ({ mobileNumber, otp }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/users/phone-login/verify`, {
                mobileNumber,
                otp,
            });
            saveAuthSession(response.data);
            return response.data.user;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);

// Async Thunk for Resending OTP
export const resendOTP = createAsyncThunk(
    "auth/resendOTP",
    async ({ email }, { rejectWithValue }) => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/users/register/resend-otp`,
                { email }
            );
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);

// Slice
const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.guestId = `guest_${new Date().getTime()}`; // Reset guest ID on logout
            clearAuthStorage();
            localStorage.setItem("guestId", state.guestId); // Set new guest ID in localStorage
            state.pendingPhone = null;
            state.phoneOtpSent = false;
            state.pendingVerification = false;
            state.pendingEmail = null;
        },
        setUserInfo: (state, action) => {
            state.user = action.payload;
            localStorage.setItem("userInfo", JSON.stringify(action.payload));
        },
        generateNewGuestId: (state) => {
            state.guestId = `guest_${new Date().getTime()}`;
            localStorage.setItem("guestId", state.guestId);
        },
        clearError: (state) => {
            state.error = null;
        },
        openPhoneAuthModal: (state, action) => {
            state.isAuthModalOpen = true;
            state.authModalRedirect = action.payload?.redirectPath || "/";
            state.error = null;
        },
        closePhoneAuthModal: (state) => {
            state.isAuthModalOpen = false;
            state.error = null;
        },
        clearPhoneAuthState: (state) => {
            state.pendingPhone = null;
            state.phoneOtpSent = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Login cases
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Login failed";
            })
            
            // Register cases (original)
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Registration failed";
            })
            
            // Request OTP cases
            .addCase(registerRequestOTP.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerRequestOTP.fulfilled, (state, action) => {
                state.loading = false;
                state.pendingVerification = true;
                state.pendingEmail = action.meta?.arg?.email || action.payload?.email || null;
            })
            .addCase(registerRequestOTP.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload.msg || "Failed to send verification code";
            })
            
            // Verify OTP cases
            .addCase(registerVerifyOTP.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerVerifyOTP.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.pendingVerification = false;
                state.pendingEmail = null;
            })
            .addCase(registerVerifyOTP.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload.msg || "Verification failed";
            })
            
            // Resend OTP cases
            .addCase(resendOTP.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(resendOTP.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(resendOTP.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload.msg || "Failed to resend verification code";
            })

            // Google login
            .addCase(googleLogin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(googleLogin.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthModalOpen = false;
            })
            .addCase(googleLogin.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.msg || action.payload?.message || "Google login failed";
            })

            // Phone OTP initiate
            .addCase(initiatePhoneLogin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(initiatePhoneLogin.fulfilled, (state, action) => {
                state.loading = false;
                state.phoneOtpSent = true;
                state.pendingPhone = action.payload?.mobileNumber || state.pendingPhone;
            })
            .addCase(initiatePhoneLogin.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.msg || action.payload?.message || "Failed to send OTP";
            })

            // Phone OTP verify
            .addCase(verifyPhoneLogin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(verifyPhoneLogin.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.phoneOtpSent = false;
                state.pendingPhone = null;
                state.pendingVerification = false;
                state.pendingEmail = null;
            })
            .addCase(verifyPhoneLogin.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.msg || action.payload?.message || "OTP verification failed";
            });
    },
});

export const {
    logout,
    setUserInfo,
    generateNewGuestId,
    clearError,
    openPhoneAuthModal,
    closePhoneAuthModal,
    clearPhoneAuthState,
} = authSlice.actions;
export default authSlice.reducer;