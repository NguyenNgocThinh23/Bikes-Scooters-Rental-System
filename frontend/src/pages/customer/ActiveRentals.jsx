import React, { useState, useEffect } from 'react';
import {
  Bike,
  Clock,
  Calendar,
  AlertTriangle,
  RotateCcw,
  MapPin,
  CheckCircle2,
  FileText,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import { formatVND, formatDateTime } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotifications } from '../../context/NotificationContext';

export default function ActiveRentals() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useNotifications();

  // Extension Modal State
  const [extModalBooking, setExtModalBooking] = useState(null);
  const [newReturnDateTime, setNewReturnDateTime] = useState('');
  const [extSubmitting, setExtSubmitting] = useState(false);
  const [extError, setExtError] = useState('');
  const [extSuccessMsg, setExtSuccessMsg] = useState('');

  useEffect(() => {
    loadActiveRentals();
  }, []);

  const loadActiveRentals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings/my-bookings?status=active');
      if (res.success) {
        setRentals(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openExtensionModal = (booking) => {
    setExtModalBooking(booking);
    setExtError('');
    setExtSuccessMsg('');
    // Default +1 day from current scheduled return
    const cur = new Date(booking.return_datetime);
    cur.setDate(cur.getDate() + 1);
    setNewReturnDateTime(cur.toISOString().slice(0, 16));
  };

  const handleRequestExtension = async (e) => {
    e.preventDefault();
    if (!extModalBooking) return;
    setExtSubmitting(true);
    setExtError('');

    try {
      const res = await api.post('/extensions/request', {
        booking_id: extModalBooking.id,
        requested_return_datetime: newReturnDateTime
      });

      if (res.success) {
        showToast('Extension request submitted! Awaiting administrator approval.', 'success');
        setExtModalBooking(null);
        loadActiveRentals();
      }
    } catch (err) {
      setExtError(err.message || 'Failed to submit extension request.');
    } finally {
      setExtSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      <div>
        <h1 className="text-2xl font-black text-primary">Active Rentals</h1>
        <p className="text-xs text-slate-500">Live overview of vehicles currently in your possession and countdown to return.</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading active rentals...</div>
      ) : rentals.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-card space-y-3">
          <Bike className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-primary">No Active Rentals Right Now</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You don't currently have any vehicles on the road. Ready for your next journey?
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rentals.map((r) => {
            const scheduledReturn = new Date(r.return_datetime);
            const now = new Date();
            const isOverdue = now > scheduledReturn;
            const diffHours = Math.round(Math.abs(scheduledReturn - now) / (1000 * 60 * 60));

            return (
              <div
                key={r.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-card space-y-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-xs font-black text-secondary">{r.booking_code}</span>
                    <StatusBadge status="active" />
                  </div>

                  <div className="flex items-start gap-4 mt-4">
                    <img
                      src={r.vehicle_image}
                      alt={r.vehicle_name}
                      className="w-20 h-20 rounded-2xl object-cover border border-slate-100 shrink-0 bg-slate-50"
                    />
                    <div>
                      <h3 className="text-base font-black text-primary">{r.vehicle_name}</h3>
                      <span className="text-xs text-slate-400 font-semibold">{r.category_name} • Plate: {r.license_plate}</span>
                      <div className="mt-2 text-xs text-slate-600 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-secondary" />
                        <span>Return to: <strong>{r.return_location_name}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Return Deadline Box */}
                  <div className={`mt-5 p-4 rounded-2xl border ${
                    isOverdue
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Return Deadline</span>
                      </span>
                      <span className="text-xs font-black">
                        {isOverdue ? `${diffHours}h Overdue` : `Due in ~${diffHours}h`}
                      </span>
                    </div>
                    <div className="text-sm font-black">{formatDateTime(r.return_datetime)}</div>
                    {isOverdue && (
                      <p className="text-[10px] text-rose-700 mt-1 font-semibold">
                        * Overdue penalty fees apply automatically per hour. Please return vehicle or request extension immediately.
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Action: Request Extension */}
                <div className="pt-3 border-t border-slate-100">
                  <button
                    onClick={() => openExtensionModal(r)}
                    className="w-full py-2.5 rounded-xl bg-primary hover:bg-secondary hover:text-white text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Request Rental Extension</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Extension Modal */}
      {extModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-primary text-base">Extend Rental: {extModalBooking.vehicle_name}</h3>
              <button
                onClick={() => setExtModalBooking(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Current scheduled return: <strong>{formatDateTime(extModalBooking.return_datetime)}</strong>. Select your requested new return time.
            </p>

            {extError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{extError}</span>
              </div>
            )}

            <form onSubmit={handleRequestExtension} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">New Return Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newReturnDateTime}
                  onChange={(e) => setNewReturnDateTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
                />
              </div>

              <div className="p-3 rounded-xl bg-bgLight text-xs text-slate-600 space-y-1">
                <p>• System will verify vehicle has no conflicting reservations.</p>
                <p>• Extension requires Administrator review & approval.</p>
                <p>• Additional rental fee will be added to your invoice.</p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExtModalBooking(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={extSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-secondary hover:bg-secondary-hover text-white text-xs font-bold transition-all shadow-md shadow-secondary/20"
                >
                  {extSubmitting ? 'Checking...' : 'Submit Extension'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
