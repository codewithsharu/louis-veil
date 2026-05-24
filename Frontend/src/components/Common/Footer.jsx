import React from 'react';
import { IoLogoInstagram } from 'react-icons/io';
import { RiTwitterXLine } from 'react-icons/ri';
import { TbBrandMeta } from 'react-icons/tb';
import { Link } from 'react-router-dom';
import { HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker } from 'react-icons/hi';
import lvLogo from '../../assets/lvlogo.png';

const footerShopLinks = [
  { to: "/collections/all?gender=Men&category=Top Wear", label: "Men's Top Wear" },
  { to: "/collections/all?gender=Women&category=Top Wear", label: "Women's Top Wear" },
  { to: "/collections/all?gender=Men&category=Bottom Wear", label: "Men's Bottom Wear" },
  { to: "/collections/all?gender=Women&category=Bottom Wear", label: "Women's Bottom Wear" },
  { to: "/thrift", label: "Thrift Collection" },
];

const footerSupportLinks = [
  { to: "/support/terms", label: "Terms & Conditions" },
  { to: "/support/privacy", label: "Privacy Policy" },
  { to: "/support/shipping", label: "Shipping & Delivery" },
  { to: "/support/contact", label: "Contact Us" },
  { to: "/support/cancellation", label: "Cancellation & Refund" },
];

const footerAccountLinks = [
  { to: "/profile", label: "My Account" },
  { to: "/my-orders", label: "Order History" },
  { to: "/wishlist", label: "Wishlist" },
];

const socialLinks = [
  { href: "https://www.facebook.com/share/1AsKxdmEL7/", icon: TbBrandMeta, label: "Facebook" },
  { href: "https://www.instagram.com/louisveil.com_india?igsh=ZXNnaGQ2ZjBkOTZm", icon: IoLogoInstagram, label: "Instagram" },
  { href: "https://www.threads.com/@louisveil.com_india", icon: RiTwitterXLine, label: "Threads" },
];

