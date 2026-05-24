import React, { useEffect, useState } from 'react';
import Header from '../Common/Header';
import Footer from '../Common/Footer';
import { Link, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { openPhoneAuthModal } from '../../redux/slices/authSlice';
import PhoneLoginModal from '../Common/PhoneLoginModal';
import { useLocation } from 'react-router-dom';


const UserLayout = ({ isVisible }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const activePath = location.pathname;
  const activeHash = location.hash;

  const bottomNavItems = [
    { to: user ? '/profile' : null, label: 'Profile', icon: 'fa-user', action: 'profile' },
    { to: '/#categories-section', label: 'Category', icon: 'fa-th-large' },
    { to: '/#new-arrivals-section', label: 'New Arrivals', icon: 'fa-sparkles' },
    { to: '/wishlist', label: 'Wishlist', icon: 'fa-heart' },
  ];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isProductPage = location.pathname.startsWith('/product/');
  const hideFloatingButtons = isProductPage && isMobile;

  const openMobileLogin = () => {
    const redirectPath = `${location.pathname}${location.search}` || '/';
    dispatch(openPhoneAuthModal({ redirectPath }));
  };

  return (
    <div className="overflow-x-hidden pb-[92px] md:pb-0">
        <Header/>
        <main className="pt-2 md:pt-3">
          <Outlet/>
        </main>
        <Footer/>

        {/* WhatsApp button */}
        {!hideFloatingButtons && window.innerWidth >= 768 ? (
          <a
            href="https://wa.me/917460935762"
            target="_blank"
            rel="noopener noreferrer"
            className={`fixed bottom-8 left-8 w-12 h-12 bg-green-500 text-white rounded-full shadow-lg
            hover:bg-green-600 hover:scale-110 active:scale-95
            transition-all duration-300 ease-in-out
            flex items-center justify-center
            text-xl
            opacity-80 hover:opacity-100
            border-2 border-transparent hover:border-white`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-6 h-6 fill-current">
              <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
            </svg>
          </a>
        ) : null}

        {/* Bottom Nav */}
        <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
          <div className="border-t border-black/10 bg-white px-2 pb-[max(1.1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_28px_rgba(0,0,0,0.10)]">
            <div className="grid grid-cols-4 gap-0">
              {bottomNavItems.map((item) => {
                const hasHashTarget = Boolean(item.to && item.to.includes('#'));
                const targetPath = hasHashTarget ? item.to.split('#')[0] || '/' : item.to;
                const targetHash = hasHashTarget ? `#${item.to.split('#')[1] || ''}` : '';
                const isActive = item.to
                  ? (hasHashTarget
                    ? activePath === targetPath && activeHash === targetHash
                    : activePath === targetPath || (targetPath !== '/' && activePath.startsWith(targetPath)))
                  : activePath.startsWith('/profile');

                const isNewArrivals = item.label === 'New Arrivals';

                const textClass = 'font-sans text-[11px] font-semibold uppercase tracking-[0.06em] leading-none whitespace-nowrap';

                const itemClass = `flex flex-col items-center justify-center gap-2.5 py-1.5 rounded-2xl text-center transition-all duration-200 ${
                  isActive ? 'bg-black/[0.06]' : 'active:bg-black/[0.04]'
                }`;

                const renderIcon = () => {
                  if (item.label === 'Profile') {
                    return (
                      <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                        <path d="M4.271 18.346C4.271 18.346 6.5 15.5 12 15.5C17.5 15.5 19.73 18.346 19.73 18.346M12 12C12.7956 12 13.5587 11.6839 14.1213 11.1213C14.6839 10.5587 15 9.79565 15 9C15 8.20435 14.6839 7.44129 14.1213 6.87868C13.5587 6.31607 12.7956 6 12 6C11.2043 6 10.4413 6.31607 9.87868 6.87868C9.31607 7.44129 9 8.20435 9 9C9 9.79565 9.31607 10.5587 9.87868 11.1213C10.4413 11.6839 11.2043 12 12 12Z" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      </svg>
                    );
                  }

                  if (item.label === 'Category') {
                    return (
                      <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 18 18" fill="none">
                        <path d="M0 4.07815C0 5.15921 0.429552 6.19742 1.19421 6.96208C1.95887 7.72674 2.99708 8.15629 4.07815 8.15629C5.15921 8.15629 6.19742 7.72674 6.96208 6.96208C7.72674 6.19742 8.15629 5.15921 8.15629 4.07815C8.15629 2.99708 7.72674 1.95887 6.96208 1.19421C6.19742 0.429552 5.15921 0 4.07815 0C2.99708 0.00109856 1.96 0.430649 1.19534 1.19531C0.430677 1.95997 0.00109687 2.99708 0 4.07815ZM4.07812 1.12503C5.27233 1.12503 6.34898 1.84463 6.80601 2.94766C7.26304 4.05179 7.01036 5.3218 6.16662 6.16656C5.32177 7.01031 4.05176 7.26299 2.94772 6.80595C1.84469 6.34892 1.12508 5.27227 1.12508 4.07806C1.12728 2.44769 2.44774 1.12728 4.07812 1.12503Z" fill="#000000"/>
                        <path d="M16.3125 0H11.5312C10.5996 0.00109856 9.84485 0.755858 9.84375 1.6875V6.46874C9.84485 7.40038 10.5996 8.15514 11.5312 8.15623H16.3125C17.2441 8.15514 17.9989 7.40038 18 6.46874V1.6875C17.9989 0.755858 17.2441 0.00109687 16.3125 0ZM16.875 6.46874C16.875 6.77966 16.6234 7.03124 16.3125 7.03124H11.5312C11.2203 7.03124 10.9687 6.77965 10.9687 6.46874V1.6875C10.9687 1.37658 11.2203 1.125 11.5312 1.125H16.3125C16.6234 1.125 16.875 1.37658 16.875 1.6875V6.46874Z" fill="#000000"/>
                        <path d="M0 16.3125C0.00109856 17.2441 0.755858 17.9989 1.6875 18H6.46874C7.40038 17.9989 8.15514 17.2441 8.15623 16.3125V11.5312C8.15514 10.5996 7.40038 9.84485 6.46874 9.84375H1.6875C0.755858 9.84485 0.00109687 10.5996 0 11.5312V16.3125ZM1.125 11.5312C1.125 11.2203 1.37658 10.9687 1.6875 10.9687H6.46874C6.77966 10.9687 7.03124 11.2203 7.03124 11.5312V16.3125C7.03124 16.6234 6.77965 16.875 6.46874 16.875H1.6875C1.37658 16.875 1.125 16.6234 1.125 16.3125V11.5312Z" fill="#000000"/>
                        <path d="M16.3125 9.84375H11.5312C10.5996 9.84485 9.84485 10.5996 9.84375 11.5312V16.3125C9.84485 17.2441 10.5996 17.9989 11.5312 18H16.3125C17.2441 17.9989 17.9989 17.2441 18 16.3125V11.5312C17.9989 10.5996 17.2441 9.84485 16.3125 9.84375ZM16.875 16.3125C16.875 16.6234 16.6234 16.875 16.3125 16.875H11.5312C11.2203 16.875 10.9687 16.6234 10.9687 16.3125V11.5312C10.9687 11.2203 11.2203 10.9687 11.5312 10.9687H16.3125C16.6234 10.9687 16.875 11.2203 16.875 11.5312V16.3125Z" fill="#000000"/>
                      </svg>
                    );
                  }

                  if (item.label === 'New Arrivals') {
                    return (
                      <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 22 22" fill="none">
                        <path d="M2.75 11C8.49567 11 11 8.58275 11 2.75C11 8.58275 13.4869 11 19.25 11C13.4869 11 11 13.4869 11 19.25C11 13.4869 8.49567 11 2.75 11Z" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      </svg>
                    );
                  }

                  return (
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none">
                      <path d="M12 21C12 21 3 14.5 3 8.5C3 6.01 4.99 4 7.5 4C9.24 4 10.91 5.01 12 6.5C13.09 5.01 14.76 4 16.5 4C19.01 4 21 6.01 21 8.5C21 14.5 12 21 12 21Z" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  );
                };

                if (item.action === 'profile' && !user) {
                  return (
                    <button key={item.label} type="button" onClick={openMobileLogin} className={itemClass}>
                      {renderIcon()}
                      <span className={`${textClass} text-black`}>{item.label}</span>
                    </button>
                  );
                }

                if (item.action === 'profile' && user) {
                  return (
                    <Link key={item.label} to={item.to} className={itemClass}>
                      {renderIcon()}
                      <span className={`${textClass} text-black`}>{item.label}</span>
                    </Link>
                  );
                }

                return (
                  <Link key={item.label} to={item.to} className={itemClass}>
                    {renderIcon()}
                    <span className={`${textClass} text-black`}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
        <PhoneLoginModal />
    </div>
  );
}

export default UserLayout;