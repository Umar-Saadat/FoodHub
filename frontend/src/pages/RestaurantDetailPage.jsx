import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Star, Clock, MapPin, Phone, ShoppingBag, Plus, Minus,
  ChevronLeft, MessageSquare, Send, Check
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import MainLayout from '../components/layout/MainLayout'
import Spinner from '../components/ui/Spinner'
import { foodService } from '../services/foodService'
import { money, mediaUrl } from '../utils/format'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

// Fix Leaflet's default icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function RestaurantDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { cart, addItem, updateItem } = useCart()
  const { addToast } = useToast()

  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Review state
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  const fetchRestaurant = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await foodService.restaurant(id)
      setRestaurant(res.data)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load restaurant details')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchRestaurant()
  }, [fetchRestaurant])

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!comment.trim()) {
      addToast('Please write a short comment for your review', 'warning')
      return
    }
    setSubmittingReview(true)
    try {
      await foodService.review(id, { rating: Number(rating), comment: comment.trim() })
      addToast('Thank you! Your review has been posted.', 'success')
      setComment('')
      setRating(5)
      fetchRestaurant()
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Failed to post review', 'error')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-gray-500 font-medium text-sm">Preparing restaurant menu...</p>
        </div>
      </MainLayout>
    )
  }

  if (error || !restaurant) {
    return (
      <MainLayout>
        <div className="max-w-xl mx-auto my-20 p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Restaurant Not Found</h2>
          <p className="text-gray-500 mb-6">{error || "The restaurant you're looking for doesn't exist or is currently inactive."}</p>
          <Link
            to="/restaurants"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 transition"
          >
            <ChevronLeft size={18} />
            Back to Restaurants
          </Link>
        </div>
      </MainLayout>
    )
  }

  // Extract unique categories from foods
  const foods = restaurant.foods || []
  const categoryIds = Array.from(new Set(foods.map((f) => f.category_id).filter(Boolean)))
  
  // Filter foods by selected category
  const filteredFoods = selectedCategory === 'all'
    ? foods
    : foods.filter((f) => String(f.category_id) === String(selectedCategory))

  // Find cart quantity for a given food
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

  return (
    <MainLayout>
      {/* Hero Header */}
      <div className="relative bg-gray-900 text-white">
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <img
            src={mediaUrl(restaurant.image_url || restaurant.image) || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200'}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <Link
            to="/restaurants"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-300 hover:text-white mb-6 transition"
          >
            <ChevronLeft size={16} /> Back to all restaurants
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-500 text-white">
                  {restaurant.cuisine || 'Gourmet'}
                </span>
                {restaurant.is_featured && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-gray-950">
                    ⭐ Featured Partner
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                {restaurant.name}
              </h1>

              <p className="mt-2 text-gray-300 text-sm md:text-base max-w-2xl">
                {restaurant.description}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-gray-300">
                <div className="flex items-center gap-1.5">
                  <Star size={16} className="text-amber-400 fill-amber-400" />
                  <span className="font-bold text-white">{restaurant.rating ? restaurant.rating.toFixed(1) : 'New'}</span>
                  <span className="text-gray-400">({restaurant.review_count || 0} reviews)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={16} className="text-gray-400" />
                  <span>{restaurant.delivery_time_min || 30} mins</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} className="text-gray-400" />
                  <span>{restaurant.address}, {restaurant.city}</span>
                </div>
                {restaurant.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone size={16} className="text-gray-400" />
                    <span>{restaurant.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Badge Box */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex gap-6 text-center">
              <div>
                <p className="text-xs text-gray-400">Delivery Fee</p>
                <p className="text-lg font-bold text-white">{restaurant.delivery_fee ? money(restaurant.delivery_fee) : 'Free'}</p>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <p className="text-xs text-gray-400">Min. Order</p>
                <p className="text-lg font-bold text-white">{money(restaurant.min_order || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Menu Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                Menu
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Handcrafted meals made fresh with quality ingredients.
              </p>
            </div>

            {/* Foods Grid */}
            {filteredFoods.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-gray-500 text-sm">No dishes available in this category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFoods.map((food) => {
                  const qty = getCartQuantity(food.id)
                  const cartItem = cart?.items?.find((i) => i.food_id === food.id)

                  return (
                    <div
                      key={food.id}
                      className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                    >
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 text-base">{food.name}</h3>
                            {food.is_popular && (
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Popular
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {food.description || 'Delicious freshly prepared dish.'}
                          </p>
                          <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-base font-extrabold text-brand-600">
                              {money(food.effective_price || food.price)}
                            </span>
                            {food.discount_price && food.discount_price < food.price && (
                              <span className="text-xs text-gray-400 line-through">
                                {money(food.price)}
                              </span>
                            )}
                          </div>
                        </div>

                        {food.image_url && (
                          <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                            <img
                              src={mediaUrl(food.image_url)}
                              alt={food.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300'
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Add to Cart Actions */}
                      <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                        <span className="text-[11px] text-gray-400 font-medium">
                          {food.prep_time_min ? `⏱ ${food.prep_time_min} mins prep` : 'Made to order'}
                        </span>

                        {qty === 0 ? (
                          <button
                            onClick={() => handleAddToCart(food)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-500 text-brand-600 hover:text-white font-bold text-xs transition duration-200"
                          >
                            <Plus size={14} /> Add
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 bg-brand-50 rounded-xl px-2 py-1">
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
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Customer Reviews Section */}
            <div className="pt-10 border-t border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Customer Reviews</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Real feedback from verified orders</p>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 px-3 py-1 rounded-xl text-sm font-bold">
                  <Star size={16} className="fill-amber-400 text-amber-400" />
                  <span>{restaurant.rating ? restaurant.rating.toFixed(1) : 'New'}</span>
                </div>
              </div>

              {/* Add Review Box */}
              {user ? (
                <form onSubmit={handleReviewSubmit} className="mb-8 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-800 mb-2">Leave a Review</h4>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-gray-500 font-medium">Rating:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 focus:outline-none"
                        >
                          <Star
                            size={18}
                            className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us what you liked about the food and delivery..."
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-bold hover:bg-brand-600 disabled:opacity-50 transition"
                    >
                      <Send size={14} />
                      {submittingReview ? 'Posting...' : 'Post Review'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600 flex items-center justify-between">
                  <span>Sign in to share your experience with this restaurant.</span>
                  <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700">
                    Sign in
                  </Link>
                </div>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                {(!restaurant.reviews || restaurant.reviews.length === 0) ? (
                  <p className="text-sm text-gray-400 italic">No reviews yet. Be the first to order and review!</p>
                ) : (
                  restaurant.reviews.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-800 text-sm">{rev.author_name || 'Customer'}</span>
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                            <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{rev.comment}</p>
                      <p className="text-[10px] text-gray-400 mt-2">
                        {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : ''}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Location & Map & Info (1 Col) */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <MapPin size={18} className="text-brand-500" /> Location & Contact
              </h3>

              {/* Leaflet Map */}
              {restaurant.latitude && restaurant.longitude ? (
                <div className="h-64 rounded-2xl overflow-hidden border border-gray-200">
                  <MapContainer
                    center={[restaurant.latitude, restaurant.longitude]}
                    zoom={15}
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[restaurant.latitude, restaurant.longitude]}>
                      <Popup>
                        <div className="font-bold text-xs">{restaurant.name}</div>
                        <div className="text-[11px] text-gray-500">{restaurant.address}</div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              ) : (
                <div className="h-48 bg-gray-100 rounded-2xl flex items-center justify-center text-xs text-gray-400">
                  Map coordinates not available
                </div>
              )}

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
                  <span>{restaurant.address}, {restaurant.city}</span>
                </div>
                {restaurant.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400 shrink-0" />
                    <span>{restaurant.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Hours & Policy Card */}
            <div className="bg-brand-50/60 border border-brand-100 rounded-3xl p-6 space-y-3">
              <h4 className="font-bold text-brand-900 text-sm">Delivery Information</h4>
              <p className="text-xs text-brand-800 leading-relaxed">
                Orders are freshly prepared upon receipt. Estimated delivery time is approximately {restaurant.delivery_time_min || 30} minutes depending on traffic.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-brand-700">
                <Check size={14} className="text-brand-500" />
                Contactless delivery available
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
