import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAppContext } from '../context/AppContext';
import { Sun, Moon, Languages, Menu, X, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import logoMark from '../assets/logo_mark.png';

export const Navbar: React.FC = () => {
  const { t, language, setLanguage, languages } = useLanguage();
  const { user, logout, switchUserRole } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('care_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('care_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const dashboardRoute = (user?.userType === 'doctor' || user?.userType === 'hospital') ? '/doctor-dashboard' : '/dashboard';

  const handleRoleSwitch = (newRole: 'patient' | 'doctor' | 'hospital') => {
    switchUserRole(newRole);
    if (newRole === 'doctor' || newRole === 'hospital') {
      navigate('/doctor-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const menuItems = [
    { label: t('nav.hospitals'), path: '/hospitals' },
    { label: t('nav.medicalStores'), path: '/medical-stores' },
    { label: t('nav.medicines'), path: '/medicines' },
    { label: t('nav.shop'), path: '/medicine-shop' },
    { label: t('nav.bookTest'), path: '/book-test' },
    { label: t('nav.chat'), path: '/chat' },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-40 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
          <img src={logoMark} alt="CarePlus Logo" className="w-7 h-7 object-contain" />
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            {t('app.title')}
          </span>
        </Link>

        {/* Desktop Nav Items */}
        <div className="hidden lg:flex items-center gap-6">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === item.path ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
          {user && (
            <Link
              to={dashboardRoute}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === dashboardRoute ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {t('nav.dashboard')}
            </Link>
          )}
        </div>

        {/* Controls (Desktop) */}
        <div className="hidden lg:flex items-center gap-4">
          {/* Languages Selector */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm bg-card hover:bg-muted text-foreground transition-all">
              <Languages className="w-4 h-4 text-primary" />
              <span>{languages.find(l => l.value === language)?.label.split(' ')[0]}</span>
            </button>
            <div className="absolute right-0 top-full mt-1 w-48 hidden group-hover:block bg-card border rounded-lg shadow-elevated overflow-hidden z-50">
              {languages.map(lang => (
                <button
                  key={lang.value}
                  onClick={() => setLanguage(lang.value)}
                  className={`w-full text-left px-4 py-2 text-xs transition-colors hover:bg-primary hover:text-primary-foreground ${
                    language === lang.value ? 'bg-secondary text-secondary-foreground font-semibold' : 'text-foreground'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 border rounded-lg hover:bg-muted text-foreground transition-all"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Role Switcher Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm bg-card hover:bg-muted text-foreground transition-all font-semibold">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>
                {user?.userType === 'doctor' 
                  ? 'Doctor View' 
                  : user?.userType === 'hospital' 
                  ? 'Hospital View' 
                  : 'Patient View'}
              </span>
            </button>
            <div className="absolute right-0 top-full mt-1 w-40 hidden group-hover:block bg-card border rounded-lg shadow-elevated overflow-hidden z-50">
              <button
                onClick={() => handleRoleSwitch('patient')}
                className="w-full text-left px-4 py-2 text-xs transition-colors hover:bg-primary hover:text-primary-foreground text-foreground font-semibold cursor-pointer"
              >
                Patient View
              </button>
              <button
                onClick={() => handleRoleSwitch('doctor')}
                className="w-full text-left px-4 py-2 text-xs transition-colors hover:bg-primary hover:text-primary-foreground text-foreground font-semibold cursor-pointer"
              >
                Doctor View
              </button>
              <button
                onClick={() => handleRoleSwitch('hospital')}
                className="w-full text-left px-4 py-2 text-xs transition-colors hover:bg-primary hover:text-primary-foreground text-foreground font-semibold cursor-pointer"
              >
                Hospital View
              </button>
            </div>
          </div>

          {/* User Auth */}
          {user ? (
            <div className="flex items-center gap-3 border-l pl-4">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.fullname || user.name}
                  className="w-8 h-8 rounded-full object-cover border border-primary/20 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 font-bold text-xs shrink-0">
                  {(user.fullname || user.name).charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold max-w-[120px] truncate text-foreground leading-tight">
                  {user.fullname || user.name}
                </span>
                {user.username && (
                  <span className="text-[10px] text-muted-foreground max-w-[120px] truncate leading-none mt-0.5">
                    @{user.username}
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-sm bg-destructive/10 text-destructive border border-destructive/20 px-3 py-1.5 rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-all font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('nav.logout')}</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 text-sm bg-gradient-medical text-white px-4 py-2 rounded-lg hover:opacity-90 shadow-medical transition-all font-medium"
            >
              <LogIn className="w-4 h-4" />
              <span>{t('nav.login')}</span>
            </Link>
          )}
        </div>

        {/* Mobile controls & Menu Toggle */}
        <div className="flex lg:hidden items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 border rounded-lg hover:bg-muted text-foreground transition-all"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 border rounded-lg hover:bg-muted text-foreground transition-all"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 w-full bg-card border-b shadow-elevated flex flex-col p-4 gap-4 z-30 animate-fade-in">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`text-base font-medium py-1 px-2 rounded-md ${
                location.pathname === item.path ? 'text-primary bg-secondary/50' : 'text-muted-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
          {user && (
            <Link
              to={dashboardRoute}
              onClick={() => setMobileMenuOpen(false)}
              className={`text-base font-medium py-1 px-2 rounded-md ${
                location.pathname === dashboardRoute ? 'text-primary bg-secondary/50' : 'text-muted-foreground'
              }`}
            >
              {t('nav.dashboard')}
            </Link>
          )}

          {/* Languages Selector (Mobile) */}
          <div className="border-t pt-4">
            <span className="text-xs text-muted-foreground font-semibold mb-2 block px-2">Select Language</span>
            <div className="grid grid-cols-2 gap-2 px-2">
              {languages.map(lang => (
                <button
                  key={lang.value}
                  onClick={() => {
                    setLanguage(lang.value);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left text-xs py-1.5 px-2.5 rounded-md border transition-all ${
                    language === lang.value
                      ? 'bg-primary text-primary-foreground border-primary font-medium'
                      : 'bg-card text-foreground border-border'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Role Switcher */}
          <div className="border-t pt-4 px-2">
            <span className="text-xs text-muted-foreground font-semibold mb-2 block">Switch Console Role</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  handleRoleSwitch('patient');
                  setMobileMenuOpen(false);
                }}
                className={`py-1.5 px-2 text-center text-[10px] rounded-lg border transition-all font-bold cursor-pointer ${
                  user?.userType === 'patient'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border'
                }`}
              >
                Patient
              </button>
              <button
                onClick={() => {
                  handleRoleSwitch('doctor');
                  setMobileMenuOpen(false);
                }}
                className={`py-1.5 px-2 text-center text-[10px] rounded-lg border transition-all font-bold cursor-pointer ${
                  user?.userType === 'doctor'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border'
                }`}
              >
                Doctor
              </button>
              <button
                onClick={() => {
                  handleRoleSwitch('hospital');
                  setMobileMenuOpen(false);
                }}
                className={`py-1.5 px-2 text-center text-[10px] rounded-lg border transition-all font-bold cursor-pointer ${
                  user?.userType === 'hospital'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border'
                }`}
              >
                Hospital
              </button>
            </div>
          </div>

          {/* Mobile Auth Button */}
          <div className="border-t pt-4 px-2">
            {user ? (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-foreground">
                  Logged in as: {user.fullname || user.name} {user.username ? `(@${user.username})` : ''}
                </span>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2 border border-destructive/20 text-destructive bg-destructive/10 rounded-lg hover:bg-destructive hover:text-white transition-all text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('nav.logout')}</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-medical text-white rounded-lg hover:opacity-90 shadow-medical transition-all text-sm font-medium"
              >
                <LogIn className="w-4 h-4" />
                <span>{t('nav.login')}</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
export default Navbar;
