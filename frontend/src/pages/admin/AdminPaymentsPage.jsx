import { useState, useEffect, useCallback } from 'react'
import { CreditCard, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react'
import { adminService } from '../../services/paymentService'
import { money } from '../../utils/format'
import { useToast } from '../../contexts/ToastContext'
import Spinner from '../../components/ui/Spinner'

export default function AdminPaymentsPage() {
  const { addToast } = useToast()
  const [payments, setPayments] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminService.payments({ page, page_size: 20 })
      setPayments(res.data.items || res.data || [])
      setTotal(res.data.total || (Array.isArray(res.data) ? res.data.length : 0))
    } catch (err) {
      addToast('Failed to load payment records', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, addToast])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const totalCollected = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)

  const paidCount = payments.filter((p) => p.status === 'paid').length
  const pendingCount = payments.filter((p) => p.status !== 'paid').length

  const totalPages = Math.ceil(total / 20) || 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payments & Transactions</h1>
        <p className="text-sm text-gray-500">Audit all incoming cash and card payment records</p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Collected on Page</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{money(totalCollected)}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Paid Transactions</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{paidCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending / Failed</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{pendingCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={22} />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center"><Spinner size="lg" /></div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <CreditCard size={40} className="mx-auto mb-2 text-gray-300" />
            <p className="font-semibold text-sm">No transaction records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Paid At</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3 px-4 font-mono text-xs font-bold text-gray-700">
                      TXN-{p.id}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-brand-600">
                      {p.order_number || `#${p.order_id}`}
                    </td>
                    <td className="py-3 px-4 capitalize font-medium text-gray-700">
                      {p.method === 'cash' ? '💵 Cash' : '💳 Card'}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {money(p.amount)} <span className="text-[10px] text-gray-400 font-mono uppercase">{p.currency || 'USD'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        p.status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : p.status === 'failed'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {p.paid_at ? new Date(p.paid_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-400">
                      {p.failure_reason ? (
                        <span className="text-red-500 font-semibold">{p.failure_reason}</span>
                      ) : (
                        'Standard transaction'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
