import React from 'react'
import { Link } from 'react-router-dom'
import { UtensilsCrossed, ExternalLink, Heart, ShieldCheck, Clock, Phone } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-white border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">

          {/* ── Col 1: Brand (2 cols on lg) ── */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-amber-500 flex items-center justify-center text-white shadow-lift group-hover:rotate-12 transition-transform duration-300">
                <UtensilsCrossed size={18} className="stroke-[2.5]" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                Food<span className="text-brand-500">Hub</span>
              </span>
            </Link>

            <p className="text-brand-400 font-bold text-sm">
              Fresh food from premier kitchens, delivered in minutes.
            </p>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              Experience the best culinary selections in your city. From artisanal smash burgers and authentic slow-cooked biryanis to wood-fired Neapolitan pizza.
            </p>

            <div className="flex items-center gap-4 pt-2 text-xs text-slate-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <Clock size={15} className="text-brand-500" /> 24/7 Delivery
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-brand-500" /> Verified Kitchens
              </span>
            </div>
          </div>

          {/* ── Col 2: Navigation ── */}
          <div>
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest mb-4">Discover</h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/restaurants" className="text-slate-400 hover:text-white transition">
                  Browse Restaurants
                </Link>
              </li>
              <li>
                <Link to="/foods" className="text-slate-400 hover:text-white transition">
                  Explore Dishes
                </Link>
              </li>
              <li>
                <Link to="/foods?popular=true" className="text-slate-400 hover:text-white transition">
                  Trending Dishes
                </Link>
              </li>
              <li>
                <Link to="/restaurants?featured=true" className="text-slate-400 hover:text-white transition">
                  Featured Kitchens
                </Link>
              </li>
            </ul>
          </div>

          {/* ── Col 3: Company ── */}
          <div>
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest mb-4">Company</h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/about" className="text-slate-400 hover:text-white transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-400 hover:text-white transition">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-slate-400 hover:text-white transition">
                  Help & FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-400 hover:text-white transition">
                  Partner with FoodHub
                </Link>
              </li>
            </ul>
          </div>

          {/* ── Col 4: Support & Order ── */}
          <div>
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest mb-4">Support & Account</h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/orders" className="text-slate-400 hover:text-white transition">
                  Live Order Tracking
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-slate-400 hover:text-white transition">
                  Saved Addresses
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-slate-400 hover:text-white transition">
                  Shopping Cart
                </Link>
              </li>
              <li className="pt-2 text-xs text-brand-400 font-bold flex items-center gap-1.5">
                <Phone size={13} /> +92 42 111 000 100
              </li>
            </ul>
          </div>

        </div>

        {/* ── Bottom Bar ── */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} FoodHub Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/faq" className="hover:text-slate-300 transition">Privacy Policy</Link>
            <Link to="/faq" className="hover:text-slate-300 transition">Terms of Service</Link>
            <Link to="/contact" className="hover:text-slate-300 transition">Kitchen Safety</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
