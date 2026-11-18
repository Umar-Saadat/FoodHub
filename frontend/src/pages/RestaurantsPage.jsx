import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Star, Clock, MapPin, SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import { foodService } from '../services/foodService'
import { money, mediaUrl } from '../utils/format'
import { useDebounce } from '../hooks/useDebounce'

export default function RestaurantsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQ = searchParams.get('q') || ''
  const initialCuisine = searchParams.get('cuisine') || ''

  const [query, setQuery] = useState(initialQ)
  const debouncedQuery = useDebounce(query, 350)
  const [selectedCuisine, setSelectedCuisine] = useState(initialCuisine)
  const [sortBy, setSortBy] = useState('rating') // 'rating' | 'delivery' | 'min_order'
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 12 })
  const [loading, setLoading] = useState(true)
  const [cuisines, setCuisines] = useState([])

  // Keep URL search params in sync
  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedQuery) params.set('q', debouncedQuery)
    if (selectedCuisine) params.set('cuisine', selectedCuisine)
    setSearchParams(params, { replace: true })
  }, [debouncedQuery, selectedCuisine, setSearchParams])

  // Fetch unique cuisines for filtering
  useEffect(() => {
    foodService.restaurants({ page_size: 100 })
      .then(res => {
        const unique = Array.from(new Set(res.data.items.map(r => r.cuisine).filter(Boolean)))
        setCuisines(unique)
      })
      .catch(() => {})
  }, [])

  // Fetch restaurants
  const fetchRestaurants = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page,
        page_size: 12,
      }
      if (debouncedQuery.trim()) params.q = debouncedQuery.trim()
      if (selectedCuisine) params.cuisine = selectedCuisine

      const res = await foodService.restaurants(params)
      let sortedItems = [...res.data.items]
      if (sortBy === 'rating') {
        sortedItems.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      } else if (sortBy === 'delivery') {
        sortedItems.sort((a, b) => (a.delivery_time_min || 0) - (b.delivery_time_min || 0))
      } else if (sortBy === 'min_order') {
        sortedItems.sort((a, b) => (a.min_order || 0) - (b.min_order || 0))
      }

      setData({
        ...res.data,
        items: sortedItems
      })
    } catch (err) {
      console.error('Failed to load restaurants', err)
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery, selectedCuisine, sortBy, page])

  useEffect(() => {
    fetchRestaurants()
  }, [fetchRestaurants])

  const totalPages = Math.ceil((data.total || 0) / 12) || 1

  return (
    <MainLayout>
      <div className="bg-gray-50 border-b border-gray-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Discover Restaurants
          </h1>
          <p className="mt-2 text-base text-gray-600">
            Find the best cuisines and restaurants delivering right to your door.
          </p>

          {/* Search Bar & Controls */}
          <div className="mt-6 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
                placeholder="Search restaurant or cuisine..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 bg-white px-3 py-2 border border-gray-300 rounded-xl text-sm shadow-sm">
                <ArrowUpDown size={16} className="text-gray-500" />
                <span className="text-gray-600 font-medium">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-gray-800 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="rating">Top Rated</option>
                  <option value="delivery">Fastest Delivery</option>
                  <option value="min_order">Lowest Minimum</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cuisine Pill Filters */}
          <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => { setSelectedCuisine(''); setPage(1) }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCuisine === ''
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              All Cuisines
            </button>
            {cuisines.map((c) => (
              <button
                key={c}
                onClick={() => { setSelectedCuisine(c); setPage(1) }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCuisine === c
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Results Count Header */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm font-medium text-gray-500">
            {loading ? 'Searching restaurants...' : `Showing ${data.items.length} of ${data.total} restaurants`}
          </p>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 animate-pulse">
                <div className="skeleton h-48 w-full" />
                <div className="p-5 space-y-3">
                  <div className="skeleton h-5 w-3/4 rounded" />
                  <div className="skeleton h-4 w-1/2 rounded" />
                  <div className="skeleton h-4 w-2/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && data.items.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 p-8">
            <div className="w-16 h-16 bg-brand-50 text-brand-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              🍽️
            </div>
            <h3 className="text-lg font-bold text-gray-900">No restaurants found</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
              We couldn't find any restaurants matching your filters. Try clearing your search or choosing another cuisine.
            </p>
            <button
              onClick={() => { setQuery(''); setSelectedCuisine(''); setPage(1) }}
              className="mt-5 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-brand-500 hover:bg-brand-600 transition"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Restaurant Cards Grid */}
        {!loading && data.items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((restaurant) => (
              <Link
                key={restaurant.id}
                to={`/restaurants/${restaurant.id}`}
                className="group rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 flex flex-col"
              >
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <img
                    src={mediaUrl(restaurant.image_url || restaurant.image) || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500'}
                    alt={restaurant.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500'
                    }}
                  />
                  {restaurant.cuisine && (
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow">
                      {restaurant.cuisine}
                    </span>
                  )}
                  {restaurant.is_featured && (
                    <span className="absolute top-3 right-3 bg-brand-500 text-white px-2.5 py-0.5 rounded-full text-xs font-semibold shadow">
                      Featured
                    </span>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-gray-900 text-lg group-hover:text-brand-500 transition-colors line-clamp-1">
                        {restaurant.name}
                      </h3>
                      <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg text-xs font-bold shrink-0">
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                        <span>{restaurant.rating ? restaurant.rating.toFixed(1) : 'New'}</span>
                      </div>
                    </div>

                    <p className="mt-1 text-sm text-gray-500 line-clamp-1">
                      {restaurant.description || 'Delicious culinary experience'}
                    </p>

                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                      <MapPin size={13} className="shrink-0" />
                      <span className="truncate">{restaurant.address}, {restaurant.city}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600 font-medium">
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="text-gray-400" />
                      <span>{restaurant.delivery_time_min || 30} mins</span>
                    </div>
                    <span>
                      Fee: {restaurant.delivery_fee ? money(restaurant.delivery_fee) : 'Free'}
                    </span>
                    <span>
                      Min: {money(restaurant.min_order || 0)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm font-medium text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
