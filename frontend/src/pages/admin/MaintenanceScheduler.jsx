import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Search,
  Check,
  X
} from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';

export default function MaintenanceScheduler() {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('');

  // Modals state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  // Schedule Form State
  const [scheduleForm, setScheduleForm] = useState({
    vehicle_id: '',
    maintenance_type: 'Regular Service',
    scheduled_date: new Date().toISOString().slice(0, 10),
    cost: '0',
    description: '',
    performed_by: '',
    notes: '',
    set_vehicle_maintenance_status: true
  });

  // Complete Form State
  const [completeForm, setCompleteForm] = useState({
    completed_date: new Date().toISOString().slice(0, 10),
    cost: '',
    notes: '',
    set_vehicle_available: true
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterVehicle) params.vehicle_id = filterVehicle;

      const [logsRes, vehRes] = await Promise.all([
        api.get('/maintenance/all', { params }),
        api.get('/vehicles', { params: { limit: 100 } })
      ]);

      if (logsRes.success) {
        setLogs(logsRes.data || []);
      }
      if (vehRes.success) {
        setVehicles(vehRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load maintenance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterVehicle]);

  const handleOpenSchedule = () => {
    setScheduleForm({
      vehicle_id: vehicles.length > 0 ? vehicles[0].id : '',
      maintenance_type: 'Regular Inspection & Brake Tuning',
      scheduled_date: new Date().toISOString().slice(0, 10),
      cost: '150000',
      description: 'Periodic safety inspection, tire pressure check, brake fluid and battery inspection.',
      performed_by: 'RideNow Service Center Tech',
      notes: '',
      set_vehicle_maintenance_status: true
    });
    setShowScheduleModal(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await api.post('/maintenance/schedule', scheduleForm);
      if (res.success) {
        setMessage({ type: 'success', text: 'Maintenance task successfully scheduled!' });
        setShowScheduleModal(false);
        fetchData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to schedule maintenance' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenComplete = (log) => {
    setSelectedLog(log);
    setCompleteForm({
      completed_date: new Date().toISOString().slice(0, 10),
      cost: log.cost || '0',
      notes: 'Completed full safety checks. Vehicle inspected and test-driven. Operational status cleared.',
      set_vehicle_available: true
    });
    setShowCompleteModal(true);
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLog) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/maintenance/${selectedLog.id}/complete`, completeForm);
      if (res.success) {
        setMessage({ type: 'success', text: 'Maintenance record completed and vehicle restored to Available!' });
        setShowCompleteModal(false);
        setSelectedLog(null);
        fetchData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to complete maintenance' });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const totalScheduled = logs.filter((l) => l.status === 'scheduled').length;
  const totalCompleted = logs.filter((l) => l.status === 'completed').length;
  const totalCost = logs.reduce((acc, l) => acc + parseFloat(l.cost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Vehicle Maintenance Scheduler</h1>
          <p className="text-sm text-gray-500">
            Schedule preventative service, monitor repair costs, and transition vehicle operational readiness.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleOpenSchedule}
            className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white font-semibold rounded-xl hover:bg-emerald-600 transition shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" />
            Schedule Service
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">Scheduled / In-Shop</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{totalScheduled}</p>
            <p className="text-xs text-gray-500 mt-1">Units blocked from booking</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">Completed Services</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{totalCompleted}</p>
            <p className="text-xs text-gray-500 mt-1">Cleared and inspected</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">Total Maintenance Cost</p>
            <p className="text-2xl font-bold text-brand-dark mt-1">{formatCurrency(totalCost)}</p>
            <p className="text-xs text-gray-500 mt-1">Fleet operational expenses</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-green bg-white"
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled / Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filterVehicle}
            onChange={(e) => setFilterVehicle(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-green bg-white"
          >
            <option value="">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.license_plate})
              </option>
            ))}
          </select>

          {(filterStatus || filterVehicle) && (
            <button
              onClick={() => {
                setFilterStatus('');
                setFilterVehicle('');
              }}
              className="text-xs text-rose-600 hover:underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500">
          Showing <strong>{logs.length}</strong> service records
        </p>
      </div>

      {/* Maintenance Logs Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-green" />
            <p>Loading maintenance records...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Wrench className="w-10 h-10 mx-auto text-gray-400 mb-2" />
            <p className="font-semibold text-gray-700">No maintenance records found</p>
            <p className="text-sm mt-1">Click "Schedule Service" above to schedule routine maintenance for a vehicle.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Log ID</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Service Type</th>
                  <th className="py-3 px-4">Scheduled Date</th>
                  <th className="py-3 px-4">Completed Date</th>
                  <th className="py-3 px-4">Cost</th>
                  <th className="py-3 px-4">Technician</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4 font-mono font-medium text-gray-600">
                      MNT-#{log.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={log.vehicle_image || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=100'}
                          alt={log.vehicle_name}
                          className="w-10 h-10 object-cover rounded-lg border border-gray-100"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">{log.vehicle_name}</p>
                          <span className="font-mono text-xs text-gray-500">{log.license_plate}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-brand-dark">{log.maintenance_type}</p>
                      {log.description && (
                        <p className="text-xs text-gray-500 max-w-xs truncate">{log.description}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-gray-700">
                      {formatDate(log.scheduled_date)}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {log.completed_date ? formatDate(log.completed_date) : '—'}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {formatCurrency(log.cost)}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600">
                      {log.performed_by || 'RideNow In-house'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          log.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : log.status === 'scheduled'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {log.status === 'scheduled' ? (
                        <button
                          onClick={() => handleOpenComplete(log)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-green text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Mark Completed
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          Done
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Maintenance Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-brand-green" />
                <h3 className="text-lg font-bold text-brand-dark">Schedule Vehicle Maintenance</h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Target Vehicle *</label>
                <select
                  value={scheduleForm.vehicle_id}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, vehicle_id: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-green bg-white"
                >
                  <option value="">Select a vehicle...</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.brand} {v.model} - {v.license_plate}) [Current Status: {v.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Service Type *</label>
                  <input
                    type="text"
                    required
                    value={scheduleForm.maintenance_type}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, maintenance_type: e.target.value })}
                    placeholder="e.g. Brake Service, Tire Replacement"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-green"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Scheduled Date *</label>
                  <input
                    type="date"
                    required
                    value={scheduleForm.scheduled_date}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_date: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-green"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Estimated Cost (VND)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={scheduleForm.cost}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, cost: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-green"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Technician / Service Partner</label>
                  <input
                    type="text"
                    value={scheduleForm.performed_by}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, performed_by: e.target.value })}
                    placeholder="e.g. Central Workshop Team"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-green"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Service Description</label>
                <textarea
                  rows="2"
                  value={scheduleForm.description}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                  placeholder="Detail the mechanical or electrical work needed..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-green"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                <label className="flex items-center gap-2 cursor-pointer text-amber-900 font-medium">
                  <input
                    type="checkbox"
                    checked={scheduleForm.set_vehicle_maintenance_status}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        set_vehicle_maintenance_status: e.target.checked
                      })
                    }
                    className="w-4 h-4 text-brand-green rounded"
                  />
                  <span>Automatically set vehicle operational status to "Maintenance"</span>
                </label>
                <p className="text-xs text-amber-700 mt-1 pl-6">
                  Prevents users from booking this vehicle while undergoing repairs.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-brand-green text-white font-semibold rounded-xl hover:bg-emerald-600 transition text-sm disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Maintenance Modal */}
      {showCompleteModal && selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-brand-dark">Complete Maintenance Work</h3>
              </div>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-gray-600 space-y-1">
              <p>
                <strong>Vehicle:</strong> {selectedLog.vehicle_name} ({selectedLog.license_plate})
              </p>
              <p>
                <strong>Task:</strong> {selectedLog.maintenance_type}
              </p>
              <p>
                <strong>Scheduled:</strong> {formatDate(selectedLog.scheduled_date)}
              </p>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Completion Date *</label>
                  <input
                    type="date"
                    required
                    value={completeForm.completed_date}
                    onChange={(e) => setCompleteForm({ ...completeForm, completed_date: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-green"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Final Actual Cost (VND)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={completeForm.cost}
                    onChange={(e) => setCompleteForm({ ...completeForm, cost: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-green"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Technician Notes</label>
                <textarea
                  rows="2"
                  value={completeForm.notes}
                  onChange={(e) => setCompleteForm({ ...completeForm, notes: e.target.value })}
                  placeholder="Record summary of repair and diagnostic test ride..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-green"
                />
              </div>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <label className="flex items-center gap-2 cursor-pointer text-emerald-900 font-medium">
                  <input
                    type="checkbox"
                    checked={completeForm.set_vehicle_available}
                    onChange={(e) =>
                      setCompleteForm({
                        ...completeForm,
                        set_vehicle_available: e.target.checked
                      })
                    }
                    className="w-4 h-4 text-brand-green rounded"
                  />
                  <span>Restore vehicle operational status to "Available"</span>
                </label>
                <p className="text-xs text-emerald-700 mt-1 pl-6">
                  Marks vehicle condition as "Excellent" and releases it back to the rental fleet.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition text-sm disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Finish & Release'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
