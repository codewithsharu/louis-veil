import React, { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { logout, openPhoneAuthModal } from '../../redux/slices/authSlice';
import { getValidToken } from '../../utils/auth';

const ProtectedRoute = ({children, role}) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const {user} = useSelector((state)=>state.auth);
  const authRequestSentRef = useRef(false);
  const validToken = getValidToken();
  const isAuthenticated = Boolean(user && validToken);

  useEffect(() => {
    if (isAuthenticated) {
      authRequestSentRef.current = false;
      return;
    }

    if (authRequestSentRef.current) {
      return;
    }

    authRequestSentRef.current = true;
    const redirectPath = `${location.pathname}${location.search}` || '/';
    dispatch(logout());
    dispatch(openPhoneAuthModal({ redirectPath }));
  }, [dispatch, isAuthenticated, location.pathname, location.search]);

  if(!isAuthenticated){
    return <Navigate to="/" replace/>;
  }

  if(role && user.role !== role){
        return <Navigate to="/" replace/>;
    }

  return children;
}

export default ProtectedRoute