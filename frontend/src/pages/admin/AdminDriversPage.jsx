import { useState, useEffect } from 'react'
import { Truck, MapPin, Phone, Mail, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { adminService } from '../../services/paymentService'
import { useToast } from '../../contexts/ToastContext'
import Spinner from '../../components/ui/Spinner'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function AdminDriversPage() {
  const { addToast } = useToast()
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDrivers = async () => {
    setLoading(true)
    try {
      const res = await adminService.drivers()
      setDrivers(res.data || [])
    } catch (err) {
      addToast('Failed to load drivers', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDrivers()
  }, [])

  // Filter drivers with coordinates for the map
  const driversWithLocation = drivers.filter((d) => d.latitude && d.longitude)
  const defaultCenter = driversWithLocation.length > 0
    ? [driversWithLocation[0].latitude, driversWithLocation[0].longitude]
    : [31.5204, 74.3587] // Lahore center

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Delivery Fleet & Drivers</h1>
          <p className="text-sm text-gray-500">Monitor driver availability, fleet vehicles, and active order assignments</p>
        </div>
        <button
          onClick={fetchDrivers}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 transition shadow-sm"
        >
          <RefreshCw size={14} /> Refresh Fleet
        </button>
      </div>

      {/* Driver Location Map */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <MapPin size={16} className="text-brand-500" /> Live Fleet Map
          </h3>
          <span className="text-xs text-gray-400">
            {driversWithLocation.length} driver(s) broadcasting location
          </span>
        </div>

        <div className="h-72 rounded-2xl overflow-hidden border border-gray-200">
          <MapContainer
            center={defaultCenter}
            zoom={12}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {driversWithLocation.map((driver) => (
              <Marker key={driver.id} position={[driver.latitude, driver.longitude]}>
                <Popup>
                  <div className="font-bold text-xs">{driver.full_name}</div>
                  <div className="text-[11px] text-gray-500">{driver.vehicle_type} ({driver.license_plate})</div>
                  <div className="text-[10px] text-brand-600 font-semibold mt-1">
                    {driver.is_available ? 'Available' : 'On Delivery'}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center"><Spinner size="lg" /></div>
        ) : drivers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Truck size={40} className="mx-auto mb-2 text-gray-300" />
            <p className="font-semibold text-sm">No drivers registered in the fleet yet</p>
            <p className="text-xs text-gray-400 mt-1">Add drivers by creating user accounts with the Driver role in the Users tab.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Driver</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">License Plate</th>
                  <th className="py-3 px-4">Availability</th>
                  <th className="py-3 px-4">Active Deliveries</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {d.full_name ? d.full_name[0].toUpperCase() : 'D'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{d.full_name}</p>
                          <p className="text-xs text-gray-400">ID: #{d.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600">
                      <div>{d.email}</div>
                      <div className="text-gray-400">{d.phone || 'No phone'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                        {d.vehicle_type || 'Motorbike'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-bold text-gray-700">
                      {d.license_plate || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        d.is_available
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${d.is_available ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {d.is_available ? 'Available' : 'Busy / Offline'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-gray-800">
                        {(d.active_orders || []).length} active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
