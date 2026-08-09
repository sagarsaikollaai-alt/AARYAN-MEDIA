import React, { useState, useRef, useEffect } from 'react';
import { NavTab, UserProfile } from '../types';
import { LogOut, BookOpen, CreditCard, Sliders, ChevronDown, Menu, X } from 'lucide-react';
import { LogoutDialog } from './LogoutDialog';

interface HeaderProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onNavigate: (path: string) => void;
  isLoggedIn: boolean;
  user: UserProfile | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  purchasedCount: number;
  /**
   * When true, this is a course preview / learning page. On these pages the
   * header collapses to Logo + Hamburger on EVERY screen size (desktop
   * included), for a distraction-free learning experience.
   */
  hideNav?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onNavigate,
  isLoggedIn,
  user,
  onLoginClick,
  onLogoutClick,
  purchasedCount,
  hideNav = false
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigateAndClose = (path: string) => {
    onNavigate(path);
    setMenuOpen(false);
    setDropdownOpen(false);
  };

  const handleLogout = () => {
    setShowLogoutDialog(false);
    setMenuOpen(false);
    setDropdownOpen(false);
    onLogoutClick();
  };

  // Hamburger is always shown on mobile. On desktop, it's shown only when
  // hideNav is true (course preview / learning pages), replacing the full
  // inline nav + account dropdown for a simpler, distraction-free header.
  const hamburgerClass = hideNav ? 'flex' : 'flex md:hidden';
  const fullNavClass = hideNav ? 'hidden' : 'hidden md:flex';
  const fullAccountClass = hideNav ? 'hidden' : 'hidden md:block';

  return (
    <>
      <header className="sticky top-0 z-40 w-full h-[52px] sm:h-[72px] bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/[0.08] px-3 sm:px-8 flex items-center justify-between">
        <div className="max-w-[1280px] w-full mx-auto flex items-center justify-between">

          {/* Logo */}
          <button
            onClick={() => navigateAndClose('/')}
            className="flex items-center gap-2 sm:gap-2.5 text-left group transition-opacity hover:opacity-90"
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-black border border-white/10 flex items-center justify-center font-bold text-xs sm:text-base text-[#D7FF2F] group-hover:border-[#D7FF2F]/50 transition-colors">
              A
            </div>
            <span className="font-bold tracking-tight text-white text-sm sm:text-base leading-none flex items-center gap-1">
              Aaryan Media
              <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF2F]" />
            </span>
          </button>

          {/* ── DESKTOP FULL NAV (hidden on mobile, and hidden entirely when hideNav) ── */}
          <nav className={`${fullNavClass} items-center gap-1 bg-[#111111] border border-white/[0.08] p-1 rounded-full`}>
            <button
              onClick={() => onNavigate('/')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === 'explore'
                  ? 'bg-[#D7FF2F] text-black font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Explore Courses
            </button>

            <button
              onClick={() => onNavigate('/my-courses')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'my-courses'
                  ? 'bg-[#D7FF2F] text-black font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>My Courses</span>
              {purchasedCount > 0 && (
                <span className={`text-xs px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'my-courses' ? 'bg-black/20 text-black' : 'bg-white/10 text-[#D7FF2F]'
                }`}>
                  {purchasedCount}
                </span>
              )}
            </button>
          </nav>

          {/* ── RIGHT SIDE ── */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop account dropdown (hidden on mobile, and hidden entirely when hideNav) */}
            {isLoggedIn ? (
              <div className={`relative ${fullAccountClass}`} ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-[#111111] hover:bg-white/[0.06] border border-white/[0.1] px-3 py-1.5 rounded-full text-sm transition-all duration-200"
                >
                  <div className="w-6 h-6 rounded-full bg-[#D7FF2F] text-black font-bold text-xs flex items-center justify-center">
                    {user?.avatar || 'A'}
                  </div>
                  <span className="font-medium text-zinc-200 text-xs sm:text-sm max-w-[100px] sm:max-w-[140px] truncate">
                    My Account
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-[#111111] border border-white/[0.12] rounded-[16px] shadow-2xl p-2 z-50 text-sm">
                    <div className="px-3 py-2.5 border-b border-white/[0.08] mb-1">
                      <p className="font-semibold text-white text-sm truncate">{user?.name}</p>
                      <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
                    </div>

                    <button
                      onClick={() => navigateAndClose('/my-courses')}
                      className="w-full text-left px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-2.5 transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-[#D7FF2F]" />
                      <span>My Enrolled Courses</span>
                      {purchasedCount > 0 && (
                        <span className="ml-auto text-xs bg-[#D7FF2F]/20 text-[#D7FF2F] px-2 py-0.5 rounded-full font-mono">{purchasedCount}</span>
                      )}
                    </button>

                    <button
                      onClick={() => navigateAndClose('/account')}
                      className="w-full text-left px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-2.5 transition-colors"
                    >
                      <CreditCard className="w-4 h-4 text-zinc-400" />
                      <span>Account & Billing</span>
                    </button>

                    <button
                      onClick={() => navigateAndClose('/preferences')}
                      className="w-full text-left px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-2.5 transition-colors"
                    >
                      <Sliders className="w-4 h-4 text-zinc-400" />
                      <span>Preferences</span>
                    </button>

                    <div className="my-1 border-t border-white/[0.08]" />

                    <button
                      onClick={() => setShowLogoutDialog(true)}
                      className="w-full text-left px-3 py-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className={`${fullAccountClass} bg-[#111111] hover:bg-[#D7FF2F] text-white hover:text-black border border-white/[0.12] hover:border-[#D7FF2F] px-5 py-2 rounded-full text-sm font-medium transition-all duration-200`}
              >
                Login
              </button>
            )}

            {/* Hamburger — always on mobile; also on desktop when hideNav is true */}
            <button
              onClick={() => setMenuOpen(true)}
              className={`${hamburgerClass} w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#111111] border border-white/[0.1] items-center justify-center text-zinc-300`}
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── SLIDE-OVER MENU (hamburger contents) ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMenuOpen(false)} />
          <div className="relative w-[78%] max-w-xs h-full bg-[#111111] border-l border-white/[0.08] p-5 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-white text-sm">Menu</span>
              <button onClick={() => setMenuOpen(false)} className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {isLoggedIn && (
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-white/[0.08]">
                <div className="w-9 h-9 rounded-full bg-[#D7FF2F] text-black font-bold text-sm flex items-center justify-center">
                  {user?.avatar || 'A'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{user?.name}</p>
                  <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
                </div>
              </div>
            )}

            <nav className="flex flex-col gap-1 text-sm">
              <button
                onClick={() => navigateAndClose('/')}
                className={`text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 ${
                  activeTab === 'explore' ? 'bg-[#D7FF2F] text-black font-semibold' : 'text-zinc-300 hover:bg-white/[0.06]'
                }`}
              >
                Explore Courses
              </button>

              {isLoggedIn && (
                <button
                  onClick={() => navigateAndClose('/my-courses')}
                  className={`text-left px-3 py-2.5 rounded-lg flex items-center justify-between ${
                    activeTab === 'my-courses' ? 'bg-[#D7FF2F] text-black font-semibold' : 'text-zinc-300 hover:bg-white/[0.06]'
                  }`}
                >
                  <span>My Courses</span>
                  {purchasedCount > 0 && (
                    <span className="text-xs bg-black/20 px-1.5 py-0.5 rounded-full font-bold">{purchasedCount}</span>
                  )}
                </button>
              )}

              {isLoggedIn ? (
                <>
                  <div className="my-2 border-t border-white/[0.08]" />
                  <button
                    onClick={() => navigateAndClose('/account')}
                    className="text-left px-3 py-2.5 rounded-lg text-zinc-300 hover:bg-white/[0.06] flex items-center gap-2.5"
                  >
                    <CreditCard className="w-4 h-4 text-zinc-400" /> My Account
                  </button>
                  <button
                    onClick={() => navigateAndClose('/preferences')}
                    className="text-left px-3 py-2.5 rounded-lg text-zinc-300 hover:bg-white/[0.06] flex items-center gap-2.5"
                  >
                    <Sliders className="w-4 h-4 text-zinc-400" /> Preferences
                  </button>
                  <div className="my-2 border-t border-white/[0.08]" />
                  <button
                    onClick={() => setShowLogoutDialog(true)}
                    className="text-left px-3 py-2.5 rounded-lg text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5 font-medium"
                  >
                    <LogOut className="w-4 h-4" /> Log Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setMenuOpen(false); onLoginClick(); }}
                  className="mt-3 bg-[#D7FF2F] text-black font-bold px-4 py-2.5 rounded-full text-sm"
                >
                  Login
                </button>
              )}
            </nav>
          </div>
        </div>
      )}

      <LogoutDialog
        isOpen={showLogoutDialog}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutDialog(false)}
      />
    </>
  );
};