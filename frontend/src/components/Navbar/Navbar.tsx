import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const navLinks = [
    { to: '/explore', label: 'Khám phá' },
    { to: '/create', label: 'Tạo Quiz' },
    { to: '/forum', label: 'Diễn đàn' },
  ];

  const handleLogout = () => {
    logout();
    setUserDropdown(false);
    navigate('/');
  };

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <nav className="navbar">
      <div className="container navbar__inner">
        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-icon">S</span>
          <span className="navbar__logo-text">StudentQuizz</span>
        </Link>

        {/* Desktop Nav */}
        <ul className="navbar__links">
          {navLinks.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={`navbar__link ${location.pathname.startsWith(link.to) ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Auth Buttons / User Menu */}
        <div className="navbar__auth">
          {isAuthenticated && user ? (
            <div className="navbar__user" onClick={() => setUserDropdown(!userDropdown)}>
              <div className="navbar__user-avatar">
                {getInitials(user.name)}
              </div>
              <span className="navbar__user-name">{user.name.split(' ').pop()}</span>
              <ChevronDown size={14} className={`navbar__chevron ${userDropdown ? 'open' : ''}`} />

              {userDropdown && (
                <div className="navbar__dropdown">
                  <div className="navbar__dropdown-header">
                    <div className="navbar__dropdown-avatar">{getInitials(user.name)}</div>
                    <div>
                      <div className="navbar__dropdown-name">{user.name}</div>
                      <div className="navbar__dropdown-email">{user.email}</div>
                    </div>
                  </div>
                  <div className="navbar__dropdown-divider" />
                  <Link to="/profile" className="navbar__dropdown-item" onClick={() => setUserDropdown(false)}>
                    <User size={15} /> Hồ sơ
                  </Link>
                  <button className="navbar__dropdown-item navbar__dropdown-item--danger" onClick={handleLogout}>
                    <LogOut size={15} /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Đăng nhập</Link>
              <Link to="/register" className="btn btn-primary">Đăng ký</Link>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
          id="mobile-menu-btn"
          className="navbar__hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="navbar__mobile-menu">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
          <div className="navbar__mobile-auth">
            {isAuthenticated ? (
              <button className="btn btn-outline" onClick={() => { handleLogout(); setMenuOpen(false); }}>
                <LogOut size={16} /> Đăng xuất
              </button>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost" onClick={() => setMenuOpen(false)}>Đăng nhập</Link>
                <Link to="/register" className="btn btn-primary" onClick={() => setMenuOpen(false)}>Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
