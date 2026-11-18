import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  DollarSign, ShoppingBag, Users, Store,
  TrendingUp, AlertTriangle, ArrowRight
} from 'lucide-react'
import { adminService } from '../../services/paymentService'
import { money, cx } from '../../utils/format'
import { statusLabel } from '../../utils/status'

const STATUS_COLORS = {
  pending:          'bg-yellow-100 text-yellow-700',
  confirmed:        'bg-blue-100 text-blue-700',
  preparing:        'bg-orange-100 text-orange-700',
  ready_for_pickup: 'bg-purple-100 text-purple-700',
  picked_up:        'bg-indigo-100 text-indigo-700',
  out_for_delivery: 'bg-cyan-100 text-cyan-700',
  delivered:        'bg-green-100 text-green-700',
  cancelled:        'bg-red-100 text-red-700',
}

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function SVGBarChart({ data }) {
  const [hovered, setHovered] = useState(null)
  if (!data || data.length === 0) return null

  const max = Math.max(...data.map(d => d.amount), 1)
  const W = 600
  const H = 200
  const padL = 55
  const padR = 10
  const padT = 10
  const padB = 40
  const chartW = W - padL - padR
  const chartH = H - padT - padB
  const barW = (chartW / data.length) * 0.55
  const gap = chartW / data.length

  const yTicks = 4
  const yStep = max / yTicks

  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const labels = data.map(d => {
    const dt = new Date(d.date)
    return dayNames[dt.getDay()]
  })

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 220 }}>
        {/* Y grid lines + labels */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const val = yStep * i
          const y = padT + chartH - (chartH * i / yTicks)
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#f3f4f6" strokeWidth="1" />
              <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">
                {val >= 1000 ? `$${(val/1000).toFixed(1)}k` : `$${Math.round(val)}`}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const barH = Math.max(2, (d.amount / max) * chartH)
          const x = padL + i * gap + (gap - barW) / 2
          const y = padT + chartH - barH
          const isHov = hovered === i
          return (
            <g key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={x} y={y} width={barW} height={barH}
                rx="4"
                fill={isHov ? '#e0124f' : '#ff2d6a'}
                opacity={isHov ? 1 : 0.85}
              />
              {isHov && (
                <g>
                  <rect x={x - 20} y={y - 28} width={barW + 40} height={22} rx="4" fill="#1f2937" />
                  <text x={x + barW / 2} y={y - 13} textAnchor="middle" fontSize="11" fill="white" fontWeight="600">
                    {money(d.amount)}
                  </text>
                </g>
              )}
              {/* X label */}
              <text x={x + barW / 2} y={H - padB + 16} textAnchor="middle" fontSize="11" fill="#6b7280">
                {labels[i]}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function HorizontalBar({ name, count, max }) {
  const pct = max > 0 ? (count / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-32 truncate flex-shrink-0">{name}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-700 w-8 text-right">{count}</span>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    adminService.dashboard()
      .then(r => setData(r.data))
      .catch(e => setError(e?.response?.data?.detail || 'Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-600">{error}</div>
  )

  const maxFood = data?.popular_foods?.length
    ? Math.max(...data.popular_foods.map(f => f.orders))
    : 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening.</p>
      </div>

      {/* Pending orders alert */}
      {data?.pending_orders > 0 && (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-4">
          <AlertTriangle size={18} className="text-yellow-600 flex-shrink-0" />
          <p className="text-yellow-800 font-medium text-sm flex-1">
            ⚠️ {data.pending_orders} order{data.pending_orders !== 1 ? 's' : ''} need attention
          </p>
          <Link
            to="/admin/orders?status=pending"
            className="flex items-center gap-1 text-sm font-semibold text-yellow-700 hover:text-yellow-900 transition-colors"
          >
            View <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={money(data?.total_revenue)}
          color="bg-green-500"
          sub={`${data?.completed_orders} completed orders`}
        />
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value={data?.total_orders?.toLocaleString()}
          color="bg-blue-500"
          sub={`${data?.pending_orders} pending`}
        />
        <StatCard
          icon={Users}
          label="Total Users"
          value={data?.total_users?.toLocaleString()}
          color="bg-purple-500"
        />
        <StatCard
          icon={Store}
          label="Restaurants"
          value={data?.total_restaurants?.toLocaleString()}
          color="bg-brand-500"
          sub={`${data?.total_foods} food items`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Revenue Last 7 Days</h2>
              <p className="text-sm text-gray-500">Daily revenue breakdown</p>
            </div>
            <TrendingUp size={18} className="text-brand-500" />
          </div>
          {data?.revenue_by_day?.length > 0
            ? <SVGBarChart data={data.revenue_by_day} />
            : <p className="text-gray-400 text-sm py-12 text-center">No revenue data available</p>
          }
        </div>

        {/* Popular Foods */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">Popular Foods</h2>
          <p className="text-sm text-gray-500 mb-5">Top ordered items</p>
          {data?.popular_foods?.length > 0 ? (
            <div className="space-y-3">
              {data.popular_foods.slice(0, 8).map((f, i) => (
                <HorizontalBar key={i} name={f.name} count={f.orders} max={maxFood} />
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm py-8 text-center">No data available</p>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Recent Orders</h2>
            <p className="text-sm text-gray-500">Latest 6 orders</p>
          </div>
          <Link
            to="/admin/orders"
            className="flex items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>
        {data?.recent_orders?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Order #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Restaurant</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_orders.slice(0, 6).map((order) => (
                  <tr key={order.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">#{order.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{order.restaurant_name || order.restaurant?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{order.customer_name || order.user?.full_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={cx('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700')}>
                        {statusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{money(order.total_price || order.total)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-sm py-12 text-center">No recent orders</p>
        )}
      </div>

      {/* Recently Registered Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Recently Registered Users</h2>
            <p className="text-sm text-gray-500">Latest customers and accounts on the platform</p>
          </div>
          <Link
            to="/admin/users"
            className="flex items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
          >
            Manage All Users <ArrowRight size={14} />
          </Link>
        </div>
        {data?.recent_users?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.recent_users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-gray-500 font-semibold">#{u.id}</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{u.full_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={cx(
                        'px-2.5 py-0.5 rounded-full text-xs font-bold capitalize',
                        u.role === 'admin' ? 'bg-pink-100 text-pink-700' :
                        u.role === 'driver' ? 'bg-purple-100 text-purple-700' :
                        'bg-blue-100 text-blue-700'
                      )}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cx(
                        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
                        u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      )}>
                        <span className={cx('w-1.5 h-1.5 rounded-full', u.is_active ? 'bg-green-500' : 'bg-red-500')} />
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {u.created_at ? new Date(u.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-sm py-12 text-center">No users registered yet</p>
        )}
      </div>
    </div>
  )
}
