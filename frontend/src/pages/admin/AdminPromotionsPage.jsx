import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Gift, Tag, Calendar, Check, X } from 'lucide-react'
import { adminService } from '../../services/paymentService'
import { money } from '../../utils/format'
import { useToast } from '../../contexts/ToastContext'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'

const EMPTY_PROMOTION = {
  code: '',
  description: '',
  discount_type: 'percent',
  discount_value: 10,
  min_order: 10,
  max_uses: 100,
  is_active: true,
  expires_at: ''
}

export default function AdminPromotionsPage() {
  const { addToast } = useToast()
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_PROMOTION)
  const [saving, setSaving] = useState(false)

  const fetchPromotions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminService.promotions()
      setPromotions(res.data || [])
    } catch (err) {
      addToast('Failed to load promotions', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    fetchPromotions()
  }, [fetchPromotions])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_PROMOTION)
    setModalOpen(true)
  }

  const openEdit = (promo) => {
    setEditing(promo)
    setForm({
      code: promo.code || '',
      description: promo.description || '',
      discount_type: promo.discount_type || 'percent',
      discount_value: promo.discount_value || 0,
      min_order: promo.min_order || 0,
      max_uses: promo.max_uses || 100,
      is_active: promo.is_active ?? true,
      expires_at: promo.expires_at ? promo.expires_at.split('T')[0] : ''
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        discount_value: Number(form.discount_value),
        min_order: Number(form.min_order),
        max_uses: Number(form.max_uses),
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null
      }

      if (editing) {
        await adminService.updatePromotion(editing.id, payload)
        addToast('Promotion updated successfully', 'success')
      } else {
        await adminService.createPromotion(payload)
        addToast('Promotion code created', 'success')
      }
      setModalOpen(false)
      fetchPromotions()
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Failed to save promotion', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this promo code?')) return
    try {
      await adminService.deletePromotion(id)
      addToast('Promotion removed', 'info')
      fetchPromotions()
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Failed to delete promotion', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Promotions & Vouchers</h1>
          <p className="text-sm text-gray-500">Create discount coupons, free delivery codes, and special marketing deals</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white font-bold text-sm rounded-xl hover:bg-brand-600 transition shadow-sm"
        >
          <Plus size={16} /> Create Promo Code
        </button>
      </div>

      {/* Promos Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center"><Spinner size="lg" /></div>
        ) : promotions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Gift size={40} className="mx-auto mb-2 text-gray-300" />
            <p className="font-semibold text-sm">No promo codes active</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Benefit</th>
                  <th className="py-3 px-4">Min. Spend</th>
                  <th className="py-3 px-4">Redemptions</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {promotions.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-mono font-extrabold text-sm px-2.5 py-1 rounded-lg bg-brand-50 text-brand-600 border border-brand-200">
                          {p.code}
                        </span>
                        <p className="text-xs text-gray-400 mt-1 max-w-xs truncate">{p.description || 'Special discount'}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize text-xs font-semibold text-gray-600">
                        {p.discount_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {p.discount_type === 'percent'
                        ? `${p.discount_value}% OFF`
                        : p.discount_type === 'free_delivery'
                        ? 'Free Delivery'
                        : `${money(p.discount_value)} OFF`}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs font-medium">
                      {p.min_order ? money(p.min_order) : 'No min'}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-gray-600">
                      {p.times_used || 0} / {p.max_uses || '∞'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                        p.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={15} />
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

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Promotion' : 'Create Promotion'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Coupon Code</label>
              <input
                type="text"
                required
                placeholder="e.g. SUMMER25"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Type</label>
              <select
                value={form.discount_type}
                onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
                <option value="free_delivery">Free Delivery</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
            <input
              type="text"
              placeholder="e.g. 10% off your entire meal order"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {form.discount_type === 'percent' ? 'Discount (%)' : 'Amount ($)'}
              </label>
              <input
                type="number"
                min="0"
                step="any"
                disabled={form.discount_type === 'free_delivery'}
                value={form.discount_type === 'free_delivery' ? 0 : form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Min. Order ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.min_order}
                onChange={(e) => setForm({ ...form, min_order: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Max Uses</label>
              <input
                type="number"
                min="1"
                value={form.max_uses}
                onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Expiration Date (Optional)</label>
            <input
              type="date"
              value={form.expires_at}
              onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="promo_active"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="rounded text-brand-500 focus:ring-brand-500"
            />
            <label htmlFor="promo_active" className="text-xs font-bold text-gray-700">
              Active immediately
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-brand-500 text-white font-bold text-xs rounded-xl hover:bg-brand-600 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Promotion'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
