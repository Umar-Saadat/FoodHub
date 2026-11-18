import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  UtensilsCrossed, ShoppingCart, Menu, X, ChevronDown, User,
  Package, LayoutDashboard, LogOut, Sparkles, Phone, HelpCircle, Info
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { cx } from '../../utils/format'

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Restaurants', to: '/restaurants' },
  { label: 'Dishes', to: '/foods' },
  { label: 'About Us', to: '/about' },
  { label: 'Contact', to: '/contact' },
  { label: 'FAQ', to: '/faq' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const { cart } = useCart()
  const navigate = useNavigate()
  const location = useLocation()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const dropdownRef = useRef(null)

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false)
    setDropdownOpen(false)
  }, [location.pathname])

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  // Track scroll state for glassmorphism elevation
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    setDropdownOpen(false)
    await logout()
    navigate('/')
  }

  const itemCount = cart?.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || cart?.item_count || 0
  const userInitial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'

  return (
    <header
      className={cx(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'glass shadow-card border-b border-gray-200/80'
          : 'bg-white border-b border-gray-100'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-amber-500 flex items-center justify-center text-white shadow-lift group-hover:scale-105 group-hover:rotate-6 transition-all duration-300">
              <UtensilsCrossed size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-gray-900 group-hover:text-brand-500 transition-colors">
                Food<span className="text-brand-500">Hub</span>
              </span>
              <span className="hidden sm:inline-block ml-1 text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-orange-100 text-brand-700">
                Delivery
              </span>
            </div>
          </Link>

          {/* ── Desktop Navigation Links ── */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 bg-gray-50/80 p-1.5 rounded-2xl border border-gray-100 shadow-inner">
            {NAV_LINKS.map((link) => {
              const isActive = link.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(link.to)

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cx(
                    'px-3.5 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all duration-200',
                    isActive
                      ? 'bg-white text-brand-600 shadow-sm border border-gray-200/60'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* ── Right Actions ── */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Shopping Cart Button */}
            <Link
              to="/cart"
              className={cx(
                'relative p-2.5 sm:px-3.5 sm:py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all duration-300',
                itemCount > 0
                  ? 'bg-orange-50 hover:bg-orange-100 text-brand-600 border border-orange-200'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              )}
              title="View Cart"
            >
              <div className="relative">
                <ShoppingCart size={19} className={itemCount > 0 ? 'text-brand-500' : 'text-gray-600'} />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-brand-500 text-white font-black text-[10px] flex items-center justify-center shadow-md animate-bounce-subtle">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </div>
              <span className="hidden md:inline font-bold">Cart</span>
            </Link>

            {/* User Profile / Dropdown OR Login/Register */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl border border-gray-200 hover:border-brand-200 bg-white hover:bg-orange-50/50 shadow-sm transition"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 text-white flex items-center justify-center font-black text-xs shadow-sm">
                    {userInitial}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-gray-900 leading-tight truncate max-w-[100px]">
                      {user.full_name?.split(' ')[0] || 'My Account'}
                    </p>
                    <p className="text-[10px] text-gray-400 capitalize">{user.role || 'Customer'}</p>
                  </div>
                  <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-popIn">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs font-bold text-gray-900 truncate">{user.full_name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-orange-50 hover:text-brand-600 transition"
                      >
                        <User size={15} /> My Profile & Addresses
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-orange-50 hover:text-brand-600 transition"
                      >
                        <Package size={15} /> My Orders & Tracking
                      </Link>

                      {user.role === 'admin' && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-purple-700 bg-purple-50/70 hover:bg-purple-100 transition"
                        >
                          <LayoutDashboard size={15} /> Admin Dashboard
                        </Link>
                      )}
                    </div>

                    <div className="pt-1 border-t border-gray-100">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition text-left"
                      >
                        <LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs sm:text-sm font-bold text-gray-700 hover:text-brand-600 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs sm:text-sm shadow-lift hover:scale-105 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition"
              aria-label="Toggle Navigation Menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu Dropdown ── */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-100 py-4 px-2 space-y-1 bg-white/95 backdrop-blur-md rounded-b-3xl shadow-xl">
            {NAV_LINKS.map((link) => {
              const isActive = link.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(link.to)

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={cx(
                    'block px-4 py-2.5 rounded-xl text-sm font-bold transition',
                    isActive
                      ? 'bg-orange-50 text-brand-600 border border-orange-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {link.label}
                </Link>
              )
            })}

            <div className="pt-3 border-t border-gray-100 mt-2 space-y-2 px-2">
              <div className="flex items-center justify-between text-xs text-gray-500 py-1">
                <span>📞 Hotline: +92 42 111 000 100</span>
                <span className="font-bold text-brand-600">24/7 Live</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
