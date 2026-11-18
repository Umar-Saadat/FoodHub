import { useState, useEffect } from 'react'
import {
  User, MapPin, Lock, Plus, Trash2, Edit3, Check,
  Shield, Phone, Mail, AlertCircle
} from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { authService } from '../services/authService'
import Spinner from '../components/ui/Spinner'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const { addToast } = useToast()

  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'addresses' | 'security'

  // Profile Form State
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [updatingProfile, setUpdatingProfile] = useState(false)

  // Addresses State
  const [addresses, setAddresses] = useState([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    address_line: '',
    city: 'Lahore',
    postal_code: '',
    is_default: false
  })
  const [savingAddress, setSavingAddress] = useState(false)

  // Security (Password) State
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '')
      setPhone(user.phone || '')
    }
  }, [user])

  // Load Addresses
  const loadAddresses = async () => {
    setLoadingAddresses(true)
    try {
      const res = await authService.addresses()
      setAddresses(res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingAddresses(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'addresses') {
      loadAddresses()
    }
  }, [activeTab])

  // Update Profile
  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setUpdatingProfile(true)
    try {
      const res = await authService.updateMe({
        full_name: fullName.trim(),
        phone: phone.trim() || null
      })
      updateUser(res.data)
      addToast('Profile updated successfully!', 'success')
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Failed to update profile', 'error')
    } finally {
      setUpdatingProfile(false)
    }
  }

  // Save Address (Create or Edit)
  const handleAddressSubmit = async (e) => {
    e.preventDefault()
    if (!addressForm.address_line.trim()) {
      addToast('Please enter an address line', 'warning')
      return
    }
    setSavingAddress(true)
    try {
      if (editingAddress) {
        await authService.updateAddress(editingAddress.id, addressForm)
        addToast('Address updated successfully', 'success')
      } else {
        await authService.addAddress(addressForm)
        addToast('New address saved', 'success')
      }
      setShowAddressModal(false)
      setEditingAddress(null)
      setAddressForm({
        label: 'Home',
        address_line: '',
        city: 'Lahore',
        postal_code: '',
        is_default: false
      })
      loadAddresses()
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Failed to save address', 'error')
    } finally {
      setSavingAddress(false)
    }
  }

  // Delete Address
  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to remove this address?')) return
    try {
      await authService.deleteAddress(id)
      addToast('Address removed', 'info')
      loadAddresses()
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Failed to delete address', 'error')
    }
  }

  // Change Password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (passwordForm.new_password.length < 8) {
      addToast('New password must be at least 8 characters long', 'warning')
      return
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      addToast('Passwords do not match', 'warning')
      return
    }
    setChangingPassword(true)
    try {
      await authService.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      })
      addToast('Password changed successfully!', 'success')
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Failed to update password', 'error')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-6 sm:p-8 text-white mb-8 shadow-sm flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-brand-500 text-white flex items-center justify-center text-3xl font-extrabold shadow-lg shrink-0">
            {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {user?.full_name || 'My Account'}
            </h1>
            <p className="text-sm text-gray-300 mt-1 flex items-center justify-center sm:justify-start gap-2">
              <Mail size={14} className="text-gray-400" /> {user?.email}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-white/10 border border-white/10 uppercase tracking-wider text-gray-200">
                {user?.role || 'Customer'}
              </span>
              <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Active Account
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-8 space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 px-1 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'profile'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <User size={16} /> Personal Details
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`pb-4 px-1 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'addresses'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <MapPin size={16} /> Saved Addresses
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-4 px-1 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'security'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Lock size={16} /> Security
          </button>
        </div>

        {/* Tab 1: Profile Settings */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm max-w-2xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Personal Details</h2>
            <p className="text-xs text-gray-500 mb-6">Manage your contact information</p>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Email Address (Read-only)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+92 300 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="px-6 py-2.5 bg-brand-500 text-white font-bold text-sm rounded-xl hover:bg-brand-600 disabled:opacity-50 transition shadow-sm"
                >
                  {updatingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Saved Addresses */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Saved Delivery Addresses</h2>
                <p className="text-xs text-gray-500">Fast checkout with your saved locations</p>
              </div>
              <button
                onClick={() => {
                  setEditingAddress(null)
                  setAddressForm({
                    label: 'Home',
                    address_line: '',
                    city: 'Lahore',
                    postal_code: '',
                    is_default: false
                  })
                  setShowAddressModal(true)
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-bold hover:bg-brand-600 transition"
              >
                <Plus size={14} /> Add New Address
              </button>
            </div>

            {loadingAddresses ? (
              <div className="py-12 flex justify-center"><Spinner /></div>
            ) : addresses.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200">
                <p className="text-sm text-gray-500">You haven't saved any delivery addresses yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                          <MapPin size={16} className="text-brand-500" />
                          {addr.label || 'Address'}
                        </span>
                        {addr.is_default && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {addr.address_line}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {addr.city} {addr.postal_code ? `• ${addr.postal_code}` : ''}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingAddress(addr)
                          setAddressForm({
                            label: addr.label || 'Home',
                            address_line: addr.address_line,
                            city: addr.city || 'Lahore',
                            postal_code: addr.postal_code || '',
                            is_default: Boolean(addr.is_default)
                          })
                          setShowAddressModal(true)
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="p-1.5 text-red-400 hover:text-red-700 rounded-lg hover:bg-red-50 transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Security */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm max-w-2xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Change Password</h2>
            <p className="text-xs text-gray-500 mb-6">Ensure your account is using a strong password</p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min. 8 characters"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-6 py-2.5 bg-brand-500 text-white font-bold text-sm rounded-xl hover:bg-brand-600 disabled:opacity-50 transition shadow-sm"
                >
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Address Modal */}
        {showAddressModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>

              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Label</label>
                  <select
                    value={addressForm.label}
                    onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    placeholder="House / Floor / Street / Area"
                    value={addressForm.address_line}
                    onChange={(e) => setAddressForm({ ...addressForm, address_line: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Postal Code (Optional)</label>
                    <input
                      type="text"
                      value={addressForm.postal_code}
                      onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={addressForm.is_default}
                    onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                    className="rounded text-brand-500 focus:ring-brand-500"
                  />
                  <label htmlFor="is_default" className="text-xs text-gray-700 font-medium">
                    Set as default delivery address
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="px-5 py-2 bg-brand-500 text-white rounded-xl text-xs font-bold hover:bg-brand-600 disabled:opacity-50"
                  >
                    {savingAddress ? 'Saving...' : 'Save Address'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