const Footer = () => {
  const linkStyle = {
    fontSize: 12,
    color: '#b0a898',
    textDecoration: 'none',
    letterSpacing: '0.02em',
    lineHeight: 1,
    fontFamily: '"DM Sans", sans-serif',
    fontWeight: 300,
    transition: 'color 0.2s',
  };

  const headingStyle = {
    fontSize: 9,
    color: '#ffffff',
    letterSpacing: '0.26em',
    textTransform: 'uppercase',
    fontFamily: '"DM Sans", sans-serif',
    fontWeight: 500,
    marginBottom: 14,
    margin: '0 0 14px',
  };

  return (
    <footer style={{ background: '#2a1e14', fontFamily: '"DM Sans", sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Playfair+Display:wght@400;500&display=swap');
        .lv-footer-link:hover { color: #c9a052 !important; }
        .lv-social-btn:hover { border-color: #c9a052 !important; color: #c9a052 !important; }
        .lv-contact-link { word-break: break-word; }
        .lv-brand-mark {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }
        .lv-brand-socials {
          display: flex;
          gap: 8px;
          justify-content: center;
          width: 100%;
        }
        .lv-footer-grid {
          grid-template-columns: 1.8fr 1fr 1.2fr 1fr 1.2fr;
          gap: 32px 24px;
        }
        @media(max-width:768px){
          .lv-footer-grid { grid-template-columns: 1fr !important; gap: 30px !important; }
          .lv-brand-col { align-items: center !important; text-align: center !important; width: 100% !important; }
          .lv-brand-col > a { width: 100% !important; }
          .lv-brand-mark { width: 70px !important; height: 70px !important; }
          .lv-brand-socials { justify-content: center !important; }
          .lv-footer-section { text-align: center !important; }
          .lv-footer-list { align-items: center !important; }
          .lv-contact-item { justify-content: center !important; }
          .lv-bottom-bar { flex-direction: column !important; gap: 10px !important; text-align: center; }
          .lv-bottom-links { justify-content: center !important; flex-wrap: wrap !important; gap: 12px !important; }
        }
      `}</style>

      {/* ── Main columns ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '44px 32px 36px' }}>
        <div className="lv-footer-grid" style={{
          display: 'grid',
          alignItems: 'flex-start',
        }}>

          {/* Brand */}
          <div className="lv-brand-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
              {/* Big logo mark */}
              <span className="lv-brand-mark">
                <img src={lvLogo} alt="Louis Veil" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </span>
              {/* Brand name */}
              <span style={{
                fontFamily: '"Playfair Display", serif',
                color: '#e8dcc8',
                fontSize: 17,
                letterSpacing: '0.22em',
                fontWeight: 400,
                display: 'block',
                marginBottom: 4,
                whiteSpace: 'nowrap',
              }}>
                LOUIS VEIL
              </span>
              {/* Sub-label */}
              <span style={{
                fontFamily: '"DM Sans", sans-serif',
                color: '#6a5e54',
                fontSize: 8,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                fontWeight: 400,
              }}>
                Artificial Jewellery
              </span>
            </Link>
            {/* Tagline */}
            <p style={{ color: '#7a6e64', fontSize: 11, lineHeight: 1.8, fontWeight: 300, margin: '0 0 18px', letterSpacing: '0.02em', width: '100%', textAlign: 'center' }}>
              Timeless Beauty,<br />Effortless You.
            </p>
            {/* Social icons */}
            <div className="lv-brand-socials">
              {socialLinks.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  aria-label={s.label}
                  className="lv-social-btn"
                  style={{
                    width: 30, height: 30,
                    border: '1px solid rgba(255,255,255,0.14)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#7a6e64', textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}>
                  <s.icon style={{ width: 13, height: 13 }} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="lv-footer-section">
            <p style={headingStyle}>Quick Links</p>
            <ul className="lv-footer-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {footerShopLinks.map(link => (
                <li key={link.label}>
                  <Link to={link.to} className="lv-footer-link" style={linkStyle}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div className="lv-footer-section">
            <p style={headingStyle}>Customer Care</p>
            <ul className="lv-footer-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {footerSupportLinks.map(link => (
                <li key={link.label}>
                  <Link to={link.to} className="lv-footer-link" style={linkStyle}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div className="lv-footer-section">
            <p style={headingStyle}>Account</p>
            <ul className="lv-footer-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {footerAccountLinks.map(link => (
                <li key={link.label}>
                  <Link to={link.to} className="lv-footer-link" style={linkStyle}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Stay Connected / Contact */}
          <div className="lv-footer-section">
            <p style={headingStyle}>Stay Connected</p>
            <ul className="lv-footer-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <li className="lv-contact-item" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <HiOutlinePhone style={{ color: '#7a6e64', width: 12, height: 12, marginTop: 1.5, flexShrink: 0 }} />
                <a href="tel:+917460935762" className="lv-footer-link" style={linkStyle}>+91 7460935762</a>
              </li>
              <li className="lv-contact-item" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <HiOutlineMail style={{ color: '#7a6e64', width: 12, height: 12, marginTop: 1.5, flexShrink: 0 }} />
                <a href="mailto:louisveil.com@gmail.com" className="lv-footer-link lv-contact-link" style={{ ...linkStyle, wordBreak: 'break-all' }}>
                  louisveil.com@gmail.com
                </a>
              </li>
              <li className="lv-contact-item" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <HiOutlineLocationMarker style={{ color: '#7a6e64', width: 12, height: 12, marginTop: 1.5, flexShrink: 0 }} />
                <span style={{ ...linkStyle, cursor: 'default' }}>Fatehpur, Uttar Pradesh, India</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* ── Gold divider ── */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,160,82,0.25), transparent)' }} />
      </div>

      {/* ── Bottom bar ── */}
      <div className="lv-bottom-bar" style={{
        maxWidth: 960, margin: '0 auto', padding: '16px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <p style={{ margin: 0, color: '#4a3e34', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 400 }}>
          © {new Date().getFullYear()} Louis Veil. All Rights Reserved.
        </p>
        <p style={{ margin: 0, color: '#4a3e34', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Nikhil Verma
        </p>
        <div className="lv-bottom-links" style={{ display: 'flex', gap: 20 }}>
          {[
            { to: '/support/privacy', label: 'Privacy' },
            { to: '/support/terms', label: 'Terms' },
            { to: '/support/shipping', label: 'Shipping' },
          ].map(l => (
            <Link key={l.label} to={l.to} className="lv-footer-link"
              style={{ color: '#4a3e34', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none' }}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>

    </footer>
  );
};

export default Footer;