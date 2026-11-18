import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search, ShoppingBag, ClipboardList, Truck, Star, Clock, ChevronRight,
  MapPin, Plus, Minus, Sparkles, ShieldCheck, Flame, ArrowRight,
  Check, Heart, Award
} from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import { api } from '../services/api'
import { money, cx, mediaUrl } from '../utils/format'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

/* ─── Skeletons ─────────────────────────────────────── */
function RestaurantSkeleton() {
  return (
    <div className="rounded-3xl overflow-hidden bg-white shadow-sm border border-gray-100 p-4 animate-pulse space-y-3">
      <div className="skeleton h-48 w-full rounded-2xl" />
      <div className="space-y-2 pt-1">
        <div className="skeleton h-5 w-3/4 rounded-lg" />
        <div className="skeleton h-4 w-1/2 rounded-lg" />
        <div className="skeleton h-4 w-2/3 rounded-lg" />
      </div>
    </div>
  )
}

function FoodSkeleton() {
  return (
    <div className="rounded-3xl overflow-hidden bg-white shadow-sm border border-gray-100 p-4 animate-pulse space-y-3">
      <div className="skeleton h-40 w-full rounded-2xl" />
      <div className="space-y-2 pt-1">
        <div className="skeleton h-5 w-3/4 rounded-lg" />
        <div className="skeleton h-3 w-full rounded-lg" />
        <div className="skeleton h-6 w-1/3 rounded-lg" />
      </div>
    </div>
  )
}

function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 flex-shrink-0 animate-pulse">
      <div className="skeleton w-24 h-24 rounded-3xl" />
      <div className="skeleton h-3 w-16 rounded" />
    </div>
  )
}

