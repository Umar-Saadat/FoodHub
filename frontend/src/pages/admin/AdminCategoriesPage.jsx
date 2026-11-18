import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Tag, Upload } from 'lucide-react'
import { foodService } from '../../services/foodService'
import { adminService } from '../../services/paymentService'
import { mediaUrl } from '../../utils/format'
import { useToast } from '../../contexts/ToastContext'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'

const EMPTY_CATEGORY = {
  name: '',
  slug: '',
  description: '',
  image_url: ''
}

export default function AdminCategoriesPage() {
  const { addToast } = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_CATEGORY)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await foodService.categories({ page_size: 100 })
      setCategories(res.data.items || res.data || [])
    } catch (err) {
      addToast('Failed to load categories', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_CATEGORY)
    setModalOpen(true)
  }

  const openEdit = (cat) => {
    setEditing(cat)
    setForm({
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
      image_url: cat.image_url || ''
    })
    setModalOpen(true)
  }

  const handleNameChange = (val) => {
    setForm((prev) => ({
      ...prev,
      name: val,
      slug: editing ? prev.slug : val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }))
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await adminService.upload(file)
      setForm((prev) => ({ ...prev, image_url: res.data.url }))
      addToast('Category image uploaded', 'success')
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await adminService.updateCategory(editing.id, form)
        addToast('Category updated successfully', 'success')
      } else {
        await adminService.createCategory(form)
        addToast('Category created successfully', 'success')
      }
      setModalOpen(false)
      fetchCategories()
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Failed to save category', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category? Dishes in this category will become uncategorized.')) return
    try {
      await adminService.deleteCategory(id)
      addToast('Category deleted', 'info')
      fetchCategories()
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Failed to delete category', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Food Categories</h1>
          <p className="text-sm text-gray-500">Organize and classify menu items into cuisine and meal groups</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white font-bold text-sm rounded-xl hover:bg-brand-600 transition shadow-sm"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Spinner size="lg" /></div>
      ) : categories.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 text-gray-500">
          <Tag size={40} className="mx-auto mb-2 text-gray-300" />
          <p className="font-semibold text-sm">No categories created yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative h-36 bg-gray-100 overflow-hidden">
                  <img
                    src={mediaUrl(cat.image_url) || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400'
                    }}
                  />
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-black/60 text-white backdrop-blur-sm">
                    /{cat.slug}
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-base">{cat.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {cat.description || 'Delicious food category'}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-gray-50 flex items-center justify-end gap-2 mt-2">
                <button
                  onClick={() => openEdit(cat)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                  title="Edit"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Category' : 'Add Category'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Category Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Burgers, Pizza, Desserts"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">URL Slug</label>
            <input
              type="text"
              required
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                className="mt-2 h-16 w-24 object-cover rounded-xl border border-gray-200"
              />
            )}
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
              {saving ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
