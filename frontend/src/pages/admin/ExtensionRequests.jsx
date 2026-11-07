import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  Bike,
  User,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import { formatVND, formatDateTime } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotifications } from '../../context/NotificationContext';

export default function ExtensionRequests() {
  const [extensions, setExtensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const { showToast } = useNotifications();

  // Reject modal
  const [rejectExt, setRejectExt] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadExtensions();
  }, [statusFilter]);

  const loadExtensions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);

      const res = await api.get(`/extensions/all?${params.toString()}`);
      if (res.success) {
        setExtensions(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (ext) => {
    if (!window.confirm(`Approve extension of +${ext.extension_hours}h for booking ${ext.booking_code}? System will verify schedule availability.`)) {
      return;
    }

    try {
      const res = await api.post(`/extensions/${ext.id}/approve`, {
        admin_notes: 'Extension verified and approved.'
      });
      if (res.success) {
        showToast('Extension approved! Booking schedule and billing updated.', 'success');
        loadExtensions();
      }
    } catch (err) {
      showToast(err.message || 'Cannot approve extension: Schedule conflict with another reservation!', 'error');
    }
  };

  const handleReject = async () => {
    if (!rejectExt) return;
    setProcessing(true);
    try {
      const res = await api.post(`/extensions/${rejectExt.id}/reject`, {
        admin_notes: rejectNotes || 'Conflict with upcoming confirmed reservation'
      });
      if (res.success) {
        showToast('Extension rejected.', 'info');
        setRejectExt(null);
        setRejectNotes('');
        loadExtensions();
      }
    } catch (err) {
      showToast(err.message || 'Rejection failed.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-primary">Rental Extension Requests</h1>
          <p className="text-xs text-slate-500">
            Review customer requests to extend active trips. System prevents approving overlapping reservations.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:border-secondary shadow-sm"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading extension requests...</div>
        ) : extensions.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No extension requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-5">Booking</th>
                  <th className="py-3.5 px-5">Customer</th>
                  <th className="py-3.5 px-5">Vehicle</th>
                  <th className="py-3.5 px-5">Current Return</th>
                  <th className="py-3.5 px-5">Requested Return</th>
                  <th className="py-3.5 px-5">Added Fee</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {extensions.map((ext) => (
                  <tr key={ext.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-5 font-bold text-primary">{ext.booking_code}</td>
                    <td className="py-4 px-5">
                      <span className="font-bold text-slate-800 block">{ext.customer_name}</span>
                      <span className="text-[10px] text-slate-400">{ext.customer_email}</span>
                    </td>
                    <td className="py-4 px-5">
                      <span className="font-bold text-slate-800 block">{ext.vehicle_name}</span>
                      <span className="text-[10px] text-secondary font-bold">{ext.license_plate}</span>
                    </td>
                    <td className="py-4 px-5 text-slate-500">{formatDateTime(ext.current_return_datetime)}</td>
                    <td className="py-4 px-5 text-primary font-bold">
                      {formatDateTime(ext.requested_return_datetime)}
                      <span className="text-[10px] text-emerald-600 block">(+{ext.extension_hours} hours)</span>
                    </td>
                    <td className="py-4 px-5 font-black text-secondary">{formatVND(ext.additional_rental_fee)}</td>
                    <td className="py-4 px-5">
                      <StatusBadge status={ext.status} />
                    </td>
                    <td className="py-4 px-5 text-right">
                      {ext.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApprove(ext)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm flex items-center gap-1"
                            title="Approve extension"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => setRejectExt(ext)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px] flex items-center gap-1"
                            title="Reject extension"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          {ext.admin_notes || 'Reviewed'}
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

      {/* Reject Modal */}
      {rejectExt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-black text-primary text-base">Decline Extension for {rejectExt.booking_code}</h3>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Decline</label>
              <textarea
                rows={3}
                required
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Vehicle is booked by another customer right after your scheduled return..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-400 bg-slate-50"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectExt(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={handleReject}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-md"
              >
                {processing ? 'Declining...' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