/* ─── Restaurant Card ────────────────────────────────── */
function RestaurantCard({ restaurant }) {
  const imgUrl = mediaUrl(restaurant.image_url || restaurant.image) || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500'

  return (
    <Link
      to={`/restaurants/${restaurant.id}`}
      className="group rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-sm card-hover flex flex-col justify-between"
    >
      <div>
        <div className="relative h-48 overflow-hidden bg-gray-100">
          <img
            src={imgUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {restaurant.cuisine && (
            <span className="absolute top-3.5 left-3.5 bg-white/95 backdrop-blur-md text-gray-900 text-xs font-black px-3 py-1 rounded-full shadow-sm">
              {restaurant.cuisine}
            </span>
          )}
          {restaurant.is_featured && (
            <span className="absolute top-3.5 right-3.5 bg-brand-500 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
              <Sparkles size={12} /> Featured
            </span>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-extrabold text-gray-900 text-lg leading-snug group-hover:text-brand-500 transition-colors line-clamp-1">
              {restaurant.name}
            </h3>
            <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-lg text-xs font-black shrink-0">
              <Star size={13} className="fill-amber-400 text-amber-400" />
              <span>{restaurant.rating ? restaurant.rating.toFixed(1) : '4.8'}</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
            {restaurant.description || `${restaurant.cuisine} specialties in ${restaurant.city}`}
          </p>

          <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
            <MapPin size={13} className="shrink-0" />
            <span className="truncate">{restaurant.address}, {restaurant.city}</span>
          </div>
        </div>
      </div>

      <div className="p-5 pt-0">
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600 font-semibold">
          <div className="flex items-center gap-1">
            <Clock size={13} className="text-brand-500" />
            <span>{restaurant.delivery_time_min || restaurant.delivery_time || 25} mins</span>
          </div>
          <span>
            Fee: {restaurant.delivery_fee ? money(restaurant.delivery_fee) : 'Free'}
          </span>
          <span className="text-gray-400">
            Min: {money(restaurant.min_order || 0)}
          </span>
        </div>
      </div>
    </Link>
  )
}

/* ─── Food Card with Cart Controls ───────────────────── */
function FoodCard({ food }) {
  const { cart, addItem, updateItem } = useCart()
  const { user } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const cartItem = cart?.items?.find((i) => i.food_id === food.id)
  const qty = cartItem ? cartItem.quantity : 0

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!user) {
      addToast('Please sign in to add delicious meals to your cart', 'info')
      navigate('/login')
      return
    }
    try {
      await addItem(food.id, 1)
      addToast(`Added ${food.name} to cart!`, 'success')
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Failed to add item', 'error')
    }
  }

  const isDiscounted = food.discount_price && parseFloat(food.discount_price) < parseFloat(food.price)
  const imgUrl = mediaUrl(food.image_url || food.image) || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm card-hover flex flex-col justify-between group">
      <div>
        <div className="relative h-44 overflow-hidden bg-gray-100">
          <img
            src={imgUrl}
            alt={food.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' }}
          />
          {isDiscounted && (
            <span className="absolute top-3 left-3 bg-brand-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
              SAVE {Math.round((1 - food.discount_price / food.price) * 100)}%
            </span>
          )}
          {food.is_popular && (
            <span className="absolute top-3 right-3 bg-amber-400 text-gray-950 text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
              🔥 Popular
            </span>
          )}
        </div>

        <div className="p-4">
          {food.restaurant_name && (
            <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider block truncate mb-1">
              {food.restaurant_name}
            </span>
          )}
          <h4 className="font-extrabold text-gray-900 text-base leading-tight truncate">
            {food.name}
          </h4>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
            {food.description || 'Prepared fresh with high-grade ingredients upon order.'}
          </p>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-black text-brand-600">
              {money(food.effective_price || food.discount_price || food.price)}
            </span>
            {isDiscounted && (
              <span className="text-xs text-gray-400 line-through">
                {money(food.price)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 pt-0">
        {qty === 0 ? (
          <button
            onClick={handleAdd}
            className="w-full py-2.5 px-4 rounded-2xl bg-orange-50 hover:bg-brand-500 text-brand-600 hover:text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 border border-orange-200 hover:border-transparent hover:shadow-lift"
          >
            <Plus size={15} /> Add to Cart
          </button>
        ) : (
          <div className="flex items-center justify-between bg-brand-50 rounded-2xl px-3 py-1.5 border border-brand-200">
            <span className="text-xs font-bold text-brand-700">In Cart</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateItem(cartItem.id, qty - 1)}
                className="w-7 h-7 rounded-xl bg-white shadow-sm flex items-center justify-center text-brand-600 hover:bg-brand-500 hover:text-white transition"
              >
                <Minus size={13} />
              </button>
              <span className="text-xs font-black text-brand-800 w-4 text-center">{qty}</span>
              <button
                onClick={() => updateItem(cartItem.id, qty + 1)}
                className="w-7 h-7 rounded-xl bg-white shadow-sm flex items-center justify-center text-brand-600 hover:bg-brand-500 hover:text-white transition"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── HomePage Component ─────────────────────────────── */
export default function HomePage() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')

  const [categories, setCategories] = useState([])
  const [catsLoading, setCatsLoading] = useState(true)

  const [restaurants, setRestaurants] = useState([])
  const [restsLoading, setRestsLoading] = useState(true)

  const [foods, setFoods] = useState([])
  const [foodsLoading, setFoodsLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [catsRes, restsRes, foodsRes] = await Promise.allSettled([
          api.get('/api/categories?page_size=20'),
          api.get('/api/restaurants?featured=true&page_size=6'),
          api.get('/api/foods?popular=true&page_size=8'),
        ])

        if (catsRes.status === 'fulfilled') {
          const d = catsRes.value.data
          setCategories(d.items || d.results || (Array.isArray(d) ? d : []))
        }
        if (restsRes.status === 'fulfilled') {
          const d = restsRes.value.data
          setRestaurants(d.items || d.results || (Array.isArray(d) ? d : []))
        }
        if (foodsRes.status === 'fulfilled') {
          const d = foodsRes.value.data
          setFoods(d.items || d.results || (Array.isArray(d) ? d : []))
        }
      } finally {
        setCatsLoading(false)
        setRestsLoading(false)
        setFoodsLoading(false)
      }
    }
    fetchAll()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/restaurants?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const copyPromo = () => {
    navigator.clipboard?.writeText('WELCOME10')
    addToast('Coupon WELCOME10 copied to clipboard!', 'success')
  }

  const quickPills = ['Burgers', 'Pizza', 'Biryani', 'Sushi', 'Pasta', 'Desserts']

  return (
    <MainLayout>
      {/* ── HERO SECTION ───────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-stone-900 text-white py-16 sm:py-24">
        {/* Glow & Backdrop elements */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-subtle" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left Column: Heading, Search & Shortcuts (7 Cols) */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Promo Banner Pill */}
              <div
                onClick={copyPromo}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-white/10 hover:bg-white/15 border border-white/20 text-orange-200 cursor-pointer shadow-sm transition group"
              >
                <Flame size={14} className="text-brand-400 animate-bounce-subtle" />
                <span>Special: Use code <strong className="text-white underline">WELCOME10</strong> for 10% off</span>
                <span className="text-[10px] text-brand-300 font-mono uppercase bg-white/10 px-2 py-0.5 rounded-full group-hover:bg-brand-500 group-hover:text-white transition">Copy</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
                Order food you love, <span className="text-gradient">delivered in 25 mins.</span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Discover the best kitchens, curated dishes, and wood-fired specialties in your neighborhood, packed hot and tracked live to your door.
              </p>

              {/* Search Bar Form */}
              <form onSubmit={handleSearch} className="max-w-xl mx-auto lg:mx-0">
                <div className="flex items-center bg-white p-2 rounded-2xl sm:rounded-3xl shadow-glow overflow-hidden">
                  <Search size={22} className="ml-3 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search restaurant, burger, biryani, pasta..."
                    className="flex-1 px-3 py-3 text-gray-900 text-sm sm:text-base focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-brand-500 hover:bg-brand-600 text-white font-extrabold px-6 py-3 rounded-xl sm:rounded-2xl transition shadow-lift hover:scale-105 shrink-0"
                  >
                    Find Food
                  </button>
                </div>
              </form>

              {/* Quick Filter Pills */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-2">
                <span className="text-xs font-bold text-slate-400">Popular:</span>
                {quickPills.map((p) => (
                  <button
                    key={p}
                    onClick={() => navigate(`/restaurants?q=${p.toLowerCase()}`)}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 hover:bg-brand-500 hover:text-white text-slate-200 border border-white/10 transition"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Visual Floating Showcase (5 Cols) */}
            <div className="lg:col-span-5 relative hidden sm:block">
              <div className="relative mx-auto max-w-sm rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80"
                  alt="Delicious food feast"
                  className="w-full h-96 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              </div>

              {/* Floating Badge 1: Speed */}
              <div className="absolute -top-4 -left-6 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/50 flex items-center gap-3 animate-float">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-brand-500 flex items-center justify-center font-bold text-lg">
                  ⚡
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase">Avg. Delivery</p>
                  <p className="text-sm font-black text-gray-900">24 Minutes</p>
                </div>
              </div>

              {/* Floating Badge 2: Rating */}
              <div className="absolute -bottom-6 -right-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/50 flex items-center gap-3 animate-float-slow">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-lg">
                  ⭐
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase">Customer Score</p>
                  <p className="text-sm font-black text-gray-900">4.9 / 5.0 Rated</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div className="mt-14 border-t border-white/10 pt-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-2">
              <p className="text-xl sm:text-2xl font-black text-white">500+ Kitchens</p>
              <p className="text-xs text-slate-400 mt-0.5">Top-rated dining</p>
            </div>
            <div className="p-2">
              <p className="text-xl sm:text-2xl font-black text-white">No Extra Fees</p>
              <p className="text-xs text-slate-400 mt-0.5">Transparent prices</p>
            </div>
            <div className="p-2">
              <p className="text-xl sm:text-2xl font-black text-white">Live GPS</p>
              <p className="text-xs text-slate-400 mt-0.5">Real-time driver map</p>
            </div>
            <div className="p-2">
              <p className="text-xl sm:text-2xl font-black text-white">Cash or Card</p>
              <p className="text-xs text-slate-400 mt-0.5">Pay your way</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES CAROUSEL ────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand-600">Curated Flavors</span>
            <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight mt-1">
              Browse by Category
            </h2>
          </div>
          <Link
            to="/foods"
            className="text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
          >
            <span>All Dishes</span>
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {catsLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
            {Array.from({ length: 8 }).map((_, i) => <CategorySkeleton key={i} />)}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No categories found.</p>
        ) : (
          <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-none">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/foods?category_id=${cat.id}`}
                className="flex flex-col items-center gap-2.5 group flex-shrink-0"
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-transparent group-hover:border-brand-500 transition-all shadow-sm group-hover:shadow-lift bg-gray-100">
                  <img
                    src={mediaUrl(cat.image_url || cat.image) || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200' }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-800 group-hover:text-brand-600 transition-colors text-center">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── FEATURED RESTAURANTS ───────────────────────────── */}
      <section className="bg-orange-50/50 py-16 border-y border-orange-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-brand-600">Top Rated</span>
              <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight mt-1">
                Featured Restaurants
              </h2>
            </div>
            <Link
              to="/restaurants"
              className="text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
            >
              <span>Explore All</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {restsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <RestaurantSkeleton key={i} />)}
            </div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
              <p className="text-gray-500 font-bold">No featured restaurants currently available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((r) => <RestaurantCard key={r.id} restaurant={r} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── POPULAR DISHES ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand-600">Crowd Favorites</span>
            <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight mt-1">
              Trending Dishes Tonight
            </h2>
          </div>
          <Link
            to="/foods"
            className="text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
          >
            <span>Full Menu</span>
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {foodsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <FoodSkeleton key={i} />)}
          </div>
        ) : foods.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
            <p className="text-gray-500 font-bold">No popular dishes found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {foods.map((food) => <FoodCard key={food.id} food={food} />)}
          </div>
        )}
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section className="bg-slate-900 text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand-400">Simple & Fast</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-1">
              How FoodHub Works
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              From craving to delicious bite in 3 easy steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-slate-800/60 rounded-3xl p-8 border border-slate-700/60 card-hover">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Select Your Restaurant</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Browse through premier partner kitchens with reviews, menus, and dish details.
              </p>
            </div>

            <div className="bg-slate-800/60 rounded-3xl p-8 border border-slate-700/60 card-hover">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Order & Apply Promos</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Customize your meal, apply coupon codes, and choose Cash on Delivery or Card.
              </p>
            </div>

            <div className="bg-slate-800/60 rounded-3xl p-8 border border-slate-700/60 card-hover">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Track & Enjoy</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Watch live GPS driver movement on an interactive map and receive your meal hot.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY FOODHUB BANNER ──────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="rounded-3xl bg-gradient-to-r from-brand-600 via-brand-500 to-amber-500 p-8 sm:p-14 text-white shadow-lift relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="px-3.5 py-1 rounded-full text-xs font-black bg-white/20 backdrop-blur-md uppercase tracking-wider">
              Exclusive Welcome Offer
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mt-4 leading-tight">
              Get 10% off your entire first kitchen run.
            </h2>
            <p className="text-orange-100 text-sm sm:text-base mt-3 leading-relaxed">
              Use promo code <span className="font-mono font-bold text-white bg-black/20 px-2 py-0.5 rounded">WELCOME10</span> at checkout. No hidden charges.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/restaurants"
                className="px-8 py-3.5 rounded-2xl bg-white text-gray-900 hover:bg-orange-50 font-black text-sm shadow-md transition"
              >
                Browse Restaurants
              </Link>
              <Link
                to="/about"
                className="px-8 py-3.5 rounded-2xl bg-black/20 hover:bg-black/30 text-white font-bold text-sm border border-white/20 transition"
              >
                About FoodHub
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}
