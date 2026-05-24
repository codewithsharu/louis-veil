import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { IoMdClose } from "react-icons/io";
import { useGoogleLogin } from "@react-oauth/google";
import { mergeCart } from "../../redux/slices/cartSlice";
import {
  clearError,
  clearPhoneAuthState,
  closePhoneAuthModal,
  googleLogin,
  setUserInfo,
} from "../../redux/slices/authSlice";
import logoText from "../../assets/loginpage/logotext.png";
import { toast } from "sonner";
import { API_BASE_URL } from "../../utils/config";

const BRAND_COLOR = "#6A56D6";

const toSafeRedirectPath = (value) => {
  const candidate = String(value || "/").trim();
  return candidate.startsWith("/") ? candidate : "/";
};

const PhoneLoginModal = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    user,
    loading,
    error,
    guestId,
    isAuthModalOpen,
    authModalRedirect,
  } = useSelector((state) => state.auth);
  const { cart } = useSelector((state) => state.cart);

  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const postLoginHandledRef = useRef(false);

  const safeRedirectPath = useMemo(() => toSafeRedirectPath(authModalRedirect), [authModalRedirect]);

  useEffect(() => {
    if (!isAuthModalOpen) {
      postLoginHandledRef.current = false;
      setShowNamePrompt(false);
      setNameInput("");
    }
  }, [isAuthModalOpen]);

  useEffect(() => {
    if (!isAuthModalOpen || !user?._id || postLoginHandledRef.current) {
      return;
    }

    const isDefaultName =
      !user.name ||
      String(user.name).trim().toLowerCase() === "temporary" ||
      String(user.name).trim().toLowerCase().startsWith("customer ");

    if (isDefaultName && !showNamePrompt) {
      setShowNamePrompt(true);
      return;
    }

    if (showNamePrompt) return;

    postLoginHandledRef.current = true;

    const finalizeLoginFlow = async () => {
      try {
        if ((cart?.products || []).length > 0 && guestId) {
          await dispatch(mergeCart({ guestId, userId: user._id }));
        }
        toast.success(`Welcome, ${user.name}!`);
      } finally {
        dispatch(closePhoneAuthModal());
        dispatch(clearPhoneAuthState());
        navigate(safeRedirectPath, { replace: true });
      }
    };

    finalizeLoginFlow();
  }, [cart?.products, dispatch, guestId, isAuthModalOpen, navigate, safeRedirectPath, user, showNamePrompt]);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      dispatch(clearError());
      try {
        await dispatch(googleLogin({ credential: tokenResponse.access_token })).unwrap();
      } catch (_) {}
    },
    onError: () => toast.error("Google sign-in was cancelled or failed. Please try again.")
  });

  if (!isAuthModalOpen) {
    return null;
  }

  const closeModal = () => {
    dispatch(clearError());
    dispatch(clearPhoneAuthState());
    dispatch(closePhoneAuthModal());
    setShowNamePrompt(false);
    setNameInput("");
  };


  const handleNameSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanName = nameInput.trim();
    if (!cleanName) {
      toast.error("Please enter a valid name");
      return;
    }

    setSavingName(true);
    try {
      const token = localStorage.getItem("userToken");
      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: cleanName }),
      });

      if (res.ok) {
        const data = await res.json();
        dispatch(setUserInfo(data.user));
        setShowNamePrompt(false);
      } else {
        const errData = await res.json();
        toast.error(errData.msg || "Failed to update name");
      }
    } catch (_err) {
      toast.error("An error occurred while saving your name");
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-[1px]">
      <div className="relative w-full max-w-[480px] overflow-hidden rounded-[28px] bg-gradient-to-b from-[#fcfcff] via-[#cdc5ff] to-[#6A56D6] shadow-2xl">
        {/* Close button */}
        <button
          type="button"
          onClick={closeModal}
          className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#6A56D6]/35 bg-white/90 text-[#6A56D6] transition-colors hover:bg-white"
          aria-label="Close login"
        >
          <IoMdClose className="text-xl" />
        </button>

        {/* Brand logo */}
        <div className="px-5 pb-6 pt-12 sm:pt-16 text-center flex justify-center w-full">
          <img
            src={logoText}
            alt="Louis Veil"
            className="mx-auto h-auto w-[85%] max-w-[400px] object-contain drop-shadow-sm"
          />
        </div>

        {/* Card */}
        <div className="mx-4 mb-8 rounded-2xl bg-white/95 p-6 shadow-[0_14px_34px_rgba(31,18,79,0.22)] sm:mx-7 sm:p-7">
          <div className="space-y-5">
            {loading ? (
              /* Loading state */
              <div className="flex flex-col items-center justify-center py-10">
                <div className="flex items-center gap-2 mb-5 h-6">
                  <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2.5 w-2.5 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-3 w-3 rounded-full bg-[#6A56D6] animate-bounce" style={{ animationDelay: "300ms", marginTop: "-2px" }} />
                </div>
                <p className="text-[13px] tracking-wide text-gray-700">Signing you in&hellip;</p>
              </div>
            ) : showNamePrompt ? (
              /* Name prompt for first-time Google users */
              <form onSubmit={handleNameSubmit} className="flex flex-col gap-4 py-2">
                <p className="text-center text-[15px] font-medium text-gray-700">
                  What should we call you?
                </p>
                <div className="flex w-full overflow-hidden rounded-xl border-2 border-[#6A56D6]/20 bg-[#f7f6ff] items-center focus-within:border-[#6A56D6] focus-within:bg-white transition-all shadow-sm">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter your full name"
                    className="h-14 flex-1 px-5 text-[16px] text-center font-medium text-gray-800 placeholder:text-gray-400 outline-none min-w-0 w-full bg-transparent"
                    autoFocus
                    disabled={savingName}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!nameInput.trim() || savingName}
                  className="w-full rounded-xl py-4 text-[15px] font-bold tracking-wide text-white transition-all shadow-[0_4px_14px_rgba(106,86,214,0.35)] disabled:shadow-none disabled:cursor-not-allowed disabled:opacity-60 hover:opacity-90 hover:-translate-y-0.5 active:scale-[0.98]"
                  style={{ backgroundColor: BRAND_COLOR }}
                >
                  {savingName ? "Saving…" : "Continue"}
                </button>
              </form>
            ) : (
              /* Google sign-in */
              <>
                <div className="text-center space-y-1">
                  <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#6A56D6]">
                    Sign in to your account
                  </p>
                  <p className="text-[12px] text-gray-500">
                    Use your Google account to continue
                  </p>
                </div>

                {/* Centred Google button */}
                <div className="flex justify-center py-2">
                  <button
                    type="button"
                    onClick={() => login()}
                    className="flex w-fit items-center overflow-hidden rounded-[5px] bg-[#1f1f1f] pr-4 transition-colors hover:bg-[#2c2c2c] active:bg-[#1a1a1a] shadow-[0_1px_3px_rgba(0,0,0,0.15)]"
                  >
                    <div className="m-[1.5px] flex h-[38px] w-[38px] items-center justify-center rounded-[3px] bg-white">
                      <svg viewBox="0 0 48 48" className="h-[19px] w-[19px]">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        <path fill="none" d="M0 0h48v48H0z"/>
                      </svg>
                    </div>
                    <span className="ml-[18px] mr-1 text-[14px] font-medium tracking-wide text-white antialiased" style={{ fontFamily: 'inherit' }}>
                      Sign in with Google
                    </span>
                  </button>
                </div>

                {/* T&C */}
                <div className="pt-4 flex items-start justify-center gap-1.5 px-2 text-[11.5px] text-gray-500 border-t border-gray-100">
                  <span className="text-[#6A56D6] text-[13px] leading-none mt-[1px]">ⓘ</span>
                  <span className="leading-snug">
                    By continuing, you agree to Louis Veil&apos;s{" "}
                    <span
                      className="font-medium text-[#6A56D6] cursor-pointer hover:underline"
                      onClick={() => { closeModal(); navigate("/support/terms"); }}
                    >
                      T&amp;C
                    </span>{" "}
                    and{" "}
                    <span
                      className="font-medium text-[#6A56D6] cursor-pointer hover:underline"
                      onClick={() => { closeModal(); navigate("/support/privacy"); }}
                    >
                      Privacy Policy
                    </span>
                    .
                  </span>
                </div>
              </>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneLoginModal;
