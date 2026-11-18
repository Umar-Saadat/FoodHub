import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Pencil, Trash2, Search, SlidersHorizontal,
  Upload, Check, X, ShoppingBag
} from 'lucide-react'
import { foodService } from '../../services/foodService'
import { adminService } from '../../services/paymentService'
import { money, mediaUrl } from '../../utils/format'
import { useToast } from '../../contexts/ToastContext'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'

const EMPTY_FOOD = {
  restaurant_id: '',
  category_id: '',
  name: '',
  description: '',
  price: '',
  discount_price: '',
  image_url: '',
  prep_time_min: 20,
  is_available: true,
  is_popular: false,
  is_featured: false
}

export default function AdminFoodsPage() {
  const { addToast } = useToast()
  const [foods, setFoods] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [restaurantFilter, setRestaurantFilter] = useState('')

  const [restaurants, setRestaurants] = useState([])
  const [categories, setCategories] = useState([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FOOD)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Fetch dropdown options
  useEffect(() => {
    foodService.restaurants({ page_size: 100 })
      .then((res) => setRestaurants(res.data.items || []))
      .catch(() => {})
    foodService.categories({ page_size: 100 })
      .then((res) => setCategories(res.data.items || res.data || []))
      .catch(() => {})
  }, [])

  const fetchFoods = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page,
        page_size: 20,
      }
      if (search.trim()) params.q = search.trim()
      if (restaurantFilter) params.restaurant_id = Number(restaurantFilter)

      const res = await foodService.foods(params)
      setFoods(res.data.items || [])
      setTotal(res.data.total || 0)
    } catch (err) {
      addToast('Failed to load menu items', 'error')
    } finally {
      setLoading(false)
    }
  }, [search, restaurantFilter, page, addToast])

  useEffect(() => {
    fetchFoods()
  }, [fetchFoods])

  const openCreate = () => {
    setEditing(null)
    setForm({
      ...EMPTY_FOOD,
      restaurant_id: restaurants[0]?.id || ''
    })
    setModalOpen(true)
  }

  const openEdit = (f) => {
    setEditing(f)
    setForm({
      restaurant_id: f.restaurant_id || '',
      category_id: f.category_id || '',
      name: f.name || '',
      description: f.description || '',
      price: f.price || '',
      discount_price: f.discount_price || '',
      image_url: f.image_url || '',
      prep_time_min: f.prep_time_min || 20,
      is_available: f.is_available ?? true,
      is_popular: f.is_popular ?? false,
      is_featured: f.is_featured ?? false
    })
    setModalOpen(true)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await adminService.upload(file)
      setForm((prev) => ({ ...prev, image_url: res.data.url }))
      addToast('Image uploaded', 'success')
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.restaurant_id) {
      addToast('Please select a restaurant', 'warning')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        restaurant_id: Number(form.restaurant_id),
        category_id: form.category_id ? Number(form.category_id) : null,
        price: Number(form.price),
        discount_price: form.discount_price ? Number(form.discount_price) : null,
        prep_time_min: Number(form.prep_time_min)
      }

      if (editing) {
        await adminService.updateFood(editing.id, payload)
        addToast('Food item updated', 'success')
      } else {
        await adminService.createFood(payload)
        addToast('Food item created', 'success')
      }
      setModalOpen(false)
      fetchFoods()
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Failed to save food item', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this food item?')) return
    try {
      await adminService.deleteFood(id)
      addToast('Food item removed', 'info')
      fetchFoods()
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Failed to delete food item', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Food Items</h1>
          <p className="text-sm text-gray-500">Manage all dishes, prices, discounts, and inventory</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white font-bold text-sm rounded-xl hover:bg-brand-600 transition shadow-sm"
        >
          <Plus size={16} /> Add Food Item
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search dishes..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <select
            value={restaurantFilter}
            onChange={(e) => { setRestaurantFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Restaurants</option>
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <span className="text-xs font-semibold text-gray-500 shrink-0">
          Total: {total} items
        </span>
      </div>

      {/* Foods Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center"><Spinner size="lg" /></div>
        ) : foods.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <ShoppingBag size={40} className="mx-auto mb-2 text-gray-300" />
            <p className="font-semibold text-sm">No food items found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Dish</th>
                  <th className="py-3 px-4">Restaurant</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Prep Time</th>
                  <th className="py-3 px-4">Tags</th>
                  <th className="py-3 px-4">Availability</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {foods.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={mediaUrl(f.image_url) || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'}
                          alt={f.name}
                          className="w-10 h-10 rounded-xl object-cover bg-gray-100 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-gray-900">{f.name}</p>
                          <p className="text-xs text-gray-400 truncate max-w-xs">{f.description || 'No description'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-medium">
                      {f.restaurant_name || f.restaurant?.name || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-brand-600">
                        {money(f.effective_price || f.price)}
                      </div>
                      {f.discount_price && f.discount_price < f.price && (
                        <div className="text-xs text-gray-400 line-through">
                          {money(f.price)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 font-medium">
                      {f.prep_time_min ? `${f.prep_time_min} mins` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {f.is_popular && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                            Popular
                          </span>
                        )}
                        {f.is_featured && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">
                            Featured
                          </span>
                        )}
                        {!f.is_popular && !f.is_featured && (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        f.is_available ? 'text-emerald-700' : 'text-gray-400'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${f.is_available ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        {f.is_available ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(f)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
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
        title={editing ? 'Edit Food Item' : 'Add Food Item'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Restaurant</label>
              <select
                required
                value={form.restaurant_id}
                onChange={(e) => setForm({ ...form, restaurant_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select Restaurant</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select Category (Optional)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Dish Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Discount Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Optional"
                value={form.discount_price}
                onChange={(e) => setForm({ ...form, discount_price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Prep Time (mins)</label>
              <input
                type="number"
                min="1"
                value={form.prep_time_min}
                onChange={(e) => setForm({ ...form, prep_time_min: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Image */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Image URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://... or upload"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <label className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition">
                <Upload size={14} />
                <span>{uploading ? '...' : 'Upload'}</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            {form.image_url && (
              <img
                src={mediaUrl(form.image_url)}
                alt="Preview"
                className="mt-2 h-16 w-28 object-cover rounded-xl border border-gray-200"
              />
            )}
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-5 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_available}
                onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
                className="rounded text-brand-500 focus:ring-brand-500"
              />
              <span className="text-xs font-bold text-gray-700">Available</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_popular}
                onChange={(e) => setForm({ ...form, is_popular: e.target.checked })}
                className="rounded text-brand-500 focus:ring-brand-500"
              />
              <span className="text-xs font-bold text-gray-700">Popular</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                className="rounded text-brand-500 focus:ring-brand-500"
              />
              <span className="text-xs font-bold text-gray-700">Featured</span>
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
              {saving ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
