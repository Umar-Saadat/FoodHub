import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Pencil, Trash2, Search, Star, Clock, MapPin,
  Upload, Check, X, Store
} from 'lucide-react'
import { foodService } from '../../services/foodService'
import { adminService } from '../../services/paymentService'
import { money, mediaUrl } from '../../utils/format'
import { useToast } from '../../contexts/ToastContext'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'

const EMPTY_RESTAURANT = {
  name: '',
  description: '',
  cuisine: '',
  address: '',
  city: 'Lahore',
  phone: '',
  image_url: '',
  latitude: 31.5204,
  longitude: 74.3587,
  delivery_time_min: 30,
  delivery_fee: 1.99,
  min_order: 10.0,
  is_active: true,
  is_featured: false
}

export default function AdminRestaurantsPage() {
  const { addToast } = useToast()
  const [restaurants, setRestaurants] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_RESTAURANT)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const fetchRestaurants = useCallback(async () => {
    setLoading(true)
    try {
      const res = await foodService.restaurants({
        q: search || undefined,
        page,
        page_size: 20
      })
      setRestaurants(res.data.items || [])
      setTotal(res.data.total || 0)
    } catch (err) {
      addToast('Failed to load restaurants', 'error')
    } finally {
      setLoading(false)
    }
  }, [search, page, addToast])

  useEffect(() => {
    fetchRestaurants()
  }, [fetchRestaurants])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_RESTAURANT)
    setModalOpen(true)
  }

  const openEdit = (r) => {
    setEditing(r)
    setForm({
      name: r.name || '',
      description: r.description || '',
      cuisine: r.cuisine || '',
      address: r.address || '',
      city: r.city || 'Lahore',
      phone: r.phone || '',
      image_url: r.image_url || r.image || '',
      latitude: r.latitude || 31.5204,
      longitude: r.longitude || 74.3587,
      delivery_time_min: r.delivery_time_min || 30,
      delivery_fee: r.delivery_fee || 1.99,
      min_order: r.min_order || 0,
      is_active: r.is_active ?? true,
      is_featured: r.is_featured ?? false
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
      addToast('Image uploaded successfully', 'success')
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Failed to upload image', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        delivery_time_min: Number(form.delivery_time_min),
        delivery_fee: Number(form.delivery_fee),
        min_order: Number(form.min_order)
      }

      if (editing) {
        await adminService.updateRestaurant(editing.id, payload)
        addToast('Restaurant updated successfully', 'success')
      } else {
        await adminService.createRestaurant(payload)
        addToast('Restaurant created successfully', 'success')
      }
      setModalOpen(false)
      fetchRestaurants()
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Failed to save restaurant', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this restaurant? This cannot be undone.')) return
    try {
      await adminService.deleteRestaurant(id)
      addToast('Restaurant deleted', 'info')
      fetchRestaurants()
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Failed to delete restaurant', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Restaurants</h1>
          <p className="text-sm text-gray-500">Manage all partner restaurants, menus, and operating details</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white font-bold text-sm rounded-xl hover:bg-brand-600 transition shadow-sm"
        >
          <Plus size={16} /> Add Restaurant
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by restaurant name, cuisine..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <span className="text-xs font-semibold text-gray-500">
          Total: {total} restaurants
        </span>
      </div>

      {/* Restaurants Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center"><Spinner size="lg" /></div>
        ) : restaurants.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Store size={40} className="mx-auto mb-2 text-gray-300" />
            <p className="font-semibold text-sm">No restaurants found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Restaurant</th>
                  <th className="py-3 px-4">Cuisine</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Delivery</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {restaurants.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={mediaUrl(r.image_url || r.image) || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100'}
                          alt={r.name}
                          className="w-10 h-10 rounded-xl object-cover bg-gray-100 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-gray-900">{r.name}</p>
                          <p className="text-xs text-gray-400 truncate max-w-xs">{r.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                        {r.cuisine || 'Various'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-medium">{r.city}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 font-bold text-amber-600">
                        <Star size={14} className="fill-amber-400 text-amber-400" />
                        <span>{r.rating ? r.rating.toFixed(1) : 'New'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      <div>{r.delivery_time_min} mins</div>
                      <div className="text-gray-400">{money(r.delivery_fee)} fee</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${r.is_active ? 'bg-emerald-500' : 'bg-red-400'}`} />
                        <span className="text-xs font-semibold text-gray-700">
                          {r.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {r.is_featured && (
                          <span className="ml-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(r)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Restaurant' : 'Add New Restaurant'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Cuisine</label>
              <input
                type="text"
                required
                placeholder="e.g. Italian, Pakistani, Burgers"
                value={form.cuisine}
                onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Address</label>
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">City</label>
              <input
                type="text"
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Delivery Time (mins)</label>
              <input
                type="number"
                min="5"
                value={form.delivery_time_min}
                onChange={(e) => setForm({ ...form, delivery_time_min: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Delivery Fee ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.delivery_fee}
                onChange={(e) => setForm({ ...form, delivery_fee: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Min. Order ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.min_order}
                onChange={(e) => setForm({ ...form, min_order: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Image URL & Upload */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Restaurant Image</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://... or upload below"
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
                className="mt-2 h-20 w-36 object-cover rounded-xl border border-gray-200"
              />
            )}
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="rounded text-brand-500 focus:ring-brand-500"
              />
              <span className="text-xs font-bold text-gray-700">Active</span>
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
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-brand-500 text-white font-bold text-xs rounded-xl hover:bg-brand-600 disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : 'Save Restaurant'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
