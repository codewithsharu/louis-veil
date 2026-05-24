import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HiOutlineUser, HiOutlineShoppingBag, HiOutlineHeart, HiOutlineSearch } from "react-icons/hi";
import { HiBars3BottomRight } from "react-icons/hi2";
import CartDrawer from "../Layout/CartDrawer";
import SearchBar from './SearchBar';
import { IoMdClose } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { openPhoneAuthModal } from "../../redux/slices/authSlice";
import lvLogo from "../../assets/lvlogo.png";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/collections/all", label: "Collection" },
  { to: "/community", label: "About Us" },
  { to: "/support/contact", label: "Contact" },
];

const Navbar = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const { cart } = useSelector((state) => state.cart);
  const [searchQuery, setSearchQuery] = useState("");
  const [navVisible, setNavVisible] = useState(true);
  const [showPromoBar, setShowPromoBar] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("lv_hide_promo_bar") !== "true";
  });
  const lastScrollY = useRef(0);
  const cartItemCount = cart?.products?.reduce((total, product) => total + product.quantity, 0) || 0;

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;

      if (currentY < 40) {
        setNavVisible(true);
        lastScrollY.current = currentY;
        return;
      }

      if (currentY < lastScrollY.current - 2) {
        setNavVisible(true);
      } else if (currentY > lastScrollY.current + 4) {
        setNavVisible(false);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = navDrawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [navDrawerOpen]);

  const toggleNavDrawer = () => setNavDrawerOpen(!navDrawerOpen);
  const toggleCartDrawer = () => setDrawerOpen(!drawerOpen);
  const openAuthModalForAccount = () => {
    const redirectPath = `${location.pathname}${location.search}` || "/";
    dispatch(openPhoneAuthModal({ redirectPath }));
  };

  const runSearch = (query) => {
    const trimmed = query.trim();
    if (!trimmed) {
      navigate('/collections/all');
      return;
    }
    navigate(`/collections/all?search=${encodeURIComponent(trimmed)}`);
  };

  const handleDesktopSearch = () => {
    runSearch(searchQuery);
    setSearchQuery("");
  };

  const handleDrawerSearch = (e) => {
    e.preventDefault();
    runSearch(searchQuery);
    setSearchQuery("");
    setNavDrawerOpen(false);
  };

  const handleClosePromoBar = () => {
    setShowPromoBar(false);
    localStorage.setItem("lv_hide_promo_bar", "true");
  };

  return (
    <>
      <div
        className={`fixed top-0 left-0 right-0 z-50 transform transition-transform duration-300 ease-out ${
          navVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        {showPromoBar && (
          <div className="relative border-b border-[#D8BE8B]/40 bg-[#E8D8C3] py-1.5 text-center font-sans text-[9px] font-medium uppercase tracking-[0.18em] text-[#6e5140] md:text-[10px] md:tracking-[0.22em]">
            <span>Free shipping on all orders</span>
            <button
              type="button"
              onClick={handleClosePromoBar}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#6e5140] transition-colors hover:text-[#3B2416]"
              aria-label="Close shipping notice"
            >
              <IoMdClose className="h-4 w-4" />
            </button>
          </div>
        )}

        <nav className="border-b border-[#D8BE8B]/40 bg-[#F3E8DA]">
          <div className="mx-auto max-w-[1380px] px-4 md:px-8">
            <div className="hidden h-[102px] items-center justify-between md:flex">
              <Link to="/" className="flex min-w-[270px] flex-col items-center justify-center leading-none">
                <img src={lvLogo} alt="Louis Veil monogram" className="h-16 w-16 object-contain" />
                <p className="mt-1 font-cinzel text-[21px] font-medium tracking-[0.075em] text-[#3B2416]">LOUIS VEIL</p>
                <p className="mt-1 font-sans text-[6px] font-medium tracking-[0.2em] text-[#8a6b52]">ARTIFICIAL JEWELLERY</p>
              </Link>

              <div className="flex items-center gap-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    className="font-cinzel text-[14px] font-medium uppercase tracking-[0.09em] text-[#3B2416] transition-colors hover:text-[#C6A46A]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="flex min-w-[270px] items-center justify-end gap-1.5">
                <div className="p-2 text-[#3B2416] transition-colors hover:text-[#C6A46A]">
                  <SearchBar />
                </div>
                {user ? (
                  <Link
                    to="/profile"
                    className="p-2 text-[#3B2416] transition-colors hover:text-[#C6A46A]"
                    aria-label="My account"
                  >
                    <HiOutlineUser className="h-[23px] w-[23px]" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={openAuthModalForAccount}
                    className="p-2 text-[#3B2416] transition-colors hover:text-[#C6A46A]"
                    aria-label="Login"
                  >
                    <HiOutlineUser className="h-[23px] w-[23px]" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleCartDrawer}
                  className="relative p-2 text-[#3B2416] transition-colors hover:text-[#C6A46A]"
                  aria-label="Open cart"
                >
                  <HiOutlineShoppingBag className="h-[23px] w-[23px]" />
                  {cartItemCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#3B2416] px-0.5 font-sans text-[9px] font-medium leading-none text-[#F3E8DA]">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="flex h-[84px] items-center justify-between md:hidden">
              <button
                onClick={toggleNavDrawer}
                className="p-1.5 text-[#3B2416]"
                aria-label="Open menu"
              >
                <HiBars3BottomRight className="h-6 w-6" />
              </button>

              <Link to="/" className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center leading-none">
                <img src={lvLogo} alt="Louis Veil monogram" className="h-11 w-11 object-contain" />
                <span className="mt-1 font-cinzel text-[12px] tracking-[0.07em] text-[#3B2416]">LOUIS VEIL</span>
              </Link>

              <div className="flex items-center gap-1">
                <div className="p-1.5 text-[#3B2416]">
                  <SearchBar />
                </div>
                <button
                  type="button"
                  onClick={toggleCartDrawer}
                  className="relative p-1.5 text-[#3B2416]"
                  aria-label="Open cart"
                >
                  <HiOutlineShoppingBag className="h-[21px] w-[21px]" />
                  {cartItemCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#3B2416] px-0.5 font-sans text-[9px] font-medium leading-none text-[#F3E8DA]">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </nav>
      </div>

      <div className={showPromoBar ? "h-[96px] md:h-[108px]" : "h-[72px] md:h-[86px]"} />

      <CartDrawer drawerOpen={drawerOpen} toggleCartDrawer={toggleCartDrawer} />

      {/* ── Mobile overlay ── */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 md:hidden ${
          navDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleNavDrawer}
      />

      <div
        className={`fixed top-0 right-0 z-50 h-full w-[320px] max-w-[88vw] transform bg-[#F3E8DA] transition-transform duration-400 ease-out md:hidden ${
          navDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-[#D8BE8B]/45 px-6">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 overflow-hidden rounded-full border border-[#C6A46A]/70 bg-[#E8D8C3] p-[2px]">
              <img src={lvLogo} alt="Louis Veil monogram" className="h-full w-full object-contain" />
            </div>
            <span className="font-serif text-lg tracking-[0.06em] text-[#3B2416]">LOUIS VEIL</span>
          </div>
          <button onClick={toggleNavDrawer} className="p-2 hover:opacity-60 transition-opacity">
            <IoMdClose className="h-5 w-5 text-[#6e5140]" />
          </button>
        </div>

        <nav className="py-5">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={toggleNavDrawer}
              className="block px-8 py-3 font-sans text-[12px] font-medium uppercase tracking-[0.2em] text-[#3B2416] transition-colors hover:bg-[#E8D8C3] hover:text-[#C6A46A]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="px-6 pb-4">
          <form onSubmit={handleDrawerSearch} className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jewellery..."
              className="w-full rounded-full border border-[#D8BE8B] bg-white py-2 pl-5 pr-10 font-sans text-[13px] text-[#3B2416] placeholder-[#9f8770] outline-none"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-3.5 text-[#3B2416] transition-opacity hover:opacity-60"
            >
              <HiOutlineSearch className="h-4 w-4" />
            </button>
          </form>
        </div>

        <div className="mx-8 h-px bg-gradient-to-r from-transparent via-[#D8BE8B] to-transparent" />

        <div className="space-y-3 px-8 py-5">
          <Link to="/wishlist" onClick={toggleNavDrawer} className="flex items-center gap-3 py-1.5 font-sans text-[12px] font-medium uppercase tracking-[0.15em] text-[#3B2416] transition-colors hover:text-[#C6A46A]">
            <HiOutlineHeart className="h-4 w-4" /> Wishlist
          </Link>
          {user ? (
            <Link to="/profile" onClick={toggleNavDrawer} className="flex items-center gap-3 py-1.5 font-sans text-[12px] font-medium uppercase tracking-[0.15em] text-[#3B2416] transition-colors hover:text-[#C6A46A]">
              <HiOutlineUser className="h-4 w-4" />
              My Account
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                toggleNavDrawer();
                openAuthModalForAccount();
              }}
              className="flex w-full items-center gap-3 py-1.5 font-sans text-[12px] font-medium uppercase tracking-[0.15em] text-[#3B2416] transition-colors hover:text-[#C6A46A]"
            >
              <HiOutlineUser className="h-4 w-4" /> My Account
            </button>
          )}
          {user && user.role === "admin" && (
            <Link to="/admin" onClick={toggleNavDrawer} className="flex items-center gap-3 py-1.5 font-sans text-[12px] font-medium uppercase tracking-[0.15em] text-[#3B2416] transition-colors hover:text-[#C6A46A]">
              <span className="w-4 h-4 flex items-center justify-center text-[10px]">⚙</span> Admin
            </Link>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
