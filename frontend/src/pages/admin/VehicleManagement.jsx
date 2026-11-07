import React, { useState, useEffect } from 'react';
import {
  Bike,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Wrench,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Star,
  ExternalLink
} from 'lucide-react';
import api from '../../services/api';
import { formatVND } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotifications } from '../../context/NotificationContext';

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { showToast } = useNotifications();

  // Modal State (Create / Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    category_id: '',
    location_id: '',
    license_plate: '',
    hourly_rate: '',
    daily_rate: '',
    weekly_rate: '',
    monthly_rate: '',
    deposit_amount: '500000',
    status: 'available',
    vehicle_condition: 'excellent',
    description: '',
    image_url: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete state
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadMetadata();
    loadVehicles();
  }, [categoryFilter, statusFilter, search]);

  const loadMetadata = async () => {
    try {
      const [cRes, lRes] = await Promise.all([
        api.get('/vehicles/categories'),
        api.get('/vehicles/locations')
      ]);
      if (cRes.success) setCategories(cRes.data);
      if (lRes.success) setLocations(lRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      if (statusFilter) params.set('status', statusFilter);

      const res = await api.get(`/vehicles?${params.toString()}`);
      if (res.success) {
        setVehicles(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingVehicle(null);
    setFormData({
      name: '',
      brand: '',
      model: '',
      category_id: categories[0]?.id || '',
      location_id: locations[0]?.id || '',
      license_plate: '',
      hourly_rate: '50000',
      daily_rate: '250000',
      weekly_rate: '1400000',
      monthly_rate: '4500000',
      deposit_amount: '500000',
      status: 'available',
      vehicle_condition: 'excellent',
      description: '',
      image_url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80'
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (v) => {
    setEditingVehicle(v);
    setFormData({
      name: v.name,
      brand: v.brand,
      model: v.model || '',
      category_id: v.category_id,
      location_id: v.location_id,
      license_plate: v.license_plate || '',
      hourly_rate: v.hourly_rate,
      daily_rate: v.daily_rate,
      weekly_rate: v.weekly_rate || '',
      monthly_rate: v.monthly_rate || '',
      deposit_amount: v.deposit_amount,
      status: v.status,
      vehicle_condition: v.vehicle_condition,
      description: v.description || '',
      image_url: v.image_url || ''
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      if (editingVehicle) {
        const res = await api.put(`/vehicles/${editingVehicle.id}`, formData);
        if (res.success) {
          showToast('Vehicle updated successfully.', 'success');
          setModalOpen(false);
          loadVehicles();
        }
      } else {
        const res = await api.post('/vehicles', formData);
        if (res.success) {
          showToast('New vehicle added to fleet successfully.', 'success');
          setModalOpen(false);
          loadVehicles();
        }
      }
    } catch (err) {
      setFormError(err.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (v) => {
    if (!window.confirm(`Are you sure you want to delete "${v.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await api.delete(`/vehicles/${v.id}`);
      if (res.success) {
        showToast('Vehicle deleted successfully.', 'info');
        loadVehicles();
      }
    } catch (err) {
      showToast(err.message || 'Cannot delete vehicle with active bookings.', 'error');
    }
  };

  const handleQuickStatusChange = async (v, newStatus) => {
    try {
      const res = await api.put(`/vehicles/${v.id}`, { status: newStatus });
      if (res.success) {
        showToast(`Vehicle status changed to ${newStatus}.`, 'success');
        loadVehicles();
      }
    } catch (err) {
      showToast(err.message || 'Status update failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-primary">Fleet Management</h1>
          <p className="text-xs text-slate-500">Manage all bicycles, e-scooters, and motorbikes, pricing, and operational statuses.</p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary-hover text-white text-xs font-bold shadow-md shadow-secondary/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Vehicle</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vehicle name, brand, or plate..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-secondary shadow-sm"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:border-secondary shadow-sm"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:border-secondary shadow-sm"
        >
          <option value="">All Statuses</option>
          <option value="available">Available</option>
          <option value="rented">Rented</option>
          <option value="maintenance">Maintenance</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>

      {/* Fleet Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading vehicles...</div>
        ) : vehicles.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No vehicles found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-5">Vehicle & Image</th>
                  <th className="py-3.5 px-5">Category & Hub</th>
                  <th className="py-3.5 px-5">Rental Rates</th>
                  <th className="py-3.5 px-5">Deposit</th>
                  <th className="py-3.5 px-5">Condition</th>
                  <th className="py-3.5 px-5">Operational Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={v.image_url}
                          alt={v.name}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-100"
                        />
                        <div>
                          <span className="font-bold text-primary block">{v.name}</span>
                          <span className="text-[10px] text-slate-400">{v.brand} {v.model && `• ${v.model}`}</span>
                          {v.license_plate && (
                            <span className="text-[10px] font-bold text-secondary block">{v.license_plate}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span className="font-bold text-slate-800 block">{v.category_name}</span>
                      <span className="text-[10px] text-slate-400">{v.location_name}</span>
                    </td>

                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-800">{formatVND(v.daily_rate)}/day</div>
                      <span className="text-[10px] text-slate-400">{formatVND(v.hourly_rate)}/hour</span>
                    </td>

                    <td className="py-4 px-5 font-semibold text-slate-700">
                      {formatVND(v.deposit_amount)}
                    </td>

                    <td className="py-4 px-5 capitalize font-semibold text-slate-700">
                      {v.vehicle_condition}
                    </td>

                    <td className="py-4 px-5">
                      <select
                        value={v.status}
                        onChange={(e) => handleQuickStatusChange(v, e.target.value)}
                        className={`text-xs font-bold py-1 px-2.5 rounded-lg border focus:outline-none ${
                          v.status === 'available' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          v.status === 'rented' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                          v.status === 'maintenance' ? 'bg-orange-50 text-orange-800 border-orange-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <option value="available">Available</option>
                        <option value="rented">Rented</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(v)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Edit Vehicle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(v)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                          title="Delete Vehicle"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add / Edit Vehicle Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-primary text-base">
                {editingVehicle ? `Edit Vehicle: ${editingVehicle.name}` : 'Add New Vehicle to Fleet'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Vehicle Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Trek Marlin 5"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Brand</label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g. Trek"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Assigned Station</label>
                  <select
                    value={formData.location_id}
                    onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
                    required
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">License Plate / Code</label>
                  <input
                    type="text"
                    value={formData.license_plate}
                    onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                    placeholder="BIKE-001 / 43-B1..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Hourly Rate (VND)</label>
                  <input
                    type="number"
                    required
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Daily Rate (VND)</label>
                  <input
                    type="number"
                    required
                    value={formData.daily_rate}
                    onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Weekly Rate (VND)</label>
                  <input
                    type="number"
                    value={formData.weekly_rate}
                    onChange={(e) => setFormData({ ...formData, weekly_rate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Deposit Amount (VND)</label>
                  <input
                    type="number"
                    required
                    value={formData.deposit_amount}
                    onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>

              {/* Status & Condition */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Operational Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
                  >
                    <option value="available">Available</option>
                    <option value="rented">Rented</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Vehicle Condition</label>
                  <select
                    value={formData.vehicle_condition}
                    onChange={(e) => setFormData({ ...formData, vehicle_condition: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Image URL</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short marketing and feature description..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-secondary hover:bg-secondary-hover text-white text-xs font-bold transition-all shadow-md shadow-secondary/20"
                >
                  {submitting ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
