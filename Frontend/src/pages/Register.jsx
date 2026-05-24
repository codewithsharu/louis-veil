import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { openPhoneAuthModal } from "../redux/slices/authSlice";

const Register = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const redirectParam = new URLSearchParams(location.search).get("redirect") || "/";
        const decoded = decodeURIComponent(redirectParam);
        const redirectPath = decoded.startsWith("/") ? decoded : `/${decoded}`;

        dispatch(openPhoneAuthModal({ redirectPath }));
        navigate("/", { replace: true });
    }, [dispatch, location.search, navigate]);

    return null;
};

export default Register;
