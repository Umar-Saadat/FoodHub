import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  CheckCircle, Clock, XCircle, MapPin, User, Car,
  Phone, CreditCard, Banknote, ArrowLeft, Wifi, WifiOff
} from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import { orderService } from '../services/orderService'
import { wsUrl, getAccessToken } from '../services/api'
import { money, cx } from '../utils/format'
import { statusLabel, canCustomerCancel } from '../utils/status'
import { useToast } from '../contexts/ToastContext'

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
})

const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const STATUS_STEPS = [
  'pending',
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'picked_up',
  'out_for_delivery',
  'delivered',
]

function statusVariant(status) {
  if (['pending', 'confirmed'].includes(status)) return 'warning'
  if (['preparing', 'ready_for_pickup'].includes(status)) return 'info'
  if (['picked_up', 'out_for_delivery'].includes(status)) return 'purple'
  if (status === 'delivered') return 'success'
  if (status === 'cancelled') return 'error'
  return 'default'
}

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatOrderNumber(id) {
  return `FH-${String(id).padStart(8, '0')}`
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  const wsRef = useRef(null)
  const mapRef = useRef(null)
  const driverMarkerRef = useRef(null)

  // Fetch initial order
  useEffect(() => {
    async function fetchOrder() {
      setLoading(true)
      setError('')
      try {
        const { data } = await orderService.get(id)
        setOrder(data)
      } catch (e) {
        setError('Failed to load order details.')
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [id])

  // WebSocket for live tracking
  useEffect(() => {
    if (!id) return
    let ws
    let reconnectTimer

    function connect() {
      try {
        const token = getAccessToken()
        const url = wsUrl(`/ws/tracking/${id}${token ? `?token=${token}` : ''}`)
        ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = () => setWsConnected(true)

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data)
            if (msg.order) setOrder(msg.order)
          } catch (_) {}
        }

        ws.onerror = () => setWsConnected(false)

        ws.onclose = () => {
          setWsConnected(false)
          // Auto-reconnect after 5s unless intentionally closed
          reconnectTimer = setTimeout(connect, 5000)
        }
      } catch (_) {
        setWsConnected(false)
      }
    }

    connect()

    return () => {
      clearTimeout(reconnectTimer)
      if (wsRef.current) wsRef.current.close()
    }
  }, [id])

  async function handleCancel() {
    if (!window.confirm('Are you sure you want to cancel this order?')) return
    setCancelling(true)
    try {
      const { data } = await orderService.cancel(id)
      setOrder(prev => ({ ...prev, ...data, status: data.status || 'cancelled' }))
      addToast('Order cancelled successfully.', 'info')
    } catch (e) {
      addToast('Failed to cancel order.', 'error')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[50vh]"><Spinner /></div>
      </MainLayout>
    )
  }

  if (error || !order) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <XCircle size={48} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">{error || 'Order not found'}</h2>
          <button onClick={() => navigate('/orders')} className="text-brand-500 hover:underline font-medium mt-2">
            ← Back to Orders
          </button>
        </div>
      </MainLayout>
    )
  }

  const currentStepIndex = STATUS_STEPS.indexOf(order.status)
  const isCancelled = order.status === 'cancelled'
  const hasDriverLocation = order.driver?.latitude && order.driver?.longitude

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Back + WS indicator */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Back to Orders
          </button>
          <div className="flex items-center gap-1.5 text-xs font-medium">
            {wsConnected
              ? <><Wifi size={13} className="text-green-500" /><span className="text-green-600">Live</span></>
              : <><WifiOff size={13} className="text-gray-400" /><span className="text-gray-400">Offline</span></>
            }
          </div>
        </div>

        {/* Order Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-wrap gap-4 items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{formatOrderNumber(order.id)}</h1>
              <p className="text-gray-500 text-sm mt-1">
                {order.restaurant?.name || order.restaurant_name} · Placed {formatDate(order.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={statusVariant(order.status)} className="text-sm px-3 py-1">
                {statusLabel(order.status)}
              </Badge>
              {canCustomerCancel(order.status) && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="border border-red-300 text-red-500 hover:bg-red-50 font-semibold px-4 py-1.5 rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling…' : 'Cancel Order'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Stepper or Cancelled Banner */}
        {isCancelled ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
            <XCircle size={40} className="mx-auto text-red-500 mb-2" />
            <h2 className="text-2xl font-black text-red-600 tracking-wide uppercase">Cancelled</h2>
            <p className="text-red-500 text-sm mt-1">This order has been cancelled.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-700 mb-6">Order Progress</h2>
            {/* Desktop: horizontal stepper */}
            <div className="hidden sm:flex items-center justify-between">
              {STATUS_STEPS.map((step, idx) => {
                const done = idx < currentStepIndex
                const active = idx === currentStepIndex
                const future = idx > currentStepIndex
                return (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={cx(
                        'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                        done ? 'bg-green-500' : active ? 'bg-brand-500 animate-pulse' : 'bg-gray-200'
                      )}>
                        {done
                          ? <CheckCircle size={18} className="text-white" />
                          : active
                            ? <div className="w-3 h-3 rounded-full bg-white" />
                            : <div className="w-3 h-3 rounded-full bg-gray-400" />
                        }
                      </div>
                      <span className={cx(
                        'text-xs mt-1 text-center max-w-[64px] leading-tight',
                        done ? 'text-green-600 font-medium' : active ? 'text-brand-500 font-bold' : 'text-gray-400'
                      )}>
                        {statusLabel(step)}
                      </span>
                    </div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div className={cx(
                        'flex-1 h-0.5 mx-1 transition-colors',
                        done ? 'bg-green-400' : 'bg-gray-200'
                      )} />
                    )}
                  </div>
                )
              })}
            </div>
            {/* Mobile: vertical stepper */}
            <div className="sm:hidden space-y-3">
              {STATUS_STEPS.map((step, idx) => {
                const done = idx < currentStepIndex
                const active = idx === currentStepIndex
                return (
                  <div key={step} className="flex items-center gap-3">
                    <div className={cx(
                      'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                      done ? 'bg-green-500' : active ? 'bg-brand-500 animate-pulse' : 'bg-gray-200'
                    )}>
                      {done
                        ? <CheckCircle size={14} className="text-white" />
                        : <div className={cx('w-2.5 h-2.5 rounded-full', active ? 'bg-white' : 'bg-gray-400')} />
                      }
                    </div>
                    <span className={cx(
                      'text-sm',
                      done ? 'text-green-600 font-medium' : active ? 'text-brand-500 font-bold' : 'text-gray-400'
                    )}>
                      {statusLabel(step)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-800 mb-4">Items Ordered</h2>
          <div className="space-y-3">
            {(order.items || []).map(item => (
              <div key={item.id} className="flex justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">
                    {item.name} <span className="text-gray-500">× {item.quantity}</span>
                  </p>
                  {item.special_instructions && (
                    <p className="text-xs italic text-gray-400 mt-0.5">{item.special_instructions}</p>
                  )}
                </div>
                <span className="text-sm font-semibold text-gray-800 flex-shrink-0">{money(item.total_price)}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
              <span>Total</span>
              <span>{money(order.total_amount || order.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery + Driver */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Delivery Address */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <MapPin size={17} className="text-brand-500" />
              Delivery Address
            </h2>
            {order.address ? (
              <div className="text-sm text-gray-700 space-y-0.5">
                <p className="font-semibold">{order.address.label}</p>
                <p>{order.address.address || order.address.address_line}</p>
                <p className="text-gray-500">{order.address.city}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Address information not available.</p>
            )}
          </div>

          {/* Driver Info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <User size={17} className="text-brand-500" />
              Driver
            </h2>
            {order.driver ? (
              <div className="text-sm text-gray-700 space-y-1.5">
                {order.status === 'out_for_delivery' && (
                  <p className="text-brand-500 font-semibold mb-2">
                    🚴 {order.driver.name || 'Driver'} is on the way!
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <User size={14} className="text-gray-400" />
                  <span>{order.driver.name || order.driver.full_name}</span>
                </div>
                {order.driver.vehicle_type && (
                  <div className="flex items-center gap-2">
                    <Car size={14} className="text-gray-400" />
                    <span>{order.driver.vehicle_type}{order.driver.license_plate ? ` · ${order.driver.license_plate}` : ''}</span>
                  </div>
                )}
                {order.driver.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    <a href={`tel:${order.driver.phone}`} className="text-brand-500 hover:underline">
                      {order.driver.phone}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Driver not assigned yet.</p>
            )}
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
            {order.payment_method === 'card'
              ? <CreditCard size={17} className="text-brand-500" />
              : <Banknote size={17} className="text-brand-500" />
            }
            Payment
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
            <span className="font-medium">
              {order.payment_method === 'card' ? 'Pay with Card (Stripe)' : 'Cash on Delivery'}
            </span>
            <Badge variant={
              order.payment_status === 'paid' ? 'success'
                : order.payment_status === 'failed' ? 'error'
                  : 'warning'
            }>
              {order.payment_status || 'pending'}
            </Badge>
            <span className="font-bold text-gray-900 ml-auto">{money(order.total_amount || order.total)}</span>
          </div>
        </div>

        {/* Live Map */}
        {hasDriverLocation && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin size={17} className="text-brand-500" />
              Live Tracking
            </h2>
            <div className="rounded-xl overflow-hidden h-64 sm:h-80 w-full z-0">
              <MapContainer
                center={[order.driver.latitude, order.driver.longitude]}
                zoom={14}
                className="h-full w-full"
                ref={mapRef}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {/* Restaurant marker */}
                {order.restaurant?.latitude && order.restaurant?.longitude && (
                  <Marker position={[order.restaurant.latitude, order.restaurant.longitude]}>
                    <Popup>🏪 {order.restaurant?.name || 'Restaurant'}</Popup>
                  </Marker>
                )}
                {/* Driver marker */}
                <Marker
                  position={[order.driver.latitude, order.driver.longitude]}
                  icon={driverIcon}
                  ref={driverMarkerRef}
                >
                  <Popup>🚴 {order.driver?.name || 'Driver'}</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
