import { useState, useEffect, useCallback } from 'react'
import {
  ClipboardList, Search, Eye, Truck, CheckCircle2,
  AlertCircle, ChevronRight, User, MapPin, DollarSign, Clock
} from 'lucide-react'
import { orderService } from '../../services/orderService'
import { adminService } from '../../services/paymentService'
import { money, mediaUrl } from '../../utils/format'
import { statusLabel, ORDER_STATUSES } from '../../utils/status'
import { useToast } from '../../contexts/ToastContext'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'

export default function AdminOrdersPage() {
  const { addToast } = useToast()
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  // Drivers list for assignment
  const [drivers, setDrivers] = useState([])

  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [assigningDriver, setAssigningDriver] = useState(false)
  const [driverToAssign, setDriverToAssign] = useState('')

  const fetchDrivers = async () => {
    try {
      const res = await adminService.drivers()
      setDrivers(res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page,
        page_size: 20,
      }
      if (statusFilter) params.status = statusFilter

      const res = await orderService.list(params)
      setOrders(res.data.items || [])
      setTotal(res.data.total || 0)
    } catch (err) {
      addToast('Failed to load orders', 'error')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page, addToast])

  useEffect(() => {
    fetchOrders()
    fetchDrivers()
  }, [fetchOrders])

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderService.status(orderId, newStatus)
      addToast(`Order updated to ${statusLabel(newStatus)}`, 'success')
      fetchOrders()
      if (selectedOrder && selectedOrder.id === orderId) {
        const updated = await orderService.get(orderId)
        setSelectedOrder(updated.data)
      }
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Failed to update order status', 'error')
    }
  }

  const handleAssignDriver = async (e) => {
    e.preventDefault()
    if (!driverToAssign || !selectedOrder) return
    setAssigningDriver(true)
    try {
      await orderService.assignDriver(selectedOrder.id, Number(driverToAssign))
      addToast('Driver assigned successfully', 'success')
      const updated = await orderService.get(selectedOrder.id)
      setSelectedOrder(updated.data)
      fetchOrders()
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Failed to assign driver', 'error')
    } finally {
      setAssigningDriver(false)
    }
  }

  const handleConfirmCash = async (orderId) => {
    try {
      await orderService.confirmCash(orderId)
      addToast('Cash payment confirmed', 'success')
      const updated = await orderService.get(orderId)
      setSelectedOrder(updated.data)
      fetchOrders()
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Failed to confirm cash', 'error')
    }
  }

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase()
    if (['pending', 'confirmed'].includes(s)) {
      return 'bg-amber-50 text-amber-800 border-amber-200'
    }
    if (['preparing', 'ready_for_pickup'].includes(s)) {
      return 'bg-blue-50 text-blue-800 border-blue-200'
    }
    if (['picked_up', 'out_for_delivery'].includes(s)) {
      return 'bg-purple-50 text-purple-800 border-purple-200'
    }
    if (s === 'delivered') {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200'
    }
    return 'bg-red-50 text-red-800 border-red-200'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Orders Management</h1>
          <p className="text-sm text-gray-500">Track and dispatch customer food orders in real time</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => { setStatusFilter(''); setPage(1) }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
            statusFilter === ''
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          All Orders
        </button>
        {ORDER_STATUSES.map((st) => (
          <button
            key={st}
            onClick={() => { setStatusFilter(st); setPage(1) }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              statusFilter === st
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {statusLabel(st)}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center"><Spinner size="lg" /></div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <ClipboardList size={40} className="mx-auto mb-2 text-gray-300" />
            <p className="font-semibold text-sm">No orders matching this filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Restaurant</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-brand-600">
                      {o.order_number || `#${o.id}`}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {o.restaurant?.name || o.restaurant_name || '—'}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {o.created_at ? new Date(o.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {money(o.total_amount || o.total)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize text-xs font-semibold text-gray-600">
                        {o.payment_method === 'cash' ? '💵 Cash' : '💳 Card'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(o.status)}`}>
                        {statusLabel(o.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={o.status}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                          className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 font-semibold text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-500"
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>{statusLabel(s)}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          title={`Order ${selectedOrder.order_number || `#${selectedOrder.id}`}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            {/* Status & Restaurant Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div>
                <p className="text-xs text-gray-500">Restaurant</p>
                <p className="font-bold text-gray-900 text-base">{selectedOrder.restaurant?.name || selectedOrder.restaurant_name}</p>
                <p className="text-xs text-gray-400">{selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString() : ''}</p>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(selectedOrder.status)}`}>
                  {statusLabel(selectedOrder.status)}
                </span>
                <p className="text-lg font-extrabold text-brand-600 mt-1">
                  {money(selectedOrder.total_amount || selectedOrder.total)}
                </p>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Order Items</h4>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} className="p-3 bg-white flex justify-between items-center text-sm">
                    <div>
                      <p className="font-bold text-gray-800">{item.name || item.food_name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity} × {money(item.unit_price || item.price)}</p>
                    </div>
                    <span className="font-bold text-gray-900">
                      {money((item.quantity || 1) * (item.unit_price || item.price || 0))}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                  <MapPin size={14} /> Delivery Address
                </h5>
                <p className="text-xs text-gray-800 font-medium mt-1">
                  {selectedOrder.address ? (
                    <>
                      {selectedOrder.address.address_line}<br />
                      {selectedOrder.address.city}
                    </>
                  ) : (
                    'Address details on record'
                  )}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                  <DollarSign size={14} /> Payment & Notes
                </h5>
                <p className="text-xs text-gray-700">
                  Method: <strong className="capitalize">{selectedOrder.payment_method}</strong>
                </p>
                {selectedOrder.payment && (
                  <p className="text-xs text-gray-700 mt-0.5">
                    Payment Status: <strong className="capitalize text-emerald-600">{selectedOrder.payment.status}</strong>
                  </p>
                )}
                {selectedOrder.payment_method === 'cash' && selectedOrder.payment?.status !== 'paid' && (
                  <button
                    onClick={() => handleConfirmCash(selectedOrder.id)}
                    className="mt-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded-lg transition"
                  >
                    Confirm Cash Received
                  </button>
                )}
              </div>
            </div>

            {/* Driver Assignment Section */}
            <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl">
              <h5 className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-2 flex items-center gap-1.5">
                <Truck size={15} /> Assigned Driver
              </h5>
              {selectedOrder.driver ? (
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-gray-900">{selectedOrder.driver.full_name || selectedOrder.driver.user?.full_name}</p>
                    <p className="text-gray-500">Vehicle: {selectedOrder.driver.vehicle_type} • Plate: {selectedOrder.driver.license_plate}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                    Dispatched
                  </span>
                </div>
              ) : (
                <form onSubmit={handleAssignDriver} className="flex gap-2 items-center">
                  <select
                    value={driverToAssign}
                    onChange={(e) => setDriverToAssign(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="">Select a driver to dispatch...</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.full_name} ({d.vehicle_type || 'Vehicle'}) — {d.is_available ? 'Available' : 'Busy'}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={assigningDriver || !driverToAssign}
                    className="px-4 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 disabled:opacity-50 transition"
                  >
                    {assigningDriver ? 'Assigning...' : 'Assign'}
                  </button>
                </form>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
