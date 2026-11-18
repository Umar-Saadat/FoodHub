import { Link } from 'react-router-dom'
import {
  UtensilsCrossed, ShieldCheck, Zap, Heart, Award,
  Users, Sparkles, Clock, MapPin, ArrowRight
} from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'

export default function AboutPage() {
  const stats = [
    { label: 'Partner Kitchens', value: '500+', sub: 'From local gems to Michelin favorites' },
    { label: 'Happy Customers', value: '120K+', sub: 'Across 15+ major neighborhoods' },
    { label: 'Average Delivery', value: '24 min', sub: 'From kitchen pass to your doorstep' },
    { label: 'Customer Satisfaction', value: '4.9 ★', sub: 'Verified reviews & feedback' },
  ]

  const values = [
    {
      icon: Zap,
      title: 'Hyper-Local & Superfast',
      desc: 'Our intelligent routing system pairs orders with optimal kitchen prep times, ensuring piping-hot meals reach you in record time.',
      color: 'bg-orange-50 text-brand-500 border-orange-200'
    },
    {
      icon: ShieldCheck,
      title: 'Uncompromised Freshness',
      desc: 'We partner exclusively with restaurants that maintain strict food safety standards and inspect packaging integrity at pickup.',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200'
    },
    {
      icon: Heart,
      title: 'Championing Local Kitchens',
      desc: 'We support mom-and-pop eateries and culinary pioneers with fair commissions, marketing tools, and transparent logistics.',
      color: 'bg-rose-50 text-rose-600 border-rose-200'
    },
    {
      icon: Award,
      title: 'Eco-Minded Delivery',
      desc: 'Committed to green delivery: batching routes to reduce carbon emissions and encouraging biodegradable packaging.',
      color: 'bg-blue-50 text-blue-600 border-blue-200'
    },
  ]

  const team = [
    {
      name: 'Umar Saadat',
      role: 'Founder & CEO',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      bio: 'Culinary enthusiast with a vision to make delicious cuisine accessible to everyone within minutes.'
    },
    {
      name: 'Chef Aisha Rahman',
      role: 'Head of Culinary Partnerships',
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
      bio: 'Former executive chef curating the finest artisan kitchens, recipes, and taste experiences on FoodHub.'
    },
    {
      name: 'Hamza Farooq',
      role: 'VP of Engineering & Logistics',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      bio: 'Optimizing real-time dispatch algorithms and mapping systems for seamless delivery execution.'
    },
  ]

  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-orange-50/70 via-white to-white py-16 sm:py-24">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-radial-glow pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-50 text-brand-600 border border-brand-200 shadow-sm animate-pulse-subtle mb-6">
            <Sparkles size={14} className="text-brand-500" />
            Our Mission & Story
          </span>

          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Connecting food lovers with the <span className="text-gradient">finest kitchens</span> in your city.
          </h1>

          <p className="mt-6 text-base sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            FoodHub was born from a simple passion: to make restaurant-quality cuisine effortless to discover and lightning-fast to arrive, while empowering local culinary creators.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/restaurants"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-lift hover:scale-105 transition-all duration-300"
            >
              Explore Restaurants <ArrowRight size={16} />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white hover:bg-gray-50 text-gray-800 font-bold text-sm border border-gray-200 shadow-sm transition"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 relative z-10 mb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-gray-100">
          {stats.map((s, idx) => (
            <div key={idx} className="text-center p-3 sm:p-4">
              <p className="text-3xl sm:text-5xl font-black text-gradient leading-none">
                {s.value}
              </p>
              <p className="text-sm sm:text-base font-bold text-gray-900 mt-2">
                {s.label}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {s.sub}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Story Narrative */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80"
                alt="Chef preparing fresh meal"
                className="w-full h-[420px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/70 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-500/90 backdrop-blur-sm">
                  Handcrafted Passion
                </span>
                <p className="font-bold text-lg mt-2">
                  Every dish tells the story of a dedicated kitchen.
                </p>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-6 -right-4 sm:-right-6 bg-white rounded-2xl p-4 shadow-xl border border-gray-100 flex items-center gap-3 animate-float">
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-brand-500 flex items-center justify-center font-bold text-xl">
                🍲
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Curated Dishes</p>
                <p className="text-base font-black text-gray-900">100% Fresh Daily</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-brand-600">
              <UtensilsCrossed size={16} /> How FoodHub Started
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-snug">
              We believe great food brings people together like nothing else.
            </h2>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              We started FoodHub after noticing that many of the most exceptional neighborhood kitchens — the ones with authentic heritage recipes and fresh ingredients — were struggling to reach customers with bloated commissions and slow delivery times.
            </p>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              We re-engineered food delivery from the ground up: pairing transparent menus, real-time kitchen tracking, optimized dispatch routes, and fair treatment for delivery heroes. The result is food that arrives fast, tastes fresh, and supports the communities we serve.
            </p>
            <div className="pt-2 flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                <Clock size={18} className="text-brand-500" /> Instant Order Prep
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                <MapPin size={18} className="text-brand-500" /> Live GPS Dispatch
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Core Values */}
      <div className="bg-gray-50/80 py-16 border-y border-gray-100 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Values That Drive Every Delivery
            </h2>
            <p className="text-gray-500 text-sm sm:text-base mt-2">
              Our culture centers on uncompromising culinary standards and community care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => {
              const Icon = v.icon
              return (
                <div
                  key={i}
                  className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm card-hover flex flex-col justify-between"
                >
                  <div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 border ${v.color}`}>
                      <Icon size={22} />
                    </div>
                    <h3 className="font-extrabold text-gray-900 text-lg mb-2">
                      {v.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      {v.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Leadership / Team */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">Our Culinary Stewards</span>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
            Meet The People Behind FoodHub
          </h2>
          <p className="text-gray-500 text-sm mt-2">
            Engineers, food critics, and dispatchers united by a love for good food.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {team.map((member, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm card-hover text-center p-6"
            >
              <div className="w-28 h-28 mx-auto rounded-2xl overflow-hidden mb-4 shadow-md bg-gray-100">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-extrabold text-gray-900 text-lg">{member.name}</h3>
              <p className="text-xs font-bold text-brand-600 mt-0.5">{member.role}</p>
              <p className="text-xs text-gray-500 mt-3 leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-brand-600 via-brand-500 to-orange-500 p-8 sm:p-12 text-white shadow-lift text-center">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready for a meal you'll truly love?
          </h2>
          <p className="mt-3 text-orange-100 text-sm sm:text-base max-w-xl mx-auto">
            Order your first meal with promo code <strong className="text-white underline">WELCOME10</strong> for 10% off your entire ticket.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/restaurants"
              className="px-8 py-3.5 rounded-2xl bg-white text-gray-900 hover:bg-orange-50 font-extrabold text-sm shadow-md transition"
            >
              Order Now
            </Link>
            <Link
              to="/faq"
              className="px-8 py-3.5 rounded-2xl bg-black/20 hover:bg-black/30 text-white font-extrabold text-sm border border-white/20 transition"
            >
              View FAQ
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
