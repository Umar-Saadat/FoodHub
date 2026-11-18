import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingCart, Tag, CheckCircle, XCircle } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import Spinner from '../components/ui/Spinner'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { money, mediaUrl, cx } from '../utils/format'

export default function CartPage() {
  const { cart, updateItem, removeItem, applyPromo, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [promoCode, setPromoCode] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoResult, setPromoResult] = useState(null) // { success: bool, message: string }

  const items = cart?.items || []
  const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
  const promoDiscount = cart?.promo_discount || 0
  const deliveryFee = cart?.delivery_fee || 0
  const total = subtotal - promoDiscount + deliveryFee

  async function handleApplyPromo() {
    if (!promoCode.trim()) return
    setPromoLoading(true)
    setPromoResult(null)
    try {
      const result = await applyPromo(promoCode.trim())
      if (result?.success) {
        setPromoResult({ success: true, message: result.message || 'Promo code applied!' })
      } else {
        setPromoResult({ success: false, message: result?.message || 'Invalid promo code.' })
      }
    } catch (err) {
      setPromoResult({ success: false, message: 'Invalid or expired promo code.' })
    } finally {
      setPromoLoading(false)
    }
  }

  function handleQtyChange(item, delta) {
    const newQty = item.quantity + delta
    if (newQty < 1) {
      removeItem(item.id)
    } else {
      updateItem(item.id, newQty)
    }
  }

  if (items.length === 0) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16">
          <div className="text-8xl mb-6">🛒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Browse restaurants and add your favorites</p>
          <Link
            to="/restaurants"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            <ShoppingCart size={20} />
            Start Ordering
          </Link>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Your Cart</h1>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="flex-1 space-y-4">
            {items.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex gap-4"
              >
                {/* Image */}
                <img
                  src={mediaUrl(item.image_url)}
                  alt={item.name}
                  className="h-20 w-20 object-cover rounded-xl flex-shrink-0 bg-gray-100"
                  onError={e => { e.target.src = '/placeholder-food.png' }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.restaurant_name}</p>
                  {item.special_instructions && (
                    <p className="text-xs italic text-gray-400 mt-1 truncate">{item.special_instructions}</p>
                  )}

                  <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                    {/* Qty controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQtyChange(item, -1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center font-semibold text-gray-800">{item.quantity}</span>
                      <button
                        onClick={() => handleQtyChange(item, 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Item total + remove */}
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">
                        {money(item.unit_price * item.quantity)}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:w-80 xl:w-96">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-3 text-sm">
                {/* Line items */}
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-gray-600">
                    <span className="truncate pr-2">{item.name} × {item.quantity}</span>
                    <span className="flex-shrink-0">{money(item.unit_price * item.quantity)}</span>
                  </div>
                ))}

                <div className="border-t border-gray-100 pt-3 flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>{money(subtotal)}</span>
                </div>

                {promoDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span className="flex items-center gap-1">
                      <Tag size={14} />
                      Promo ({cart.promo_code})
                    </span>
                    <span>-{money(promoDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-700">
                  <span>Delivery fee</span>
                  <span>{deliveryFee > 0 ? money(deliveryFee) : <span className="text-green-600">Free</span>}</span>
                </div>

                <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-lg text-gray-900">
                  <span>Total</span>
                  <span>{money(total)}</span>
                </div>
              </div>

              {/* Promo code */}
              {!promoDiscount && (
                <div className="mt-5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                      placeholder="Promo code"
                      className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleApplyPromo}
                      disabled={promoLoading || !promoCode.trim()}
                      className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                    >
                      {promoLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                  {promoResult && (
                    <div className={cx(
                      'mt-2 flex items-center gap-1.5 text-xs font-medium',
                      promoResult.success ? 'text-green-600' : 'text-red-500'
                    )}>
                      {promoResult.success
                        ? <CheckCircle size={13} />
                        : <XCircle size={13} />
                      }
                      {promoResult.message}
                    </div>
                  )}
                </div>
              )}

              {promoDiscount > 0 && (
                <div className="mt-4 flex items-center gap-2 text-green-600 text-sm font-medium bg-green-50 rounded-xl px-3 py-2">
                  <CheckCircle size={15} />
                  Promo "{cart.promo_code}" applied
                </div>
              )}

              {/* Checkout button */}
              <div className="mt-6">
                {user ? (
                  <button
                    onClick={() => navigate('/checkout')}
                    className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 rounded-xl text-base transition-colors shadow-sm"
                  >
                    Proceed to Checkout
                  </button>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      Please{' '}
                      <Link to="/login" className="text-brand-500 hover:underline font-medium">
                        log in
                      </Link>{' '}
                      to checkout
                    </p>
                    <Link
                      to="/login"
                      className="block w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 rounded-xl text-base transition-colors text-center"
                    >
                      Log in to Checkout
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
