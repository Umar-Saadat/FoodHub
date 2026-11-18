import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Plus, CreditCard, Banknote, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import { authService } from '../services/authService'
import { orderService } from '../services/orderService'
import { foodService } from '../services/foodService'
import { api, errorMessage } from '../services/api'
import { money, cx } from '../utils/format'
import { useCart } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'

const LABEL_OPTIONS = ['Home', 'Work', 'Other']

function AddressForm({ onSave, onCancel, initial = {} }) {
  const [form, setForm] = useState({
    label: initial.label || 'Home',
    address: initial.address || '',
    city: initial.city || '',
    is_default: initial.is_default || false,
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.address.trim() || !form.city.trim()) {
      setErr('Address and city are required.')
      return
    }
    setSaving(true)
    setErr('')
    try {
      const result = await onSave(form)
      return result
    } catch (e) {
      setErr(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-2xl p-4 mt-3 border border-gray-200 space-y-3">
      <div className="flex gap-3 flex-wrap">
        {LABEL_OPTIONS.map(opt => (
          <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="label"
              value={opt}
              checked={form.label === opt}
              onChange={handleChange}
              className="accent-brand-500"
            />
            <span className="text-sm font-medium text-gray-700">{opt}</span>
          </label>
        ))}
        <input
          type="text"
          name="label"
          value={form.label}
          onChange={handleChange}
          placeholder="Custom label"
          className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-32"
        />
      </div>
      <input
        type="text"
        name="address"
        value={form.address}
        onChange={handleChange}
        placeholder="Address Line"
        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <input
        type="text"
        name="city"
        value={form.city}
        onChange={handleChange}
        placeholder="City"
        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          name="is_default"
          checked={form.is_default}
          onChange={handleChange}
          className="accent-brand-500 w-4 h-4"
        />
        <span className="text-sm text-gray-700">Set as default address</span>
      </label>
      {err && <p className="text-red-500 text-xs">{err}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
        >
          {saving ? 'Saving…' : 'Save Address'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="border border-gray-300 text-gray-600 font-semibold px-5 py-2 rounded-xl text-sm hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { cart, clearCart } = useCart()
  const { addToast } = useToast()

  const [addresses, setAddresses] = useState([])
  const [stripeEnabled, setStripeEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [notes, setNotes] = useState('')
  const [placing, setPlacing] = useState(false)
  const [placeError, setPlaceError] = useState('')

  const items = cart?.items || []
  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const promoDiscount = cart?.promo_discount || 0
  const deliveryFee = cart?.delivery_fee || 0
  const total = subtotal - promoDiscount + deliveryFee

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [addrRes, cfgRes] = await Promise.allSettled([
          authService.addresses(),
          foodService.config(),
        ])
        const addrs = addrRes.status === 'fulfilled' ? (addrRes.value?.data || []) : []
        setAddresses(addrs)
        const defaultAddr = addrs.find(a => a.is_default) || addrs[0]
        if (defaultAddr) setSelectedAddressId(defaultAddr.id)
        if (addrs.length === 0) setShowAddForm(true)

        const cfg = cfgRes.status === 'fulfilled' ? cfgRes.value?.data : null
        setStripeEnabled(cfg?.stripe_enabled || false)
      } catch (e) {
        // partial failures handled above
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleAddAddress(form) {
    const { data } = await authService.addAddress(form)
    setAddresses(prev => [...prev, data])
    setSelectedAddressId(data.id)
    setShowAddForm(false)
  }

  async function handlePlaceOrder() {
    setPlaceError('')
    if (!selectedAddressId) {
      setPlaceError('Please select a delivery address.')
      return
    }
    if (items.length === 0) {
      setPlaceError('Your cart is empty.')
      return
    }
    setPlacing(true)
    try {
      const payload = {
        address_id: selectedAddressId,
        payment_method: paymentMethod,
        notes: notes.trim() || undefined,
        promo_code: cart?.promo_code || undefined,
      }
      const { data: order } = await orderService.create(payload)
      await clearCart()
      addToast('Order placed successfully!', 'success')
      navigate(`/orders/${order.id}`)
    } catch (e) {
      setPlaceError(errorMessage(e))
    } finally {
      setPlacing(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <Spinner />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>

        {/* Section 1 — Delivery Address */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <MapPin size={20} className="text-brand-500" />
              Delivery Address
            </h2>
            {addresses.length > 0 && (
              <button
                onClick={() => setShowAddForm(v => !v)}
                className="flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600 font-medium"
              >
                <Plus size={15} />
                Add New
                {showAddForm ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>

          {addresses.length === 0 && (
            <p className="text-gray-500 text-sm mb-3">Add your first delivery address</p>
          )}

          <div className="space-y-3">
            {addresses.map(addr => (
              <label
                key={addr.id}
                className={cx(
                  'flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors',
                  selectedAddressId === addr.id
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <input
                  type="radio"
                  name="address"
                  value={addr.id}
                  checked={selectedAddressId === addr.id}
                  onChange={() => setSelectedAddressId(addr.id)}
                  className="mt-0.5 accent-brand-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-gray-800 text-sm">{addr.label}</span>
                    {addr.is_default && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Default</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{addr.address}</p>
                  <p className="text-sm text-gray-500">{addr.city}</p>
                </div>
              </label>
            ))}
          </div>

          {showAddForm && (
            <AddressForm
              onSave={handleAddAddress}
              onCancel={addresses.length > 0 ? () => setShowAddForm(false) : undefined}
            />
          )}
        </section>

        {/* Section 2 — Order Summary */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            {items.map(item => (
              <div key={item.id} className="flex justify-between text-gray-600">
                <span>{item.name} × {item.quantity}</span>
                <span>{money(item.unit_price * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-2 flex justify-between text-gray-700">
              <span>Subtotal</span><span>{money(subtotal)}</span>
            </div>
            {promoDiscount > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Promo ({cart.promo_code})</span>
                <span>-{money(promoDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-700">
              <span>Delivery fee</span>
              <span>{deliveryFee > 0 ? money(deliveryFee) : 'Free'}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-base text-gray-900">
              <span>Total</span><span>{money(total)}</span>
            </div>
          </div>
        </section>

        {/* Section 3 — Payment Method */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Payment Method</h2>
          <div className="space-y-3">
            {/* Cash */}
            <label className={cx(
              'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors',
              paymentMethod === 'cash' ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
            )}>
              <input
                type="radio"
                name="payment"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={() => setPaymentMethod('cash')}
                className="mt-0.5 accent-brand-500"
              />
              <div>
                <div className="flex items-center gap-2 font-semibold text-gray-800">
                  <Banknote size={18} className="text-green-600" />
                  Cash on Delivery
                </div>
                <p className="text-sm text-gray-500 mt-0.5">Pay with cash when your order arrives</p>
              </div>
            </label>

            {/* Card */}
            <label className={cx(
              'flex items-start gap-3 p-4 rounded-xl border-2 transition-colors',
              stripeEnabled
                ? 'cursor-pointer ' + (paymentMethod === 'card' ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300')
                : 'cursor-not-allowed opacity-60 border-gray-200 bg-gray-50'
            )}>
              <input
                type="radio"
                name="payment"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={() => stripeEnabled && setPaymentMethod('card')}
                disabled={!stripeEnabled}
                className="mt-0.5 accent-brand-500"
              />
              <div>
                <div className="flex items-center gap-2 font-semibold text-gray-800">
                  <CreditCard size={18} className="text-blue-600" />
                  Pay with Card (Stripe)
                </div>
                {stripeEnabled ? (
                  <p className="text-sm text-gray-500 mt-0.5">Secure online payment</p>
                ) : (
                  <p className="text-sm text-amber-600 mt-0.5">
                    Stripe not configured. Add <code className="bg-amber-100 px-1 rounded text-xs">STRIPE_SECRET_KEY</code> to backend/.env
                  </p>
                )}
              </div>
            </label>
          </div>
        </section>

        {/* Section 4 — Special Instructions */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Special Instructions</h2>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Any special instructions for your order? (optional)"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </section>

        {/* Place Order */}
        {placeError && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle size={16} />
            {placeError}
          </div>
        )}
        <button
          onClick={handlePlaceOrder}
          disabled={placing}
          className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold py-4 rounded-xl text-base transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          {placing ? (
            <>
              <Spinner size="sm" color="white" />
              Placing Order…
            </>
          ) : (
            `Place Order · ${money(total)}`
          )}
        </button>
      </div>
    </MainLayout>
  )
}
