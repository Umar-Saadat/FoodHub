import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Search, SlidersHorizontal, Plus, Minus, Star,
  UtensilsCrossed, Tag, X, ArrowUpDown
} from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import { foodService } from '../services/foodService'
import { money, mediaUrl } from '../utils/format'
import { useCart } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'
import { useDebounce } from '../hooks/useDebounce'

export default function FoodsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQ = searchParams.get('q') || ''
  const initialCategory = searchParams.get('category_id') || ''
  const initialPopular = searchParams.get('popular') === 'true'

  const [query, setQuery] = useState(initialQ)
  const debouncedQuery = useDebounce(query, 350)
  const [categoryId, setCategoryId] = useState(initialCategory)
  const [popularOnly, setPopularOnly] = useState(initialPopular)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('featured') // 'featured' | 'price_asc' | 'price_desc'
  const [page, setPage] = useState(1)

  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 12 })
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const { cart, addItem, updateItem } = useCart()
  const { addToast } = useToast()

  // Keep search params updated
  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedQuery) params.set('q', debouncedQuery)
    if (categoryId) params.set('category_id', categoryId)
    if (popularOnly) params.set('popular', 'true')
    setSearchParams(params, { replace: true })
  }, [debouncedQuery, categoryId, popularOnly, setSearchParams])

  // Load categories for filter
  useEffect(() => {
    foodService.categories({ page_size: 50 })
      .then((res) => setCategories(res.data.items || res.data || []))
      .catch(() => {})
  }, [])

  // Fetch foods
  const fetchFoods = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page,
        page_size: 12,
      }
      if (debouncedQuery.trim()) params.q = debouncedQuery.trim()
      if (categoryId) params.category_id = Number(categoryId)
      if (popularOnly) params.popular = true
      if (minPrice) params.min_price = Number(minPrice)
      if (maxPrice) params.max_price = Number(maxPrice)

      const res = await foodService.foods(params)
      let items = [...(res.data.items || [])]

      if (sortBy === 'price_asc') {
        items.sort((a, b) => (a.effective_price || a.price) - (b.effective_price || b.price))
      } else if (sortBy === 'price_desc') {
        items.sort((a, b) => (b.effective_price || b.price) - (a.effective_price || a.price))
      }

      setData({
        ...res.data,
        items
      })
    } catch (err) {
      console.error('Failed to load foods', err)
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery, categoryId, popularOnly, minPrice, maxPrice, sortBy, page])

  useEffect(() => {
    fetchFoods()
  }, [fetchFoods])

  const totalPages = Math.ceil((data.total || 0) / 12) || 1

  const getCartQuantity = (foodId) => {
    const item = cart?.items?.find((i) => i.food_id === foodId)
    return item ? item.quantity : 0
  }

  const handleAddToCart = async (food) => {
    try {
      await addItem(food.id, 1)
      addToast(`Added ${food.name} to cart!`, 'success')
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Please sign in to add items to your cart', 'error')
    }
  }

  const clearFilters = () => {
    setQuery('')
    setCategoryId('')
    setPopularOnly(false)
    setMinPrice('')
    setMaxPrice('')
    setPage(1)
  }

  const hasActiveFilters = Boolean(query || categoryId || popularOnly || minPrice || maxPrice)

  return (
    <MainLayout>
      <div className="bg-gray-50 border-b border-gray-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Explore All Dishes
          </h1>
          <p className="mt-2 text-base text-gray-600">
            Craving something special? Browse through hundreds of handcrafted dishes.
          </p>

          {/* Search & Sort Controls */}
          <div className="mt-6 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1) }}
                placeholder="Search by dish name, ingredients..."
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
                  <option value="featured">Featured First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>

              <button
                onClick={() => setPopularOnly(!popularOnly)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition ${
                  popularOnly
                    ? 'bg-amber-100 border-amber-300 text-amber-900'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                🔥 Popular only
              </button>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 underline"
                >
                  <X size={14} /> Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => { setCategoryId(''); setPage(1) }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                categoryId === ''
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setCategoryId(String(cat.id)); setPage(1) }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  String(categoryId) === String(cat.id)
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Foods Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm font-medium text-gray-500">
            {loading ? 'Finding dishes...' : `Showing ${data.items.length} of ${data.total} dishes`}
          </p>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 animate-pulse">
                <div className="skeleton h-44 w-full rounded-xl" />
                <div className="mt-4 space-y-2">
                  <div className="skeleton h-5 w-3/4 rounded" />
                  <div className="skeleton h-4 w-1/2 rounded" />
                  <div className="skeleton h-6 w-1/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && data.items.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 p-8">
            <div className="w-16 h-16 bg-brand-50 text-brand-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              🥘
            </div>
            <h3 className="text-lg font-bold text-gray-900">No dishes found</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
              We couldn't find any items matching your selected criteria. Try adjusting your search query or category.
            </p>
            <button
              onClick={clearFilters}
              className="mt-5 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-brand-500 hover:bg-brand-600 transition"
            >
              Reset filters
            </button>
          </div>
        )}

        {/* Foods Grid */}
        {!loading && data.items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {data.items.map((food) => {
              const qty = getCartQuantity(food.id)
              const cartItem = cart?.items?.find((i) => i.food_id === food.id)

              return (
                <div
                  key={food.id}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-44 overflow-hidden bg-gray-100">
                      <img
                        src={mediaUrl(food.image_url)}
                        alt={food.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'
                        }}
                      />
                      {food.is_popular && (
                        <span className="absolute top-2.5 left-2.5 bg-amber-400 text-gray-950 px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow">
                          Popular
                        </span>
                      )}
                      {food.discount_price && food.discount_price < food.price && (
                        <span className="absolute top-2.5 right-2.5 bg-brand-500 text-white px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow">
                          Sale
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      {food.restaurant_name && (
                        <Link
                          to={`/restaurants/${food.restaurant_id}`}
                          className="text-xs font-semibold text-gray-400 hover:text-brand-600 transition block truncate"
                        >
                          {food.restaurant_name}
                        </Link>
                      )}

                      <h3 className="font-bold text-gray-900 text-base mt-1 line-clamp-1">
                        {food.name}
                      </h3>

                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {food.description || 'Deliciously prepared with fresh ingredients.'}
                      </p>

                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-lg font-extrabold text-brand-600">
                          {money(food.effective_price || food.price)}
                        </span>
                        {food.discount_price && food.discount_price < food.price && (
                          <span className="text-xs text-gray-400 line-through">
                            {money(food.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Add to Cart Actions */}
                  <div className="p-4 pt-0">
                    {qty === 0 ? (
                      <button
                        onClick={() => handleAddToCart(food)}
                        className="w-full py-2 px-3 rounded-xl bg-gray-100 hover:bg-brand-500 text-gray-800 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Plus size={14} /> Add to Cart
                      </button>
                    ) : (
                      <div className="flex items-center justify-between bg-brand-50 rounded-xl px-3 py-1.5">
                        <span className="text-xs font-semibold text-brand-700">In Cart</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateItem(cartItem.id, qty - 1)}
                            className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center text-brand-600 hover:bg-brand-500 hover:text-white transition"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-bold text-brand-700 w-4 text-center">{qty}</span>
                          <button
                            onClick={() => updateItem(cartItem.id, qty + 1)}
                            className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center text-brand-600 hover:bg-brand-500 hover:text-white transition"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
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
